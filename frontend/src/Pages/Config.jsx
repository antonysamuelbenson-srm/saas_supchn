// // import React, { useEffect, useState, useCallback } from "react";
// // import { useNavigate } from "react-router-dom";
// // import axios from "axios";
// // import ForecastLookahead from "./ForecastLookahead";

// // // --- Constants ---
// // const BASE_URL = "http://127.0.0.1:5500";

// // // A configuration array for store form fields to avoid repetition.
// // const STORE_FORM_FIELDS = [
// //   { name: "store_code", label: "Store Code", required: true },
// //   { name: "name", label: "Store Name", required: true },
// //   { name: "address", label: "Address", required: true },
// //   { name: "city", label: "City", required: true },
// //   { name: "state", label: "State" },
// //   { name: "country", label: "Country" },
// //   { name: "lat", label: "Latitude", type: "number" },
// //   { name: "long", label: "Longitude", type: "number" },
// //   { name: "capacity_units", label: "Capacity (Units)", type: "number" },
// // ];

// // const INITIAL_STORE_FORM_STATE = {
// //   store_id: "", store_code: "", name: "", address: "", city: "",
// //   state: "", country: "", lat: "", long: "", capacity_units: "",
// // };

// // // --- Main Component ---
// // export default function ConfigPage() {
// //   const navigate = useNavigate();

// //   // --- State Management ---
// //   const [activeTab, setActiveTab] = useState("addStore");
// //   const [formulas, setFormulas] = useState({});
// //   const [stores, setStores] = useState([]);
  
// //   // State for "Apply Formula" section
// //   const [selectedFormula, setSelectedFormula] = useState("");
// //   const [selectedStores, setSelectedStores] = useState([]);
// //   const [applyLoading, setApplyLoading] = useState(false);
// //   const [applyMessage, setApplyMessage] = useState({ text: "", type: "" });

// //   // State for "Add/Edit Store" sections
// //   const [storeForm, setStoreForm] = useState(INITIAL_STORE_FORM_STATE);
// //   const [originalStore, setOriginalStore] = useState(null);
// //   const [storeLoading, setStoreLoading] = useState(false);
// //   const [storeMessage, setStoreMessage] = useState({ text: "", type: "" });
  
// //   // --- API & Data Fetching ---
// //   const getAuthHeaders = useCallback(() => {
// //     const token = localStorage.getItem("token");
// //     if (!token) {
// //       navigate("/login");
// //       return null;
// //     }
// //     return { 'Authorization': `Bearer ${token}` };
// //   }, [navigate]);

// //   const fetchFormulas = useCallback(async () => {
// //     try {
// //       const headers = getAuthHeaders();
// //       if (!headers) return;
// //       const res = await axios.get(`${BASE_URL}/config/formulas`, { headers });
// //       setFormulas(res.data);
// //     } catch (err) {
// //       console.error("Failed to fetch formulas:", err);
// //       if (err.response?.status === 401) navigate("/login");
// //     }
// //   }, [getAuthHeaders, navigate]);

// //   const fetchStores = useCallback(async () => {
// //     try {
// //       const headers = getAuthHeaders();
// //       if (!headers) return;
// //       const res = await axios.get(`${BASE_URL}/stores`, { headers });
// //       setStores(res.data.stores || []);
// //     } catch (err) {
// //       console.error("Failed to fetch stores:", err);
// //       if (err.response?.status === 401) navigate("/login");
// //     }
// //   }, [getAuthHeaders, navigate]);

// //   useEffect(() => {
// //     fetchFormulas();
// //     fetchStores();
// //   }, [fetchFormulas, fetchStores]);
  
// //   // --- Event Handlers ---
// //   const handleStoreFormChange = (e) => {
// //     const { name, value } = e.target;
// //     setStoreForm((prev) => ({ ...prev, [name]: value }));
// //   };
  
// //   const handleStoreSelectForEdit = (e) => {
// //     const selectedId = parseInt(e.target.value, 10);
// //     const selected = stores.find((s) => s.store_id === selectedId);

// //     if (selected) {
// //       // Populate form state, converting nulls to empty strings for controlled inputs
// //       const formData = Object.keys(INITIAL_STORE_FORM_STATE).reduce((acc, key) => {
// //         acc[key] = selected[key] ?? "";
// //         return acc;
// //       }, {});
// //       setStoreForm(formData);
// //       setOriginalStore(selected); // Keep original for comparison
// //       setStoreMessage({ text: "", type: "" });
// //     } else {
// //       // Reset if "Choose Store" is selected
// //       setStoreForm(INITIAL_STORE_FORM_STATE);
// //       setOriginalStore(null);
// //     }
// //   };

// //   const handleAddStore = async (e) => {
// //     e.preventDefault();
// //     setStoreLoading(true);
// //     setStoreMessage({ text: "Adding store...", type: "info" });
    
// //     try {
// //       const headers = getAuthHeaders();
// //       if (!headers) return;
// //       await axios.post(`${BASE_URL}/store_upload`, storeForm, { headers });
// //       setStoreMessage({ text: "✅ Store added successfully!", type: "success" });
// //       setStoreForm(INITIAL_STORE_FORM_STATE); // Reset form
// //       await fetchStores(); // Refresh list
// //     } catch (err) {
// //       setStoreMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
// //     } finally {
// //       setStoreLoading(false);
// //     }
// //   };

// //   const handleUpdateStore = async () => {
// //     if (!originalStore) {
// //         setStoreMessage({ text: "❌ No store selected for update.", type: "error" });
// //         return;
// //     }

// //     const headers = getAuthHeaders();
// //     if (!headers) return;

// //     // Create payload with only the fields that have changed
// //     const payload = { store_id: originalStore.store_id };
// //     let changesMade = false;
    
// //     Object.keys(storeForm).forEach(key => {
// //         if (key === 'store_id') return;

// //         const originalValue = originalStore[key] ?? "";
// //         const currentValue = storeForm[key] ?? "";

// //         if (originalValue !== currentValue) {
// //             // Send null if field is empty, otherwise send the value
// //             payload[key] = currentValue === "" ? null : currentValue;
// //             changesMade = true;
// //         }
// //     });

// //     if (!changesMade) {
// //         setStoreMessage({ text: "💡 No changes detected.", type: "info" });
// //         return;
// //     }

// //     setStoreLoading(true);
// //     setStoreMessage({ text: "Updating store...", type: "info" });

// //     try {
// //         await axios.post(`${BASE_URL}/update_store`, payload, { headers });
// //         setStoreMessage({ text: "✅ Store updated successfully!", type: "success" });
// //         await fetchStores(); // Refresh list
// //     } catch (err) {
// //         setStoreMessage({ text: `❌ Update failed: ${err.response?.data?.error || err.message}`, type: "error" });
// //     } finally {
// //         setStoreLoading(false);
// //     }
// //   };
  
// //   const handleApplyFormula = async () => {
// //     if (!selectedFormula) {
// //       setApplyMessage({ text: "❌ Please select a formula!", type: "error" });
// //       return;
// //     }
    
// //     setApplyLoading(true);
// //     setApplyMessage({ text: "Applying formula...", type: "info" });
    
// //     const headers = getAuthHeaders();
// //     if (!headers) return;
    
// //     const payload = { formula: selectedFormula };
// //     if (selectedStores.length > 0) {
// //       payload.store_ids = selectedStores;
// //     }
    
// //     try {
// //       const res = await axios.post(`${BASE_URL}/config/apply-formula`, payload, { headers });
// //       console.log("✅ Success Response from Server:", res.data);
// //       console.log("Store IDs:", selectedStores);
// //       setApplyMessage({ text: `✅ Success: ${res.data.message || 'Formula applied.'}`, type: "success" });
// //     } catch (err) {
// //       setApplyMessage({ text: `❌ Failed: ${err.response?.data?.error || err.message}`, type: "error" });
// //     } finally {
// //       setApplyLoading(false);
// //     }
// //   };

// // const handleClick = async () => {
// //   try {
// //     // 1. Get the token from local storage
// //     const token = localStorage.getItem('token');

// //     if (!token) {
// //       console.error('Authentication token not found. Please log in again.');
// //       return;
// //     }

// //     // 2. Define the common request options
// //     const requestOptions = {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //         'Authorization': `Bearer ${token}`,
// //       },
// //       // Note: The /refresh endpoint doesn't need a body, 
// //       // but sending one is harmless.
// //       body: JSON.stringify({ data: 'some data from frontend' }), 
// //     };

// //     console.log('Starting requests for all three endpoints...');

// //     // 3. Use Promise.all to run all three fetch requests in parallel
// //     const [
// //       dashboardResponse, 
// //       availabilityResponse, 
// //       alertsResponse // Added handler for the new endpoint
// //     ] = await Promise.all([
// //       fetch('http://localhost:5500/dashboard/recompute', requestOptions),
// //       fetch('http://localhost:5500/availability/recompute', requestOptions),
// //       fetch('http://localhost:5500/alerts/refresh', requestOptions) // Added the new endpoint
// //     ]);

// //     // 4. Check if all three responses were successful
// //     if (!dashboardResponse.ok) {
// //       throw new Error(`Dashboard recompute failed with status: ${dashboardResponse.status}`);
// //     }
// //     if (!availabilityResponse.ok) {
// //       throw new Error(`Availability recompute failed with status: ${availabilityResponse.status}`);
// //     }
// //     if (!alertsResponse.ok) { // Added check for the new endpoint
// //       throw new Error(`Alerts refresh failed with status: ${alertsResponse.status}`);
// //     }

// //     // 5. Get the JSON results from all successful responses
// //     const dashboardResult = await dashboardResponse.json();
// //     const availabilityResult = await availabilityResponse.json();
// //     const alertsResult = await alertsResponse.json(); // Added result parsing

// //     console.log('✅ Dashboard Recompute Successful:', dashboardResult);
// //     console.log('✅ Availability Recompute Successful:', availabilityResult);
// //     console.log('✅ Alerts Refresh Successful:', alertsResult); // Added log for the new result

// //   } catch (error) {
// //     console.error('An error occurred during the process:', error);
// //   }
// // };
// //   // --- Render ---
// //   return (
// //     <div className="dark:bg-[#0f172a] bg-gray-50 text-gray-800 dark:text-gray-200 flex flex-col h-screen">
// //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col flex-1">

// //         {/* Header */}
// //         <header className="py-6 flex justify-between items-center">
// //           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⚙️ Configuration</h1>
// //           <button
// //             onClick={() => navigate("/dashboard")}
// //             className="px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
// //           >
// //             &larr; Back to Dashboard
// //           </button>
// //         </header>

// //         <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
// //           {/* Side Menu */}
// //           <aside className="md:w-64">
// //             <div className="sticky top-6 bg-white dark:bg-[#1e293b] rounded-xl shadow-md p-4 space-y-2">
// //               {[
// //                 { id: "addStore", label: "🏪 Add New Store" },
// //                 { id: "editStore", label: "✏️ Edit Store Details" },
// //                 { id: "applyFormula", label: "🧮 Apply Formula" },
// //                 { id: "forecast", label: "🔭 Forecast Lookahead" },
// //               ].map(tab => (
// //                 <button
// //                   key={tab.id}
// //                   onClick={() => setActiveTab(tab.id)}
// //                   className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
// //                     activeTab === tab.id
// //                       ? "bg-blue-600 text-white shadow"
// //                       : "hover:bg-gray-100 dark:hover:bg-slate-700"
// //                   }`}
// //                 >
// //                   {tab.label}
// //                 </button>
// //               ))}
// //             </div>
// //           </aside>

// //           {/* Main Content */}
// //           <main className="flex-1 overflow-y-auto pb-8">
// //             {activeTab === "addStore" && (
// //               <SectionCard title="🏪 Add New Store">
// //                 <StoreForm
// //                     formData={storeForm}
// //                     onFormChange={handleStoreFormChange}
// //                     onSubmit={handleAddStore}
// //                     isLoading={storeLoading}
// //                     message={storeMessage}
// //                     buttonText="Add Store"
// //                 />
// //               </SectionCard>
// //             )}

// //             {activeTab === "editStore" && (
// //                 <SectionCard title="✏️ Edit Store Details">
// //                     <div className="mb-6">
// //                         <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
// //                             Select a Store to Edit
// //                         </label>
// //                         <select
// //                             id="store-select"
// //                             className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
// //                             onChange={handleStoreSelectForEdit}
// //                             value={storeForm.store_id || ""}
// //                         >
// //                             <option value="">-- Choose Store --</option>
// //                             {stores.map(store => (
// //                                 <option key={store.store_id} value={store.store_id}>
// //                                     {store.name} ({store.city})
// //                                 </option>
// //                             ))}
// //                         </select>
// //                     </div>

// //                     {storeForm.store_id && (
// //                         <StoreForm
// //                             formData={storeForm}
// //                             onFormChange={handleStoreFormChange}
// //                             onSubmit={handleUpdateStore}
// //                             isLoading={storeLoading}
// //                             message={storeMessage}
// //                             buttonText="Update Store"
// //                             isUpdate={true}
// //                         />
// //                     )}
// //                 </SectionCard>
// //             )}

// //             {activeTab === "applyFormula" && (
// //               <SectionCard title="🧮 Apply Formula to Stores">
// //                 <div className="space-y-6">
// //                   <div>
// //                     <label htmlFor="formula-select" className="block text-sm font-medium mb-1">Select Formula</label>
// //                     <select
// //                       id="formula-select"
// //                       className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
// //                       value={selectedFormula}
// //                       onChange={(e) => setSelectedFormula(e.target.value)}
// //                     >
// //                       <option value="">-- Choose Formula --</option>
// //                       {Object.entries(formulas).map(([key, desc]) => (
// //                         <option key={key} value={key}>{key} &rarr; {desc}</option>
// //                       ))}
// //                     </select>
// //                   </div>

// //                   <div>
// //                     <label className="block text-sm font-medium mb-1">Select Stores</label>
// //                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto border p-4 rounded-lg bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-gray-600">
// //                       {stores.map((store) => (
// //                         <label key={store.store_id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
// //                           <input
// //                             type="checkbox"
// //                             className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
// //                             checked={selectedStores.includes(store.store_id)}
// //                             onChange={() => {
// //                                 setSelectedStores(prev =>
// //                                     prev.includes(store.store_id)
// //                                     ? prev.filter(id => id !== store.store_id)
// //                                     : [...prev, store.store_id]
// //                                 );
// //                             }}
// //                           />
// //                           <span>{store.name} <span className="text-gray-500 dark:text-gray-400">({store.city})</span></span>
// //                         </label>
// //                       ))}
// //                     </div>
// //                   </div>
                  
// //                   <div className="flex items-center gap-4">
// //                     <SubmitButton onClick={() => { handleApplyFormula(); handleClick(); }} isLoading={applyLoading} className="bg-green-600 hover:bg-green-700">
// //                         Apply Formula
// //                     </SubmitButton>
// //                      {applyMessage.text && <StatusMessage message={applyMessage.text} type={applyMessage.type} />}
// //                   </div>
// //                 </div>
// //               </SectionCard>
// //             )}

// //             {activeTab === "forecast" && <ForecastLookahead />}
// //           </main>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // --- Reusable UI Components ---

// // // Card wrapper for each section
// // function SectionCard({ title, children }) {
// //   return (
// //     <div className="bg-white dark:bg-[#1e293b] shadow-lg rounded-xl p-6 md:p-8">
// //       <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{title}</h2>
// //       {children}
// //     </div>
// //   );
// // }

// // // Reusable form for adding and editing stores
// // function StoreForm({ formData, onFormChange, onSubmit, isLoading, message, buttonText, isUpdate = false }) {
// //     return (
// //         // ✅ **THE FIX IS HERE** ✅
// //         // The onSubmit prop is now passed directly to the form element
// //         <form onSubmit={isUpdate ? (e) => e.preventDefault() : onSubmit} className="space-y-5">
// //             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
// //                 {STORE_FORM_FIELDS.map(field => (
// //                     <FormField
// //                         key={field.name}
// //                         name={field.name}
// //                         label={field.label}
// //                         value={formData[field.name]}
// //                         onChange={onFormChange}
// //                         type={field.type || "text"}
// //                         required={field.required}
// //                         placeholder={`Enter ${field.label}...`}
// //                     />
// //                 ))}
// //             </div>
// //             <div className="pt-2 flex items-center gap-4">
// //                 <SubmitButton 
// //                   onClick={isUpdate ? onSubmit : undefined} 
// //                   type={isUpdate ? "button" : "submit"}
// //                   isLoading={isLoading}
// //                   disabled={isLoading}
// //                 >
// //                     {buttonText}
// //                 </SubmitButton>
// //                 {message.text && <StatusMessage message={message.text} type={message.type} />}
// //             </div>
// //         </form>
// //     );
// // }

// // // Reusable labeled form field
// // function FormField({ name, label, value, onChange, ...props }) {
// //   return (
// //     <div>
// //       <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
// //         {label} {props.required && <span className="text-red-500">*</span>}
// //       </label>
// //       <input
// //         id={name}
// //         name={name}
// //         value={value}
// //         onChange={onChange}
// //         className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
// //         {...props}
// //       />
// //     </div>
// //   );
// // }

// // // Reusable button with loading state
// // function SubmitButton({ isLoading, children, className = "bg-blue-600 hover:bg-blue-700", ...props }) {
// //     return (
// //         <button
// //             {...props}
// //             className={`flex items-center justify-center px-5 py-2.5 font-semibold text-white rounded-lg shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
// //             disabled={isLoading}
// //         >
// //             {isLoading ? (
// //                 <>
// //                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
// //                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
// //                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
// //                     </svg>
// //                     Processing...
// //                 </>
// //             ) : (
// //                 children
// //             )}
// //         </button>
// //     );
// // }

// // // Component to display status messages
// // function StatusMessage({ message, type }) {
// //     const baseClasses = "text-sm font-medium";
// //     const typeClasses = {
// //         success: "text-green-600 dark:text-green-400",
// //         error: "text-red-600 dark:text-red-400",
// //         info: "text-gray-600 dark:text-gray-300",
// //     };
// //     return <p className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}>{message}</p>;
// // }

// import React, { useEffect, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import ForecastLookahead from "./ForecastLookahead";

// // --- Constants ---
// const BASE_URL = "http://127.0.0.1:5500";

// // --- Helper UI Components (Shared across the file) ---

// function SectionCard({ title, children, titleSize = "text-2xl" }) {
//   return (
//     <div className="bg-white dark:bg-[#1e293b] shadow-lg rounded-xl p-6 md:p-8">
//       <h2 className={`${titleSize} font-bold mb-6 text-gray-800 dark:text-gray-100`}>{title}</h2>
//       {children}
//     </div>
//   );
// }

// function SubmitButton({ isLoading, children, className = "bg-blue-600 hover:bg-blue-700", ...props }) {
//     return (
//         <button
//             {...props}
//             className={`flex items-center justify-center px-5 py-2.5 font-semibold text-white rounded-lg shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
//             disabled={isLoading}
//         >
//             {isLoading ? (
//                 <>
//                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Processing...
//                 </>
//             ) : (
//                 children
//             )}
//         </button>
//     );
// }

// function StatusMessage({ message, type }) {
//     const baseClasses = "text-sm font-medium";
//     const typeClasses = {
//         success: "text-green-600 dark:text-green-400",
//         error: "text-red-600 dark:text-red-400",
//         info: "text-gray-600 dark:text-gray-300",
//     };
//     return <p className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}>{message}</p>;
// }

// function GenericFormField({ label, name, as = 'input', children, ...props }) {
//     const InputComponent = as;
//     return (
//         <div>
//             <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
//             <InputComponent
//                 id={name}
//                 name={name}
//                 className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 {...props}
//             >
//                 {children}
//             </InputComponent>
//         </div>
//     );
// }


// // --- Forecast Settings Component ---
// function ForecastSettings({ getAuthHeaders, BASE_URL }) {
//     // State for setting the schedule
//     const [scheduleForm, setScheduleForm] = useState({
//         frequency: 'daily',
//         time_of_day: '00:00',
//         day_of_week: 'Saturday',
//     });
//     const [scheduleLoading, setScheduleLoading] = useState(false);
//     const [scheduleMessage, setScheduleMessage] = useState({ text: "", type: "" });

//     // State for viewing schedules
//     const [schedules, setSchedules] = useState(null);
//     const [viewLoading, setViewLoading] = useState(false);
//     const [viewMessage, setViewMessage] = useState({ text: "", type: "" });

//     // State for updating the horizon
//     const [horizon, setHorizon] = useState('');
//     const [horizonLoading, setHorizonLoading] = useState(false);
//     const [horizonMessage, setHorizonMessage] = useState({ text: "", type: "" });

//     // State for running the forecast manually
//     const [runLoading, setRunLoading] = useState(false);
//     const [runMessage, setRunMessage] = useState({ text: "", type: "" });

//     // --- Event Handlers & API Calls ---
//     const handleScheduleFormChange = (e) => {
//         const { name, value } = e.target;
//         setScheduleForm(prev => ({ ...prev, [name]: value }));
//     };

//     const handleSetSchedule = async (e) => {
//         e.preventDefault();
//         const headers = getAuthHeaders();
//         if (!headers) return;

//         setScheduleLoading(true);
//         setScheduleMessage({ text: "Setting schedule...", type: "info" });
//         try {
//             const res = await axios.post(`${BASE_URL}/forecast/schedule`, scheduleForm, { headers });
//             setScheduleMessage({ text: res.data.message || "✅ Schedule set successfully!", type: "success" });
//         } catch (err) {
//             setScheduleMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
//         } finally {
//             setScheduleLoading(false);
//         }
//     };

//     const handleViewSchedules = async () => {
//         const headers = getAuthHeaders();
//         if (!headers) return;

//         setViewLoading(true);
//         setViewMessage({ text: "Fetching schedules...", type: "info" });
//         setSchedules(null);
//         try {
//             const res = await axios.get(`${BASE_URL}/forecast/schedule`, { headers });
//             setSchedules(res.data);
//             setViewMessage({ text: "", type: "" }); // Clear message on success
//         } catch (err) {
//             setViewMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
//         } finally {
//             setViewLoading(false);
//         }
//     };

//     const handleUpdateHorizon = async (e) => {
//         e.preventDefault();
//         if (!horizon || isNaN(parseInt(horizon, 10))) {
//             setHorizonMessage({ text: "❌ Please enter a valid number of weeks.", type: "error" });
//             return;
//         }

//         const headers = getAuthHeaders();
//         if (!headers) return;
        
//         setHorizonLoading(true);
//         setHorizonMessage({ text: "Updating horizon...", type: "info" });
//         try {
//             const payload = { "n_weeks": parseInt(horizon, 10) };
//             const res = await axios.post(`${BASE_URL}/forecast/schedule/horizon`, payload, { headers });
//             setHorizonMessage({ text: res.data.message || "✅ Horizon updated successfully!", type: "success" });
//         } catch (err) {
//             setHorizonMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
//         } finally {
//             setHorizonLoading(false);
//         }
//     };

//     const handleRunForecast = async () => {
//         const headers = getAuthHeaders();
//         if (!headers) return;

//         setRunLoading(true);
//         setRunMessage({ text: "Triggering manual forecast run...", type: "info" });
//         try {
//             const res = await axios.post(`${BASE_URL}/forecast/run`, {}, { headers });
//             setRunMessage({ text: res.data.message || "✅ Forecast run triggered successfully!", type: "success" });
//         } catch (err) {
//             setRunMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
//         } finally {
//             setRunLoading(false);
//         }
//     };


//     return (
//         <div className="space-y-8">
//             <SectionCard title="🗓️ Set Forecast Schedule" titleSize="text-xl">
//                 <form onSubmit={handleSetSchedule} className="space-y-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <GenericFormField label="Frequency" name="frequency" value={scheduleForm.frequency} onChange={handleScheduleFormChange} as="select">
//                             <option value="daily">Daily</option>
//                             <option value="weekly">Weekly</option>
//                             <option value="monthly">Monthly</option>
//                             <option value="hourly">Hourly</option>
//                         </GenericFormField>
//                         <GenericFormField label="Time of Day (HH:MM)" name="time_of_day" value={scheduleForm.time_of_day} onChange={handleScheduleFormChange} type="time" />
//                         {scheduleForm.frequency === 'weekly' && (
//                              <GenericFormField label="Day of Week" name="day_of_week" value={scheduleForm.day_of_week} onChange={handleScheduleFormChange} as="select">
//                                 <option>Saturday</option><option>Sunday</option><option>Monday</option>
//                                 <option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>
//                             </GenericFormField>
//                         )}
//                     </div>
//                     <div className="flex items-center gap-4 pt-2">
//                         <SubmitButton type="submit" isLoading={scheduleLoading}>Set Schedule</SubmitButton>
//                         {scheduleMessage.text && <StatusMessage message={scheduleMessage.text} type={scheduleMessage.type} />}
//                     </div>
//                 </form>
//             </SectionCard>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <SectionCard title="🔭 Update Forecast Horizon" titleSize="text-xl">
//                      <form onSubmit={handleUpdateHorizon} className="space-y-4">
//                         <GenericFormField label="Horizon (in weeks)" name="horizon" value={horizon} onChange={(e) => setHorizon(e.target.value)} type="number" placeholder="e.g., 4" />
//                          <div className="flex items-center gap-4 pt-2">
//                             <SubmitButton type="submit" isLoading={horizonLoading}>Update Horizon</SubmitButton>
//                             {horizonMessage.text && <StatusMessage message={horizonMessage.text} type={horizonMessage.type} />}
//                         </div>
//                     </form>
//                 </SectionCard>
//                 <SectionCard title="⚡ Run Forecast Manually" titleSize="text-xl">
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Trigger an immediate forecast calculation for all relevant data. This may take a few moments.</p>
//                      <div className="flex items-center gap-4">
//                         <SubmitButton onClick={handleRunForecast} isLoading={runLoading} className="bg-green-600 hover:bg-green-700">Run Forecast Now</SubmitButton>
//                         {runMessage.text && <StatusMessage message={runMessage.text} type={runMessage.type} />}
//                     </div>
//                 </SectionCard>
//             </div>

//             <SectionCard title="📋 View Current Schedules" titleSize="text-xl">
//                 <div className="flex items-center gap-4 mb-4">
//                     <SubmitButton onClick={handleViewSchedules} isLoading={viewLoading}>
//                         View Active Schedules
//                     </SubmitButton>
//                     {viewMessage.text && <StatusMessage message={viewMessage.text} type={viewMessage.type} />}
//                 </div>
//                 {schedules && (
//                     <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg max-h-96 overflow-y-auto">
//                         <pre className="text-sm text-gray-800 dark:text-gray-200">{JSON.stringify(schedules, null, 2)}</pre>
//                     </div>
//                 )}
//             </SectionCard>
//         </div>
//     );
// }


// // --- Main Config Page Component ---

// const STORE_FORM_FIELDS = [
//   { name: "store_code", label: "Store Code", required: true },
//   { name: "name", label: "Store Name", required: true },
//   { name: "address", label: "Address", required: true },
//   { name: "city", label: "City", required: true },
//   { name: "state", label: "State" },
//   { name: "country", label: "Country" },
//   { name: "lat", label: "Latitude", type: "number" },
//   { name: "long", label: "Longitude", type: "number" },
//   { name: "capacity_units", label: "Capacity (Units)", type: "number" },
// ];

// const INITIAL_STORE_FORM_STATE = {
//   store_id: "", store_code: "", name: "", address: "", city: "",
//   state: "", country: "", lat: "", long: "", capacity_units: "",
// };

// export default function ConfigPage() {
//   const navigate = useNavigate();

//   // State
//   const [activeTab, setActiveTab] = useState("addStore");
//   const [formulas, setFormulas] = useState({});
//   const [stores, setStores] = useState([]);
//   const [selectedFormula, setSelectedFormula] = useState("");
//   const [selectedStores, setSelectedStores] = useState([]);
//   const [applyLoading, setApplyLoading] = useState(false);
//   const [applyMessage, setApplyMessage] = useState({ text: "", type: "" });
//   const [storeForm, setStoreForm] = useState(INITIAL_STORE_FORM_STATE);
//   const [originalStore, setOriginalStore] = useState(null);
//   const [storeLoading, setStoreLoading] = useState(false);
//   const [storeMessage, setStoreMessage] = useState({ text: "", type: "" });
  
//   // API & Data Fetching
//   const getAuthHeaders = useCallback(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       navigate("/login");
//       return null;
//     }
//     return { 'Authorization': `Bearer ${token}` };
//   }, [navigate]);

//   const fetchFormulas = useCallback(async () => {
//     try {
//       const headers = getAuthHeaders();
//       if (!headers) return;
//       const res = await axios.get(`${BASE_URL}/config/formulas`, { headers });
//       setFormulas(res.data);
//     } catch (err) {
//       console.error("Failed to fetch formulas:", err);
//       if (err.response?.status === 401) navigate("/login");
//     }
//   }, [getAuthHeaders, navigate]);

//   const fetchStores = useCallback(async () => {
//     try {
//       const headers = getAuthHeaders();
//       if (!headers) return;
//       const res = await axios.get(`${BASE_URL}/stores`, { headers });
//       setStores(res.data.stores || []);
//     } catch (err) {
//       console.error("Failed to fetch stores:", err);
//       if (err.response?.status === 401) navigate("/login");
//     }
//   }, [getAuthHeaders, navigate]);

//   useEffect(() => {
//     fetchFormulas();
//     fetchStores();
//   }, [fetchFormulas, fetchStores]);
  
//   // Event Handlers
//   const handleStoreFormChange = (e) => {
//     const { name, value } = e.target;
//     setStoreForm((prev) => ({ ...prev, [name]: value }));
//   };
  
//   const handleStoreSelectForEdit = (e) => {
//     const selectedId = parseInt(e.target.value, 10);
//     const selected = stores.find((s) => s.store_id === selectedId);
//     if (selected) {
//       const formData = Object.keys(INITIAL_STORE_FORM_STATE).reduce((acc, key) => {
//         acc[key] = selected[key] ?? "";
//         return acc;
//       }, {});
//       setStoreForm(formData);
//       setOriginalStore(selected);
//       setStoreMessage({ text: "", type: "" });
//     } else {
//       setStoreForm(INITIAL_STORE_FORM_STATE);
//       setOriginalStore(null);
//     }
//   };

//   const handleAddStore = async (e) => {
//     e.preventDefault();
//     setStoreLoading(true);
//     setStoreMessage({ text: "Adding store...", type: "info" });
//     try {
//       const headers = getAuthHeaders();
//       if (!headers) return;
//       await axios.post(`${BASE_URL}/store_upload`, storeForm, { headers });
//       setStoreMessage({ text: "✅ Store added successfully!", type: "success" });
//       setStoreForm(INITIAL_STORE_FORM_STATE);
//       await fetchStores();
//     } catch (err) {
//       setStoreMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
//     } finally {
//       setStoreLoading(false);
//     }
//   };

//   const handleUpdateStore = async () => {
//     if (!originalStore) return;
//     const headers = getAuthHeaders();
//     if (!headers) return;

//     const payload = { store_id: originalStore.store_id };
//     let changesMade = false;
//     Object.keys(storeForm).forEach(key => {
//         if (key !== 'store_id' && (originalStore[key] ?? "") !== (storeForm[key] ?? "")) {
//             payload[key] = storeForm[key] === "" ? null : storeForm[key];
//             changesMade = true;
//         }
//     });

//     if (!changesMade) {
//       setStoreMessage({ text: "💡 No changes detected.", type: "info" });
//       return;
//     }

//     setStoreLoading(true);
//     setStoreMessage({ text: "Updating store...", type: "info" });
//     try {
//         await axios.post(`${BASE_URL}/update_store`, payload, { headers });
//         setStoreMessage({ text: "✅ Store updated successfully!", type: "success" });
//         await fetchStores();
//     } catch (err) {
//         setStoreMessage({ text: `❌ Update failed: ${err.response?.data?.error || err.message}`, type: "error" });
//     } finally {
//         setStoreLoading(false);
//     }
//   };
  
//   const handleApplyFormula = async () => {
//     if (!selectedFormula) {
//       setApplyMessage({ text: "❌ Please select a formula!", type: "error" });
//       return;
//     }
//     setApplyLoading(true);
//     setApplyMessage({ text: "Applying formula...", type: "info" });
//     const headers = getAuthHeaders();
//     if (!headers) return;
//     const payload = { formula: selectedFormula, ...(selectedStores.length > 0 && { store_ids: selectedStores }) };
//     try {
//       const res = await axios.post(`${BASE_URL}/config/apply-formula`, payload, { headers });
//       setApplyMessage({ text: `✅ Success: ${res.data.message || 'Formula applied.'}`, type: "success" });
//     } catch (err) {
//       setApplyMessage({ text: `❌ Failed: ${err.response?.data?.error || err.message}`, type: "error" });
//     } finally {
//       setApplyLoading(false);
//     }
//   };

//   const handleClick = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) return;
//       const requestOptions = {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//         body: JSON.stringify({}),
//       };
//       await Promise.all([
//         fetch(`${BASE_URL}/dashboard/recompute`, requestOptions),
//         fetch(`${BASE_URL}/availability/recompute`, requestOptions),
//         fetch(`${BASE_URL}/alerts/refresh`, requestOptions)
//       ]);
//       console.log('✅ Recompute and refresh actions triggered successfully.');
//     } catch (error) {
//       console.error('An error occurred during the recompute process:', error);
//     }
//   };

//   // Render
//   return (
//     <div className="dark:bg-[#0f172a] bg-gray-50 text-gray-800 dark:text-gray-200 flex flex-col h-screen">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col flex-1">
//         <header className="py-6 flex justify-between items-center">
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⚙️ Configuration</h1>
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
//           >
//             &larr; Back to Dashboard
//           </button>
//         </header>

//         <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
//           <aside className="md:w-64">
//             <div className="sticky top-6 bg-white dark:bg-[#1e293b] rounded-xl shadow-md p-4 space-y-2">
//               {[
//                 { id: "addStore", label: "🏪 Add New Store" },
//                 { id: "editStore", label: "✏️ Edit Store Details" },
//                 { id: "applyFormula", label: "🧮 Apply Formula" },
//                 { id: "forecast", label: "🔭 Forecast Lookahead" },
//                 { id: "forecastSettings", label: "📈 Forecast Settings" },
//               ].map(tab => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
//                     activeTab === tab.id
//                       ? "bg-blue-600 text-white shadow"
//                       : "hover:bg-gray-100 dark:hover:bg-slate-700"
//                   }`}
//                 >
//                   {tab.label}
//                 </button>
//               ))}
//             </div>
//           </aside>

//           <main className="flex-1 overflow-y-auto pb-8">
//             {activeTab === "addStore" && (
//               <SectionCard title="🏪 Add New Store">
//                 <StoreForm formData={storeForm} onFormChange={handleStoreFormChange} onSubmit={handleAddStore} isLoading={storeLoading} message={storeMessage} buttonText="Add Store" />
//               </SectionCard>
//             )}

//             {activeTab === "editStore" && (
//                 <SectionCard title="✏️ Edit Store Details">
//                     <div className="mb-6">
//                         <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select a Store to Edit</label>
//                         <select id="store-select" className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600" onChange={handleStoreSelectForEdit} value={storeForm.store_id || ""}>
//                             <option value="">-- Choose Store --</option>
//                             {stores.map(store => <option key={store.store_id} value={store.store_id}>{store.name} ({store.city})</option>)}
//                         </select>
//                     </div>
//                     {storeForm.store_id && <StoreForm formData={storeForm} onFormChange={handleStoreFormChange} onSubmit={handleUpdateStore} isLoading={storeLoading} message={storeMessage} buttonText="Update Store" isUpdate={true} />}
//                 </SectionCard>
//             )}

//             {activeTab === "applyFormula" && (
//               <SectionCard title="🧮 Apply Formula to Stores">
//                 <div className="space-y-6">
//                   <div>
//                     <label htmlFor="formula-select" className="block text-sm font-medium mb-1">Select Formula</label>
//                     <select id="formula-select" className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600" value={selectedFormula} onChange={(e) => setSelectedFormula(e.target.value)}>
//                       <option value="">-- Choose Formula --</option>
//                       {Object.entries(formulas).map(([key, desc]) => <option key={key} value={key}>{key} &rarr; {desc}</option>)}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Select Stores</label>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto border p-4 rounded-lg bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-gray-600">
//                       {stores.map((store) => (
//                         <label key={store.store_id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer">
//                           <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={selectedStores.includes(store.store_id)} onChange={() => setSelectedStores(p => p.includes(store.store_id) ? p.filter(id => id !== store.store_id) : [...p, store.store_id])} />
//                           <span>{store.name} <span className="text-gray-500 dark:text-gray-400">({store.city})</span></span>
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-4">
//                     <SubmitButton onClick={() => { handleApplyFormula(); handleClick(); }} isLoading={applyLoading} className="bg-green-600 hover:bg-green-700">Apply Formula</SubmitButton>
//                     {applyMessage.text && <StatusMessage message={applyMessage.text} type={applyMessage.type} />}
//                   </div>
//                 </div>
//               </SectionCard>
//             )}

//             {activeTab === "forecast" && <ForecastLookahead />}

//             {activeTab === "forecastSettings" && <ForecastSettings getAuthHeaders={getAuthHeaders} BASE_URL={BASE_URL} />}
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- Store Form Component ---
// function StoreForm({ formData, onFormChange, onSubmit, isLoading, message, buttonText, isUpdate = false }) {
//     return (
//         <form onSubmit={isUpdate ? (e) => e.preventDefault() : onSubmit} className="space-y-5">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
//                 {STORE_FORM_FIELDS.map(field => <StoreFormField key={field.name} name={field.name} label={field.label} value={formData[field.name]} onChange={onFormChange} type={field.type || "text"} required={field.required} placeholder={`Enter ${field.label}...`} />)}
//             </div>
//             <div className="pt-2 flex items-center gap-4">
//                 <SubmitButton onClick={isUpdate ? onSubmit : undefined} type={isUpdate ? "button" : "submit"} isLoading={isLoading} disabled={isLoading}>{buttonText}</SubmitButton>
//                 {message.text && <StatusMessage message={message.text} type={message.type} />}
//             </div>
//         </form>
//     );
// }

// function StoreFormField({ name, label, value, onChange, ...props }) {
//   return (
//     <div>
//       <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//         {label} {props.required && <span className="text-red-500">*</span>}
//       </label>
//       <input id={name} name={name} value={value} onChange={onChange} className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600" {...props} />
//     </div>
//   );
// }


import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ForecastLookahead from "./ForecastLookahead";

// --- Constants ---
const BASE_URL = "http://127.0.0.1:5500";

// --- Helper UI Components (Shared across the file) ---

function SectionCard({ title, children, titleSize = "text-2xl" }) {
  return (
    <div className="bg-white dark:bg-[#1e293b] shadow-lg rounded-xl p-6 md:p-8">
      <h2 className={`${titleSize} font-bold mb-6 text-gray-800 dark:text-gray-100`}>{title}</h2>
      {children}
    </div>
  );
}

function SubmitButton({ isLoading, children, className = "bg-blue-600 hover:bg-blue-700", ...props }) {
    return (
        <button
            {...props}
            className={`flex items-center justify-center px-5 py-2.5 font-semibold text-white rounded-lg shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </>
            ) : (
                children
            )}
        </button>
    );
}

function StatusMessage({ message, type }) {
    const baseClasses = "text-sm font-medium";
    const typeClasses = {
        success: "text-green-600 dark:text-green-400",
        error: "text-red-600 dark:text-red-400",
        info: "text-gray-600 dark:text-gray-300",
    };
    return <p className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}>{message}</p>;
}

function GenericFormField({ label, name, as = 'input', children, ...props }) {
    const InputComponent = as;
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <InputComponent
                id={name}
                name={name}
                className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...props}
            >
                {children}
            </InputComponent>
        </div>
    );
}


// --- Forecast Settings Component ---
function ForecastSettings({ getAuthHeaders, BASE_URL }) {
    // State for setting the schedule
    const [scheduleForm, setScheduleForm] = useState({
        frequency: 'daily',
        time_of_day: '00:00',
        day_of_week: 'Saturday',
    });
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleMessage, setScheduleMessage] = useState({ text: "", type: "" });

    // State for viewing schedules
    const [schedules, setSchedules] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewMessage, setViewMessage] = useState({ text: "", type: "" });

    // State for updating the horizon
    const [horizon, setHorizon] = useState('');
    const [horizonLoading, setHorizonLoading] = useState(false);
    const [horizonMessage, setHorizonMessage] = useState({ text: "", type: "" });

    // State for running the forecast manually
    const [manualRunWeeks, setManualRunWeeks] = useState(''); // State for manual run weeks input
    const [runLoading, setRunLoading] = useState(false);
    const [runMessage, setRunMessage] = useState({ text: "", type: "" });

    // --- Event Handlers & API Calls ---
    const handleScheduleFormChange = (e) => {
        const { name, value } = e.target;
        setScheduleForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSetSchedule = async (e) => {
        e.preventDefault();
        const headers = getAuthHeaders();
        if (!headers) return;

        setScheduleLoading(true);
        setScheduleMessage({ text: "Setting schedule...", type: "info" });
        try {
            const res = await axios.post(`${BASE_URL}/forecast/schedule`, scheduleForm, { headers });
            setScheduleMessage({ text: res.data.message || "✅ Schedule set successfully!", type: "success" });
        } catch (err) {
            setScheduleMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
        } finally {
            setScheduleLoading(false);
        }
    };

    const handleViewSchedules = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        setViewLoading(true);
        setViewMessage({ text: "Fetching schedules...", type: "info" });
        setSchedules(null);
        try {
            const res = await axios.get(`${BASE_URL}/forecast/schedule`, { headers });
            setSchedules(res.data);
            setViewMessage({ text: "", type: "" }); // Clear message on success
        } catch (err) {
            setViewMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
        } finally {
            setViewLoading(false);
        }
    };

    const handleUpdateHorizon = async (e) => {
        e.preventDefault();
        if (!horizon || isNaN(parseInt(horizon, 10))) {
            setHorizonMessage({ text: "❌ Please enter a valid number of weeks.", type: "error" });
            return;
        }

        const headers = getAuthHeaders();
        if (!headers) return;
        
        setHorizonLoading(true);
        setHorizonMessage({ text: "Updating horizon...", type: "info" });
        try {
            const payload = { "n_weeks": parseInt(horizon, 10) };
            const res = await axios.post(`${BASE_URL}/forecast/schedule/horizon`, payload, { headers });
            setHorizonMessage({ text: res.data.message || "✅ Horizon updated successfully!", type: "success" });
        } catch (err) {
            setHorizonMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
        } finally {
            setHorizonLoading(false);
        }
    };
    
    // ✅ MODIFIED FUNCTION
    const handleRunForecast = async () => {
        // Validation for the new 'weeks' input
        if (!manualRunWeeks || isNaN(parseInt(manualRunWeeks, 10)) || parseInt(manualRunWeeks, 10) <= 0) {
            setRunMessage({ text: "❌ Please enter a valid, positive number of weeks.", type: "error" });
            return;
        }
    
        const headers = getAuthHeaders();
        if (!headers) return;
    
        setRunLoading(true);
        setRunMessage({ text: "Triggering manual forecast run...", type: "info" });
        
        // Create the payload with the 'weeks' parameter
        const payload = { "weeks": parseInt(manualRunWeeks, 10) };
    
        try {
            // Send the payload in the POST request
            const res = await axios.post(`${BASE_URL}/forecast/run`, payload, { headers });
            setRunMessage({ text: res.data.message || `✅ Forecast run for ${manualRunWeeks} weeks triggered!`, type: "success" });
        } catch (err) {
            setRunMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
        } finally {
            setRunLoading(false);
        }
    };


    return (
        <div className="space-y-8">
            <SectionCard title="🗓️ Set Forecast Schedule" titleSize="text-xl">
                <form onSubmit={handleSetSchedule} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GenericFormField label="Frequency" name="frequency" value={scheduleForm.frequency} onChange={handleScheduleFormChange} as="select">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="hourly">Hourly</option>
                        </GenericFormField>
                        <GenericFormField label="Time of Day (HH:MM)" name="time_of_day" value={scheduleForm.time_of_day} onChange={handleScheduleFormChange} type="time" />
                        {scheduleForm.frequency === 'weekly' && (
                             <GenericFormField label="Day of Week" name="day_of_week" value={scheduleForm.day_of_week} onChange={handleScheduleFormChange} as="select">
                                <option>Saturday</option><option>Sunday</option><option>Monday</option>
                                <option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>
                            </GenericFormField>
                        )}
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                        <SubmitButton type="submit" isLoading={scheduleLoading}>Set Schedule</SubmitButton>
                        {scheduleMessage.text && <StatusMessage message={scheduleMessage.text} type={scheduleMessage.type} />}
                    </div>
                </form>
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SectionCard title="🔭 Update Forecast Horizon" titleSize="text-xl">
                     <form onSubmit={handleUpdateHorizon} className="space-y-4">
                        <GenericFormField label="Horizon (in weeks)" name="horizon" value={horizon} onChange={(e) => setHorizon(e.target.value)} type="number" placeholder="e.g., 4" />
                         <div className="flex items-center gap-4 pt-2">
                            <SubmitButton type="submit" isLoading={horizonLoading}>Update Horizon</SubmitButton>
                            {horizonMessage.text && <StatusMessage message={horizonMessage.text} type={horizonMessage.type} />}
                        </div>
                    </form>
                </SectionCard>

                 {/* ✅ MODIFIED SECTION */}
                <SectionCard title="⚡ Run Forecast Manually" titleSize="text-xl">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Trigger an immediate forecast calculation for a specific number of weeks.</p>
                        
                        {/* Input field for 'weeks' */}
                        <GenericFormField 
                            label="Number of Weeks to Forecast" 
                            name="manual_run_weeks" 
                            value={manualRunWeeks} 
                            onChange={(e) => setManualRunWeeks(e.target.value)} 
                            type="number" 
                            placeholder="e.g., 4" 
                            min="1"
                        />

                        <div className="flex items-center gap-4 pt-2">
                            <SubmitButton onClick={handleRunForecast} isLoading={runLoading} className="bg-green-600 hover:bg-green-700">Run Forecast Now</SubmitButton>
                            {runMessage.text && <StatusMessage message={runMessage.text} type={runMessage.type} />}
                        </div>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="📋 View Current Schedules" titleSize="text-xl">
                <div className="flex items-center gap-4 mb-4">
                    <SubmitButton onClick={handleViewSchedules} isLoading={viewLoading}>
                        View Active Schedules
                    </SubmitButton>
                    {viewMessage.text && <StatusMessage message={viewMessage.text} type={viewMessage.type} />}
                </div>
                {schedules && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-800 dark:text-gray-200">{JSON.stringify(schedules, null, 2)}</pre>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}


// --- Main Config Page Component ---

const STORE_FORM_FIELDS = [
  { name: "store_code", label: "Store Code", required: true },
  { name: "name", label: "Store Name", required: true },
  { name: "address", label: "Address", required: true },
  { name: "city", label: "City", required: true },
  { name: "state", label: "State" },
  { name: "country", label: "Country" },
  { name: "lat", label: "Latitude", type: "number" },
  { name: "long", label: "Longitude", type: "number" },
  { name: "capacity_units", label: "Capacity (Units)", type: "number" },
];

const INITIAL_STORE_FORM_STATE = {
  store_id: "", store_code: "", name: "", address: "", city: "",
  state: "", country: "", lat: "", long: "", capacity_units: "",
};

export default function ConfigPage() {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState("addStore");
  const [formulas, setFormulas] = useState({});
  const [stores, setStores] = useState([]);
  const [selectedFormula, setSelectedFormula] = useState("");
  const [selectedStores, setSelectedStores] = useState([]);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState({ text: "", type: "" });
  const [storeForm, setStoreForm] = useState(INITIAL_STORE_FORM_STATE);
  const [originalStore, setOriginalStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeMessage, setStoreMessage] = useState({ text: "", type: "" });
  
  // API & Data Fetching
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  }, [navigate]);

  const fetchFormulas = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get(`${BASE_URL}/config/formulas`, { headers });
      setFormulas(res.data);
    } catch (err) {
      console.error("Failed to fetch formulas:", err);
      if (err.response?.status === 401) navigate("/login");
    }
  }, [getAuthHeaders, navigate]);

  const fetchStores = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get(`${BASE_URL}/stores`, { headers });
      setStores(res.data.stores || []);
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      if (err.response?.status === 401) navigate("/login");
    }
  }, [getAuthHeaders, navigate]);

  useEffect(() => {
    fetchFormulas();
    fetchStores();
  }, [fetchFormulas, fetchStores]);
  
  // Event Handlers
  const handleStoreFormChange = (e) => {
    const { name, value } = e.target;
    setStoreForm((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleStoreSelectForEdit = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    const selected = stores.find((s) => s.store_id === selectedId);
    if (selected) {
      const formData = Object.keys(INITIAL_STORE_FORM_STATE).reduce((acc, key) => {
        acc[key] = selected[key] ?? "";
        return acc;
      }, {});
      setStoreForm(formData);
      setOriginalStore(selected);
      setStoreMessage({ text: "", type: "" });
    } else {
      setStoreForm(INITIAL_STORE_FORM_STATE);
      setOriginalStore(null);
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    setStoreLoading(true);
    setStoreMessage({ text: "Adding store...", type: "info" });
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      await axios.post(`${BASE_URL}/store_upload`, storeForm, { headers });
      setStoreMessage({ text: "✅ Store added successfully!", type: "success" });
      setStoreForm(INITIAL_STORE_FORM_STATE);
      await fetchStores();
    } catch (err) {
      setStoreMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
    } finally {
      setStoreLoading(false);
    }
  };

  const handleUpdateStore = async () => {
    if (!originalStore) return;
    const headers = getAuthHeaders();
    if (!headers) return;

    const payload = { store_id: originalStore.store_id };
    let changesMade = false;
    Object.keys(storeForm).forEach(key => {
        if (key !== 'store_id' && (originalStore[key] ?? "") !== (storeForm[key] ?? "")) {
            payload[key] = storeForm[key] === "" ? null : storeForm[key];
            changesMade = true;
        }
    });

    if (!changesMade) {
      setStoreMessage({ text: "💡 No changes detected.", type: "info" });
      return;
    }

    setStoreLoading(true);
    setStoreMessage({ text: "Updating store...", type: "info" });
    try {
        await axios.post(`${BASE_URL}/update_store`, payload, { headers });
        setStoreMessage({ text: "✅ Store updated successfully!", type: "success" });
        await fetchStores();
    } catch (err) {
        setStoreMessage({ text: `❌ Update failed: ${err.response?.data?.error || err.message}`, type: "error" });
    } finally {
        setStoreLoading(false);
    }
  };
  
  const handleApplyFormula = async () => {
    if (!selectedFormula) {
      setApplyMessage({ text: "❌ Please select a formula!", type: "error" });
      return;
    }
    setApplyLoading(true);
    setApplyMessage({ text: "Applying formula...", type: "info" });
    const headers = getAuthHeaders();
    if (!headers) return;
    const payload = { formula: selectedFormula, ...(selectedStores.length > 0 && { store_ids: selectedStores }) };
    try {
      const res = await axios.post(`${BASE_URL}/config/apply-formula`, payload, { headers });
      setApplyMessage({ text: `✅ Success: ${res.data.message || 'Formula applied.'}`, type: "success" });
    } catch (err) {
      setApplyMessage({ text: `❌ Failed: ${err.response?.data?.error || err.message}`, type: "error" });
    } finally {
      setApplyLoading(false);
    }
  };

  const handleClick = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({}),
      };
      await Promise.all([
        fetch(`${BASE_URL}/dashboard/recompute`, requestOptions),
        fetch(`${BASE_URL}/availability/recompute`, requestOptions),
        fetch(`${BASE_URL}/alerts/refresh`, requestOptions)
      ]);
      console.log('✅ Recompute and refresh actions triggered successfully.');
    } catch (error) {
      console.error('An error occurred during the recompute process:', error);
    }
  };

  // Render
  return (
    <div className="dark:bg-[#0f172a] bg-gray-50 text-gray-800 dark:text-gray-200 flex flex-col h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col flex-1">
        <header className="py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⚙️ Configuration</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
          >
            &larr; Back to Dashboard
          </button>
        </header>

        <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
          <aside className="md:w-64">
            <div className="sticky top-6 bg-white dark:bg-[#1e293b] rounded-xl shadow-md p-4 space-y-2">
              {[
                { id: "addStore", label: "🏪 Add New Store" },
                { id: "editStore", label: "✏️ Edit Store Details" },
                { id: "applyFormula", label: "🧮 Apply Formula" },
                { id: "forecast", label: "🔭 Forecast Lookahead" },
                { id: "forecastSettings", label: "📈 Forecast Settings" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto pb-8">
            {activeTab === "addStore" && (
              <SectionCard title="🏪 Add New Store">
                <StoreForm formData={storeForm} onFormChange={handleStoreFormChange} onSubmit={handleAddStore} isLoading={storeLoading} message={storeMessage} buttonText="Add Store" />
              </SectionCard>
            )}

            {activeTab === "editStore" && (
                <SectionCard title="✏️ Edit Store Details">
                    <div className="mb-6">
                        <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select a Store to Edit</label>
                        <select id="store-select" className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600" onChange={handleStoreSelectForEdit} value={storeForm.store_id || ""}>
                            <option value="">-- Choose Store --</option>
                            {stores.map(store => <option key={store.store_id} value={store.store_id}>{store.name} ({store.city})</option>)}
                        </select>
                    </div>
                    {storeForm.store_id && <StoreForm formData={storeForm} onFormChange={handleStoreFormChange} onSubmit={handleUpdateStore} isLoading={storeLoading} message={storeMessage} buttonText="Update Store" isUpdate={true} />}
                </SectionCard>
            )}

            {activeTab === "applyFormula" && (
              <SectionCard title="🧮 Apply Formula to Stores">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="formula-select" className="block text-sm font-medium mb-1">Select Formula</label>
                    <select id="formula-select" className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600" value={selectedFormula} onChange={(e) => setSelectedFormula(e.target.value)}>
                      <option value="">-- Choose Formula --</option>
                      {Object.entries(formulas).map(([key, desc]) => <option key={key} value={key}>{key} &rarr; {desc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Stores</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto border p-4 rounded-lg bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-gray-600">
                      {stores.map((store) => (
                        <label key={store.store_id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={selectedStores.includes(store.store_id)} onChange={() => setSelectedStores(p => p.includes(store.store_id) ? p.filter(id => id !== store.store_id) : [...p, store.store_id])} />
                          <span>{store.name} <span className="text-gray-500 dark:text-gray-400">({store.city})</span></span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <SubmitButton onClick={() => { handleApplyFormula(); handleClick(); }} isLoading={applyLoading} className="bg-green-600 hover:bg-green-700">Apply Formula</SubmitButton>
                    {applyMessage.text && <StatusMessage message={applyMessage.text} type={applyMessage.type} />}
                  </div>
                </div>
              </SectionCard>
            )}

            {activeTab === "forecast" && <ForecastLookahead />}

            {activeTab === "forecastSettings" && <ForecastSettings getAuthHeaders={getAuthHeaders} BASE_URL={BASE_URL} />}
          </main>
        </div>
      </div>
    </div>
  );
}

// --- Store Form Component ---
function StoreForm({ formData, onFormChange, onSubmit, isLoading, message, buttonText, isUpdate = false }) {
    return (
        <form onSubmit={isUpdate ? (e) => e.preventDefault() : onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {STORE_FORM_FIELDS.map(field => <StoreFormField key={field.name} name={field.name} label={field.label} value={formData[field.name]} onChange={onFormChange} type={field.type || "text"} required={field.required} placeholder={`Enter ${field.label}...`} />)}
            </div>
            <div className="pt-2 flex items-center gap-4">
                <SubmitButton onClick={isUpdate ? onSubmit : undefined} type={isUpdate ? "button" : "submit"} isLoading={isLoading} disabled={isLoading}>{buttonText}</SubmitButton>
                {message.text && <StatusMessage message={message.text} type={message.type} />}
            </div>
        </form>
    );
}

function StoreFormField({ name, label, value, onChange, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input id={name} name={name} value={value} onChange={onChange} className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600" {...props} />
    </div>
  );
}