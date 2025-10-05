// import React, { useEffect, useState, useCallback, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import ForecastLookahead from "./ForecastLookahead";

// // --- Constants ---
// const BASE_URL = "http://127.0.0.1:5500";

// // --- Helper UI Components (Shared across the file) ---

// function SectionCard({ title, children, titleSize = "text-2xl" }) {
//   return (
//     // This class is correct: flex-1 makes the card grow
//     <div className="bg-white dark:bg-[#1e293b] shadow-lg rounded-xl p-6 md:p-8 flex-1">
//       <h2 className={`${titleSize} font-bold mb-6 text-gray-800 dark:text-gray-100`}>{title}</h2>
//       {children}
//     </div>
//   );
// }

// function SubmitButton({ isLoading, children, className = "bg-blue-600 hover:bg-blue-700", ...props }) {
//     return (
//         <button
//             {...props}
//             className={`flex items-center justify-center px-5 py-2.5 font-semibold text-white rounded-lg shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
//             disabled={isLoading}
//         >
//             {isLoading ? (
//                 <>
//                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Processing...
//                 </>
//             ) : (
//                 children
//             )}
//         </button>
//     );
// }

// function StatusMessage({ message, type }) {
//     const baseClasses = "text-sm font-medium";
//     const typeClasses = {
//         success: "text-green-600 dark:text-green-400",
//         error: "text-red-600 dark:text-red-400",
//         info: "text-gray-600 dark:text-gray-300",
//     };
//     return <p className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}>{message}</p>;
// }

// function GenericFormField({ label, name, as = 'input', children, ...props }) {
//     const InputComponent = as;
//     return (
//         <div>
//             <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
//             <InputComponent
//                 id={name}
//                 name={name}
//                 className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 {...props}
//             >
//                 {children}
//             </InputComponent>
//         </div>
//     );
// }

// // --- Forecast Settings Component ---
// function ForecastSettings({ getAuthHeaders, BASE_URL }) {
//     // State for setting the schedule
//     const [scheduleForm, setScheduleForm] = useState({
//         frequency: 'daily',
//         time_of_day: '00:00',
//         day_of_week: 'Saturday',
//     });
//     const [scheduleLoading, setScheduleLoading] = useState(false);
//     const [scheduleMessage, setScheduleMessage] = useState({ text: "", type: "" });

//     // State for viewing schedules
//     const [schedules, setSchedules] = useState(null);
//     const [viewLoading, setViewLoading] = useState(false);
//     const [viewMessage, setViewMessage] = useState({ text: "", type: "" });

//     // State for running the forecast manually
//     const [manualRunWeeks, setManualRunWeeks] = useState('');
//     const [runLoading, setRunLoading] = useState(false);
//     const [runMessage, setRunMessage] = useState({ text: "", type: "" });

//     // --- Event Handlers & API Calls ---
//     const handleScheduleFormChange = (e) => {
//         const { name, value } = e.target;
//         setScheduleForm(prev => ({ ...prev, [name]: value }));
//     };

//     const handleSetSchedule = async (e) => {
//         e.preventDefault();
//         const headers = getAuthHeaders();
//         if (!headers) return;

//         setScheduleLoading(true);
//         setScheduleMessage({ text: "Setting schedule...", type: "info" });
//         try {
//             const res = await axios.post(`${BASE_URL}/forecast/schedule`, scheduleForm, { headers });
//             setScheduleMessage({ text: res.data.message || "✅ Schedule set successfully!", type: "success" });
//         } catch (err) {
//             setScheduleMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
//         } finally {
//             setScheduleLoading(false);
//         }
//     };

//     const handleViewSchedules = async () => {
//         const headers = getAuthHeaders();
//         if (!headers) return;

//         setViewLoading(true);
//         setViewMessage({ text: "Fetching schedules...", type: "info" });
//         setSchedules(null);
//         try {
//             const res = await axios.get(`${BASE_URL}/forecast/schedule`, { headers });
//             setSchedules(res.data.schedules);
//             setViewMessage({ text: "", type: "" }); // Clear message on success
//         } catch (err) {
//             setViewMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
//         } finally {
//             setViewLoading(false);
//         }
//     };

//     const handleRunForecast = async () => {
//         if (!manualRunWeeks || isNaN(parseInt(manualRunWeeks, 10)) || parseInt(manualRunWeeks, 10) <= 0) {
//             setRunMessage({ text: "❌ Please enter a valid, positive number of weeks.", type: "error" });
//             return;
//         }
//         const headers = getAuthHeaders();
//         if (!headers) return;
//         setRunLoading(true);
//         setRunMessage({ text: "Triggering manual forecast run...", type: "info" });
//         const payload = { "weeks": parseInt(manualRunWeeks, 10) };
//         try {
//             const res = await axios.post(`${BASE_URL}/run`, payload, { headers });
//             setRunMessage({ text: res.data.message || `✅ Forecast run for ${manualRunWeeks} weeks triggered!`, type: "success" });
//         } catch (err) {
//             setRunMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
//         } finally {
//             setRunLoading(false);
//         }
//     };

//     return (
//         <SectionCard title="📈 Forecast Settings">
//             <div className="space-y-10">
//                 {/* --- Set Schedule Sub-section --- */}
//                 <div>
//                     <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">🗓️ Set Forecast Schedule</h3>
//                     <form onSubmit={handleSetSchedule} className="space-y-4">
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <GenericFormField label="Frequency" name="frequency" value={scheduleForm.frequency} onChange={handleScheduleFormChange} as="select">
//                                 <option value="daily">Daily</option>
//                                 <option value="weekly">Weekly</option>
//                                 <option value="monthly">Monthly</option>
//                                 <option value="hourly">Hourly</option>
//                             </GenericFormField>
//                             <GenericFormField label="Time of Day (HH:MM)" name="time_of_day" value={scheduleForm.time_of_day} onChange={handleScheduleFormChange} type="time" />
//                             {scheduleForm.frequency === 'weekly' && (
//                                 <GenericFormField label="Day of Week" name="day_of_week" value={scheduleForm.day_of_week} onChange={handleScheduleFormChange} as="select">
//                                     <option>Saturday</option><option>Sunday</option><option>Monday</option>
//                                     <option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>
//                                 </GenericFormField>
//                             )}
//                         </div>
//                         <div className="flex items-center gap-4 pt-2">
//                             <SubmitButton type="submit" isLoading={scheduleLoading}>Set Schedule</SubmitButton>
//                             {scheduleMessage.text && <StatusMessage message={scheduleMessage.text} type={scheduleMessage.type} />}
//                         </div>
//                     </form>
//                 </div>

//                 <hr className="border-gray-200 dark:border-gray-700" />

//                 {/* --- Manual Run Sub-section --- */}
//                 <div>
//                     <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">⚡ Run Forecast Manually</h3>
//                      <div className="space-y-4">
//                         <p className="text-sm text-gray-600 dark:text-gray-400">Trigger an immediate forecast calculation for a specific number of weeks.</p>
//                         <GenericFormField
//                             label="Number of Weeks to Forecast"
//                             name="manual_run_weeks"
//                             value={manualRunWeeks}
//                             onChange={(e) => setManualRunWeeks(e.target.value)}
//                             type="number"
//                             placeholder="e.g., 4"
//                             min="1"
//                         />
//                         <div className="flex items-center gap-4 pt-2">
//                             <SubmitButton onClick={handleRunForecast} isLoading={runLoading} className="bg-green-600 hover:bg-green-700">Run Forecast Now</SubmitButton>
//                             {runMessage.text && <StatusMessage message={runMessage.text} type={runMessage.type} />}
//                         </div>
//                     </div>
//                 </div>

//                 <hr className="border-gray-200 dark:border-gray-700" />

//                 {/* --- View Schedules Sub-section --- */}
//                 <div>
//                     <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">📋 View Current Schedules</h3>
//                     <div className="flex items-center gap-4 mb-4">
//                         <SubmitButton onClick={handleViewSchedules} isLoading={viewLoading}>
//                             View Active Schedules
//                         </SubmitButton>
//                         {viewMessage.text && <StatusMessage message={viewMessage.text} type={viewMessage.type} />}
//                     </div>

//                     {schedules && Array.isArray(schedules) && schedules.length > 0 ? (
//                         <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
//                            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
//                                 <thead className="bg-gray-50 dark:bg-slate-800">
//                                     <tr>
//                                         <th scope="col" className="px-4 py-3 font-semibold">Frequency</th>
//                                         <th scope="col" className="px-4 py-3 font-semibold">Time of Day</th>
//                                         <th scope="col" className="px-4 py-3 font-semibold">Day of Week</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//                                     {schedules.map((schedule, index) => (
//                                         <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800">
//                                             <td className="px-4 py-3 capitalize">{schedule.frequency || 'N/A'}</td>
//                                             <td className="px-4 py-3">{schedule.time_of_day || 'N/A'}</td>
//                                             <td className="px-4 py-3">{schedule.day_of_week || 'N/A'}</td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     ) : schedules ? (
//                         <p className="mt-4 text-sm text-gray-500">No active schedules found.</p>
//                     ) : null}
//                 </div>
//             </div>
//         </SectionCard>
//     );
// }

// // --- Main Config Page Component ---

// const STORE_FORM_FIELDS = [
//   { name: "store_code", label: "Store Code", required: true },
//   { name: "name", label: "Store Name", required: true },
//   { name: "address", label: "Address", required: true },
//   { name: "city", label: "City", required: true },
//   { name: "state", label: "State" },
//   { name: "country", label: "Country" },
//   { name: "lat", label: "Latitude", type: "number" },
//   { name: "long", label: "Longitude", type: "number" },
//   { name: "capacity_units", label: "Capacity (Units)", type: "number" },
// ];

// const INITIAL_STORE_FORM_STATE = {
//   store_id: "", store_code: "", name: "", address: "", city: "",
//   state: "", country: "", lat: "", long: "", capacity_units: "",
// };

// export default function ConfigPage() {
//   const navigate = useNavigate();
//   // NEW: Add a ref for the "Select All" checkbox
//   const selectAllCheckboxRef = useRef(null);

//   // State
//   const [activeTab, setActiveTab] = useState("forecastSettings");
//   const [formulas, setFormulas] = useState({});
//   const [stores, setStores] = useState([]);
//   const [selectedFormula, setSelectedFormula] = useState("");
//   const [selectedStores, setSelectedStores] = useState([]);
//   const [applyLoading, setApplyLoading] = useState(false);
//   const [applyMessage, setApplyMessage] = useState({ text: "", type: "" });
//   const [storeForm, setStoreForm] = useState(INITIAL_STORE_FORM_STATE);
//   const [originalStore, setOriginalStore] = useState(null);
//   const [storeLoading, setStoreLoading] = useState(false);
//   const [storeMessage, setStoreMessage] = useState({ text: "", type: "" });
//   
//   // API & Data Fetching
//   const getAuthHeaders = useCallback(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       navigate("/login");
//       return null;
//     }
//     return { 'Authorization': `Bearer ${token}` };
//   }, [navigate]);

//   const fetchFormulas = useCallback(async () => {
//     try {
//       const headers = getAuthHeaders();
//       if (!headers) return;
//       const res = await axios.get(`${BASE_URL}/config/formulas`, { headers });
//       setFormulas(res.data);
//     } catch (err) {
//       console.error("Failed to fetch formulas:", err);
//       if (err.response?.status === 401) navigate("/login");
//     }
//   }, [getAuthHeaders, navigate]);

//   const fetchStores = useCallback(async () => {
//     try {
//       const headers = getAuthHeaders();
//       if (!headers) return;
//       const res = await axios.get(`${BASE_URL}/stores`, { headers });
//       setStores(res.data.stores || []);
//     } catch (err) {
//       console.error("Failed to fetch stores:", err);
//       if (err.response?.status === 401) navigate("/login");
//     }
//   }, [getAuthHeaders, navigate]);

//   useEffect(() => {
//     fetchFormulas();
//     fetchStores();
//   }, [fetchFormulas, fetchStores]);

//   // NEW: Effect to handle the indeterminate state of the "Select All" checkbox
//   useEffect(() => {
//     if (selectAllCheckboxRef.current) {
//       const totalStores = stores.length;
//       const selectedCount = selectedStores.length;
//       selectAllCheckboxRef.current.indeterminate = selectedCount > 0 && selectedCount < totalStores;
//     }
//   }, [selectedStores, stores]);
//   
//   // Event Handlers
//   const handleStoreFormChange = (e) => {
//     const { name, value } = e.target;
//     setStoreForm((prev) => ({ ...prev, [name]: value }));
//   };
//   
//   const handleStoreSelectForEdit = (e) => {
//     const selectedId = parseInt(e.target.value, 10);
//     const selected = stores.find((s) => s.store_id === selectedId);
//     if (selected) {
//       const formData = Object.keys(INITIAL_STORE_FORM_STATE).reduce((acc, key) => {
//         acc[key] = selected[key] ?? "";
//         return acc;
//       }, {});
//       setStoreForm(formData);
//       setOriginalStore(selected);
//       setStoreMessage({ text: "", type: "" });
//     } else {
//       setStoreForm(INITIAL_STORE_FORM_STATE);
//       setOriginalStore(null);
//     }
//   };

//   const handleAddStore = async (e) => {
//     e.preventDefault();
//     setStoreLoading(true);
//     setStoreMessage({ text: "Adding store...", type: "info" });
//     try {
//       const headers = getAuthHeaders();
//       if (!headers) return;
//       await axios.post(`${BASE_URL}/store_upload`, storeForm, { headers });
//       setStoreMessage({ text: "✅ Store added successfully!", type: "success" });
//       setStoreForm(INITIAL_STORE_FORM_STATE);
//       await fetchStores();
//     } catch (err) {
//       setStoreMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
//     } finally {
//       setStoreLoading(false);
//     }
//   };

//   const handleUpdateStore = async () => {
//     if (!originalStore) return;
//     const headers = getAuthHeaders();
//     if (!headers) return;

//     const payload = { store_id: originalStore.store_id };
//     let changesMade = false;
//     Object.keys(storeForm).forEach(key => {
//         if (key !== 'store_id' && (originalStore[key] ?? "") !== (storeForm[key] ?? "")) {
//             payload[key] = storeForm[key] === "" ? null : storeForm[key];
//             changesMade = true;
//         }
//     });

//     if (!changesMade) {
//       setStoreMessage({ text: "💡 No changes detected.", type: "info" });
//       return;
//     }

//     setStoreLoading(true);
//     setStoreMessage({ text: "Updating store...", type: "info" });
//     try {
//         await axios.post(`${BASE_URL}/update_store`, payload, { headers });
//         setStoreMessage({ text: "✅ Store updated successfully!", type: "success" });
//         await fetchStores();
//     } catch (err) {
//         setStoreMessage({ text: `❌ Update failed: ${err.response?.data?.error || err.message}`, type: "error" });
//     } finally {
//         setStoreLoading(false);
//     }
//   };
//   
//   const handleApplyFormula = async () => {
//     if (!selectedFormula) {
//       setApplyMessage({ text: "❌ Please select a formula!", type: "error" });
//       return;
//     }
//     setApplyLoading(true);
//     setApplyMessage({ text: "Applying formula...", type: "info" });
//     const headers = getAuthHeaders();
//     if (!headers) return;
//     const payload = { formula: selectedFormula, ...(selectedStores.length > 0 && { store_ids: selectedStores }) };
//     try {
//       const res = await axios.post(`${BASE_URL}/config/apply-formula`, payload, { headers });
//       setApplyMessage({ text: `✅ Success: ${res.data.message || 'Formula applied.'}`, type: "success" });
//     } catch (err) {
//       setApplyMessage({ text: `❌ Failed: ${err.response?.data?.error || err.message}`, type: "error" });
//     } finally {
//       setApplyLoading(false);
//     }
//   };

//   const handleClick = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) return;
//       const requestOptions = {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//         body: JSON.stringify({}),
//       };
//       await Promise.all([
//         fetch(`${BASE_URL}/dashboard/recompute`, requestOptions),
//         fetch(`${BASE_URL}/availability/recompute`, requestOptions),
//         fetch(`${BASE_URL}/alerts/refresh`, requestOptions)
//       ]);
//       console.log('✅ Recompute and refresh actions triggered successfully.');
//     } catch (error) {
//       console.error('An error occurred during the recompute process:', error);
//     }
//   };

//   // NEW: Handler for the "Select All" checkbox
//   const handleSelectAll = (e) => {
//     if (e.target.checked) {
//       setSelectedStores(stores.map(store => store.store_id));
//     } else {
//       setSelectedStores([]);
//     }
//   };

//   return (
//     <div className="dark:bg-[#0f172a] bg-gray-50 text-gray-800 dark:text-gray-200 flex flex-col h-screen">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col flex-1">
//         <header className="py-6 flex justify-between items-center">
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⚙️ Configuration</h1>
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
//           >
//             &larr; Back to Dashboard
//           </button>
//         </header>

//         <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
//           <aside className="md:w-64">
//             <div className="sticky top-6 bg-white dark:bg-[#1e293b] rounded-xl shadow-md p-4 space-y-2">
//               {[
//                 { id: "addStore", label: "🏪 Add New Store" },
//                 { id: "editStore", label: "✏️ Edit Store Details" },
//                 { id: "applyFormula", label: "🧮 Apply Formula" },
//                 { id: "forecast", label: "🔭 Forecast Lookahead" },
//                 { id: "forecastSettings", label: "📈 Forecast Settings" },
//               ].map(tab => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
//                     activeTab === tab.id
//                       ? "bg-blue-600 text-white shadow"
//                       : "hover:bg-gray-100 dark:hover:bg-slate-700"
//                   }`}
//                 >
//                   {tab.label}
//                 </button>
//               ))}
//             </div>
//           </aside>

//           {/* FINAL FIX: Removed pb-8 from this className */}
//           <main className="flex-1 overflow-y-auto flex flex-col">
//             {activeTab === "addStore" && (
//               <SectionCard title="🏪 Add New Store">
//                 <StoreForm formData={storeForm} onFormChange={handleStoreFormChange} onSubmit={handleAddStore} isLoading={storeLoading} message={storeMessage} buttonText="Add Store" />
//               </SectionCard>
//             )}

//             {activeTab === "editStore" && (
//                 <SectionCard title="✏️ Edit Store Details">
//                     <div className="mb-6">
//                         <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select a Store to Edit</label>
//                         <select id="store-select" className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600" onChange={handleStoreSelectForEdit} value={storeForm.store_id || ""}>
//                             <option value="">-- Choose Store --</option>
//                             {stores.map(store => <option key={store.store_id} value={store.store_id}>{store.name} ({store.city})</option>)}
//                         </select>
//                     </div>
//                     {storeForm.store_id && <StoreForm formData={storeForm} onFormChange={handleStoreFormChange} onSubmit={handleUpdateStore} isLoading={storeLoading} message={storeMessage} buttonText="Update Store" isUpdate={true} />}
//                 </SectionCard>
//             )}

//             {activeTab === "applyFormula" && (
//               <SectionCard title="🧮 Apply Formula to Stores">
//                 <div className="space-y-6">
//                   <div>
//                     <label htmlFor="formula-select" className="block text-sm font-medium mb-1">Select Formula</label>
//                     <select id="formula-select" className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600" value={selectedFormula} onChange={(e) => setSelectedFormula(e.target.value)}>
//                       <option value="">-- Choose Formula --</option>
//                       {Object.entries(formulas).map(([key, desc]) => <option key={key} value={key}>{key} &rarr; {desc}</option>)}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Select Stores</label>
//                     <div className="border p-4 rounded-lg bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-gray-600 space-y-3">
//                       {/* NEW: "Select All" checkbox */}
//                       <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer font-semibold border-b border-gray-300 dark:border-gray-600 pb-3">
//                           <input
//                               ref={selectAllCheckboxRef}
//                               type="checkbox"
//                               className="h-4 w-4 rounded border-gray-300 text-blue-600"
//                               checked={stores.length > 0 && selectedStores.length === stores.length}
//                               onChange={handleSelectAll}
//                           />
//                           <span>{selectedStores.length === stores.length ? 'Deselect All' : 'Select All'}</span>
//                       </label>
//                       {/* --- Store list container --- */}
//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
//                         {stores.map((store) => (
//                           <label key={store.store_id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer">
//                             <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={selectedStores.includes(store.store_id)} onChange={() => setSelectedStores(p => p.includes(store.store_id) ? p.filter(id => id !== store.store_id) : [...p, store.store_id])} />
//                             <span>{store.name} <span className="text-gray-500 dark:text-gray-400">({store.city})</span></span>
//                           </label>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-4">
//                     <SubmitButton onClick={() => { handleApplyFormula(); handleClick(); }} isLoading={applyLoading} className="bg-green-600 hover:bg-green-700">Apply Formula</SubmitButton>
//                     {applyMessage.text && <StatusMessage message={applyMessage.text} type={applyMessage.type} />}
//                   </div>
//                 </div>
//               </SectionCard>
//             )}

//             {activeTab === "forecast" && <ForecastLookahead />}

//             {activeTab === "forecastSettings" && <ForecastSettings getAuthHeaders={getAuthHeaders} BASE_URL={BASE_URL} />}
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- Store Form Component ---
// function StoreForm({ formData, onFormChange, onSubmit, isLoading, message, buttonText, isUpdate = false }) {
//   return (
//       <form onSubmit={isUpdate ? (e) => e.preventDefault() : onSubmit} className="space-y-5">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
//               {STORE_FORM_FIELDS.map(field => <StoreFormField key={field.name} name={field.name} label={field.label} value={formData[field.name]} onChange={onFormChange} type={field.type || "text"} required={field.required} placeholder={`Enter ${field.label}...`} />)}
//           </div>
//           <div className="pt-2 flex items-center gap-4">
//               <SubmitButton onClick={isUpdate ? onSubmit : undefined} type={isUpdate ? "button" : "submit"} isLoading={isLoading} disabled={isLoading}>{buttonText}</SubmitButton>
//               {message.text && <StatusMessage message={message.text} type={message.type} />}
//           </div>
//       </form>
//   );
// }

// function StoreFormField({ name, label, value, onChange, ...props }) {
//   return (
//     <div>
//       <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//         {label} {props.required && <span className="text-red-500">*</span>}
//       </label>
//       <input id={name} name={name} value={value} onChange={onChange} className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600" {...props} />
//     </div>
//   );
// }

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { FilePlus, Edit, Calculator, BarChart, Settings, Plus, RefreshCw } from 'lucide-react';
import ForecastLookahead from "./ForecastLookahead";
import Chatbot from "../components/Chatbot";

// --- Constants ---
const BASE_URL = "http://127.0.0.1:5500";

// --- Helper UI Components ---

function SectionCard({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-slate-800/50 border border-slate-700/50 shadow-2xl shadow-black/20 rounded-2xl w-full"
    >
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          {Icon && <Icon className="w-7 h-7 text-violet-400" />}
          <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function SubmitButton({ isLoading, children, className = "bg-violet-600 hover:bg-violet-700", ...props }) {
    return (
        <button
            {...props}
            className={`flex items-center justify-center px-5 py-2.5 font-semibold text-white rounded-lg shadow-sm transition-all duration-300 transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-400 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 active:scale-95 hover:shadow-lg hover:shadow-violet-600/30 ${className}`}
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
    if (!message) return null;
    const typeClasses = {
        success: "text-emerald-400",
        error: "text-red-400",
        info: "text-slate-400",
    };
    return (
        <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-medium ${typeClasses[type] || typeClasses.info}`}
        >
            {message}
        </motion.p>
    );
}

function GenericFormField({ label, name, as = 'input', children, ...props }) {
    const InputComponent = as;
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
            <InputComponent
                id={name}
                name={name}
                className="w-full p-3 rounded-lg border-2 bg-slate-900 border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                {...props}
            >
                {children}
            </InputComponent>
        </div>
    );
}

// --- Forecast Settings Component ---
function ForecastSettings({ getAuthHeaders, BASE_URL }) {
    const [scheduleForm, setScheduleForm] = useState({ frequency: 'daily', time_of_day: '00:00', day_of_week: 'Saturday' });
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleMessage, setScheduleMessage] = useState({ text: "", type: "" });
    const [schedules, setSchedules] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewMessage, setViewMessage] = useState({ text: "", type: "" });
    const [manualRunWeeks, setManualRunWeeks] = useState('');
    const [runLoading, setRunLoading] = useState(false);
    const [runMessage, setRunMessage] = useState({ text: "", type: "" });

    const handleScheduleFormChange = (e) => setScheduleForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
            setSchedules(res.data.schedules);
            setViewMessage({ text: "", type: "" });
        } catch (err) {
            setViewMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
        } finally {
            setViewLoading(false);
        }
    };

    const handleRunForecast = async () => {
        if (!manualRunWeeks || isNaN(parseInt(manualRunWeeks, 10)) || parseInt(manualRunWeeks, 10) <= 0) {
            setRunMessage({ text: "❌ Please enter a valid, positive number of weeks.", type: "error" });
            return;
        }
        const headers = getAuthHeaders();
        if (!headers) return;
        setRunLoading(true);
        setRunMessage({ text: "Triggering manual forecast run...", type: "info" });
        const payload = { "weeks": parseInt(manualRunWeeks, 10) };
        try {
            const res = await axios.post(`${BASE_URL}/run`, payload, { headers });
            setRunMessage({ text: res.data.message || `✅ Forecast run for ${manualRunWeeks} weeks triggered!`, type: "success" });
        } catch (err) {
            setRunMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
        } finally {
            setRunLoading(false);
        }
    };

    return (
        <SectionCard title="Forecast Settings" icon={Settings}>
            <div className="space-y-10">
                {/* --- Set Schedule --- */}
                <div>
                    <h3 className="text-xl font-bold mb-4 text-slate-100">🗓️ Set Forecast Schedule</h3>
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
                            <StatusMessage message={scheduleMessage.text} type={scheduleMessage.type} />
                        </div>
                    </form>
                </div>
                <hr className="border-slate-700" />
                {/* --- Manual Run --- */}
                <div>
                    <h3 className="text-xl font-bold mb-4 text-slate-100">⚡ Run Forecast Manually</h3>
                     <div className="space-y-4">
                        <p className="text-sm text-slate-400">Trigger an immediate forecast calculation for a specific number of weeks.</p>
                        <GenericFormField label="Number of Weeks to Forecast" name="manual_run_weeks" value={manualRunWeeks} onChange={(e) => setManualRunWeeks(e.target.value)} type="number" placeholder="e.g., 4" min="1" />
                        <div className="flex items-center gap-4 pt-2">
                            <SubmitButton onClick={handleRunForecast} isLoading={runLoading} className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/30">Run Forecast Now</SubmitButton>
                            <StatusMessage message={runMessage.text} type={runMessage.type} />
                        </div>
                    </div>
                </div>
                <hr className="border-slate-700" />
                {/* --- View Schedules --- */}
                <div>
                    <h3 className="text-xl font-bold mb-4 text-slate-100">📋 View Current Schedules</h3>
                    <div className="flex items-center gap-4 mb-4">
                        <SubmitButton onClick={handleViewSchedules} isLoading={viewLoading}>View Active Schedules</SubmitButton>
                        <StatusMessage message={viewMessage.text} type={viewMessage.type} />
                    </div>
                    {schedules && Array.isArray(schedules) && schedules.length > 0 ? (
                        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700">
                           <table className="w-full text-sm text-left text-slate-300">
                                <thead className="bg-slate-900/80">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 font-semibold">Frequency</th>
                                        <th scope="col" className="px-4 py-3 font-semibold">Time of Day</th>
                                        <th scope="col" className="px-4 py-3 font-semibold">Day of Week</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {schedules.map((schedule, index) => (
                                        <tr key={index} className="hover:bg-slate-700/50">
                                            <td className="px-4 py-3 capitalize">{schedule.frequency || 'N/A'}</td>
                                            <td className="px-4 py-3">{schedule.time_of_day || 'N/A'}</td>
                                            <td className="px-4 py-3">{schedule.day_of_week || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : schedules ? (
                        <p className="mt-4 text-sm text-slate-500">No active schedules found.</p>
                    ) : null}
                </div>
            </div>
        </SectionCard>
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
    { name: "lat", label: "Latitude", type: "number", step: "any" },
    { name: "long", label: "Longitude", type: "number", step: "any" },
    { name: "capacity_units", label: "Capacity (Units)", type: "number" },
];

const TABS = [
    { id: "addStore", label: "Add New Store", icon: FilePlus },
    { id: "editStore", label: "Edit Store Details", icon: Edit },
    { id: "applyFormula", label: "Apply Formula", icon: Calculator },
    { id: "forecast", label: "Forecast Lookahead", icon: BarChart },
    { id: "forecastSettings", label: "Forecast Settings", icon: Settings },
];

function TabButton({ id, label, icon: Icon, activeTab, setActiveTab }) {
    return (
        <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                activeTab === id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "hover:bg-slate-700/50 text-slate-300"
            }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );
}

export default function ConfigPage() {
    const navigate = useNavigate();
    const selectAllCheckboxRef = useRef(null);

    const [activeTab, setActiveTab] = useState("addStore");
    const [formulas, setFormulas] = useState({});
    const [stores, setStores] = useState([]);
    const [selectedFormula, setSelectedFormula] = useState("");
    const [selectedStores, setSelectedStores] = useState([]);
    const [applyLoading, setApplyLoading] = useState(false);
    const [applyMessage, setApplyMessage] = useState({ text: "", type: "" });
    const [originalStore, setOriginalStore] = useState(null);
    const [storeLoading, setStoreLoading] = useState(false);
    const [storeMessage, setStoreMessage] = useState({ text: "", type: "" });
    
    const INITIAL_STORE_FORM_STATE = {
        store_id: "",
        ...Object.fromEntries(STORE_FORM_FIELDS.map(f => [f.name, ""]))
    };
    
    const [storeForm, setStoreForm] = useState(INITIAL_STORE_FORM_STATE);
    
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) navigate("/login");
        return { 'Authorization': `Bearer ${token}` };
    }, [navigate]);

    const fetchData = useCallback(async () => {
        const headers = getAuthHeaders();
        if (!headers) return;
        try {
            const [formulasRes, storesRes] = await Promise.all([
                axios.get(`${BASE_URL}/config/formulas`, { headers }),
                axios.get(`${BASE_URL}/stores`, { headers })
            ]);
            setFormulas(formulasRes.data);
            setStores(storesRes.data.stores || []);
        } catch (err) {
            console.error("Failed to fetch initial data:", err);
            if (err.response?.status === 401) navigate("/login");
        }
    }, [getAuthHeaders, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const totalStores = stores.length;
            const selectedCount = selectedStores.length;
            selectAllCheckboxRef.current.indeterminate = selectedCount > 0 && selectedCount < totalStores;
        }
    }, [selectedStores, stores]);
    
    const handleStoreFormChange = (e) => setStoreForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    
    const handleStoreSelectForEdit = (e) => {
        const selectedId = parseInt(e.target.value, 10);
        const selected = stores.find((s) => s.store_id === selectedId);
        if (selected) {
            const newFormData = { ...INITIAL_STORE_FORM_STATE };
            for (const key in newFormData) {
                if (Object.hasOwnProperty.call(selected, key)) {
                    newFormData[key] = selected[key] ?? "";
                }
            }
            setStoreForm(newFormData);
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
            const { store_id, ...payload } = storeForm;
            await axios.post(`${BASE_URL}/store_upload`, payload, { headers });
            setStoreMessage({ text: "✅ Store added successfully!", type: "success" });
            setStoreForm(INITIAL_STORE_FORM_STATE);
            await fetchData();
        } catch (err) {
            setStoreMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
        } finally {
            setStoreLoading(false);
        }
    };

    const handleUpdateStore = async (e) => {
        e.preventDefault();
        if (!originalStore) return;
        
        const headers = getAuthHeaders();
        if (!headers) return;

        const payload = { store_id: originalStore.store_id };
        let changesMade = false;
        Object.keys(storeForm).forEach(key => {
            if (key !== 'store_id' && String(originalStore[key] ?? "") !== String(storeForm[key] ?? "")) {
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
            await fetchData();
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

    const recomputeAll = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;
        console.log('Triggering recompute actions...');
        try {
            await Promise.all([
                axios.post(`${BASE_URL}/dashboard/recompute`, {}, { headers }),
                axios.post(`${BASE_URL}/availability/recompute`, {}, { headers }),
                axios.post(`${BASE_URL}/alerts/refresh`, {}, { headers })
            ]);
            console.log('✅ Recompute and refresh actions triggered successfully.');
        } catch (error) {
            console.error('An error occurred during the recompute process:', error);
        }
    };
    
    const handleSelectAll = (e) => {
        setSelectedStores(e.target.checked ? stores.map(store => store.store_id) : []);
    };
    
    const renderActiveTab = () => {
        switch (activeTab) {
            case "addStore":
                return (
                    <SectionCard title="Add New Store" icon={FilePlus}>
                        <StoreForm formData={storeForm} onFormChange={handleStoreFormChange} onSubmit={handleAddStore} isLoading={storeLoading} message={storeMessage} buttonText="Add Store" />
                    </SectionCard>
                );
            case "editStore":
                return (
                    <SectionCard title="Edit Store Details" icon={Edit}>
                        <div className="mb-6">
                            <label htmlFor="store-select" className="block text-sm font-medium text-slate-300 mb-2">Select a Store to Edit</label>
                            <select id="store-select" className="w-full p-3 rounded-lg border-2 bg-slate-900 border-slate-700 text-slate-200" onChange={handleStoreSelectForEdit} value={storeForm.store_id || ""}>
                                <option value="">-- Choose Store --</option>
                                {stores.map(store => <option key={store.store_id} value={store.store_id}>{store.name} ({store.city})</option>)}
                            </select>
                        </div>
                        {storeForm.store_id && <StoreForm formData={storeForm} onFormChange={handleStoreFormChange} onSubmit={handleUpdateStore} isLoading={storeLoading} message={storeMessage} buttonText="Update Store" isUpdate={true} />}
                    </SectionCard>
                );
            case "applyFormula":
                 return (
                    <SectionCard title="Apply Formula to Stores" icon={Calculator}>
                        <div className="space-y-6">
                            <GenericFormField label="Select Formula" name="formula-select" as="select" value={selectedFormula} onChange={(e) => setSelectedFormula(e.target.value)}>
                                <option value="">-- Choose Formula --</option>
                                {Object.entries(formulas).map(([key, desc]) => <option key={key} value={key}>{key} &rarr; {desc}</option>)}
                            </GenericFormField>
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Select Stores (optional, applies to all if none selected)</label>
                                <div className="border-2 p-4 rounded-lg bg-slate-900/50 border-slate-700 space-y-3">
                                    <label className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700/50 cursor-pointer font-semibold border-b-2 border-slate-700 pb-3">
                                        <input
                                            ref={selectAllCheckboxRef}
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                                            checked={stores.length > 0 && selectedStores.length === stores.length}
                                            onChange={handleSelectAll}
                                        />
                                        <span>{selectedStores.length === stores.length ? 'Deselect All' : 'Select All'}</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                                        {stores.map((store) => (
                                            <label key={store.store_id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700/50 cursor-pointer">
                                                <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500" checked={selectedStores.includes(store.store_id)} onChange={() => setSelectedStores(p => p.includes(store.store_id) ? p.filter(id => id !== store.store_id) : [...p, store.store_id])} />
                                                <span>{store.name} <span className="text-slate-400">({store.city})</span></span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <SubmitButton onClick={() => { handleApplyFormula(); recomputeAll(); }} isLoading={applyLoading} className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/30">Apply Formula & Recompute</SubmitButton>
                                <StatusMessage message={applyMessage.text} type={applyMessage.type} />
                            </div>
                        </div>
                    </SectionCard>
                );
            case "forecast":
                return <ForecastLookahead />;
            case "forecastSettings":
                return <ForecastSettings getAuthHeaders={getAuthHeaders} BASE_URL={BASE_URL} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-slate-900 text-slate-200 flex flex-col min-h-screen font-sans">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-1">
                <header className="py-8 flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-slate-50">⚙️ Configuration</h1>
                    <button onClick={() => navigate("/dashboard")} className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors">
                        &larr; Back to Dashboard
                    </button>
                </header>
                <div className="flex flex-col md:flex-row gap-8 flex-1">
                    <aside className="md:w-64">
                        <div className="sticky top-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-2 shadow-2xl shadow-black/20">
                            {TABS.map(tab => (
                                <TabButton key={tab.id} {...tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                            ))}
                        </div>
                    </aside>
                    <main className="flex-1 flex pb-8">
                        <AnimatePresence mode="wait">
                            {renderActiveTab()}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        <Chatbot/>
        </div>
    );
}

// --- Store Form Component ---
function StoreForm({ formData, onFormChange, onSubmit, isLoading, message, buttonText, isUpdate = false }) {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {STORE_FORM_FIELDS.map(field => <StoreFormField key={field.name} {...field} value={formData[field.name]} onChange={onFormChange} />)}
            </div>
            <div className="pt-2 flex items-center gap-4">
                 <SubmitButton type="submit" isLoading={isLoading} disabled={isLoading}>
                   {isUpdate ? <><RefreshCw className="w-4 h-4 mr-2"/> {buttonText}</> : <><Plus className="w-4 h-4 mr-2"/> {buttonText}</>}
                </SubmitButton>
                <StatusMessage message={message.text} type={message.type} />
            </div>
        </form>
    );
}

function StoreFormField({ name, label, value, onChange, required, ...props }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-2">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <input
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full p-3 rounded-lg border-2 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                placeholder={`Enter ${label}...`}
                required={required}
                {...props}
            />
        </div>
    );
}