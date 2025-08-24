// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom"; // ✅ import for navigation
// import axios from "axios";


// const BASE_URL = "http://127.0.0.1:5500";
// const token = localStorage.getItem("token");

// // ✅ useNavigate hook for navigation`  
// export default function ConfigPage() {
//   const navigate = useNavigate(); // ✅ useNavigate hook

//   const [formulas, setFormulas] = useState({});
//   const [selectedFormula, setSelectedFormula] = useState("");
//   const [stores, setStores] = useState([]);
//   const [selectedStores, setSelectedStores] = useState([]);
//   const [applyLoading, setApplyLoading] = useState(false);
//   const [applyMessage, setApplyMessage] = useState("");const [lookaheadDays, setLookaheadDays] = useState(7);
// const [lookaheadStatus, setLookaheadStatus] = useState("");
// const [activeTab, setActiveTab] = useState("addStore");

//   const [storeForm, setStoreForm] = useState({
//     store_code: "",
//     name: "",
//     address: "",
//     city: "",
//     state: "",
//     country: "",
//     lat: "",
//     long: "",
//     capacity_units: "",
//   });
//   const [uploadStatus, setUploadStatus] = useState("");

//   const authHeaders = {
//     Authorization: `Bearer ${token}`,
//   };

//   useEffect(() => {
//     fetchFormulas();
//     fetchStores();
//   }, []);

//     const fetchFormulas = async () => {
//   try {
//     const currentToken = localStorage.getItem("token"); // ✅ Get the fresh token
//     const res = await axios.get(`${BASE_URL}/config/formulas`, {
//       headers: { // ✅ Create headers just-in-time
//         'Authorization': `Bearer ${currentToken}`
//       },
//     });
//     setFormulas(res.data);
//   } catch (err) {
//     console.error("Failed to fetch formulas:", err);
//   }
// };

//   const fetchStores = async () => {
//     try {
//       const currentToken = localStorage.getItem("token");
//       const res = await axios.get(`${BASE_URL}/stores`, {
//         headers: { // ✅ Create headers just-in-time
//         'Authorization': `Bearer ${currentToken}`
//       },
//       });
//       setStores(res.data.stores || []);
//     } catch (err) {
//       console.error("Failed to fetch stores:", err);
//     }
//   };

//   const handleStoreChange = (e) => {
//     const { name, value } = e.target;
//     setStoreForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleStoreUpload = async (e) => {
//     e.preventDefault();
//     setUploadStatus("Uploading...");
//     try {
//       const currentToken = localStorage.getItem("token");
//       const res = await axios.post(`${BASE_URL}/store_upload`, storeForm, {
//         headers: { // ✅ Create headers just-in-time
//         'Authorization': `Bearer ${currentToken}`
//       },
//       });
//       setUploadStatus(`✅ Store added: ${res.status}`);
//       fetchStores();
//     } catch (err) {
//       setUploadStatus(`❌ Failed: ${err.response?.data || err.message}`);
//     }
//   };

// const [originalStore, setOriginalStore] = useState(null); // ← add this with your other useState hooks

// const handleStoreSelect = (e) => {
//   // ✅ Convert the string value from the dropdown to a number
//   const selectedId = parseInt(e.target.value, 10); 

//   const selected = stores.find((s) => s.store_id === selectedId);

//   if (selected) {
//     setStoreForm({ ...selected });
//     setOriginalStore({ ...selected });
//     setUploadStatus(""); 
//   }
// };

// const handleStoreUpdate = async () => {
//   // 1. Check if a store has been selected.
//   if (!storeForm.store_id || !originalStore) {
//     setUploadStatus("❌ No store selected.");
//     return;
//   }

//   const payload = { store_id: storeForm.store_id };
//   const fields = [
//     "store_code", "name", "lat", "long",
//     "address", "city", "state", "country", "capacity_units"
//   ];
//   let changesMade = false;

//   for (const key of fields) {
//     const newVal = storeForm[key];
//     const oldVal = originalStore[key];
    
//     let finalNewVal = newVal;
//     let finalOldVal = oldVal;
    
//     // ✅ Robustly parse numeric fields
//     if (["lat", "long", "capacity_units"].includes(key)) {
//       // Coerce empty strings or invalid numbers to null to avoid sending NaN
//       finalNewVal = (newVal === "" || newVal === null || isNaN(parseFloat(newVal))) 
//         ? null 
//         : parseFloat(newVal);
        
//       finalOldVal = (oldVal === "" || oldVal === null || isNaN(parseFloat(oldVal))) 
//         ? null 
//         : parseFloat(oldVal);
//     }

//     if (finalNewVal !== finalOldVal) {
//       payload[key] = finalNewVal; // Add the cleaned-up value to the payload
//       changesMade = true;
//     }
//   }

//   if (!changesMade) {
//     setUploadStatus("💡 No changes were made."); // Changed message for clarity
//     return;
//   }

//   // 3. Make the API call with the built payload.
//   try {
//     const currentToken = localStorage.getItem("token");
//     const res = await axios.post(`${BASE_URL}/update_store`, payload, {
//       headers: {
//         'Authorization': `Bearer ${currentToken}`
//       },
//     });

//     if (res.status === 200) {
//       setUploadStatus("✅ Store updated successfully.");
//       fetchStores(); // Refresh the stores list
//     } else {
//       setUploadStatus("❌ Failed to update store.");
//     }
//   } catch (err) {
//     setUploadStatus(`❌ Error: ${err.response?.data?.error || err.message}`);
//     console.error("Update failed:", err);
//   }
// };
//   const toggleStoreSelection = (storeId) => {
//     if (selectedStores.includes(storeId)) {
//       setSelectedStores(selectedStores.filter((id) => id !== storeId));
//     } else {
//       setSelectedStores([...selectedStores, storeId]);
//     }
//   };

// const applyFormula = async () => {
//     if (!selectedFormula) {
//       alert("Please select a formula!");
//       return;
//     }

//     setApplyLoading(true);
//     setApplyMessage("");

//     const payload = { formula: selectedFormula };
//     if (selectedStores.length > 0) {
//       payload.store_ids = selectedStores;
//     }

//     try {
//       const currentToken = localStorage.getItem("token"); // ✅ Get fresh token
//       const res = await axios.post(
//         `${BASE_URL}/config/apply-formula`,
//         payload,
//         { headers: { 'Authorization': `Bearer ${currentToken}` } } // ✅ Use fresh token
//       );
//       setApplyMessage(`✅ Applied: ${JSON.stringify(res.data)}`);
//     } catch (err) {
//       setApplyMessage(`❌ Failed: ${err.response?.data || err.message}`);
//     } finally {
//       setApplyLoading(false);
//     }
//   };
// const updateLookaheadDays = async () => {
//     try {
//       const currentToken = localStorage.getItem("token"); // ✅ Get fresh token
//       await axios.post(`${BASE_URL}/user/lookahead_days`, {
//         lookahead_days: parseInt(lookaheadDays),
//       }, { headers: { 'Authorization': `Bearer ${currentToken}` } }); // ✅ Use fresh token

//       setLookaheadStatus("✅ Updated lookahead days!");
//     } catch (err) {
//       setLookaheadStatus(`❌ Error: ${err.response?.data?.error || err.message}`);
//     }
//   };
  

//   return (
//     <div className="p-8 max-w-6xl mx-auto space-y-10 dark:bg-[#0f172a] bg-gray-100 min-h-screen">
      
//       {/* ✅ Back Button */}
//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-300">⚙️ Configuration</h1>
//         <button
//           onClick={() => navigate("/dashboard")} // ✅ navigate back
//           className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 transition"
//         >
//           ⬅ Back to Dashboard
//         </button>
//       </div>

//       {/* --- STORE UPLOAD SECTION --- */}
//       <div className="flex min-h-screen dark:bg-[#0f172a] bg-gray-100">
//   {/* Side Menu */}
//   <aside className="w-64 bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
//     <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">⚙️ Config Menu</h2>
//     {[
//       { id: "addStore", label: "🏪 Add Store" },
//       { id: "applyFormula", label: "🧮 Apply Formula" },
//       { id: "editStore", label: "✏️ Edit Store Details" },
//       { id: "forecast", label: "🔭 Forecast Lookahead" }
//     ].map(tab => (
//       <button
//         key={tab.id}
//         onClick={() => setActiveTab(tab.id)}
//         className={`w-full text-left px-4 py-2 rounded ${
//           activeTab === tab.id
//             ? "bg-blue-600 text-white"
//             : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
//         }`}
//       >
//         {tab.label}
//       </button>
//     ))}
//   </aside>

//   {/* Main Content */}
//   <main className="flex-1 p-8 space-y-8 max-w-6xl mx-auto">
//     {activeTab === "addStore" && (
//       // your "Add Store" section here
//            <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
//         <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">🏪 Add New Store</h2>
//         <form
//           onSubmit={handleStoreUpload}
//           className="grid grid-cols-1 md:grid-cols-2 gap-4"
//         >
//           {[
//             "store_code", "name", "address", "city", "state",
//             "country", "lat", "long", "capacity_units"
//           ].map((field) => (
//             <input
//               key={field}
//               name={field}
//               placeholder={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
//               className="border border-gray-300 dark:border-gray-600 dark:bg-[#334155] p-2 rounded text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300"
//               value={storeForm[field]}
//               onChange={handleStoreChange}
//               required={["store_code", "name", "address", "city"].includes(field)}
//             />
//           ))}
//           <div className="md:col-span-2">
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//             >
//               ➕ Add Store
//             </button>
//             {uploadStatus && (
//               <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{uploadStatus}</p>
//             )}
//           </div>
//         </form>
//       </section>
//     )}

//     {activeTab === "applyFormula" && (
//       // your "Apply Formula" section here
//       <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
//         <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
//           📐 Apply Formula
//         </h2>

//         <div className="mb-4">
//           <label className="block text-gray-600 dark:text-gray-300 mb-1">Select Formula:</label>
//           <select
//             className="border p-2 rounded w-full dark:bg-[#334155] dark:text-white dark:border-gray-600"
//             value={selectedFormula}
//             onChange={(e) => setSelectedFormula(e.target.value)}
//           >
//             <option value="">-- Choose Formula --</option>
//             {Object.entries(formulas).map(([key, desc]) => (
//               <option key={key} value={key}>
//                 {key} → {desc}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="mb-4">
//           <label className="block text-gray-600 dark:text-gray-300 mb-1">
//             Select Stores (or leave empty for ALL):
//           </label>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded dark:bg-[#334155] dark:border-gray-600">
//             {stores.map((store) => (
//               <label key={store.store_id} className="flex items-center gap-2 text-sm text-black dark:text-white">
//                 <input
//                   type="checkbox"
//                   checked={selectedStores.includes(store.store_id)}
//                   onChange={() => toggleStoreSelection(store.store_id)}
//                 />
//                 {store.name} ({store.city})
//               </label>
//             ))}
//           </div>
//         </div>

//         <button
//           onClick={applyFormula}
//           disabled={applyLoading}
//           className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
//         >
//           {applyLoading ? "Applying..." : "✅ Apply Formula"}
//         </button>

//         {applyMessage && (
//           <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{applyMessage}</p>
//         )}
//       </section>
//     )}

//       {activeTab === "editStore" && (
//       <div className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
//         <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">✏️ Edit Store Details</h2>

//         {/* --- Step 1: Select a store --- */}
//         <div className="mb-4">
//           <label className="block text-gray-700 dark:text-gray-300 mb-1">Select Store:</label>
//           <select
//             className="w-full p-2 rounded border dark:bg-[#334155] dark:text-white dark:border-gray-600"
//             onChange={handleStoreSelect}
//             // Set a default value to avoid accidental selection
//             defaultValue="" 
//           >
//             <option value="" disabled>-- Choose Store --</option>
//             {stores.map(store => (
//               <option key={store.store_id} value={store.store_id}>
//                 {store.name} ({store.city})
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* --- Step 2: Edit the store's details --- */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {[
//             "store_code", "name", "address", "city", "state",
//             "country", "lat", "long", "capacity_units"
//           ].map((field) => (
//             <input
//               key={field}
//               name={field}
//               placeholder={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
//               className="border border-gray-300 dark:border-gray-600 dark:bg-[#334155] p-2 rounded text-black dark:text-white"
//               value={storeForm[field] || ""}
//               onChange={handleStoreChange} // ✅ Correctly uses handleStoreChange
//             />
//           ))}
//         </div>

//         {/* --- Step 3: Save the changes --- */}
//         <div className="mt-4">
//           <button
//             onClick={handleStoreUpdate} // ✅ Correctly uses handleStoreUpdate
//             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//           >
//             💾 Update Store
//           </button>
//           {uploadStatus && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{uploadStatus}</p>}
//         </div>
//       </div>
//     )}

//     {activeTab === "forecast" && (
//       // your Forecast Lookahead section here
//       <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
//         <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">🔭 Forecast Lookahead</h2>
//         <div className="flex items-center gap-4">
//           <input
//             type="number"
//             min="1"
//             className="border p-2 rounded w-32 dark:bg-[#334155] dark:text-white dark:border-gray-600"
//             placeholder="Lookahead Days"
//             value={lookaheadDays}
//             onChange={(e) => setLookaheadDays(e.target.value)}
//           />
//           <button
//             onClick={updateLookaheadDays}
//             className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
//           >
//             Save Days
//           </button>
//         </div>
//         {lookaheadStatus && <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{lookaheadStatus}</p>}
//       </section>
//           )}
//         </main>
//       </div>


//     </div>
//   );
// }


// // import React, { useEffect, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import axios from "axios";

// // const BASE_URL = "http://127.0.0.1:5500";

// // // ✅ The stale global token variable has been removed.

// // export default function ConfigPage() {
// //   const navigate = useNavigate();

// //   const [formulas, setFormulas] = useState({});
// //   const [selectedFormula, setSelectedFormula] = useState("");
// //   const [stores, setStores] = useState([]);
// //   const [selectedStores, setSelectedStores] = useState([]);
// //   const [applyLoading, setApplyLoading] = useState(false);
// //   const [applyMessage, setApplyMessage] = useState("");
// //   const [lookaheadDays, setLookaheadDays] = useState(7);
// //   const [lookaheadStatus, setLookaheadStatus] = useState("");
// //   const [activeTab, setActiveTab] = useState("addStore");

// //   const [storeForm, setStoreForm] = useState({
// //     store_code: "",
// //     name: "",
// //     address: "",
// //     city: "",
// //     state: "",
// //     country: "",
// //     lat: "",
// //     long: "",
// //     capacity_units: "",
// //   });
// //   const [uploadStatus, setUploadStatus] = useState("");
// //   const [originalStore, setOriginalStore] = useState(null);

// //   // ✅ The stale authHeaders variable has been removed.

// //   useEffect(() => {
// //     fetchFormulas();
// //     fetchStores();
// //   }, []);

// //   const fetchFormulas = async () => {
// //     try {
// //       const currentToken = localStorage.getItem("token");
// //       const res = await axios.get(`${BASE_URL}/config/formulas`, {
// //         headers: {
// //           'Authorization': `Bearer ${currentToken}`
// //         },
// //       });
// //       setFormulas(res.data);
// //     } catch (err) {
// //       console.error("Failed to fetch formulas:", err);
// //     }
// //   };

// //   const fetchStores = async () => {
// //     try {
// //       const currentToken = localStorage.getItem("token");
// //       const res = await axios.get(`${BASE_URL}/stores`, {
// //         headers: {
// //           'Authorization': `Bearer ${currentToken}`
// //         },
// //       });
// //       setStores(res.data.stores || []);
// //     } catch (err) {
// //       console.error("Failed to fetch stores:", err);
// //     }
// //   };

// //   const handleStoreChange = (e) => {
// //     const { name, value } = e.target;
// //     setStoreForm((prev) => ({ ...prev, [name]: value }));
// //   };

// //   const handleStoreUpload = async (e) => {
// //     e.preventDefault();
// //     setUploadStatus("Uploading...");
// //     try {
// //       const currentToken = localStorage.getItem("token");
// //       if (!currentToken) {
// //         setUploadStatus("❌ Authentication error: Please log in again.");
// //         return;
// //       }
// //       const res = await axios.post(`${BASE_URL}/store_upload`, storeForm, {
// //         headers: {
// //           'Authorization': `Bearer ${currentToken}`
// //         },
// //       });
// //       setUploadStatus(`✅ Store added: ${res.status}`);
// //       fetchStores(); // Refresh stores list
// //     } catch (err) {
// //       setUploadStatus(`❌ Failed: ${err.response?.data || err.message}`);
// //     }
// //   };

// //   const handleStoreSelect = (e) => {
// //     const selectedId = parseInt(e.target.value, 10);
// //     const selected = stores.find((s) => s.store_id === selectedId);
// //     if (selected) {
// //       setStoreForm({ ...selected });
// //       setOriginalStore({ ...selected });
// //       setUploadStatus("");
// //     }
// //   };

// //   // ✅ --- FIXED AND MORE ROBUST `handleStoreUpdate` FUNCTION --- ✅
// //   const handleStoreUpdate = async () => {
// //     if (!storeForm.store_id || !originalStore) {
// //       setUploadStatus("❌ No store selected.");
// //       return;
// //     }

// //     const payload = { store_id: storeForm.store_id };
// //     const fields = [
// //       "store_code", "name", "lat", "long",
// //       "address", "city", "state", "country", "capacity_units"
// //     ];
// //     let changesMade = false;

// //     for (const key of fields) {
// //       const newVal = storeForm[key];
// //       const oldVal = originalStore[key];
// //       let finalNewVal = newVal;
// //       let finalOldVal = oldVal;
// //       if (["lat", "long", "capacity_units"].includes(key)) {
// //         finalNewVal = (newVal === "" || newVal === null || isNaN(parseFloat(newVal))) ? null : parseFloat(newVal);
// //         finalOldVal = (oldVal === "" || oldVal === null || isNaN(parseFloat(oldVal))) ? null : parseFloat(oldVal);
// //       }
// //       if (finalNewVal !== finalOldVal) {
// //         payload[key] = finalNewVal;
// //         changesMade = true;
// //       }
// //     }

// //     if (!changesMade) {
// //       setUploadStatus("💡 No changes were made.");
// //       return;
// //     }

// //     try {
// //       // 🛡️ Get and validate the token before the API call
// //       const currentToken = localStorage.getItem("token");
// //       console.log("Token being used for update:", currentToken); // For debugging

// //       if (!currentToken) {
// //         setUploadStatus("❌ Authentication error: No token found. Please log in again.");
// //         return; // Stop the function here
// //       }

// //       const res = await axios.post(`${BASE_URL}/update_store`, payload, {
// //         headers: {
// //           'Authorization': `Bearer ${currentToken}`
// //         },
// //       });

// //       if (res.status === 200) {
// //         setUploadStatus("✅ Store updated successfully.");
// //         fetchStores(); // Refresh the stores list
// //       } else {
// //         setUploadStatus("❌ Failed to update store.");
// //       }
// //     } catch (err) {
// //       // A 401 error will be caught here
// //       setUploadStatus(`❌ Error: ${err.response?.data?.error || err.message}`);
// //       console.error("Update failed:", err);
// //     }
// //   };

// //   const toggleStoreSelection = (storeId) => {
// //     if (selectedStores.includes(storeId)) {
// //       setSelectedStores(selectedStores.filter((id) => id !== storeId));
// //     } else {
// //       setSelectedStores([...selectedStores, storeId]);
// //     }
// //   };

// //   const applyFormula = async () => {
// //     if (!selectedFormula) {
// //       alert("Please select a formula!");
// //       return;
// //     }
// //     setApplyLoading(true);
// //     setApplyMessage("");
// //     const payload = { formula: selectedFormula };
// //     if (selectedStores.length > 0) {
// //       payload.store_ids = selectedStores;
// //     }
// //     try {
// //       const currentToken = localStorage.getItem("token");
// //       const res = await axios.post(
// //         `${BASE_URL}/config/apply-formula`,
// //         payload,
// //         { headers: { 'Authorization': `Bearer ${currentToken}` } }
// //       );
// //       setApplyMessage(`✅ Applied: ${JSON.stringify(res.data)}`);
// //     } catch (err) {
// //       setApplyMessage(`❌ Failed: ${err.response?.data || err.message}`);
// //     } finally {
// //       setApplyLoading(false);
// //     }
// //   };

// //   const updateLookaheadDays = async () => {
// //     try {
// //       const currentToken = localStorage.getItem("token");
// //       await axios.post(`${BASE_URL}/user/lookahead_days`, {
// //         lookahead_days: parseInt(lookaheadDays),
// //       }, { headers: { 'Authorization': `Bearer ${currentToken}` } });
// //       setLookaheadStatus("✅ Updated lookahead days!");
// //     } catch (err) {
// //       setLookaheadStatus(`❌ Error: ${err.response?.data?.error || err.message}`);
// //     }
// //   };

// //   return (
// //     <div className="p-8 max-w-6xl mx-auto space-y-10 dark:bg-[#0f172a] bg-gray-100 min-h-screen">
// //       <div className="flex justify-between items-center">
// //         <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-300">⚙️ Configuration</h1>
// //         <button
// //           onClick={() => navigate("/dashboard")}
// //           className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 transition"
// //         >
// //           ⬅ Back to Dashboard
// //         </button>
// //       </div>

// //       <div className="flex min-h-screen dark:bg-[#0f172a] bg-gray-100">
// //         <aside className="w-64 bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
// //           <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">⚙️ Config Menu</h2>
// //           {[
// //             { id: "addStore", label: "🏪 Add Store" },
// //             { id: "applyFormula", label: "🧮 Apply Formula" },
// //             { id: "editStore", label: "✏️ Edit Store Details" },
// //             { id: "forecast", label: "🔭 Forecast Lookahead" }
// //           ].map(tab => (
// //             <button
// //               key={tab.id}
// //               onClick={() => setActiveTab(tab.id)}
// //               className={`w-full text-left px-4 py-2 rounded ${
// //                 activeTab === tab.id
// //                   ? "bg-blue-600 text-white"
// //                   : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
// //               }`}
// //             >
// //               {tab.label}
// //             </button>
// //           ))}
// //         </aside>

// //         <main className="flex-1 p-8 space-y-8 max-w-6xl mx-auto">
// //           {activeTab === "addStore" && (
// //             <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
// //               <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">🏪 Add New Store</h2>
// //               <form
// //                 onSubmit={handleStoreUpload}
// //                 className="grid grid-cols-1 md:grid-cols-2 gap-4"
// //               >
// //                 {[
// //                   "store_code", "name", "address", "city", "state",
// //                   "country", "lat", "long", "capacity_units"
// //                 ].map((field) => (
// //                   <input
// //                     key={field}
// //                     name={field}
// //                     placeholder={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
// //                     className="border border-gray-300 dark:border-gray-600 dark:bg-[#334155] p-2 rounded text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300"
// //                     value={storeForm[field]}
// //                     onChange={handleStoreChange}
// //                     required={["store_code", "name", "address", "city"].includes(field)}
// //                   />
// //                 ))}
// //                 <div className="md:col-span-2">
// //                   <button
// //                     type="submit"
// //                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
// //                   >
// //                     ➕ Add Store
// //                   </button>
// //                   {uploadStatus && (
// //                     <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{uploadStatus}</p>
// //                   )}
// //                 </div>
// //               </form>
// //             </section>
// //           )}

// //           {activeTab === "applyFormula" && (
// //             <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
// //               <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
// //                 📐 Apply Formula
// //               </h2>
// //               <div className="mb-4">
// //                 <label className="block text-gray-600 dark:text-gray-300 mb-1">Select Formula:</label>
// //                 <select
// //                   className="border p-2 rounded w-full dark:bg-[#334155] dark:text-white dark:border-gray-600"
// //                   value={selectedFormula}
// //                   onChange={(e) => setSelectedFormula(e.target.value)}
// //                 >
// //                   <option value="">-- Choose Formula --</option>
// //                   {Object.entries(formulas).map(([key, desc]) => (
// //                     <option key={key} value={key}>
// //                       {key} → {desc}
// //                     </option>
// //                   ))}
// //                 </select>
// //               </div>
// //               <div className="mb-4">
// //                 <label className="block text-gray-600 dark:text-gray-300 mb-1">
// //                   Select Stores (or leave empty for ALL):
// //                 </label>
// //                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded dark:bg-[#334155] dark:border-gray-600">
// //                   {stores.map((store) => (
// //                     <label key={store.store_id} className="flex items-center gap-2 text-sm text-black dark:text-white">
// //                       <input
// //                         type="checkbox"
// //                         checked={selectedStores.includes(store.store_id)}
// //                         onChange={() => toggleStoreSelection(store.store_id)}
// //                       />
// //                       {store.name} ({store.city})
// //                     </label>
// //                   ))}
// //                 </div>
// //               </div>
// //               <button
// //                 onClick={applyFormula}
// //                 disabled={applyLoading}
// //                 className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
// //               >
// //                 {applyLoading ? "Applying..." : "✅ Apply Formula"}
// //               </button>
// //               {applyMessage && (
// //                 <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{applyMessage}</p>
// //               )}
// //             </section>
// //           )}

// //           {activeTab === "editStore" && (
// //             <div className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
// //               <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">✏️ Edit Store Details</h2>
// //               <div className="mb-4">
// //                 <label className="block text-gray-700 dark:text-gray-300 mb-1">Select Store:</label>
// //                 <select
// //                   className="w-full p-2 rounded border dark:bg-[#334155] dark:text-white dark:border-gray-600"
// //                   onChange={handleStoreSelect}
// //                   defaultValue=""
// //                 >
// //                   <option value="" disabled>-- Choose Store --</option>
// //                   {stores.map(store => (
// //                     <option key={store.store_id} value={store.store_id}>
// //                       {store.name} ({store.city})
// //                     </option>
// //                   ))}
// //                 </select>
// //               </div>
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 {[
// //                   "store_code", "name", "address", "city", "state",
// //                   "country", "lat", "long", "capacity_units"
// //                 ].map((field) => (
// //                   <input
// //                     key={field}
// //                     name={field}
// //                     placeholder={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
// //                     className="border border-gray-300 dark:border-gray-600 dark:bg-[#334155] p-2 rounded text-black dark:text-white"
// //                     value={storeForm[field] || ""}
// //                     onChange={handleStoreChange}
// //                   />
// //                 ))}
// //               </div>
// //               <div className="mt-4">
// //                 <button
// //                   onClick={handleStoreUpdate}
// //                   className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
// //                 >
// //                   💾 Update Store
// //                 </button>
// //                 {uploadStatus && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{uploadStatus}</p>}
// //               </div>
// //             </div>
// //           )}

// //           {activeTab === "forecast" && (
// //             <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
// //               <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">🔭 Forecast Lookahead</h2>
// //               <div className="flex items-center gap-4">
// //                 <input
// //                   type="number"
// //                   min="1"
// //                   className="border p-2 rounded w-32 dark:bg-[#334155] dark:text-white dark:border-gray-600"
// //                   placeholder="Lookahead Days"
// //                   value={lookaheadDays}
// //                   onChange={(e) => setLookaheadDays(e.target.value)}
// //                 />
// //                 <button
// //                   onClick={updateLookaheadDays}
// //                   className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
// //                 >
// //                   Save Days
// //                 </button>
// //               </div>
// //               {lookaheadStatus && <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{lookaheadStatus}</p>}
// //             </section>
// //           )}
// //         </main>
// //       </div>
// //     </div>
// //   );
// // }




// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import ForecastLookahead from "./ForecastLookahead";

// const BASE_URL = "http://127.0.0.1:5500";
// const token = localStorage.getItem("token");

// export default function ConfigPage() {
//   const navigate = useNavigate();

//   const [formulas, setFormulas] = useState({});
//   const [selectedFormula, setSelectedFormula] = useState("");
//   const [stores, setStores] = useState([]);
//   const [selectedStores, setSelectedStores] = useState([]);
//   const [applyLoading, setApplyLoading] = useState(false);
//   const [applyMessage, setApplyMessage] = useState("");const [lookaheadDays, setLookaheadDays] = useState(7);
// const [activeTab, setActiveTab] = useState("addStore");

//   const [storeForm, setStoreForm] = useState({
//     store_id: "",
//     store_code: "",
//     name: "",
//     address: "",
//     city: "",
//     state: "",
//     country: "",
//     lat: "",
//     long: "",
//     capacity_units: "",
//   });
//   const [originalStore, setOriginalStore] = useState(null);
//   const [uploadStatus, setUploadStatus] = useState("");

//   // Helper function to get fresh auth headers
//   const getAuthHeaders = () => {
//     const currentToken = localStorage.getItem("token");
//     if (!currentToken) {
//       setUploadStatus("❌ No authentication token found. Please login again.");
//       navigate("/login"); // Redirect to login if no token
//       return null;
//     }
//     return {
//       'Authorization': `Bearer ${currentToken}`,
//       'Content-Type': 'application/json'
//     };
//   };

//   useEffect(() => {
//     fetchFormulas();
//     fetchStores();
//   }, []);

//   const fetchFormulas = async () => {
//     try {
//       const headers = getAuthHeaders();
//       if (!headers) return;
     
//       const res = await axios.get(`${BASE_URL}/config/formulas`, { headers });
//       setFormulas(res.data);
//     } catch (err) {
//       console.error("Failed to fetch formulas:", err);
//       if (err.response?.status === 401) {
//         setUploadStatus("❌ Authentication failed. Please login again.");
//         navigate("/login");
//       }
//     }
//   };

//   const fetchStores = async () => {
//     try {
//       const headers = getAuthHeaders();
//       if (!headers) return;
     
//       const res = await axios.get(`${BASE_URL}/stores`, { headers });
//       setStores(res.data.stores || []);
//     } catch (err) {
//       console.error("Failed to fetch stores:", err);
//       if (err.response?.status === 401) {
//         setUploadStatus("❌ Authentication failed. Please login again.");
//         navigate("/login");
//       }
//     }
//   };

//   const handleStoreChange = (e) => {
//     const { name, value } = e.target;
//     setStoreForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleStoreUpload = async (e) => {
//     e.preventDefault();
//     setUploadStatus("Uploading...");
//     try {
//       const headers = getAuthHeaders();
//       if (!headers) return;
     
//       const res = await axios.post(`${BASE_URL}/store_upload`, storeForm, { headers });
//       setUploadStatus(`✅ Store added: ${res.status}`);
//       fetchStores();
//     } catch (err) {
//       setUploadStatus(`❌ Failed: ${err.response?.data || err.message}`);
//     }
//   };

//   const handleStoreSelect = (e) => {
//     const selectedId = parseInt(e.target.value, 10);
   
//     if (!selectedId) {
//       // Reset form when no store is selected
//       setStoreForm({
//         store_id: "",
//         store_code: "",
//         name: "",
//         address: "",
//         city: "",
//         state: "",
//         country: "",
//         lat: "",
//         long: "",
//         capacity_units: "",
//       });
//       setOriginalStore(null);
//       setUploadStatus("");
//       return;
//     }

//     const selected = stores.find((s) => s.store_id === selectedId);

//     if (selected) {
//       // Convert null values to empty strings for form display
//       const formData = {
//         store_id: selected.store_id || "",
//         store_code: selected.store_code || "",
//         name: selected.name || "",
//         address: selected.address || "",
//         city: selected.city || "",
//         state: selected.state || "",
//         country: selected.country || "",
//         lat: selected.lat || "",
//         long: selected.long || "",
//         capacity_units: selected.capacity_units || "",
//       };
     
//       setStoreForm(formData);
//       setOriginalStore(selected); // Keep original with actual null values
//       setUploadStatus("");
//     }
//   };

//   const handleStoreUpdate = async () => {
//     // 1. Check if a store has been selected
//     if (!storeForm.store_id || !originalStore) {
//       setUploadStatus("❌ No store selected for update.");
//       return;
//     }

//     const headers = getAuthHeaders();
//     if (!headers) return;

//     // 2. Build the payload with only changed fields
//     const payload = { store_id: parseInt(storeForm.store_id, 10) };
//     const fields = [
//       "store_code", "name", "lat", "long",
//       "address", "city", "state", "country", "capacity_units"
//     ];
//     let changesMade = false;

//     for (const key of fields) {
//       let newVal = storeForm[key];
//       let oldVal = originalStore[key];
     
//       // Handle numeric fields
//       if (["lat", "long", "capacity_units"].includes(key)) {
//         // Convert empty strings to null for numeric fields
//         newVal = (newVal === "" || newVal === null) ? null : parseFloat(newVal);
//         oldVal = (oldVal === "" || oldVal === null) ? null : parseFloat(oldVal);
       
//         // Check for NaN and convert to null
//         if (isNaN(newVal)) newVal = null;
//         if (isNaN(oldVal)) oldVal = null;
//       } else {
//         // For string fields, treat empty strings as null for comparison
//         newVal = newVal === "" ? null : newVal;
//         oldVal = oldVal === "" ? null : oldVal;
//       }

//       // Compare values
//       if (newVal !== oldVal) {
//         payload[key] = newVal;
//         changesMade = true;
//       }
//     }

//     if (!changesMade) {
//       setUploadStatus("💡 No changes detected.");
//       return;
//     }

//     // 3. Make the API call
//     try {
//       setUploadStatus("Updating...");
//       const res = await axios.post(`${BASE_URL}/update_store`, payload, { headers });

//       if (res.status === 200) {
//         setUploadStatus("✅ Store updated successfully.");
//         await fetchStores(); // Refresh the stores list
       
//         // Update the form with fresh data
//         const updatedStore = stores.find(s => s.store_id === parseInt(storeForm.store_id, 10));
//         if (updatedStore) {
//           const formData = {
//             store_id: updatedStore.store_id || "",
//             store_code: updatedStore.store_code || "",
//             name: updatedStore.name || "",
//             address: updatedStore.address || "",
//             city: updatedStore.city || "",
//             state: updatedStore.state || "",
//             country: updatedStore.country || "",
//             lat: updatedStore.lat || "",
//             long: updatedStore.long || "",
//             capacity_units: updatedStore.capacity_units || "",
//           };
//           setStoreForm(formData);
//           setOriginalStore(updatedStore);
//         }
//       }
//     } catch (err) {
//       console.error("Update failed:", err);
//       if (err.response?.status === 401) {
//         setUploadStatus("❌ Authentication failed. Please login again.");
//         navigate("/login");
//       } else if (err.response?.status === 404) {
//         setUploadStatus("❌ Store not found or you don't have permission to update it.");
//       } else {
//         setUploadStatus(`❌ Update failed: ${err.response?.data?.error || err.message}`);
//       }
//     }
//   };

//   const toggleStoreSelection = (storeId) => {
//     if (selectedStores.includes(storeId)) {
//       setSelectedStores(selectedStores.filter((id) => id !== storeId));
//     } else {
//       setSelectedStores([...selectedStores, storeId]);
//     }
//   };

//   const applyFormula = async () => {
//     if (!selectedFormula) {
//       setApplyMessage("❌ Please select a formula!");
//       return;
//     }

//     const headers = getAuthHeaders();
//     if (!headers) return;

//     setApplyLoading(true);
//     setApplyMessage("");

//     const payload = { formula: selectedFormula };
//     if (selectedStores.length > 0) {
//       payload.store_ids = selectedStores;
//     }

//     try {
//       const res = await axios.post(`${BASE_URL}/config/apply-formula`, payload, { headers });
//       setApplyMessage(`✅ Applied: ${JSON.stringify(res.data)}`);
//     } catch (err) {
//       if (err.response?.status === 401) {
//         setApplyMessage("❌ Authentication failed. Please login again.");
//         navigate("/login");
//       } else {
//         setApplyMessage(`❌ Failed: ${err.response?.data || err.message}`);
//       }
//     } finally {
//       setApplyLoading(false);
//     }
//   };
  

//   return (
//     <div className="p-8 max-w-6xl mx-auto space-y-10 dark:bg-[#0f172a] bg-gray-100 min-h-screen">
     
//       {/* Back Button */}
//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-300">⚙️ Configuration</h1>
//         <button
//           onClick={() => navigate("/dashboard")}
//           className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 transition"
//         >
//           ⬅ Back to Dashboard
//         </button>
//       </div>

//       <div className="flex min-h-screen dark:bg-[#0f172a] bg-gray-100">
//         {/* Side Menu */}
//         <aside className="w-64 bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
//           <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">⚙️ Config Menu</h2>
//           {[
//             { id: "addStore", label: "🏪 Add Store" },
//             { id: "applyFormula", label: "🧮 Apply Formula" },
//             { id: "editStore", label: "✏️ Edit Store Location" },
//             { id: "forecast", label: "🔭 Forecast Lookahead" }
//           ].map(tab => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`w-full text-left px-4 py-2 rounded ${
//                 activeTab === tab.id
//                   ? "bg-blue-600 text-white"
//                   : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
//               }`}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </aside>

//         {/* Main Content */}
//         <main className="flex-1 p-8 space-y-8 max-w-6xl mx-auto">
//           {activeTab === "addStore" && (
//             <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
//               <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">🏪 Add New Store</h2>
//               <form onSubmit={handleStoreUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {[
//                   "store_code", "name", "address", "city", "state",
//                   "country", "lat", "long", "capacity_units"
//                 ].map((field) => (
//                   <input
//                     key={field}
//                     name={field}
//                     placeholder={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
//                     className="border border-gray-300 dark:border-gray-600 dark:bg-[#334155] p-2 rounded text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300"
//                     value={storeForm[field]}
//                     onChange={handleStoreChange}
//                     required={["store_code", "name", "address", "city"].includes(field)}
//                   />
//                 ))}
//                 <div className="md:col-span-2">
//                   <button
//                     type="submit"
//                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                   >
//                     ➕ Add Store
//                   </button>
//                   {uploadStatus && (
//                     <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{uploadStatus}</p>
//                   )}
//                 </div>
//               </form>
//             </section>
//           )}

//           {activeTab === "applyFormula" && (
//             <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
//               <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">📐 Apply Formula</h2>

//               <div className="mb-4">
//                 <label className="block text-gray-600 dark:text-gray-300 mb-1">Select Formula:</label>
//                 <select
//                   className="border p-2 rounded w-full dark:bg-[#334155] dark:text-white dark:border-gray-600"
//                   value={selectedFormula}
//                   onChange={(e) => setSelectedFormula(e.target.value)}
//                 >
//                   <option value="">-- Choose Formula --</option>
//                   {Object.entries(formulas).map(([key, desc]) => (
//                     <option key={key} value={key}>
//                       {key} → {desc}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-gray-600 dark:text-gray-300 mb-1">
//                   Select Stores (or leave empty for ALL):
//                 </label>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded dark:bg-[#334155] dark:border-gray-600">
//                   {stores.map((store) => (
//                     <label key={store.store_id} className="flex items-center gap-2 text-sm text-black dark:text-white">
//                       <input
//                         type="checkbox"
//                         checked={selectedStores.includes(store.store_id)}
//                         onChange={() => toggleStoreSelection(store.store_id)}
//                       />
//                       {store.name} ({store.city})
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               <button
//                 onClick={applyFormula}
//                 disabled={applyLoading}
//                 className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
//               >
//                 {applyLoading ? "Applying..." : "✅ Apply Formula"}
//               </button>

//               {applyMessage && (
//                 <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{applyMessage}</p>
//               )}
//             </section>
//           )}

//           {activeTab === "editStore" && (
//             <div className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
//               <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">✏️ Edit Store Details</h2>

//               {/* Step 1: Select a store */}
//               <div className="mb-4">
//                 <label className="block text-gray-700 dark:text-gray-300 mb-1">Select Store:</label>
//                 <select
//                   className="w-full p-2 rounded border dark:bg-[#334155] dark:text-white dark:border-gray-600"
//                   onChange={handleStoreSelect}
//                   value={storeForm.store_id || ""}
//                 >
//                   <option value="">-- Choose Store --</option>
//                   {stores.map(store => (
//                     <option key={store.store_id} value={store.store_id}>
//                       {store.name} ({store.city})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Step 2: Edit the store's details */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {[
//                   "store_code", "name", "address", "city", "state",
//                   "country", "lat", "long", "capacity_units"
//                 ].map((field) => (
//                   <input
//                     key={field}
//                     name={field}
//                     placeholder={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
//                     className="border border-gray-300 dark:border-gray-600 dark:bg-[#334155] p-2 rounded text-black dark:text-white"
//                     value={storeForm[field] || ""}
//                     onChange={handleStoreChange}
//                     disabled={!storeForm.store_id} // Disable if no store selected
//                   />
//                 ))}
//               </div>

//               {/* Step 3: Save the changes */}
//               <div className="mt-4">
//                 <button
//                   onClick={handleStoreUpdate}
//                   disabled={!storeForm.store_id}
//                   className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   💾 Update Store
//                 </button>
//                 {uploadStatus && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{uploadStatus}</p>}
//               </div>
//             </div>
//           )}

//           {activeTab === "forecast" && (
//             <ForecastLookahead />
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ForecastLookahead from "./ForecastLookahead";

// --- Constants ---
const BASE_URL = "http://127.0.0.1:5500";

// A configuration array for store form fields to avoid repetition.
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

// --- Main Component ---
export default function ConfigPage() {
  const navigate = useNavigate();

  // --- State Management ---
  const [activeTab, setActiveTab] = useState("addStore");
  const [formulas, setFormulas] = useState({});
  const [stores, setStores] = useState([]);
  
  // State for "Apply Formula" section
  const [selectedFormula, setSelectedFormula] = useState("");
  const [selectedStores, setSelectedStores] = useState([]);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState({ text: "", type: "" });

  // State for "Add/Edit Store" sections
  const [storeForm, setStoreForm] = useState(INITIAL_STORE_FORM_STATE);
  const [originalStore, setOriginalStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeMessage, setStoreMessage] = useState({ text: "", type: "" });
  
  // --- API & Data Fetching ---
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
  
  // --- Event Handlers ---
  const handleStoreFormChange = (e) => {
    const { name, value } = e.target;
    setStoreForm((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleStoreSelectForEdit = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    const selected = stores.find((s) => s.store_id === selectedId);

    if (selected) {
      // Populate form state, converting nulls to empty strings for controlled inputs
      const formData = Object.keys(INITIAL_STORE_FORM_STATE).reduce((acc, key) => {
        acc[key] = selected[key] ?? "";
        return acc;
      }, {});
      setStoreForm(formData);
      setOriginalStore(selected); // Keep original for comparison
      setStoreMessage({ text: "", type: "" });
    } else {
      // Reset if "Choose Store" is selected
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
      setStoreForm(INITIAL_STORE_FORM_STATE); // Reset form
      await fetchStores(); // Refresh list
    } catch (err) {
      setStoreMessage({ text: `❌ Error: ${err.response?.data?.error || err.message}`, type: "error" });
    } finally {
      setStoreLoading(false);
    }
  };

  const handleUpdateStore = async () => {
    if (!originalStore) {
        setStoreMessage({ text: "❌ No store selected for update.", type: "error" });
        return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    // Create payload with only the fields that have changed
    const payload = { store_id: originalStore.store_id };
    let changesMade = false;
    
    Object.keys(storeForm).forEach(key => {
        if (key === 'store_id') return;

        const originalValue = originalStore[key] ?? "";
        const currentValue = storeForm[key] ?? "";

        if (originalValue !== currentValue) {
            // Send null if field is empty, otherwise send the value
            payload[key] = currentValue === "" ? null : currentValue;
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
        await fetchStores(); // Refresh list
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
    
    const payload = { formula: selectedFormula };
    if (selectedStores.length > 0) {
      payload.store_ids = selectedStores;
    }
    
    try {
      const res = await axios.post(`${BASE_URL}/config/apply-formula`, payload, { headers });
      setApplyMessage({ text: `✅ Success: ${res.data.message || 'Formula applied.'}`, type: "success" });
    } catch (err) {
      setApplyMessage({ text: `❌ Failed: ${err.response?.data?.error || err.message}`, type: "error" });
    } finally {
      setApplyLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="dark:bg-[#0f172a] bg-gray-50 text-gray-800 dark:text-gray-200 flex flex-col h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col flex-1">

        {/* Header */}
        <header className="py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⚙️ Configuration</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
          >
            &larr; Back to Dashboard
          </button>
        </header>

        <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
          {/* Side Menu */}
          <aside className="md:w-64">
            <div className="sticky top-6 bg-white dark:bg-[#1e293b] rounded-xl shadow-md p-4 space-y-2">
              {[
                { id: "addStore", label: "🏪 Add New Store" },
                { id: "editStore", label: "✏️ Edit Store Details" },
                { id: "applyFormula", label: "🧮 Apply Formula" },
                { id: "forecast", label: "🔭 Forecast Lookahead" },
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

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-8">
            {activeTab === "addStore" && (
              <SectionCard title="🏪 Add New Store">
                <StoreForm
                    formData={storeForm}
                    onFormChange={handleStoreFormChange}
                    onSubmit={handleAddStore}
                    isLoading={storeLoading}
                    message={storeMessage}
                    buttonText="Add Store"
                />
              </SectionCard>
            )}

            {activeTab === "editStore" && (
                <SectionCard title="✏️ Edit Store Details">
                    <div className="mb-6">
                        <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Select a Store to Edit
                        </label>
                        <select
                            id="store-select"
                            className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                            onChange={handleStoreSelectForEdit}
                            value={storeForm.store_id || ""}
                        >
                            <option value="">-- Choose Store --</option>
                            {stores.map(store => (
                                <option key={store.store_id} value={store.store_id}>
                                    {store.name} ({store.city})
                                </option>
                            ))}
                        </select>
                    </div>

                    {storeForm.store_id && (
                        <StoreForm
                            formData={storeForm}
                            onFormChange={handleStoreFormChange}
                            onSubmit={handleUpdateStore}
                            isLoading={storeLoading}
                            message={storeMessage}
                            buttonText="Update Store"
                            isUpdate={true}
                        />
                    )}
                </SectionCard>
            )}

            {activeTab === "applyFormula" && (
              <SectionCard title="🧮 Apply Formula to Stores">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="formula-select" className="block text-sm font-medium mb-1">Select Formula</label>
                    <select
                      id="formula-select"
                      className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                      value={selectedFormula}
                      onChange={(e) => setSelectedFormula(e.target.value)}
                    >
                      <option value="">-- Choose Formula --</option>
                      {Object.entries(formulas).map(([key, desc]) => (
                        <option key={key} value={key}>{key} &rarr; {desc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Select Stores (leave empty for all)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto border p-4 rounded-lg bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-gray-600">
                      {stores.map((store) => (
                        <label key={store.store_id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedStores.includes(store.store_id)}
                            onChange={() => {
                                setSelectedStores(prev =>
                                    prev.includes(store.store_id)
                                    ? prev.filter(id => id !== store.store_id)
                                    : [...prev, store.store_id]
                                );
                            }}
                          />
                          <span>{store.name} <span className="text-gray-500 dark:text-gray-400">({store.city})</span></span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <SubmitButton onClick={handleApplyFormula} isLoading={applyLoading} className="bg-green-600 hover:bg-green-700">
                        Apply Formula
                    </SubmitButton>
                     {applyMessage.text && <StatusMessage message={applyMessage.text} type={applyMessage.type} />}
                  </div>
                </div>
              </SectionCard>
            )}

            {activeTab === "forecast" && <ForecastLookahead />}
          </main>
        </div>
      </div>
    </div>
  );
}

// --- Reusable UI Components ---

// Card wrapper for each section
function SectionCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-[#1e293b] shadow-lg rounded-xl p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  );
}

// Reusable form for adding and editing stores
function StoreForm({ formData, onFormChange, onSubmit, isLoading, message, buttonText, isUpdate = false }) {
    return (
        // ✅ **THE FIX IS HERE** ✅
        // The onSubmit prop is now passed directly to the form element
        <form onSubmit={isUpdate ? (e) => e.preventDefault() : onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {STORE_FORM_FIELDS.map(field => (
                    <FormField
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        value={formData[field.name]}
                        onChange={onFormChange}
                        type={field.type || "text"}
                        required={field.required}
                        placeholder={`Enter ${field.label}...`}
                    />
                ))}
            </div>
            <div className="pt-2 flex items-center gap-4">
                <SubmitButton 
                  onClick={isUpdate ? onSubmit : undefined} 
                  type={isUpdate ? "button" : "submit"}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                    {buttonText}
                </SubmitButton>
                {message.text && <StatusMessage message={message.text} type={message.type} />}
            </div>
        </form>
    );
}

// Reusable labeled form field
function FormField({ name, label, value, onChange, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2.5 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
    </div>
  );
}

// Reusable button with loading state
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

// Component to display status messages
function StatusMessage({ message, type }) {
    const baseClasses = "text-sm font-medium";
    const typeClasses = {
        success: "text-green-600 dark:text-green-400",
        error: "text-red-600 dark:text-red-400",
        info: "text-gray-600 dark:text-gray-300",
    };
    return <p className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}>{message}</p>;
}