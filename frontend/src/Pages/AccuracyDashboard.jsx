// // src/Pages/AccuracyDashboard.jsx

// import React, { useState, useEffect } from 'react';
// import { FiTrendingUp, FiCpu, FiTarget, FiAlertCircle } from 'react-icons/fi';
// import Select from 'react-select';
// import HierarchicalTable from './HierarchicalTable';

// const API_BASE_URL = 'http://127.0.0.1:5500';

// // --- Helper Components (Unchanged) ---
// const LoadingSpinner = () => ( <div className="flex items-center justify-center h-full min-h-[300px]"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div></div> );
// const StatCard = ({ icon, label, value }) => ( <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4 border border-slate-700"><div className="bg-slate-900/50 p-3 rounded-full text-2xl">{icon}</div><div><div className="text-slate-400 text-sm">{label}</div><div className="text-xl font-bold text-white">{value}</div></div></div> );

// const AccuracyDashboard = () => {
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [overallAccuracy, setOverallAccuracy] = useState({ actuals: 0, forecast: 0, wmape: 0, mae: 0 });
//     const [granularData, setGranularData] = useState([]);

//     // Available options for the filters
//     const [availableWeeks, setAvailableWeeks] = useState([]);
//     const [availableSkus, setAvailableSkus] = useState([]);
//     const [availableStores, setAvailableStores] = useState([]);
    
//     // User's current selections
//     const [selectedWeeks, setSelectedWeeks] = useState([]);
//     const [selectedSkus, setSelectedSkus] = useState([]);
//     const [selectedStores, setSelectedStores] = useState([]);

//     const getToken = () => localStorage.getItem('token');

//     // **useEffect to fetch filter options (Stores & SKUs) ONCE on mount**
//     useEffect(() => {
//         const fetchFilterOptions = async () => {
//             const token = getToken();
//             if (!token) { setError("Authentication token not found."); return; }
//             try {
//                 const [storesRes, skusRes] = await Promise.all([
//                     fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } }),
//                     fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } })
//                 ]);

//                 if (!storesRes.ok) throw new Error(`API Error (Stores): ${storesRes.statusText}`);
//                 if (!skusRes.ok) throw new Error(`API Error (SKUs): ${skusRes.statusText}`);

//                 const storesData = await storesRes.json();
//                 const skusData = await skusRes.json();

//                 // Set the full list of available options. This will not change.
//                 setAvailableStores(storesData.stores || []);
//                 setAvailableSkus(skusData.skus.map(sku => ({ value: sku, label: sku })) || []);

//             } catch (err) {
//                 setError(err.message);
//             }
//         };
//         fetchFilterOptions();
//     }, []); // Empty dependency array means this runs only once.

//     // **useEffect to fetch accuracy data whenever filters change**
//     useEffect(() => {
//         const fetchAccuracyData = async () => {
//             const token = getToken();
//             if (!token) { setError("Authentication token not found."); setLoading(false); return; }
            
//             setLoading(true);
//             setError(null);

//             try {
//                 const params = new URLSearchParams();
//                 if (selectedWeeks.length > 0) params.append('weeks', selectedWeeks.map(w => w.value).join(','));
//                 if (selectedSkus.length > 0) params.append('skus', selectedSkus.map(s => s.value).join(','));
//                 if (selectedStores.length > 0) params.append('stores', selectedStores.map(s => s.value).join(','));

//                 const accuracyRes = await fetch(`${API_BASE_URL}/forecast/accuracy?${params.toString()}`, {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (!accuracyRes.ok) throw new Error(`API Error (Accuracy): ${accuracyRes.statusText}`);
                
//                 const accuracyData = await accuracyRes.json();

//                 setOverallAccuracy(accuracyData.overall);
//                 setGranularData(accuracyData.granular);

//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchAccuracyData();
//     }, [selectedWeeks, selectedSkus, selectedStores]); // This now ONLY fetches accuracy data.

//     // **useEffect to derive available WEEKS from the data**
//     useEffect(() => {
//         if (granularData && granularData.length > 0) {
//             const uniqueWeeks = [...new Set(granularData.map(item => item.week_start))].sort((a, b) => new Date(b) - new Date(a));
//             setAvailableWeeks(uniqueWeeks.map(week => ({ value: week, label: week })));
//         } else if (!loading) {
//             // If filters result in no data, clear the week options
//             setAvailableWeeks([]);
//         }
//     }, [granularData, loading]); // This hook's only job is to update week options.

//     const selectStyles = {
//         control: s => ({ ...s, backgroundColor: '#334155', border: '1px solid #475569' }),
//         option: (s, { isFocused }) => ({ ...s, backgroundColor: isFocused ? '#4f46e5' : '#334155', color: 'white' }),
//         multiValue: s => ({ ...s, backgroundColor: '#4f46e5' }),
//         multiValueLabel: s => ({ ...s, color: 'white' }),
//         menu: s => ({ ...s, backgroundColor: '#334155'}),
//         input: s => ({...s, color: 'white'})
//     };
    
//     return (
//         <div className="space-y-8">
//             {error && (<div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center"><FiAlertCircle className="mr-3" /> Error: {error}</div>)}
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Overall Accuracy</h2>
//                 {loading ? <div className="text-slate-400">Calculating...</div> : (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                         <StatCard label="Actuals" value={overallAccuracy.actuals.toLocaleString()} icon={<FiTrendingUp className="text-indigo-400" />} />
//                         <StatCard label="Forecast" value={overallAccuracy.forecast.toLocaleString()} icon={<FiCpu className="text-teal-400" />} />
//                         <StatCard label="WMAPE" value={`${overallAccuracy.wmape?.toFixed(2)}%`} icon={<FiTarget className="text-orange-400" />} />
//                         <StatCard label="MAE" value={overallAccuracy.mae?.toFixed(2)} icon={<FiTarget className="text-amber-400" />} />
//                     </div>
//                 )}
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Filters</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <Select isMulti options={availableWeeks} value={selectedWeeks} onChange={setSelectedWeeks} styles={selectStyles} placeholder="Filter by Week..." />
//                     <Select isMulti options={availableSkus} value={selectedSkus} onChange={setSelectedSkus} styles={selectStyles} placeholder="Filter by SKU..." />
//                     <Select isMulti options={availableStores} value={selectedStores} onChange={setSelectedStores} styles={selectStyles} placeholder="Filter by Store..." />
//                 </div>
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Granular Values</h2>
//                 {loading ? <LoadingSpinner /> : (<HierarchicalTable data={granularData} />)}
//             </div>
//         </div>
//     );
// };

// export default AccuracyDashboard;
































// // // src/Pages/AccuracyDashboard.jsx

// import React, { useState, useEffect } from 'react';
// import { FiTrendingUp, FiCpu, FiTarget, FiAlertCircle } from 'react-icons/fi';
// import Select from 'react-select';
// import HierarchicalTable from './HierarchicalTable';

// const API_BASE_URL = 'http://127.0.0.1:5500';

// // --- Helper Components (Unchanged) ---
// const LoadingSpinner = () => ( <div className="flex items-center justify-center h-full min-h-[300px]"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div></div> );
// const StatCard = ({ icon, label, value }) => ( <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4 border border-slate-700"><div className="bg-slate-900/50 p-3 rounded-full text-2xl">{icon}</div><div><div className="text-slate-400 text-sm">{label}</div><div className="text-xl font-bold text-white">{value}</div></div></div> );

// const AccuracyDashboard = () => {
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [overallAccuracy, setOverallAccuracy] = useState({ actuals: 0, forecast: 0, wmape: 0, mae: 0 });
//     const [granularData, setGranularData] = useState([]);

//     // Available options for the filters
//     const [availableWeeks, setAvailableWeeks] = useState([]);
//     const [availableSkus, setAvailableSkus] = useState([]);
//     const [availableStores, setAvailableStores] = useState([]);
    
//     // User's current selections
//     const [selectedWeeks, setSelectedWeeks] = useState([]);
//     const [selectedSkus, setSelectedSkus] = useState([]);
//     const [selectedStores, setSelectedStores] = useState([]);

//     const getToken = () => localStorage.getItem('token');

//     // // **useEffect to fetch filter options (Stores & SKUs) ONCE on mount**
//     // useEffect(() => {
//     //     const fetchFilterOptions = async () => {
//     //         const token = getToken();
//     //         if (!token) { setError("Authentication token not found."); return; }
//     //         try {
//     //             const [storesRes, skusRes] = await Promise.all([
//     //                 fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } }),
//     //                 fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } })
//     //             ]);

//     //             if (!storesRes.ok) throw new Error(`API Error (Stores): ${storesRes.statusText}`);
//     //             if (!skusRes.ok) throw new Error(`API Error (SKUs): ${skusRes.statusText}`);

//     //             const storesData = await storesRes.json();
//     //             const skusData = await skusRes.json();

//     //             // Set the full list of available options. This will not change.
//     //             // ✅ CORRECTED LINE: Map stores to the { value, label } format
//     //             setAvailableStores(storesData.stores.map(store => ({ value: store, label: store })) || []);
//     //             setAvailableSkus(skusData.skus.map(sku => ({ value: sku, label: sku })) || []);

//     //         } catch (err) {
//     //             setError(err.message);
//     //         }
//     //     };
//     //     fetchFilterOptions();
//     // }, []); // Empty dependency array means this runs only once.
//     // src/Pages/AccuracyDashboard.jsx

// // **useEffect to fetch filter options (Stores & SKUs) ONCE on mount**
// // useEffect(() => {
// //     const fetchFilterOptions = async () => {
// //         const token = getToken();
// //         if (!token) { setError("Authentication token not found."); return; }
// //         try {
// //             const [storesRes, skusRes] = await Promise.all([
// //                 fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } }),
// //                 fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } })
// //             ]);

// //             if (!storesRes.ok) throw new Error(`API Error (Stores): ${storesRes.statusText}`);
// //             if (!skusRes.ok) throw new Error(`API Error (SKUs): ${skusRes.statusText}`);

// //             const storesData = await storesRes.json();
// //             const skusData = await skusRes.json();
            
// //             // ✅ CORRECTED: Use store.store_id for the value and store.name for the label.
// //             // setAvailableStores(storesData.stores.map(store => ({ value: store.store_id, label: store.name })) || []);
// //             // src/Pages/AccuracyDashboard.jsx

// // // This combines the STR number and the store name for the best user experience.
// // setAvailableStores(storesData.stores.map(store => ({ 
// //     value: store.store_id, // Keep using the unique ID for the filter value
// //     label: `${store.str_number} - ${store.name}` // Combine STR number and name for the display label
// // })) || []);
            
// //             // This part for SKUs was already correct
// //             setAvailableSkus(skusData.skus.map(sku => ({ value: sku, label: sku })) || []);

// //         } catch (err) {
// //             setError(err.message);
// //         }
// //     };
// //     fetchFilterOptions();
// // }, []); // Empty dependency array means this runs only once.
// // src/Pages/AccuracyDashboard.jsx



































// useEffect(() => {
//     const fetchFilterOptions = async () => {
//         const token = getToken();
//         if (!token) { setError("Authentication token not found."); return; }
//         try {
//             // No change to the fetch calls
//             const [storesRes, skusRes] = await Promise.all([
//                 fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } }),
//                 fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } })
//             ]);

//             if (!storesRes.ok) throw new Error(`API Error (Stores): ${storesRes.statusText}`);
//             if (!skusRes.ok) throw new Error(`API Error (SKUs): ${skusRes.statusText}`);

//             const storesData = await storesRes.json();
//             const skusData = await skusRes.json();
            
//             // ✅ CRITICAL CHANGE HERE: The backend now sends a different structure.
//             // We now map the response to the { value, label } format ourselves.
//             // This uses the correct store_id for the value.
//             setAvailableStores(storesData.stores.map(store => ({
//                 value: store.store_id, 
//                 label: `${store.name} (${store.store_code})`
//             })) || []);
            
//             setAvailableSkus(skusData.skus.map(sku => ({ value: sku, label: sku })) || []);

//         } catch (err) {
//             setError(err.message);
//         }
//     };
//     fetchFilterOptions();
// }, []);
//     // **useEffect to fetch accuracy data whenever filters change**
//     useEffect(() => {
//         const fetchAccuracyData = async () => {
//             const token = getToken();
//             if (!token) { setError("Authentication token not found."); setLoading(false); return; }
            
//             setLoading(true);
//             setError(null);

//             try {
//                 const params = new URLSearchParams();
//                 if (selectedWeeks.length > 0) params.append('weeks', selectedWeeks.map(w => w.value).join(','));
//                 if (selectedSkus.length > 0) params.append('skus', selectedSkus.map(s => s.value).join(','));
//                 if (selectedStores.length > 0) params.append('stores', selectedStores.map(s => s.value).join(','));

//                 const accuracyRes = await fetch(`${API_BASE_URL}/forecast/accuracy?${params.toString()}`, {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (!accuracyRes.ok) throw new Error(`API Error (Accuracy): ${accuracyRes.statusText}`);
                
//                 const accuracyData = await accuracyRes.json();

//                 setOverallAccuracy(accuracyData.overall);
//                 setGranularData(accuracyData.granular);

//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchAccuracyData();
//     }, [selectedWeeks, selectedSkus, selectedStores]); // This now ONLY fetches accuracy data.

//     // **useEffect to derive available WEEKS from the data**
//     useEffect(() => {
//         if (granularData && granularData.length > 0) {
//             const uniqueWeeks = [...new Set(granularData.map(item => item.week_start))].sort((a, b) => new Date(b) - new Date(a));
//             setAvailableWeeks(uniqueWeeks.map(week => ({ value: week, label: week })));
//         } else if (!loading) {
//             // If filters result in no data, clear the week options
//             setAvailableWeeks([]);
//         }
//     }, [granularData, loading]); // This hook's only job is to update week options.

//     const selectStyles = {
//         control: s => ({ ...s, backgroundColor: '#334155', border: '1px solid #475569' }),
//         option: (s, { isFocused }) => ({ ...s, backgroundColor: isFocused ? '#4f46e5' : '#334155', color: 'white' }),
//         multiValue: s => ({ ...s, backgroundColor: '#4f46e5' }),
//         multiValueLabel: s => ({ ...s, color: 'white' }),
//         menu: s => ({ ...s, backgroundColor: '#334155'}),
//         input: s => ({...s, color: 'white'})
//     };
    
//     return (
//         <div className="space-y-8">
//             {error && (<div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center"><FiAlertCircle className="mr-3" /> Error: {error}</div>)}
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Overall Accuracy</h2>
//                 {loading ? <div className="text-slate-400">Calculating...</div> : (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                         <StatCard label="Actuals" value={overallAccuracy.actuals.toLocaleString()} icon={<FiTrendingUp className="text-indigo-400" />} />
//                         <StatCard label="Forecast" value={overallAccuracy.forecast.toLocaleString()} icon={<FiCpu className="text-teal-400" />} />
//                         <StatCard label="WMAPE" value={`${overallAccuracy.wmape?.toFixed(2)}%`} icon={<FiTarget className="text-orange-400" />} />
//                         <StatCard label="MAE" value={overallAccuracy.mae?.toFixed(2)} icon={<FiTarget className="text-amber-400" />} />
//                     </div>
//                 )}
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Filters</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <Select isMulti options={availableWeeks} value={selectedWeeks} onChange={setSelectedWeeks} styles={selectStyles} placeholder="Filter by Week..." />
//                     <Select isMulti options={availableSkus} value={selectedSkus} onChange={setSelectedSkus} styles={selectStyles} placeholder="Filter by SKU..." />
//                     <Select isMulti options={availableStores} value={selectedStores} onChange={setSelectedStores} styles={selectStyles} placeholder="Filter by Store..." />
//                 </div>
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Granular Values</h2>
//                 {loading ? <LoadingSpinner /> : (<HierarchicalTable data={granularData} />)}
//             </div>
//         </div>
//     );
// };

// export default AccuracyDashboard;






















































// // src/Pages/AccuracyDashboard.jsx

// import React, { useState, useEffect } from 'react';
// import { FiTrendingUp, FiCpu, FiTarget, FiAlertCircle } from 'react-icons/fi';
// import Select from 'react-select';
// import HierarchicalTable from './HierarchicalTable'; // Make sure this component exists

// const API_BASE_URL = 'http://127.0.0.1:5500';

// // --- Helper Components ---
// const LoadingSpinner = () => (
//     <div className="flex items-center justify-center h-full min-h-[300px]">
//         <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
//     </div>
// );

// const StatCard = ({ icon, label, value }) => (
//     <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
//         <div className="bg-slate-900/50 p-3 rounded-full text-2xl">{icon}</div>
//         <div>
//             <div className="text-slate-400 text-sm">{label}</div>
//             <div className="text-xl font-bold text-white">{value}</div>
//         </div>
//     </div>
// );

// const AccuracyDashboard = () => {
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [overallAccuracy, setOverallAccuracy] = useState({ actuals: 0, forecast: 0, wmape: 0, mae: 0 });
//     const [granularData, setGranularData] = useState([]);

//     // Available options for the filters
//     const [availableWeeks, setAvailableWeeks] = useState([]);
//     const [availableSkus, setAvailableSkus] = useState([]);
//     const [availableStores, setAvailableStores] = useState([]);
    
//     // User's current selections
//     const [selectedWeeks, setSelectedWeeks] = useState([]);
//     const [selectedSkus, setSelectedSkus] = useState([]);
//     const [selectedStores, setSelectedStores] = useState([]);

//     const getToken = () => localStorage.getItem('token');

//     // **useEffect to fetch static filter options (Stores & SKUs) ONCE on mount**
//     useEffect(() => {
//         const fetchFilterOptions = async () => {
//             const token = getToken();
//             if (!token) { setError("Authentication token not found."); return; }
//             try {
//                 const [storesRes, skusRes] = await Promise.all([
//                     fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } }),
//                     fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } })
//                 ]);

//                 if (!storesRes.ok) throw new Error(`API Error (Stores): ${storesRes.statusText}`);
//                 if (!skusRes.ok) throw new Error(`API Error (SKUs): ${skusRes.statusText}`);

//                 const storesData = await storesRes.json();
//                 const skusData = await skusRes.json();
                
//                 // Map the API response to the { value, label } format required by react-select
//                 setAvailableStores(storesData.stores.map(store => ({
//                     // ✅ CRITICAL CHANGE: Use store_code as the value for the backend filter
//                     value: store.store_code, 
//                     label: `${store.name} (${store.store_code})`
//                 })) || []);
                
//                 setAvailableSkus(skusData.skus.map(sku => ({ value: sku, label: sku })) || []);

//             } catch (err) {
//                 setError(err.message);
//             }
//         };
//         fetchFilterOptions();
//     }, []); // Empty dependency array means this runs only once.

//     // **useEffect to fetch accuracy data whenever filters change**
//     useEffect(() => {
//         const fetchAccuracyData = async () => {
//             const token = getToken();
//             if (!token) { setError("Authentication token not found."); setLoading(false); return; }
            
//             setLoading(true);
//             setError(null);

//             try {
//                 const params = new URLSearchParams();
//                 if (selectedWeeks.length > 0) params.append('weeks', selectedWeeks.map(w => w.value).join(','));
//                 if (selectedSkus.length > 0) params.append('skus', selectedSkus.map(s => s.value).join(','));
//                 if (selectedStores.length > 0) params.append('stores', selectedStores.map(s => s.value).join(','));

//                 const accuracyRes = await fetch(`${API_BASE_URL}/forecast/accuracy?${params.toString()}`, {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (!accuracyRes.ok) throw new Error(`API Error (Accuracy): ${accuracyRes.statusText}`);
                
//                 const accuracyData = await accuracyRes.json();

//                 setOverallAccuracy(accuracyData.overall);
//                 setGranularData(accuracyData.granular);

//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchAccuracyData();
//     }, [selectedWeeks, selectedSkus, selectedStores]);

//     // **useEffect to derive available WEEKS from the granular data**
//     useEffect(() => {
//         if (granularData && granularData.length > 0) {
//             const uniqueWeeks = [...new Set(granularData.map(item => item.week_start))].sort((a, b) => new Date(b) - new Date(a));
//             setAvailableWeeks(uniqueWeeks.map(week => ({ value: week, label: week })));
//         } else if (!loading) {
//             // If filters result in no data, clear the week options
//             setAvailableWeeks([]);
//         }
//     }, [granularData, loading]);

//     // Styles for the react-select component
//     const selectStyles = {
//         control: s => ({ ...s, backgroundColor: '#334155', border: '1px solid #475569' }),
//         option: (s, { isFocused }) => ({ ...s, backgroundColor: isFocused ? '#4f46e5' : '#334155', color: 'white' }),
//         multiValue: s => ({ ...s, backgroundColor: '#4f46e5' }),
//         multiValueLabel: s => ({ ...s, color: 'white' }),
//         menu: s => ({ ...s, backgroundColor: '#334155'}),
//         input: s => ({...s, color: 'white'})
//     };
    
//     return (
//         <div className="space-y-8">
//             {error && (
//                 <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center">
//                     <FiAlertCircle className="mr-3" /> Error: {error}
//                 </div>
//             )}
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Overall Accuracy</h2>
//                 {loading ? <div className="text-slate-400">Calculating...</div> : (
//                     <div className="grid grid-cols-1 sm-grid-cols-2 lg:grid-cols-4 gap-4">
//                         <StatCard label="Actuals" value={overallAccuracy.actuals?.toLocaleString() ?? '0'} icon={<FiTrendingUp className="text-indigo-400" />} />
//                         <StatCard label="Forecast" value={overallAccuracy.forecast?.toLocaleString() ?? '0'} icon={<FiCpu className="text-teal-400" />} />
//                         <StatCard label="WMAPE" value={`${overallAccuracy.wmape?.toFixed(2) ?? '0.00'}%`} icon={<FiTarget className="text-orange-400" />} />
//                         <StatCard label="MAE" value={overallAccuracy.mae?.toFixed(2) ?? '0.00'} icon={<FiTarget className="text-amber-400" />} />
//                     </div>
//                 )}
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Filters</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <Select isMulti options={availableWeeks} value={selectedWeeks} onChange={setSelectedWeeks} styles={selectStyles} placeholder="Filter by Week..." />
//                     <Select isMulti options={availableSkus} value={selectedSkus} onChange={setSelectedSkus} styles={selectStyles} placeholder="Filter by SKU..." />
//                     <Select isMulti options={availableStores} value={selectedStores} onChange={setSelectedStores} styles={selectStyles} placeholder="Filter by Store..." />
//                 </div>
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Granular Values</h2>
//                 {loading ? <LoadingSpinner /> : (<HierarchicalTable data={granularData} />)}
//             </div>
//         </div>
//     );
// };

// export default AccuracyDashboard;




















































































































// // src/Pages/AccuracyDashboard.jsx

// import React, { useState, useEffect } from 'react';
// import { FiTrendingUp, FiCpu, FiTarget, FiAlertCircle } from 'react-icons/fi';
// import Select from 'react-select';
// import HierarchicalTable from './HierarchicalTable'; // Make sure this component exists

// const API_BASE_URL = 'http://127.0.0.1:5500';

// // --- Helper Components ---
// const LoadingSpinner = () => (
//     <div className="flex items-center justify-center h-full min-h-[300px]">
//         <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
//     </div>
// );

// const StatCard = ({ icon, label, value }) => (
//     <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
//         <div className="bg-slate-900/50 p-3 rounded-full text-2xl">{icon}</div>
//         <div>
//             <div className="text-slate-400 text-sm">{label}</div>
//             <div className="text-xl font-bold text-white">{value}</div>
//         </div>
//     </div>
// );

// const AccuracyDashboard = () => {
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [overallAccuracy, setOverallAccuracy] = useState({ actuals: 0, forecast: 0, wmape: 0, mae: 0 });
//     const [granularData, setGranularData] = useState([]);

//     // Available options for the filters
//     const [availableWeeks, setAvailableWeeks] = useState([]);
//     const [availableSkus, setAvailableSkus] = useState([]);
//     const [availableStores, setAvailableStores] = useState([]);
    
//     // User's current selections
//     const [selectedWeeks, setSelectedWeeks] = useState([]);
//     const [selectedSkus, setSelectedSkus] = useState([]);
//     const [selectedStores, setSelectedStores] = useState([]);

//     const getToken = () => localStorage.getItem('token');

//     // **useEffect to fetch static filter options (Stores & SKUs) ONCE on mount**
//     useEffect(() => {
//         const fetchFilterOptions = async () => {
//             const token = getToken();
//             if (!token) { setError("Authentication token not found."); return; }
//             try {
//                 const [storesRes, skusRes] = await Promise.all([
//                     fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } }),
//                     fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } })
//                 ]);

//                 if (!storesRes.ok) throw new Error(`API Error (Stores): ${storesRes.statusText}`);
//                 if (!skusRes.ok) throw new Error(`API Error (SKUs): ${skusRes.statusText}`);

//                 const storesData = await storesRes.json();
//                 const skusData = await skusRes.json();
                
//                 // Map the API response to the { value, label } format required by react-select
//                 setAvailableStores(storesData.stores.map(store => ({
//                     // Use store_code for both the value (for the API) and the label (for display)
//                     value: store.store_code, 
//                     label: store.store_code
//                 })) || []);
                
//                 setAvailableSkus(skusData.skus.map(sku => ({ value: sku, label: sku })) || []);

//             } catch (err) {
//                 setError(err.message);
//             }
//         };
//         fetchFilterOptions();
//     }, []); // Empty dependency array means this runs only once.

//     // **useEffect to fetch accuracy data whenever filters change**
//     useEffect(() => {
//         const fetchAccuracyData = async () => {
//             const token = getToken();
//             if (!token) { setError("Authentication token not found."); setLoading(false); return; }
            
//             setLoading(true);
//             setError(null);

//             try {
//                 const params = new URLSearchParams();
//                 if (selectedWeeks.length > 0) params.append('weeks', selectedWeeks.map(w => w.value).join(','));
//                 if (selectedSkus.length > 0) params.append('skus', selectedSkus.map(s => s.value).join(','));
//                 if (selectedStores.length > 0) params.append('stores', selectedStores.map(s => s.value).join(','));

//                 const accuracyRes = await fetch(`${API_BASE_URL}/forecast/accuracy?${params.toString()}`, {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (!accuracyRes.ok) throw new Error(`API Error (Accuracy): ${accuracyRes.statusText}`);
                
//                 const accuracyData = await accuracyRes.json();

//                 setOverallAccuracy(accuracyData.overall);
//                 setGranularData(accuracyData.granular);

//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchAccuracyData();
//     }, [selectedWeeks, selectedSkus, selectedStores]);

//     // **useEffect to derive available WEEKS from the granular data**
//     useEffect(() => {
//         if (granularData && granularData.length > 0) {
//             const uniqueWeeks = [...new Set(granularData.map(item => item.week_start))].sort((a, b) => new Date(b) - new Date(a));
//             setAvailableWeeks(uniqueWeeks.map(week => ({ value: week, label: week })));
//         } else if (!loading) {
//             // If filters result in no data, clear the week options
//             setAvailableWeeks([]);
//         }
//     }, [granularData, loading]);

//     // Styles for the react-select component
//     const selectStyles = {
//         control: s => ({ ...s, backgroundColor: '#334155', border: '1px solid #475569' }),
//         option: (s, { isFocused }) => ({ ...s, backgroundColor: isFocused ? '#4f46e5' : '#334155', color: 'white' }),
//         multiValue: s => ({ ...s, backgroundColor: '#4f46e5' }),
//         multiValueLabel: s => ({ ...s, color: 'white' }),
//         menu: s => ({ ...s, backgroundColor: '#334155'}),
//         input: s => ({...s, color: 'white'})
//     };
    
//     return (
//         <div className="space-y-8">
//             {error && (
//                 <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center">
//                     <FiAlertCircle className="mr-3" /> Error: {error}
//                 </div>
//             )}
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Overall Accuracy</h2>
//                 {loading ? <div className="text-slate-400">Calculating...</div> : (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                         <StatCard label="Actuals" value={overallAccuracy.actuals?.toLocaleString() ?? '0'} icon={<FiTrendingUp className="text-indigo-400" />} />
//                         <StatCard label="Forecast" value={overallAccuracy.forecast?.toLocaleString() ?? '0'} icon={<FiCpu className="text-teal-400" />} />
//                         <StatCard label="WMAPE" value={`${overallAccuracy.wmape?.toFixed(2) ?? '0.00'}%`} icon={<FiTarget className="text-orange-400" />} />
//                         <StatCard label="MAE" value={overallAccuracy.mae?.toFixed(2) ?? '0.00'} icon={<FiTarget className="text-amber-400" />} />
//                     </div>
//                 )}
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Filters</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <Select isMulti options={availableWeeks} value={selectedWeeks} onChange={setSelectedWeeks} styles={selectStyles} placeholder="Filter by Week..." />
//                     <Select isMulti options={availableSkus} value={selectedSkus} onChange={setSelectedSkus} styles={selectStyles} placeholder="Filter by SKU..." />
//                     <Select isMulti options={availableStores} value={selectedStores} onChange={setSelectedStores} styles={selectStyles} placeholder="Filter by Store..." />
//                 </div>
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Granular Values</h2>
//                 {loading ? <LoadingSpinner /> : (<HierarchicalTable data={granularData} />)}
//             </div>
//         </div>
//     );
// };

// export default AccuracyDashboard;





// import React, { useState, useEffect } from 'react';
// import { FiTrendingUp, FiCpu, FiTarget, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
// import Select from 'react-select';
// import HierarchicalTable from './HierarchicalTable';

// const API_BASE_URL = 'http://127.0.0.1:5500';

// // --- Helper Components ---
// const LoadingSpinner = () => (
//     <div className="flex items-center justify-center h-full min-h-[300px]">
//         <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
//     </div>
// );

// const StatCard = ({ icon, label, value }) => (
//     <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
//         <div className="bg-slate-900/50 p-3 rounded-full text-2xl">{icon}</div>
//         <div>
//             <div className="text-slate-400 text-sm">{label}</div>
//             <div className="text-xl font-bold text-white">{value}</div>
//         </div>
//     </div>
// );

// const AccuracyDashboard = () => {
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [overallAccuracy, setOverallAccuracy] = useState({ actuals: 0, forecast: 0, wmape: 0, mae: 0 });
//     const [granularData, setGranularData] = useState([]);

//     const [availableWeeks, setAvailableWeeks] = useState([]);
//     const [availableSkus, setAvailableSkus] = useState([]);
//     const [availableStores, setAvailableStores] = useState([]);
    
//     const [selectedWeeks, setSelectedWeeks] = useState([]);
//     const [selectedSkus, setSelectedSkus] = useState([]);
//     const [selectedStores, setSelectedStores] = useState([]);

//     const getToken = () => localStorage.getItem('token');

//     // Fetches static filter options (SKUs and Stores) only once on component mount.
//     // This provides a stable list for the filters and prevents the "filter filtering itself" issue.
//     useEffect(() => {
//         console.log("Attempting to fetch filter options...");
//         const fetchFilterOptions = async () => {
//             const token = getToken();
//             if (!token) {
//                 setError("Authentication token not found.");
//                 return;
//             }
//             try {
//                 // Fetch SKUs
//                 const skusRes = await fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } });
//                 if (!skusRes.ok) throw new Error(`API Error (SKUs): ${skusRes.statusText}`);
//                 const skusData = await skusRes.json();
//                 setAvailableSkus(skusData.skus.map(sku => ({ value: sku, label: sku })) || []);

//                 // Fetch Stores
//                 const storesRes = await fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } });
//                 if (!storesRes.ok) throw new Error(`API Error (Stores): ${storesRes.statusText}`);
//                 const storesData = await storesRes.json();
//                 setAvailableStores(storesData.stores || []);

//             } catch (err) {
//                 setError(err.message);
//             }
//         };
//         fetchFilterOptions();
//     }, []); // Empty dependency array [] is stable and runs only once.

//     // Fetches the main accuracy data whenever a filter selection changes.
//     // The dependency array is stable, preventing the console error.
//     useEffect(() => {
//         const fetchAccuracyData = async () => {
//             const token = getToken();
//             if (!token) { setError("Authentication token not found."); setLoading(false); return; }
            
//             setLoading(true);
//             setError(null);

//             try {
//                 const params = new URLSearchParams();
//                 if (selectedWeeks.length > 0) params.append('weeks', selectedWeeks.map(w => w.value).join(','));
//                 if (selectedSkus.length > 0) params.append('skus', selectedSkus.map(s => s.value).join(','));
//                 if (selectedStores.length > 0) params.append('stores', selectedStores.map(s => s.value).join(','));

//                 const accuracyRes = await fetch(`${API_BASE_URL}/forecast/accuracy?${params.toString()}`, {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (!accuracyRes.ok) throw new Error(`API Error (Accuracy): ${accuracyRes.statusText}`);
//                 const accuracyData = await accuracyRes.json();

//                 setOverallAccuracy(accuracyData.overall);
//                 setGranularData(accuracyData.granular);
//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchAccuracyData();
//     }, [selectedWeeks, selectedSkus, selectedStores]); // Stable dependency array.

//     // Derives the list of available weeks from the data.
//     // This logic runs only when the week filter is empty to avoid overwriting the options.
//     useEffect(() => {
//         if (granularData && granularData.length > 0) {
//             if (selectedWeeks.length === 0) {
//                 const uniqueWeeks = [...new Set(granularData.map(item => item.week_start))].sort((a, b) => new Date(b) - new Date(a));
//                 setAvailableWeeks(uniqueWeeks.map(week => ({ value: week, label: week })));
//             }
//         } else if (!loading && selectedWeeks.length === 0) {
//             setAvailableWeeks([]);
//         }
//     }, [granularData, loading, selectedWeeks]); // Stable dependency array.

//     // Handler to reset all filters
//     const handleResetFilters = () => {
//         setSelectedWeeks([]);
//         setSelectedSkus([]);
//         setSelectedStores([]);
//     };

//     const selectStyles = {
//         control: s => ({ ...s, backgroundColor: '#334155', border: '1px solid #475569' }),
//         option: (s, { isFocused }) => ({ ...s, backgroundColor: isFocused ? '#4f46e5' : '#334155', color: 'white' }),
//         multiValue: s => ({ ...s, backgroundColor: '#4f46e5' }),
//         multiValueLabel: s => ({ ...s, color: 'white' }),
//         menu: s => ({ ...s, backgroundColor: '#334155'}),
//         input: s => ({...s, color: 'white'})
//     };
    
//     return (
//         <div className="space-y-8">
//             {error && (
//                 <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center">
//                     <FiAlertCircle className="mr-3" /> Error: {error}
//                 </div>
//             )}
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <h2 className="text-xl font-semibold text-white mb-4">Overall Accuracy</h2>
//                 {loading ? <div className="text-slate-400">Calculating...</div> : (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                         <StatCard label="Actuals" value={overallAccuracy.actuals?.toLocaleString() ?? '0'} icon={<FiTrendingUp className="text-indigo-400" />} />
//                         <StatCard label="Forecast" value={overallAccuracy.forecast?.toLocaleString() ?? '0'} icon={<FiCpu className="text-teal-400" />} />
//                         <StatCard label="WMAPE" value={`${overallAccuracy.wmape?.toFixed(2) ?? '0.00'}%`} icon={<FiTarget className="text-orange-400" />} />
//                         <StatCard label="MAE" value={overallAccuracy.mae?.toFixed(2) ?? '0.00'} icon={<FiTarget className="text-amber-400" />} />
//                     </div>
//                 )}
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-xl font-semibold text-white">Filters</h2>
//                     <button
//                         onClick={handleResetFilters}
//                         className="flex items-center gap-2 text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors"
//                     >
//                         <FiRefreshCw size={14} />
//                         Reset
//                     </button>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <Select isMulti options={availableWeeks} value={selectedWeeks} onChange={setSelectedWeeks} styles={selectStyles} placeholder="Filter by Week..." />
//                     <Select isMulti options={availableSkus} value={selectedSkus} onChange={setSelectedSkus} styles={selectStyles} placeholder="Filter by SKU..." />
//                     <Select isMulti options={availableStores} value={selectedStores} onChange={setSelectedStores} styles={selectStyles} placeholder="Filter by Store..." />
//                 </div>
//             </div>
            
//             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
//                 {loading ? <LoadingSpinner /> : (<HierarchicalTable data={granularData} />)}
//             </div>
//         </div>
//     );
// };

// export default AccuracyDashboard;

// src/Pages/AccuracyDashboard.jsx

import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiCpu, FiTarget, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import Select from 'react-select';
import HierarchicalTable from './HierarchicalTable'; // Make sure this component exists

const API_BASE_URL = 'http://127.0.0.1:5001';

// --- Helper Components ---
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
    </div>
);

const StatCard = ({ icon, label, value }) => (
    <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
        <div className="bg-slate-900/50 p-3 rounded-full text-2xl">{icon}</div>
        <div>
            <div className="text-slate-400 text-sm">{label}</div>
            <div className="text-xl font-bold text-white">{value}</div>
        </div>
    </div>
);

const AccuracyDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [overallAccuracy, setOverallAccuracy] = useState({ actuals: 0, forecast: 0, wmape: 0, mae: 0 });
    const [granularData, setGranularData] = useState([]);

    // Available options for the filters
    const [availableWeeks, setAvailableWeeks] = useState([]);
    const [availableSkus, setAvailableSkus] = useState([]);
    const [availableStores, setAvailableStores] = useState([]);

    // User's current selections
    const [selectedWeeks, setSelectedWeeks] = useState([]);
    const [selectedSkus, setSelectedSkus] = useState([]);
    const [selectedStores, setSelectedStores] = useState([]);

    const getToken = () => localStorage.getItem('token');

    // **useEffect to fetch static filter options (Stores & SKUs) ONCE on mount**
    useEffect(() => {
        const fetchFilterOptions = async () => {
            const token = getToken();
            if (!token) { setError("Authentication token not found."); return; }
            try {
                const [storesRes, skusRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!storesRes.ok) throw new Error(`API Error (Stores): ${storesRes.statusText}`);
                if (!skusRes.ok) throw new Error(`API Error (SKUs): ${skusRes.statusText}`);

                const storesData = await storesRes.json();
                const skusData = await skusRes.json();

                // Map the API response to the { value, label } format required by react-select
                if (storesData && storesData.stores) {
                    setAvailableStores(storesData.stores.map(store => ({
                        value: store.store_id,
                        label: store.name
                    })) || []);
                }

                if (skusData && skusData.skus) {
                    setAvailableSkus(skusData.skus.map(sku => ({ value: sku, label: sku })) || []);
                }

            } catch (err) {
                setError(err.message);
            }
        };
        fetchFilterOptions();
    }, []); // Empty dependency array means this runs only once.

    // **useEffect to fetch accuracy data whenever filters change**
    useEffect(() => {
        const fetchAccuracyData = async () => {
            const token = getToken();
            if (!token) { setError("Authentication token not found."); setLoading(false); return; }

            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                if (selectedWeeks.length > 0) params.append('weeks', selectedWeeks.map(w => w.value).join(','));
                if (selectedSkus.length > 0) params.append('skus', selectedSkus.map(s => s.value).join(','));
                if (selectedStores.length > 0) params.append('stores', selectedStores.map(s => s.value).join(','));

                const accuracyRes = await fetch(`${API_BASE_URL}/forecast/accuracy?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!accuracyRes.ok) throw new Error(`API Error (Accuracy): ${accuracyRes.statusText}`);

                const accuracyData = await accuracyRes.json();

                setOverallAccuracy(accuracyData.overall);
                setGranularData(accuracyData.granular);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAccuracyData();
    }, [selectedWeeks, selectedSkus, selectedStores]);

    // **useEffect to derive available WEEKS from the granular data**
    useEffect(() => {
        if (granularData && granularData.length > 0) {
            const uniqueWeeks = [...new Set(granularData.map(item => item.week_start))].sort((a, b) => new Date(b) - new Date(a));
            setAvailableWeeks(uniqueWeeks.map(week => ({ value: week, label: week })));
        } else if (!loading) {
            // If filters result in no data, clear the week options
            setAvailableWeeks([]);
        }
    }, [granularData, loading]);

    // Handler to reset all filters
    const handleResetFilters = () => {
        setSelectedWeeks([]);
        setSelectedSkus([]);
        setSelectedStores([]);
    };

    // Styles for the react-select component
    const selectStyles = {
        control: s => ({ ...s, backgroundColor: '#334155', border: '1px solid #475569' }),
        option: (s, { isFocused }) => ({ ...s, backgroundColor: isFocused ? '#4f46e5' : '#334155', color: 'white' }),
        multiValue: s => ({ ...s, backgroundColor: '#4f46e5' }),
        multiValueLabel: s => ({ ...s, color: 'white' }),
        menu: s => ({ ...s, backgroundColor: '#334155' }),
        input: s => ({ ...s, color: 'white' })
    };

    return (
        
        <div className="space-y-8">
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center">
                    <FiAlertCircle className="mr-3" /> Error: {error}
                </div>
            )}

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">Overall Accuracy</h2>
                {loading ? <div className="text-slate-400">Calculating...</div> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Actuals" value={overallAccuracy.actuals?.toLocaleString() ?? '0'} icon={<FiTrendingUp className="text-indigo-400" />} />
                        <StatCard label="Forecast" value={overallAccuracy.forecast?.toLocaleString() ?? '0'} icon={<FiCpu className="text-teal-400" />} />
                        <StatCard label="WMAPE" value={`${overallAccuracy.wmape?.toFixed(2) ?? '0.00'}%`} icon={<FiTarget className="text-orange-400" />} />
                        <StatCard label="MAE" value={overallAccuracy.mae?.toFixed(2) ?? '0.00'} icon={<FiTarget className="text-amber-400" />} />
                    </div>
                )}
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Filters</h2>
                    <button
                        onClick={handleResetFilters}
                        className="flex items-center gap-2 text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors"
                    >
                        <FiRefreshCw size={14} />
                        Reset
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select isMulti options={availableWeeks} value={selectedWeeks} onChange={setSelectedWeeks} styles={selectStyles} placeholder="Filter by Week..." />
                    <Select isMulti options={availableSkus} value={selectedSkus} onChange={setSelectedSkus} styles={selectStyles} placeholder="Filter by SKU..." />
                    <Select isMulti options={availableStores} value={selectedStores} onChange={setSelectedStores} styles={selectStyles} placeholder="Filter by Store..." />
                </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                {loading ? <LoadingSpinner /> : (<HierarchicalTable data={granularData} />)}
            </div>
        </div>
    );
};

export default AccuracyDashboard;