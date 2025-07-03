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
    
    

