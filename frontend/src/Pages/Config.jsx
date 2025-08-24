// // import React, { useEffect, useState } from "react";
// // import axios from "axios";

// // const BASE_URL = "http://127.0.0.1:5500"; // same as backend
// // const token = localStorage.getItem("token"); // assume you saved token after login

// // export default function ConfigPage() {
// //   const [formulas, setFormulas] = useState({});
// //   const [selectedFormula, setSelectedFormula] = useState("");
// //   const [stores, setStores] = useState([]);
// //   const [selectedStores, setSelectedStores] = useState([]);
// //   const [applyLoading, setApplyLoading] = useState(false);
// //   const [applyMessage, setApplyMessage] = useState("");

// //   // Store upload form state
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

// //   const authHeaders = {
// //     Authorization: `Bearer ${token}`,
// //   };

// //   // Fetch formulas & stores on mount
// //   useEffect(() => {
// //     fetchFormulas();
// //     fetchStores();
// //   }, []);

// //   const fetchFormulas = async () => {
// //     try {
// //       const res = await axios.get(`${BASE_URL}/config/formulas`, {
// //         headers: authHeaders,
// //       });
// //       setFormulas(res.data);
// //     } catch (err) {
// //       console.error("Failed to fetch formulas:", err);
// //     }
// //   };

// //   const fetchStores = async () => {
// //     try {
// //       const res = await axios.get(`${BASE_URL}/stores`, {
// //         headers: authHeaders,
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
// //       const res = await axios.post(`${BASE_URL}/store_upload`, storeForm, {
// //         headers: authHeaders,
// //       });
// //       setUploadStatus(`✅ Store added: ${res.status}`);
// //       fetchStores(); // refresh list
// //     } catch (err) {
// //       setUploadStatus(`❌ Failed: ${err.response?.data || err.message}`);
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

// //     const payload = {
// //       formula: selectedFormula,
// //     };
// //     if (selectedStores.length > 0) {
// //       payload.store_ids = selectedStores;
// //     }

// //     try {
// //       const res = await axios.post(
// //         `${BASE_URL}/config/apply-formula`,
// //         payload,
// //         { headers: authHeaders }
// //       );
// //       setApplyMessage(`✅ Applied: ${JSON.stringify(res.data)}`);
// //     } catch (err) {
// //       setApplyMessage(`❌ Failed: ${err.response?.data || err.message}`);
// //     } finally {
// //       setApplyLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="p-8 max-w-6xl mx-auto space-y-10">
// //       <h1 className="text-3xl font-bold text-blue-900">⚙️ Configuration</h1>

// //       {/* --- STORE UPLOAD SECTION --- */}
// //       <section className="bg-white shadow rounded-xl p-6">
// //         <h2 className="text-xl font-semibold mb-4 text-gray-700">
// //           🏪 Add New Store
// //         </h2>
// //         <form
// //           onSubmit={handleStoreUpload}
// //           className="grid grid-cols-1 md:grid-cols-2 gap-4"
// //         >
// //           <input
// //             name="store_code"
// //             placeholder="Store Code"
// //             className="border p-2 rounded"
// //             value={storeForm.store_code}
// //             onChange={handleStoreChange}
// //             required
// //           />
// //           <input
// //             name="name"
// //             placeholder="Store Name"
// //             className="border p-2 rounded"
// //             value={storeForm.name}
// //             onChange={handleStoreChange}
// //             required
// //           />
// //           <input
// //             name="address"
// //             placeholder="Address"
// //             className="border p-2 rounded"
// //             value={storeForm.address}
// //             onChange={handleStoreChange}
// //             required
// //           />
// //           <input
// //             name="city"
// //             placeholder="City"
// //             className="border p-2 rounded"
// //             value={storeForm.city}
// //             onChange={handleStoreChange}
// //             required
// //           />
// //           <input
// //             name="state"
// //             placeholder="State (optional)"
// //             className="border p-2 rounded"
// //             value={storeForm.state}
// //             onChange={handleStoreChange}
// //           />
// //           <input
// //             name="country"
// //             placeholder="Country (optional)"
// //             className="border p-2 rounded"
// //             value={storeForm.country}
// //             onChange={handleStoreChange}
// //           />
// //           <input
// //             name="lat"
// //             placeholder="Latitude"
// //             className="border p-2 rounded"
// //             value={storeForm.lat}
// //             onChange={handleStoreChange}
// //           />
// //           <input
// //             name="long"
// //             placeholder="Longitude"
// //             className="border p-2 rounded"
// //             value={storeForm.long}
// //             onChange={handleStoreChange}
// //           />
// //           <input
// //             name="capacity_units"
// //             placeholder="Capacity Units"
// //             className="border p-2 rounded"
// //             value={storeForm.capacity_units}
// //             onChange={handleStoreChange}
// //           />
// //           <div className="md:col-span-2">
// //             <button
// //               type="submit"
// //               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
// //             >
// //               ➕ Add Store
// //             </button>
// //             {uploadStatus && (
// //               <p className="mt-2 text-sm text-gray-600">{uploadStatus}</p>
// //             )}
// //           </div>
// //         </form>
// //       </section>

// //       {/* --- FORMULA SELECTION SECTION --- */}
// //       <section className="bg-white shadow rounded-xl p-6">
// //         <h2 className="text-xl font-semibold mb-4 text-gray-700">
// //           📐 Apply Formula
// //         </h2>

// //         {/* Formula Dropdown */}
// //         <div className="mb-4">
// //           <label className="block text-gray-600 mb-1">Select Formula:</label>
// //           <select
// //             className="border p-2 rounded w-full"
// //             value={selectedFormula}
// //             onChange={(e) => setSelectedFormula(e.target.value)}
// //           >
// //             <option value="">-- Choose Formula --</option>
// //             {Object.entries(formulas).map(([key, desc]) => (
// //               <option key={key} value={key}>
// //                 {key} → {desc}
// //               </option>
// //             ))}
// //           </select>
// //         </div>

// //         {/* Store Selection */}
// //         <div className="mb-4">
// //           <label className="block text-gray-600 mb-1">
// //             Select Stores (or leave empty for ALL):
// //           </label>
// //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
// //             {stores.map((store) => (
// //               <label
// //                 key={store.store_id}
// //                 className="flex items-center gap-2 text-sm"
// //               >
// //                 <input
// //                   type="checkbox"
// //                   checked={selectedStores.includes(store.store_id)}
// //                   onChange={() => toggleStoreSelection(store.store_id)}
// //                 />
// //                 {store.name} ({store.city})
// //               </label>
// //             ))}
// //           </div>
// //         </div>

// //         <button
// //           onClick={applyFormula}
// //           disabled={applyLoading}
// //           className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
// //         >
// //           {applyLoading ? "Applying..." : "✅ Apply Formula"}
// //         </button>

// //         {applyMessage && (
// //           <p className="mt-2 text-sm text-gray-700">{applyMessage}</p>
// //         )}
// //       </section>
// //     </div>
// //   );
// // }


// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const BASE_URL = "http://127.0.0.1:5500";
// const token = localStorage.getItem("token");

// export default function ConfigPage() {
//   const [formulas, setFormulas] = useState({});
//   const [selectedFormula, setSelectedFormula] = useState("");
//   const [stores, setStores] = useState([]);
//   const [selectedStores, setSelectedStores] = useState([]);
//   const [applyLoading, setApplyLoading] = useState(false);
//   const [applyMessage, setApplyMessage] = useState("");

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

//   const fetchFormulas = async () => {
//     try {
//       const res = await axios.get(`${BASE_URL}/config/formulas`, {
//         headers: authHeaders,
//       });
//       setFormulas(res.data);
//     } catch (err) {
//       console.error("Failed to fetch formulas:", err);
//     }
//   };

//   const fetchStores = async () => {
//     try {
//       const res = await axios.get(`${BASE_URL}/stores`, {
//         headers: authHeaders,
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
//       const res = await axios.post(`${BASE_URL}/store_upload`, storeForm, {
//         headers: authHeaders,
//       });
//       setUploadStatus(`✅ Store added: ${res.status}`);
//       fetchStores();
//     } catch (err) {
//       setUploadStatus(`❌ Failed: ${err.response?.data || err.message}`);
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
//       const res = await axios.post(
//         `${BASE_URL}/config/apply-formula`,
//         payload,
//         { headers: authHeaders }
//       );
//       setApplyMessage(`✅ Applied: ${JSON.stringify(res.data)}`);
//     } catch (err) {
//       setApplyMessage(`❌ Failed: ${err.response?.data || err.message}`);
//     } finally {
//       setApplyLoading(false);
//     }
//   };

//   return (
//     <div className="p-8 max-w-6xl mx-auto space-y-10 dark:bg-[#0f172a] bg-gray-100 min-h-screen">
//       <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-300">⚙️ Configuration</h1>

//       {/* STORE UPLOAD */}
//       <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
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

//       {/* FORMULA SECTION */}
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
//     </div>
//   );
// }



import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import for navigation
import axios from "axios";
import ForecastLookahead from "./ForecastLookahead";


const BASE_URL = "http://127.0.0.1:5500";
const token = localStorage.getItem("token");

// ✅ useNavigate hook for navigation`  
export default function ConfigPage() {
  const navigate = useNavigate(); // ✅ useNavigate hook

  const [formulas, setFormulas] = useState({});
  const [selectedFormula, setSelectedFormula] = useState("");
  const [stores, setStores] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");const [lookaheadDays, setLookaheadDays] = useState(7);
const [activeTab, setActiveTab] = useState("addStore");

  const [storeForm, setStoreForm] = useState({
    store_code: "",
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    lat: "",
    long: "",
    capacity_units: "",
  });
  const [uploadStatus, setUploadStatus] = useState("");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchFormulas();
    fetchStores();
  }, []);

  const fetchFormulas = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/config/formulas`, {
        headers: authHeaders,
      });
      setFormulas(res.data);
    } catch (err) {
      console.error("Failed to fetch formulas:", err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/stores`, {
        headers: authHeaders,
      });
      setStores(res.data.stores || []);
    } catch (err) {
      console.error("Failed to fetch stores:", err);
    }
  };

  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStoreForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoreUpload = async (e) => {
    e.preventDefault();
    setUploadStatus("Uploading...");
    try {
      const res = await axios.post(`${BASE_URL}/store_upload`, storeForm, {
        headers: authHeaders,
      });
      setUploadStatus(`✅ Store added: ${res.status}`);
      fetchStores();
    } catch (err) {
      setUploadStatus(`❌ Failed: ${err.response?.data || err.message}`);
    }
  };

const [originalStore, setOriginalStore] = useState(null); // ← add this with your other useState hooks

const handleStoreSelect = (e) => {
  const selected = stores.find((s) => s.store_id === e.target.value);
  if (selected) {
    setStoreForm({ ...selected }); // shallow clone
    setOriginalStore({ ...selected });
    setUploadStatus(""); // clear any old status message
  }
};




 const handleStoreUpdate = async () => {
  if (!storeForm.store_id || !originalStore) {
    setUploadStatus("❌ No store selected.");
    return;
  }

  const payload = { store_id: storeForm.store_id };
  const fields = [
    "store_code", "name", "lat", "lon",
    "address", "city", "state", "country", "capacity_units"
  ];

  let changesMade = false;

  for (const key of fields) {
    const newVal = storeForm[key];
    const oldVal = originalStore[key];

    // Convert lat/lon/capacity to float before comparison
    const isNumeric = ["lat", "lon", "capacity_units"].includes(key);
    const parsedNewVal = isNumeric ? parseFloat(newVal) : newVal;
    const parsedOldVal = isNumeric ? parseFloat(oldVal) : oldVal;

    if (parsedNewVal !== parsedOldVal) {
      payload[key] = parsedNewVal;
      changesMade = true;
    }
  }

  if (!changesMade) {
    setUploadStatus("❌ No changes provided.");
    return;
  }

  try {
    const res = await axios.post(`${BASE_URL}/update_store`, payload, {
      headers: authHeaders,
    });
    if (res.status === 200) {
      setUploadStatus("✅ Store updated successfully.");
      fetchStores();
    } else {
      setUploadStatus("❌ Failed to update store.");
    }
  } catch (err) {
    setUploadStatus(`❌ Error: ${err.response?.data || err.message}`);
  }
};



  const toggleStoreSelection = (storeId) => {
    if (selectedStores.includes(storeId)) {
      setSelectedStores(selectedStores.filter((id) => id !== storeId));
    } else {
      setSelectedStores([...selectedStores, storeId]);
    }
  };

  const applyFormula = async () => {
    if (!selectedFormula) {
      alert("Please select a formula!");
      return;
    }

    setApplyLoading(true);
    setApplyMessage("");

    const payload = { formula: selectedFormula };
    if (selectedStores.length > 0) {
      payload.store_ids = selectedStores;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/config/apply-formula`,
        payload,
        { headers: authHeaders }
      );
      setApplyMessage(`✅ Applied: ${JSON.stringify(res.data)}`);
    } catch (err) {
      setApplyMessage(`❌ Failed: ${err.response?.data || err.message}`);
    } finally {
      setApplyLoading(false);
    }
  };
  

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 dark:bg-[#0f172a] bg-gray-100 min-h-screen">
      
      {/* ✅ Back Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-300">⚙️ Configuration</h1>
        <button
          onClick={() => navigate("/dashboard")} // ✅ navigate back
          className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 transition"
        >
          ⬅ Back to Dashboard
        </button>
      </div>

      {/* --- STORE UPLOAD SECTION --- */}
      <div className="flex min-h-screen dark:bg-[#0f172a] bg-gray-100">
  {/* Side Menu */}
  <aside className="w-64 bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
    <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">⚙️ Config Menu</h2>
    {[
      { id: "addStore", label: "🏪 Add Store" },
      { id: "applyFormula", label: "🧮 Apply Formula" },
      { id: "editStore", label: "✏️ Edit Store Location" },
      { id: "forecast", label: "🔭 Forecast Lookahead" }
    ].map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`w-full text-left px-4 py-2 rounded ${
          activeTab === tab.id
            ? "bg-blue-600 text-white"
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </aside>

  {/* Main Content */}
  <main className="flex-1 p-8 space-y-8 max-w-6xl mx-auto">
    {activeTab === "addStore" && (
      // your "Add Store" section here
           <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">🏪 Add New Store</h2>
        <form
          onSubmit={handleStoreUpload}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {[
            "store_code", "name", "address", "city", "state",
            "country", "lat", "long", "capacity_units"
          ].map((field) => (
            <input
              key={field}
              name={field}
              placeholder={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              className="border border-gray-300 dark:border-gray-600 dark:bg-[#334155] p-2 rounded text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300"
              value={storeForm[field]}
              onChange={handleStoreChange}
              required={["store_code", "name", "address", "city"].includes(field)}
            />
          ))}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ➕ Add Store
            </button>
            {uploadStatus && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{uploadStatus}</p>
            )}
          </div>
        </form>
      </section>
    )}

    {activeTab === "applyFormula" && (
      // your "Apply Formula" section here
      <section className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
          📐 Apply Formula
        </h2>

        <div className="mb-4">
          <label className="block text-gray-600 dark:text-gray-300 mb-1">Select Formula:</label>
          <select
            className="border p-2 rounded w-full dark:bg-[#334155] dark:text-white dark:border-gray-600"
            value={selectedFormula}
            onChange={(e) => setSelectedFormula(e.target.value)}
          >
            <option value="">-- Choose Formula --</option>
            {Object.entries(formulas).map(([key, desc]) => (
              <option key={key} value={key}>
                {key} → {desc}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 dark:text-gray-300 mb-1">
            Select Stores (or leave empty for ALL):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded dark:bg-[#334155] dark:border-gray-600">
            {stores.map((store) => (
              <label key={store.store_id} className="flex items-center gap-2 text-sm text-black dark:text-white">
                <input
                  type="checkbox"
                  checked={selectedStores.includes(store.store_id)}
                  onChange={() => toggleStoreSelection(store.store_id)}
                />
                {store.name} ({store.city})
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={applyFormula}
          disabled={applyLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {applyLoading ? "Applying..." : "✅ Apply Formula"}
        </button>

        {applyMessage && (
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{applyMessage}</p>
        )}
      </section>
    )}

    {activeTab === "editStore" && (
      // See below for Edit Store section
      <div className="bg-white dark:bg-[#1e293b] shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">✏️ Edit Store Location</h2>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Select Store:</label>
            <select
              className="w-full p-2 rounded border dark:bg-[#334155] dark:text-white dark:border-gray-600"
              onChange={handleStoreSelect}
            >
              <option value="">-- Choose Store --</option>
              {stores.map(store => (
                <option key={store.store_id} value={store.store_id}>
                  {store.name} ({store.city})
                </option>
              ))}
            </select>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "store_code", "name", "address", "city", "state",
            "country", "lat", "lon", "capacity_units"
          ].map((field) => (
            <input
              key={field}
              name={field}
              placeholder={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              className="border border-gray-300 dark:border-gray-600 dark:bg-[#334155] p-2 rounded text-black dark:text-white"
              value={storeForm[field] || ""}
              onClick={handleStoreUpdate}
            />
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={handleStoreUpload} // You may want to rename this to `handleStoreUpdate`
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            💾 Update Store
          </button>
          {uploadStatus && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{uploadStatus}</p>}
        </div>
      </div>

          )}

          {activeTab === "forecast" && (
            <ForecastLookahead />
          )}
        </main>
      </div>


    </div>
  );
}
