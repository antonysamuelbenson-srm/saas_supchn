# 📦 Inventory Maintainer SaaS — Alert & Reorder Logic

This document explains the mathematical logic and formulas used in generating alerts and computing reorder thresholds within the Inventory Maintainer SaaS application.

---

## 🔔 Alert Generation Logic

Alerts are triggered based on inventory health after data is uploaded.

| Alert Type        | Condition                                | Description |
|-------------------|-------------------------------------------|-------------|
| `Stockout`        | `quantity == 0`                           | Raised when a SKU has no stock left in a given store/warehouse. |
| `BelowThreshold`  | `quantity < reorder_point`               | Raised when stock drops below its reorder threshold (safe buffer). |

---

## 📦 Reorder Configuration Logic

Reorder thresholds are calculated for each SKU to proactively manage restocking.

| Metric            | Formula                                                        | Description |
|-------------------|----------------------------------------------------------------|-------------|
| `avg_daily_usage` | `total_quantity / 30`                                          | Estimated average daily usage over the past 30 days. |
| `safety_stock`    | `0.5 × avg_daily_usage`                                        | 50% buffer stock to account for variability in demand/supply. |
| `lead_time_days`  | `7` (constant)                                                 | Time taken to restock from supplier (assumed constant for now). |
| `reorder_point`   | `(avg_daily_usage × lead_time_days) + safety_stock`           | Stock level at which reorder should be triggered. |

---

## 📘 Example Calculation

Given:
- Last 30-day quantity: `120`
- `avg_daily_usage = 120 / 30 = 4`
- `safety_stock = 0.5 × 4 = 2`
- `lead_time_days = 7`

Then:


## reorder_point = (4 × 7) + 2 = 30


If current quantity is **less than 30**, a **BelowThreshold alert** is raised.

---

## 🧠 Summary Table

| Metric            | Formula                                             | Used In         | Purpose                         |
|-------------------|-----------------------------------------------------|------------------|---------------------------------|
| `avg_daily_usage` | `total_qty / 30`                                    | Reorder Config   | Estimate daily sales            |
| `safety_stock`    | `0.5 × avg_daily_usage`                             | Reorder Config   | Buffer for uncertainty          |
| `reorder_point`   | `avg_daily_usage × lead_time + safety_stock`        | Reorder Config   | Defines safe minimum level      |
| `Stockout Alert`  | `quantity == 0`                                     | Alerts           | No inventory left               |
| `BelowThreshold`  | `quantity < reorder_point`                          | Alerts           | Inventory is dangerously low    |

---

## ✅ Current Assumptions
- `lead_time_days` is a constant value of 7.
- `safety_stock` is a fixed 50% of `avg_daily_usage`.
- Quantity in CSV is assumed as a proxy for recent 30-day usage.

---

## 🛠️ Future Improvements
- Use actual historical sales data for `avg_daily_usage`.
- Allow dynamic configuration of `lead_time` and `safety_stock`.
- Add severity levels based on how far below the threshold stock is.

---



| Step | Action                                                               | Where                                                 |
| ---- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| 1️⃣  | A **planner uploads** a CSV file                                     | `client_terminal.py` → `/upload/validate`             |
| 2️⃣  | Flask reads the file, checks headers, validates data                 | `app/routes/upload.py`                                |
| 3️⃣  | Each row is saved to the **InventorySnapshot** table                 | using SQLAlchemy ORM                                  |
| 4️⃣  | After insertion, the route calls: `generate_alerts(role_user_id)`    | 🔥 This triggers alert logic                          |
| 5️⃣  | Inside `generate_alerts()`, fetches all inventory data for that user | `InventorySnapshot.query.filter_by(role_user_id=...)` |
| 6️⃣  | Also fetches thresholds from `ReorderConfig`                         | filtered for the same user                            |
| 7️⃣  | For each SKU, checks:                                                |                                                       |
