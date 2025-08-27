# # app/services/forecast_service.py
# def execute_forecast_job(schedule_id=None):
#     from app import db
#     from app.models.forecast_schedule import ForecastSchedule
#     from app.models.forecast_log import ForecastLog
#     from app.models.predict import ForecastDaily
#     from app.models.sales import Sales
#     from app.utils.forecast_utils import run_forecast_logic
#     from datetime import datetime
#     import uuid

#     schedules = []
#     if schedule_id:
#         sched = ForecastSchedule.query.get(schedule_id)
#         if sched:
#             schedules.append(sched)
#     else:
#         schedules = ForecastSchedule.query.all()

#     results_summary = []
#     for sched in schedules:
#         n_weeks = int(sched.n_weeks)
#         log_id = uuid.uuid4()

#         forecast_log = ForecastLog(
#             id=log_id,
#             run_time=datetime.utcnow(),
#             store_id=sched.store_id,
#             product_id=sched.product_id,
#             n_weeks=n_weeks,
#             schedule_id=sched.id,
#             run_started_at=datetime.utcnow(),
#             status="running"
#         )
#         db.session.add(forecast_log)
#         db.session.flush()

#         if sched.store_id and sched.product_id:
#             combos = [(sched.store_id, sched.product_id)]
#         else:
#             combos = db.session.query(Sales.store_id, Sales.product_id).distinct().all()

#         for store_id, product_id in combos:
#             forecasts = run_forecast_logic(store_id, product_id, n_weeks)
#             for f in forecasts:
#                 db.session.add(ForecastDaily(
#                     store_id=store_id,
#                     product_id=product_id,
#                     date=f["date"],
#                     predicted=f["forecast"],
#                     forecast_log_id=log_id
#                 ))

#             results_summary.append({
#                 "store_id": store_id,
#                 "product_id": product_id,
#                 "forecast_count": len(forecasts)
#             })

#         forecast_log.status = "completed"
#         forecast_log.run_completed_at = datetime.utcnow()

#     db.session.commit()
#     return {"status": "success", "details": results_summary}


# # app/services/forecast_service.py
# def execute_forecast_job(schedule_id=None):
#     from app import db
#     from app.models.forecast_schedule import ForecastSchedule
#     from app.models.forecast_log import ForecastLog
#     from app.models.forecast import ForecastDaily
#     from app.models.sales import Sales
#     from app.utils.forecast_utils import run_forecast_logic
#     from sqlalchemy import text
#     from datetime import datetime, timedelta
#     import pandas as pd
#     import uuid

#     schedules = []
#     if schedule_id:
#         sched = ForecastSchedule.query.get(schedule_id)
#         if sched:
#             schedules.append(sched)
#     else:
#         schedules = ForecastSchedule.query.all()

#     results_summary = []

#     for sched in schedules:
#         try:
#             # Pull n_weeks directly from schedule
#             n_weeks = int(sched.n_weeks)
#             forecast_end_date = datetime.utcnow().date() + timedelta(weeks=n_weeks)

#             log_id = uuid.uuid4()
#             forecast_log = ForecastLog(
#                 id=log_id,
#                 run_time=datetime.utcnow(),
#                 store_id=sched.store_id,
#                 product_id=sched.product_id,
#                 n_weeks=n_weeks,
#                 schedule_id=sched.id,
#                 run_started_at=datetime.utcnow(),
#                 status="running"
#             )
#             db.session.add(forecast_log)
#             db.session.flush()

#             # Build fast SQL filters
#             sql_filters = []
#             params = {"forecast_end_date": forecast_end_date}

#             if sched.store_id:
#                 sql_filters.append("store_id = :store_id")
#                 params["store_id"] = sched.store_id
#             if sched.product_id:
#                 sql_filters.append("product_id = :product_id")
#                 params["product_id"] = sched.product_id

#             where_clause = f"WHERE {' AND '.join(sql_filters)}" if sql_filters else ""

#             # Fetch all sales in one query
#             sql = text(f"""
#                 SELECT store_id, product_id, date, SUM(quantity) AS total_qty
#                 FROM sales
#                 {where_clause}
#                 GROUP BY store_id, product_id, date
#                 ORDER BY store_id, product_id, date
#             """)
#             rows = db.session.execute(sql, params).fetchall()

#             if not rows:
#                 print(f"⚠ No sales data found for schedule {sched.id}")
#                 continue

#             # Convert to DataFrame for batch forecasting
#             df = pd.DataFrame(rows, columns=["store_id", "product_id", "date", "total_qty"])
#             forecasts_df = run_forecast_logic(df, n_weeks)  # should handle multiple store/product combos

#             # Add forecast_log_id to all rows
#             forecasts_df["forecast_log_id"] = log_id

#             # Bulk insert forecasts
#             forecast_records = [
#                 ForecastDaily(
#                     store_id=row.store_id,
#                     product_id=row.product_id,
#                     date=row.date,
#                     predicted=row.predicted,
#                     forecast_log_id=row.forecast_log_id
#                 )
#                 for row in forecasts_df.itertuples(index=False)
#             ]
#             db.session.bulk_save_objects(forecast_records)

#             forecast_log.status = "completed"
#             forecast_log.run_completed_at = datetime.utcnow()

#             results_summary.append({
#                 "schedule_id": str(sched.id),
#                 "store_id": sched.store_id,
#                 "product_id": sched.product_id,
#                 "forecast_count": len(forecasts_df)
#             })

#         except Exception as e:
#             print(f"❌ Failed to process schedule {sched.id}: {e}")

#     db.session.commit()
#     return {"status": "success", "details": results_summary}


# app/services/forecast_service.py

def execute_forecast_job(schedule_id=None):
    from app import db
    from app.models.forecast_schedule import ForecastSchedule
    from app.models.forecast_log import ForecastLog
    from app.models.predict import ForecastDaily
    from app.models.sales import Sales
    from app.utils.forecast_utils import run_forecast_logic
    from datetime import datetime, date
    import uuid

    schedules = []
    if schedule_id:
        sched = ForecastSchedule.query.get(schedule_id)
        if sched:
            schedules.append(sched)
    else:
        schedules = ForecastSchedule.query.all()

    results_summary = []

    for sched in schedules:
        try:
            n_weeks = int(sched.n_weeks)
            log_id = uuid.uuid4()

            # ✅ Create forecast log
            forecast_log = ForecastLog(
                id=log_id,
                run_time=datetime.utcnow(),
                n_weeks=n_weeks,
                schedule_id=sched.id,
                run_started_at=datetime.utcnow(),
                status="running",
                store_id=sched.store_id if sched.store_id else None,
                product_id=sched.product_id if sched.product_id else None
            )
            db.session.add(forecast_log)
            db.session.flush()

            # ✅ Determine store-product combos in ONE query
            q = db.session.query(Sales.store_id, Sales.product_id).distinct()
            if sched.store_id:
                q = q.filter(Sales.store_id == sched.store_id)
            if sched.product_id:
                q = q.filter(Sales.product_id == sched.product_id)
            combos = [(str(s), str(p)) for s, p in q.all()]

            all_forecast_rows = []
            now = datetime.utcnow()

            # ✅ Generate all forecasts in memory before DB insert
            for store_id, product_id in combos:
                forecasts = run_forecast_logic(store_id, product_id, n_weeks)
                if not forecasts:
                    continue

                for f in forecasts:
                    forecast_date = f["date"]
                    if hasattr(forecast_date, 'date') and callable(forecast_date.date):
                        forecast_date = forecast_date.date()
                    elif not isinstance(forecast_date, date):
                        forecast_date = datetime.strptime(str(forecast_date)[:10], "%Y-%m-%d").date()

                    pred_val = float(getattr(f.get("forecast", 0.0), 'item', f.get("forecast", 0.0)))

                    all_forecast_rows.append(ForecastDaily(
                        store_id=store_id,
                        product_id=product_id,
                        date=forecast_date,
                        predicted=pred_val,
                        created_at=now,
                        forecast_log_id=log_id
                    ))

                results_summary.append({
                    "store_id": store_id,
                    "product_id": product_id,
                    "forecast_count": len(forecasts)
                })

            # ✅ Bulk insert in one go
            if all_forecast_rows:
                db.session.add_all(all_forecast_rows)

            forecast_log.status = "completed"
            forecast_log.run_completed_at = datetime.utcnow()
            db.session.commit()

        except Exception as e:
            db.session.rollback()
            print(f"❌ Forecast run failed for schedule {sched.id}: {e}")

    return {"status": "success", "details": results_summary}
