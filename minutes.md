### 06/19 
- Control tower front end has been created by Satyam, Sudeep and Srijan.
### 06/26 
#### Control Tower, FE. 
- Added a side bar and update part in the UI.
- Created login, landing page. *This was not discussed earlier.* 
#### Upload Data, BE. 
- Uploaded dataset.
- Upload through CSV as well as API.
- Validation is carried out.
- for generating alerts, reorder qty is calculated.

### Next Steps
- Supa data base. Then we can see current demand and inv alerts.
- Navigation from control tower to the data uploading or configuration.
- logic selected and numbers should come from the config file.
- Integration with front end.
- Role based user access.


### 07/03
#### KPIs to be Considered (Current Focus)
- Inventory, Demand. Weeks of Supply
- Configurable Safety Stock
- Thresholds to be defined by user

  #### Completed so far
  - Login/signup page
  - Data upload through csv and API (Ingestion complete)
  - Dashboard with KPI's - Current demand, Inventory position, Weeks of Supplay, Stockouts, %SKU's below ROP, LAst Updated, Store-wise Inventory(Integration Pending)
  - Dashboard with KPI's - Current demand, Inventory position, Weeks of Supply, Stockouts, %SKU's below ROP, Last Updated, Store-wise Inventory(Integration Pending)
  - Database setup : Inventory, Alert, Node, Reorder congif, User

  #### Tasks for Next week
  - Dashboard enhancements
    - add maps with store labels 
    - display store-level information driven from a config file
    - include store, inventory and mapping
    - uploaded data should directly reflect on the ddashboard
    - accept day-level forecast data from user for the next 4 weeks (uploaded monthly)

  - Future directions :
    - Update inventory, transaction, and transit data periodically
    - Schedule data uploads via files (cloud-based upload via GCP/AWS in future)
    - Set up daily updates, preferably at midnight
    - auto-fetch and monitor a file regularly

### 07/10
- Front end 
    - Map is ready.
    - You can add new stores.
    - Formula selection is now available.
- Backend
    - No updates.
 
#### Next Steps
- uploaded data should directly reflect on the ddashboard
- accept day-level forecast data from user for the next 4 weeks (uploaded monthly)
- include store, inventory and mapping
- Store info adding part should be in config.

### 07/17
- Backend
    * csv upload of stores, inventory, forecast data, - upload one or more at a time
    * while upload, all stores' reorder_config are calculated with default formula from config part  we can select       which formula has to be appled for which stores
    * alerts for all stores in general alert section
    * on dashboard - kpi's like current demand, inventory position, weeks of supply also reorder details per store       and product(current_demand discrepancy has been resolved)
    * add stores manually 
    * view store summary, select a store and view its details on each sku
    * for map, name of store, the no. of alerts for each store, total sku and last update is returned
 
- Frontend
    * Fully completed for backend done until now.
 
  Target :
  - Finish task assigned for sprint 1

### Date - 07/08/25

#### pending
1. Change the line chart to bar chart 
2. Making the dashboard visible for the the forecasted data on maps 
3. Stockout and connecting back to the backend 

#### Sprint 3 
- initialized
- due on 14th Aug 2025
- Forecast Module