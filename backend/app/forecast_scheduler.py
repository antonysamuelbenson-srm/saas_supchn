from apscheduler.schedulers.background import BackgroundScheduler
from app.services.forecast_service import execute_forecast_job
from app.models.forecast_schedule import ForecastSchedule
from app import db, create_app

VALID_WEEKDAYS = [
    "monday", "tuesday", "wednesday", "thursday",
    "friday", "saturday", "sunday"
]

def start_forecast_scheduler():
    scheduler = BackgroundScheduler()

    schedules = ForecastSchedule.query.all()
    for sched in schedules:
        try:
            # Extract time from DB safely
            hour, minute = map(int, sched.time_of_day.split(":"))

            # Daily jobs
            if sched.frequency.lower() == "daily":
                scheduler.add_job(
                    execute_forecast_job,
                    trigger="cron",
                    hour=hour,
                    minute=minute,
                    args=[sched.id],
                    id=str(sched.id)
                )

            # Weekly jobs
            elif sched.frequency and sched.frequency.strip().lower() == "weekly":
                day_of_week_clean = (sched.day_of_week or "").strip().lower()

                # Map common variants to APScheduler's expected names
                weekday_map = {
                    "monday": "mon",
                    "tuesday": "tue",
                    "wednesday": "wed",
                    "thursday": "thu",
                    "friday": "fri",
                    "saturday": "sat",
                    "sunday": "sun"
                }

                if day_of_week_clean not in weekday_map:
                    print(f"⚠ Skipping invalid weekday '{sched.day_of_week}' in schedule {sched.id}")
                    continue

                scheduler.add_job(
                    execute_forecast_job,
                    trigger="cron",
                    day_of_week=weekday_map[day_of_week_clean],
                    hour=hour,
                    minute=minute,
                    args=[sched.id],
                    id=str(sched.id)
                )

            else:
                print(f"⚠ Unknown frequency '{sched.frequency}' in schedule {sched.id}")

        except Exception as e:
            print(f"❌ Failed to add schedule {sched.id}: {e}")

    scheduler.start()
    print(f"✅ Forecast scheduler started with {len(schedules)} jobs.")

