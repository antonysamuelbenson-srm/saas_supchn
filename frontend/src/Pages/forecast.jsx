// // import React, { useState, useEffect, useCallback } from 'react';
// // import { FiBarChart2, FiDownload, FiCheckCircle, FiTrendingUp, FiCpu, FiClock, FiAlertCircle } from 'react-icons/fi';
// // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';

// // // --- API Configuration ---
// // // ✅ IMPORTANT: This URL must match the one used in your login page
// // const API_BASE_URL = 'http://127.0.0.1:5500'; 

// // const ForecastPage = () => {
// //     // --- State Management ---
// //     const [activeTab, setActiveTab] = useState('forecast');
// //     const [chartData, setChartData] = useState([]);
// //     const [accuracyData, setAccuracyData] = useState([]);
// //     const [logData, setLogData] = useState([]);
// //     const [keyMetrics, setKeyMetrics] = useState({
// //         forecastedUnits: 'N/A',
// //         forecastedRevenue: 'N/A',
// //         forecastAccuracy: 'N/A',
// //     });
// //     const [loading, setLoading] = useState({
// //         chart: true,
// //         accuracy: false,
// //         logs: false,
// //         run: false,
// //     });
// //     const [error, setError] = useState(null);

// //     // --- API Fetching Functions ---
// //     const getToken = () => localStorage.getItem('token'); // ✅ Using the correct key: 'token'

// //     const fetchChartData = useCallback(async () => {
// //         const token = getToken();
// //         if (!token) {
// //             setError("No authentication token found. Please log in.");
// //             setLoading(prev => ({ ...prev, chart: false }));
// //             return;
// //         }
// //         setLoading(prev => ({ ...prev, chart: true }));
// //         setError(null);
// //         try {
// //             const res = await fetch(`${API_BASE_URL}/forecast/chart-data`, {
// //                 headers: { 'Authorization': `Bearer ${token}` },
// //             });
// //             if (!res.ok) throw new Error(`Failed to fetch chart data (Status: ${res.status})`);
// //             const data = await res.json();
            
// //             const firstStoreId = Object.keys(data)[0];
// //             if (firstStoreId) {
// //                 const formattedData = data[firstStoreId].map(item => ({
// //                     date: item.week_start,
// //                     historical: item.actual,
// //                     forecast: item.forecast,
// //                 }));
// //                 setChartData(formattedData);
// //             } else {
// //                 setChartData([]);
// //             }
// //         } catch (err) {
// //             setError(err.message);
// //             setChartData([]);
// //         } finally {
// //             setLoading(prev => ({ ...prev, chart: false }));
// //         }
// //     }, []);

// //     const fetchAccuracyData = useCallback(async (level = 'store') => {
// //         const token = getToken();
// //         if (!token) return;
// //         setLoading(prev => ({ ...prev, accuracy: true }));
// //         try {
// //             const res = await fetch(`${API_BASE_URL}/forecast/accuracy/${level}`, {
// //                 headers: { 'Authorization': `Bearer ${token}` },
// //             });
// //             if (!res.ok) throw new Error(`Failed to fetch ${level}-level accuracy`);
// //             const data = await res.json();
// //             setAccuracyData(data);
// //         } catch (err) {
// //             setError(err.message);
// //         } finally {
// //             setLoading(prev => ({ ...prev, accuracy: false }));
// //         }
// //     }, []);

// //     const fetchLogs = useCallback(async () => {
// //         const token = getToken();
// //         if (!token) return;
// //         setLoading(prev => ({ ...prev, logs: true }));
// //         try {
// //             const res = await fetch(`${API_BASE_URL}/forecast/logs`, {
// //                 headers: { 'Authorization': `Bearer ${token}` },
// //             });
// //             if (!res.ok) throw new Error('Failed to fetch logs');
// //             const data = await res.json();
// //             setLogData(data.logs || []);
// //         } catch (err) {
// //             setError(err.message);
// //         } finally {
// //             setLoading(prev => ({ ...prev, logs: false }));
// //         }
// //     }, []);

// //     const handleRunForecast = async () => {
// //         const token = getToken();
// //         if (!token) {
// //             alert("You must be logged in to run a forecast.");
// //             return;
// //         }
// //         setLoading(prev => ({ ...prev, run: true }));
// //         setError(null);
// //         try {
// //             const res = await fetch(`${API_BASE_URL}/forecast/run`, {
// //                 method: 'POST',
// //                 headers: { 'Authorization': `Bearer ${token}` },
// //             });
// //             if (!res.ok) throw new Error('Forecast run failed');
// //             alert('Forecast run initiated successfully! Data will be updated shortly.');
// //             setTimeout(fetchChartData, 5000); 
// //         } catch (err) {
// //             setError(err.message);
// //             alert(`Error: ${err.message}`);
// //         } finally {
// //             setLoading(prev => ({ ...prev, run: false }));
// //         }
// //     };
    
// //     useEffect(() => {
// //         fetchChartData();
// //     }, [fetchChartData]);

// //     // ... (The rest of your component's JSX remains the same)
// //     // Card component, TabButton, ForecastChartPanel, AccuracyPanel, LogsPanel etc.

// //     return (
// //         <div className="p-8 bg-slate-900 text-slate-300 min-h-screen font-sans">
// //              {/* 1. Header */}
// //             <div className="flex justify-between items-center mb-8">
// //                 <h1 className="text-3xl font-bold text-white">Sales & Demand Forecast</h1>
// //                 <button 
// //                     onClick={handleRunForecast}
// //                     disabled={loading.run}
// //                     className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-slate-500 disabled:cursor-not-allowed"
// //                 >
// //                     <FiCpu className={`mr-2 ${loading.run ? 'animate-spin' : ''}`} />
// //                     {loading.run ? 'Running...' : 'Run Forecast Manually'}
// //                 </button>
// //             </div>
            
// //             {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center"><FiAlertCircle className="mr-3" /> Error: {error}</div>}

// //             {/* 2. Key Metrics */}
// //             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
// //                 <Card title="Forecasted Units" value={keyMetrics.forecastedUnits} icon={<FiBarChart2 size={24} className="text-blue-400" />} />
// //                 <Card title="Forecasted Revenue" value={keyMetrics.forecastedRevenue} icon={<FiTrendingUp size={24} className="text-green-400" />} change="+7.2% vs. previous period" />
// //                 <Card title="Forecast Accuracy" value={keyMetrics.forecastAccuracy} icon={<FiCheckCircle size={24} className="text-teal-400" />} />
// //             </div>

// //             {/* 3. Tab Navigation */}
// //             <div className="flex border-b border-slate-700 mb-8">
// //                 <TabButton title="Forecast Visualization" tabName="forecast" activeTab={activeTab} setActiveTab={setActiveTab} />
// //                 <TabButton title="Performance & Accuracy" tabName="accuracy" activeTab={activeTab} setActiveTab={setActiveTab} onClick={() => fetchAccuracyData('store')} />
// //                 <TabButton title="Run History" tabName="logs" activeTab={activeTab} setActiveTab={setActiveTab} onClick={fetchLogs} />
// //             </div>

// //             {/* 4. Tab Content */}
// //             <div>
// //                 {activeTab === 'forecast' && <ForecastChartPanel loading={loading.chart} data={chartData} />}
// //                 {activeTab === 'accuracy' && <AccuracyPanel loading={loading.accuracy} data={accuracyData} fetchData={fetchAccuracyData} />}
// //                 {activeTab === 'logs' && <LogsPanel loading={loading.logs} data={logData} />}
// //             </div>
// //         </div>
// //     );
// // };

// // // --- Child Components ---
// // const Card = ({ title, value, icon, change }) => (
// //     <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
// //         <div className="flex items-center">
// //             <div className="p-3 bg-slate-700 rounded-md mr-4">{icon}</div>
// //             <div>
// //                 <p className="text-sm text-slate-400">{title}</p>
// //                 <p className="text-2xl font-bold text-white">{value}</p>
// //             </div>
// //         </div>
// //         {change && <p className="text-sm text-green-400 mt-2">{change}</p>}
// //     </div>
// // );

// // const TabButton = ({ title, tabName, activeTab, setActiveTab, onClick }) => (
// //     <button
// //         onClick={() => {
// //             setActiveTab(tabName);
// //             if (onClick) onClick();
// //         }}
// //         className={`py-3 px-6 font-semibold transition -mb-px ${
// //             activeTab === tabName 
// //             ? 'text-blue-400 border-b-2 border-blue-400' 
// //             : 'text-slate-400 hover:text-white'
// //         }`}
// //     >
// //         {title}
// //     </button>
// // );

// // const ForecastChartPanel = ({ loading, data }) => (
// //     <div className="bg-slate-800 p-6 rounded-lg shadow-lg h-[500px]">
// //         <h2 className="text-xl font-semibold mb-4 text-white">Forecast vs. Historical Sales (Weekly)</h2>
// //         {loading ? (
// //             <div className="flex items-center justify-center h-full">Loading chart data...</div>
// //         ) : data.length === 0 ? (
// //              <div className="flex items-center justify-center h-full">No data available to display.</div>
// //         ) : (
// //             <ResponsiveContainer width="100%" height="90%">
// //                 <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
// //                     <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
// //                     <XAxis dataKey="date" stroke="#94a3b8" />
// //                     <YAxis stroke="#94a3b8" />
// //                     <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
// //                     <Legend />
// //                     <Line type="monotone" dataKey="historical" stroke="#60a5fa" strokeWidth={2} name="Historical Sales" dot={false} />
// //                     <Line type="monotone" dataKey="forecast" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" name="Forecasted Sales" dot={false} />
// //                 </LineChart>
// //             </ResponsiveContainer>
// //         )}
// //     </div>
// // );

// // const AccuracyPanel = ({ loading, data, fetchData }) => (
// //     <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
// //         <div className="flex justify-between items-center mb-4">
// //             <h2 className="text-xl font-semibold text-white">Forecast Accuracy (MAPE %)</h2>
// //             <div>
// //                 <button onClick={() => fetchData('store')} className="bg-slate-700 hover:bg-slate-600 text-sm py-1 px-3 rounded-l-md">Store-Level</button>
// //                 <button onClick={() => fetchData('sku')} className="bg-slate-700 hover:bg-slate-600 text-sm py-1 px-3 rounded-r-md">SKU-Level</button>
// //             </div>
// //         </div>
// //         {loading ? <p>Loading accuracy data...</p> : (
// //             <div className="overflow-x-auto">
// //                 <table className="w-full text-left">
// //                     <thead className="border-b border-slate-600">
// //                         <tr>
// //                             <th className="p-3">Identifier (Store/SKU)</th>
// //                             <th className="p-3">Week Start</th>
// //                             <th className="p-3">MAPE (%)</th>
// //                         </tr>
// //                     </thead>
// //                     <tbody>
// //                         {data.flatMap(item => 
// //                             item.weekly_accuracy.map((acc, index) => (
// //                                 <tr key={`${item.store_id || item.product_id}-${acc.week_start}`} className="border-b border-slate-700">
// //                                     {index === 0 && <td rowSpan={item.weekly_accuracy.length} className="p-3 font-bold text-white">{item.store_id || item.product_id}</td>}
// //                                     <td className="p-3">{acc.week_start}</td>
// //                                     <td className="p-3 font-medium text-teal-400">{acc.mape !== null ? `${acc.mape}%` : 'N/A'}</td>
// //                                 </tr>
// //                             ))
// //                         )}
// //                     </tbody>
// //                 </table>
// //             </div>
// //         )}
// //     </div>
// // );

// // const LogsPanel = ({ loading, data }) => (
// //     <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
// //         <h2 className="text-xl font-semibold text-white mb-4">Forecast Run History</h2>
// //         {loading ? <p>Loading logs...</p> : (
// //             <div className="overflow-x-auto">
// //                 <table className="w-full text-left">
// //                     <thead className="border-b border-slate-600">
// //                         <tr>
// //                             <th className="p-3">Run Time (UTC)</th>
// //                             <th className="p-3">Store ID</th>
// //                             <th className="p-3">Product ID</th>
// //                             <th className="p-3">Forecast Horizon</th>
// //                         </tr>
// //                     </thead>
// //                     <tbody>
// //                         {data.map((log, index) => (
// //                             <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/50">
// //                                 <td className="p-3"><FiClock className="inline mr-2" />{log.run_time}</td>
// //                                 <td className="p-3">{log.store_id || 'All'}</td>
// //                                 <td className="p-3">{log.product_id || 'All'}</td>
// //                                 <td className="p-3">{log.n_weeks} weeks</td>
// //                             </tr>
// //                         ))}
// //                     </tbody>
// //                 </table>
// //             </div>
// //         )}
// //     </div>
// // );

// // export default ForecastPage;



// import React, { useState, useEffect, useCallback } from 'react';
// import { FiBarChart2, FiDownload, FiCheckCircle, FiTrendingUp, FiCpu, FiClock, FiAlertCircle } from 'react-icons/fi';
// // ✅ Corrected line
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
// import { motion, AnimatePresence } from 'framer-motion';

// // --- API Configuration ---
// const API_BASE_URL = 'http://127.0.0.1:5500';

// // ✨ NEW: Animation variants for panels
// const panelVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
//     exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
// };

// const ForecastPage = () => {
//     // --- State Management ---
//     const [activeTab, setActiveTab] = useState('forecast');
//     const [chartData, setChartData] = useState([]);
//     const [accuracyData, setAccuracyData] = useState([]);
//     const [logData, setLogData] = useState([]);
//     const [loading, setLoading] = useState({
//         chart: true,
//         accuracy: false,
//         logs: false,
//         run: false,
//     });
//     const [error, setError] = useState(null);

//     // --- API Fetching Functions ---
//     const getToken = () => localStorage.getItem('token');

//     const fetchChartData = useCallback(async () => {
//         const token = getToken();
//         if (!token) {
//             setError("No authentication token found. Please log in.");
//             setLoading(prev => ({ ...prev, chart: false }));
//             return;
//         }
//         setLoading(prev => ({ ...prev, chart: true }));
//         setError(null);
//         try {
//             const res = await fetch(`${API_BASE_URL}/forecast/chart-data`, {
//                 headers: { 'Authorization': `Bearer ${token}` },
//             });
//             if (!res.ok) throw new Error(`Failed to fetch chart data (Status: ${res.status})`);
//             const data = await res.json();
            
//             const firstStoreId = Object.keys(data)[0];
//             if (firstStoreId) {
//                 const formattedData = data[firstStoreId].map(item => ({
//                     date: item.week_start,
//                     historical: item.actual,
//                     forecast: item.forecast,
//                 }));
//                 setChartData(formattedData);
//             } else {
//                 setChartData([]);
//             }
//         } catch (err) {
//             setError(err.message);
//             setChartData([]);
//         } finally {
//             setLoading(prev => ({ ...prev, chart: false }));
//         }
//     }, []);

//     const fetchAccuracyData = useCallback(async (level = 'store') => {
//         const token = getToken();
//         if (!token) return;
//         setLoading(prev => ({ ...prev, accuracy: true }));
//         try {
//             const res = await fetch(`${API_BASE_URL}/forecast/accuracy/${level}`, {
//                 headers: { 'Authorization': `Bearer ${token}` },
//             });
//             if (!res.ok) throw new Error(`Failed to fetch ${level}-level accuracy`);
//             const data = await res.json();
//             setAccuracyData(data);
//         } catch (err) {
//             setError(err.message);
//         } finally {
//             setLoading(prev => ({ ...prev, accuracy: false }));
//         }
//     }, []);

//     const fetchLogs = useCallback(async () => {
//         const token = getToken();
//         if (!token) return;
//         setLoading(prev => ({ ...prev, logs: true }));
//         try {
//             const res = await fetch(`${API_BASE_URL}/forecast/logs`, {
//                 headers: { 'Authorization': `Bearer ${token}` },
//             });
//             if (!res.ok) throw new Error('Failed to fetch logs');
//             const data = await res.json();
//             setLogData(data.logs || []);
//         } catch (err) {
//             setError(err.message);
//         } finally {
//             setLoading(prev => ({ ...prev, logs: false }));
//         }
//     }, []);

//     const handleRunForecast = async () => {
//         const token = getToken();
//         if (!token) {
//             alert("You must be logged in to run a forecast.");
//             return;
//         }
//         setLoading(prev => ({ ...prev, run: true }));
//         setError(null);
//         try {
//             const res = await fetch(`${API_BASE_URL}/forecast/run`, {
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}` },
//             });
//             if (!res.ok) throw new Error('Forecast run failed');
//             alert('Forecast run initiated successfully! Data will be updated shortly.');
//             setTimeout(fetchChartData, 5000);
//         } catch (err) {
//             setError(err.message);
//             alert(`Error: ${err.message}`);
//         } finally {
//             setLoading(prev => ({ ...prev, run: false }));
//         }
//     };
    
//     useEffect(() => {
//         fetchChartData();
//     }, [fetchChartData]);

//     const tabs = [
//         { id: 'forecast', title: 'Forecast Visualization', onClick: null },
//         { id: 'accuracy', title: 'Performance & Accuracy', onClick: () => fetchAccuracyData('store') },
//         { id: 'logs', title: 'Run History', onClick: fetchLogs },
//     ];

//     return (
//         <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-300 min-h-screen font-sans">
//             <div className="max-w-7xl mx-auto">
//                 {/* 1. Header */}
//                 <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
//                     <div>
//                          <h1 className="text-3xl font-bold text-white">Demand Forecast Dashboard</h1>
//                          <p className="text-slate-400 mt-1">Analyze historical data and future sales predictions.</p>
//                     </div>
//                     <button 
//                         onClick={handleRunForecast}
//                         disabled={loading.run}
//                         className="flex items-center mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30"
//                     >
//                         <FiCpu className={`mr-2 ${loading.run ? 'animate-spin' : ''}`} />
//                         {loading.run ? 'Processing...' : 'Run New Forecast'}
//                     </button>
//                 </header>
                
//                 {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center"><FiAlertCircle className="mr-3" /> Error: {error}</div>}

//                 {/* 2. Tab Navigation */}
//                 <div className="flex border-b border-slate-700 mb-8">
//                     {tabs.map(tab => (
//                         <TabButton 
//                             key={tab.id}
//                             title={tab.title}
//                             tabName={tab.id}
//                             activeTab={activeTab}
//                             setActiveTab={setActiveTab}
//                             onClick={tab.onClick}
//                         />
//                     ))}
//                 </div>

//                 {/* 3. Tab Content */}
//                 <main>
//                     <AnimatePresence mode="wait">
//                         {activeTab === 'forecast' && (
//                             <motion.div key="forecast" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
//                                 <ForecastChartPanel loading={loading.chart} data={chartData} />
//                             </motion.div>
//                         )}
//                         {activeTab === 'accuracy' && (
//                             <motion.div key="accuracy" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
//                                 <AccuracyPanel loading={loading.accuracy} data={accuracyData} fetchData={fetchAccuracyData} />
//                             </motion.div>
//                         )}
//                         {activeTab === 'logs' && (
//                              <motion.div key="logs" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
//                                 <LogsPanel loading={loading.logs} data={logData} />
//                              </motion.div>
//                         )}
//                     </AnimatePresence>
//                 </main>
//             </div>
//         </div>
//     );
// };


// // --- Child Components ---

// const TabButton = ({ title, tabName, activeTab, setActiveTab, onClick }) => (
//     <button
//         onClick={() => {
//             setActiveTab(tabName);
//             if (onClick) onClick();
//         }}
//         className={`relative py-3 px-2 sm:px-6 font-semibold transition-colors duration-300 text-sm sm:text-base ${
//             activeTab === tabName ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
//         }`}
//     >
//         {title}
//         {activeTab === tabName && (
//             <motion.div 
//                 className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"
//                 layoutId="underline"
//                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
//             />
//         )}
//     </button>
// );

// const LoadingSpinner = () => (
//     <div className="flex items-center justify-center h-full min-h-[300px]">
//         <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
//     </div>
// );

// const ForecastChartPanel = ({ loading, data }) => (
//     <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg h-[500px] border border-slate-700">
//         <h2 className="text-xl font-semibold mb-4 text-white">Forecast vs. Historical Sales (Weekly)</h2>
//         {loading ? (
//             <LoadingSpinner />
//         ) : data.length === 0 ? (
//              <div className="flex items-center justify-center h-full text-slate-400">No data available to display.</div>
//         ) : (
//             <ResponsiveContainer width="100%" height="90%">
//                 <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
//                     {/* 👇 This JSX is correct and uses standard SVG tags, not imported components */}
//                     <defs>
//                         <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
//                             <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
//                         </linearGradient>
//                          <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
//                             <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
//                         </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
//                     <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
//                     <YAxis stroke="#94a3b8" fontSize={12} />
//                     <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
//                     <Legend />
//                     <Area type="monotone" dataKey="historical" stroke="#818cf8" strokeWidth={2} name="Historical Sales" fill="url(#colorHistorical)" />
//                     <Area type="monotone" dataKey="forecast" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" name="Forecasted Sales" fill="url(#colorForecast)" />
//                 </LineChart>
//             </ResponsiveContainer>
//         )}
//     </div>
// );

// const AccuracyPanel = ({ loading, data, fetchData }) => (
//     <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
//             <h2 className="text-xl font-semibold text-white mb-3 sm:mb-0">Forecast Accuracy (MAPE %)</h2>
//             <div className="bg-slate-700 p-1 rounded-lg">
//                 <button onClick={() => fetchData('store')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">Store-Level</button>
//                 <button onClick={() => fetchData('sku')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">SKU-Level</button>
//             </div>
//         </div>
//         {loading ? <LoadingSpinner /> : (
//             <div className="overflow-x-auto">
//                 <table className="w-full text-left">
//                     <thead className="border-b-2 border-slate-600">
//                         <tr>
//                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Identifier (Store/SKU)</th>
//                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Week Start</th>
//                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">MAPE (%)</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {data.map(item => 
//                             item.weekly_accuracy.map((acc, index) => (
//                                 <tr key={`${item.store_id || item.product_id}-${acc.week_start}`} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
//                                     {index === 0 && <td rowSpan={item.weekly_accuracy.length} className="p-3 font-bold text-white align-top">{item.store_id || item.product_id}</td>}
//                                     <td className="p-3">{acc.week_start}</td>
//                                     <td className="p-3 font-medium text-teal-400">{acc.mape !== null ? `${acc.mape}%` : 'N/A'}</td>
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         )}
//     </div>
// );

// const LogsPanel = ({ loading, data }) => (
//     <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
//         <h2 className="text-xl font-semibold text-white mb-4">Forecast Run History</h2>
//         {loading ? <LoadingSpinner /> : (
//             <div className="overflow-x-auto">
//                 <table className="w-full text-left">
//                     <thead className="border-b-2 border-slate-600">
//                         <tr>
//                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Run Time (UTC)</th>
//                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Store ID</th>
//                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Product ID</th>
//                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Forecast Horizon</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {data.map((log, index) => (
//                             <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
//                                 <td className="p-3 whitespace-nowrap"><FiClock className="inline mr-2 text-slate-400" />{log.run_time}</td>
//                                 <td className="p-3">{log.store_id || 'All'}</td>
//                                 <td className="p-3">{log.product_id || 'All'}</td>
//                                 <td className="p-3">{log.n_weeks} weeks</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         )}
//     </div>
// );

// export default ForecastPage;

import React, { useState, useEffect, useCallback } from 'react';
import { FiBarChart2, FiCpu, FiClock, FiAlertCircle } from 'react-icons/fi';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from "react-router-dom";

// --- API Configuration ---
const API_BASE_URL = 'http://127.0.0.1:5500';

// ✨ Animation variants for panels
const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
};

const ForecastPage = () => {
    // --- State Management ---
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('forecast');
    const [chartData, setChartData] = useState([]);
    const [accuracyData, setAccuracyData] = useState([]);
    const [logData, setLogData] = useState([]);
    const [stores, setStores] = useState([]);
    const [skus, setSkus] = useState([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [selectedSku, setSelectedSku] = useState('');
    const [storeForecastData, setStoreForecastData] = useState({});
    const [skuForecastData, setSkuForecastData] = useState({});
    const [loading, setLoading] = useState({
        chart: true,
        accuracy: false,
        logs: false,
        run: false,
        storeForecast: false,
        skuForecast: false,
    });
    const [error, setError] = useState(null);

    // --- API Fetching Functions ---
    const getToken = () => localStorage.getItem('token');

    const fetchChartData = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setError("No authentication token found. Please log in.");
            setLoading(prev => ({ ...prev, chart: false }));
            return;
        }
        setLoading(prev => ({ ...prev, chart: true }));
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/forecast/chart-data`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Failed to fetch chart data (Status: ${res.status})`);
            const data = await res.json();
            
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                const firstStoreId = Object.keys(data)[0];
                if (firstStoreId && Array.isArray(data[firstStoreId])) {
                    const formattedData = data[firstStoreId].map(item => ({
                        date: item.week_start || item.date,
                        historical: item.actual,
                        forecast: item.forecast,
                    }));
                    setChartData(formattedData);
                } else {
                    setChartData([]);
                }
            } else {
                setChartData([]);
            }
        } catch (err) {
            setError(err);
            setChartData([]);
        } finally {
            setLoading(prev => ({ ...prev, chart: false }));
        }
    }, []);

    const fetchAccuracyData = useCallback(async (level = 'store') => {
        const token = getToken();
        if (!token) return;
        setLoading(prev => ({ ...prev, accuracy: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/forecast/accuracy/${level}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Failed to fetch ${level}-level accuracy`);
            const data = await res.json();
            setAccuracyData(data || []);
        } catch (err) {
            setError(err);
            setAccuracyData([]);
        } finally {
            setLoading(prev => ({ ...prev, accuracy: false }));
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        setLoading(prev => ({ ...prev, logs: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/forecast/logs`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch logs');
            const data = await res.json();
            setLogData(data.logs || []);
        } catch (err) {
            setError(err);
            setLogData([]);
        } finally {
            setLoading(prev => ({ ...prev, logs: false }));
        }
    }, []);

    const handleRunForecast = async () => {
        const token = getToken();
        if (!token) {
            alert("You must be logged in to run a forecast.");
            return;
        }
        setLoading(prev => ({ ...prev, run: true }));
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/forecast/run`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Forecast run failed');
            alert('Forecast run initiated successfully! Data will be updated shortly.');
            setTimeout(() => {
                fetchChartData();
                fetchStoreLevelForecast();
                fetchSkuLevelForecast();
            }, 5000);
        } catch (err) {
            setError(err);
            alert(`Error: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, run: false }));
        }
    };

    const fetchStores = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/stores`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch stores');
            const data = await res.json();
            const storeList = data.stores || [];
            setStores(storeList);
            if (storeList.length > 0) {
                setSelectedStore(storeList[0].store_id);
            }
        } catch (err) {
            setError(err);
            setStores([]);
        }
    }, []);

    const fetchStoreLevelForecast = useCallback(async (n_weeks = 4) => {
        const token = getToken();
        if (!token) return;
        setLoading(prev => ({ ...prev, storeForecast: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/forecast/store-level?n_weeks=${n_weeks}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch store-level forecast');
            const dataAsList = await res.json();

            const formattedData = (dataAsList || []).reduce((acc, item) => {
                if (item.store_id && item.forecast_weekly) {
                    acc[item.store_id] = item.forecast_weekly.map(forecastItem => ({
                        week_start: forecastItem.week_start,
                        forecast: forecastItem.forecast
                    }));
                }
                return acc;
            }, {});

            setStoreForecastData(formattedData);

        } catch (err) {
            setError(err);
            setStoreForecastData({});
        } finally {
            setLoading(prev => ({ ...prev, storeForecast: false }));
        }
    }, []);
    
    const fetchSkuLevelForecast = useCallback(async (n_weeks = 4) => {
        const token = getToken();
        if (!token) return;
        setLoading(prev => ({ ...prev, skuForecast: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/forecast/sku-level?n_weeks=${n_weeks}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch SKU-level forecast');
            const dataAsList = await res.json();

            const formattedData = (dataAsList || []).reduce((acc, item) => {
                if (item.product_id && item.forecast_weekly) {
                     acc[item.product_id] = item.forecast_weekly.map(forecastItem => ({
                        week_start: forecastItem.week_start,
                        forecast: forecastItem.forecast
                    }));
                }
                return acc;
            }, {});

            setSkuForecastData(formattedData);

            const skuList = Object.keys(formattedData || {});
            setSkus(skuList);
            if (skuList.length > 0) {
                setSelectedSku(skuList[0]);
            }
        } catch (err) {
            setError(err);
            setSkuForecastData({});
        } finally {
            setLoading(prev => ({ ...prev, skuForecast: false }));
        }
    }, []);

    useEffect(() => {
        fetchChartData();
        fetchStores();
        fetchStoreLevelForecast();
        fetchSkuLevelForecast();
    }, [fetchChartData, fetchStores, fetchStoreLevelForecast, fetchSkuLevelForecast]);
    
    const tabs = [
        { id: 'forecast', title: 'Forecast Visualization', onClick: null },
        { id: 'accuracy', title: 'Performance & Accuracy', onClick: () => fetchAccuracyData('store') },
        { id: 'logs', title: 'Run History', onClick: fetchLogs },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-300 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
          >
            &larr; Back to Dashboard
          </button>
                    <div>
                         <h1 className="text-3xl font-bold text-white">Demand Forecast Dashboard</h1>
                         <p className="text-slate-400 mt-1">Analyze historical data and future sales predictions.</p>
                    </div>
                    
                    <button 
                        onClick={handleRunForecast}
                        disabled={loading.run}
                        className="flex items-center mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30"
                    >
                        <FiCpu className={`mr-2 ${loading.run ? 'animate-spin' : ''}`} />
                        {loading.run ? 'Processing...' : 'Run New Forecast'}
                    </button>
                </header>
                
                {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center"><FiAlertCircle className="mr-3" /> Error: {error.message}</div>}

                <div className="flex border-b border-slate-700 mb-8">
                    {tabs.map(tab => (
                        <TabButton 
                            key={tab.id}
                            title={tab.title}
                            tabName={tab.id}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onClick={tab.onClick}
                        />
                    ))}
                </div>

                <main>
                    <AnimatePresence mode="wait">
                        {activeTab === 'forecast' && (
                            <motion.div key="forecast" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
                                <ForecastChartPanel loading={loading.chart} data={chartData || []} />
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                    <ForecastDetailChart
                                        title="Store-Level Forecast (Next N Weeks)"
                                        loading={loading.storeForecast}
                                        items={stores}
                                        selectedItem={selectedStore}
                                        onItemChange={setSelectedStore}
                                        data={storeForecastData[selectedStore] || []}
                                        dataKey="forecast"
                                        itemName="store"
                                    />
                                    <ForecastDetailChart
                                        title="SKU-Level Forecast (Next N Weeks)"
                                        loading={loading.skuForecast}
                                        items={skus}
                                        selectedItem={selectedSku}
                                        onItemChange={setSelectedSku}
                                        data={skuForecastData[selectedSku] || []}
                                        dataKey="forecast"
                                        itemName="sku"
                                    />
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'accuracy' && (
                            <motion.div key="accuracy" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
                                <AccuracyPanel loading={loading.accuracy} data={accuracyData || []} fetchData={fetchAccuracyData} />
                            </motion.div>
                        )}
                        {activeTab === 'logs' && (
                             <motion.div key="logs" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
                                <LogsPanel loading={loading.logs} data={logData || []} />
                             </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

// --- Child Components ---

const TabButton = ({ title, tabName, activeTab, setActiveTab, onClick }) => (
    <button
        onClick={() => {
            setActiveTab(tabName);
            if (onClick) onClick();
        }}
        className={`relative py-3 px-2 sm:px-6 font-semibold transition-colors duration-300 text-sm sm:text-base ${
            activeTab === tabName ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
        }`}
    >
        {title}
        {activeTab === tabName && (
            <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"
                layoutId="underline"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        )}
    </button>
);

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
    </div>
);

const ForecastChartPanel = ({ loading, data }) => (
    <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg h-[500px] border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-white">Forecast vs. Historical Sales (Weekly)</h2>
        {loading ? (
            <LoadingSpinner />
        ) : !data || data.length === 0 ? (
             <div className="flex items-center justify-center h-full text-slate-400">No data available to display.</div>
        ) : (
            <ResponsiveContainer width="100%" height="90%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                        </linearGradient>
                         <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
                    <Legend />
                    <Area type="monotone" dataKey="historical" stroke="#818cf8" strokeWidth={2} name="Historical Sales" fill="url(#colorHistorical)" />
                    <Area type="monotone" dataKey="forecast" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" name="Forecasted Sales" fill="url(#colorForecast)" />
                </LineChart>
            </ResponsiveContainer>
        )}
    </div>
);

const AccuracyPanel = ({ loading, data, fetchData }) => (
    <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-3 sm:mb-0">Forecast Accuracy (MAPE %)</h2>
            <div className="bg-slate-700 p-1 rounded-lg">
                <button onClick={() => fetchData('store')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">Store-Level</button>
                <button onClick={() => fetchData('sku')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">SKU-Level</button>
            </div>
        </div>
        {loading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b-2 border-slate-600">
                        <tr>
                            <th className="p-3 text-sm font-semibold uppercase text-slate-400">Identifier (Store/SKU)</th>
                            <th className="p-3 text-sm font-semibold uppercase text-slate-400">Week Start</th>
                            <th className="p-3 text-sm font-semibold uppercase text-slate-400">MAPE (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(data) && data.map(item => 
                           (item.weekly_accuracy || []).map((acc, index) => (
                                <tr key={`${item.store_id || item.product_id}-${acc.week_start}`} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                                    {index === 0 && <td rowSpan={item.weekly_accuracy.length} className="p-3 font-bold text-white align-top">{item.store_id || item.product_id}</td>}
                                    <td className="p-3">{acc.week_start}</td>
                                    <td className="p-3 font-medium text-teal-400">{acc.mape !== null ? `${acc.mape}%` : 'N/A'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

const LogsPanel = ({ loading, data }) => (
    <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">Forecast Run History</h2>
        {loading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b-2 border-slate-600">
                        <tr>
                            <th className="p-3 text-sm font-semibold uppercase text-slate-400">Run Time (UTC)</th>
                            <th className="p-3 text-sm font-semibold uppercase text-slate-400">Store ID</th>
                            <th className="p-3 text-sm font-semibold uppercase text-slate-400">Product ID</th>
                            <th className="p-3 text-sm font-semibold uppercase text-slate-400">Forecast Horizon</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(data) && data.map((log, index) => (
                            <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                                <td className="p-3 whitespace-nowrap"><FiClock className="inline mr-2 text-slate-400" />{log.run_time}</td>
                                <td className="p-3">{log.store_id || 'All'}</td>
                                <td className="p-3">{log.product_id || 'All'}</td>
                                <td className="p-3">{log.n_weeks} weeks</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

const ForecastDetailChart = ({ title, loading, items, selectedItem, onItemChange, data, dataKey, itemName }) => {
    
    const renderOptions = () => {
        if (itemName === 'store') {
            return (items || []).map(item => <option key={item.store_id} value={item.store_id}>{item.name} ({item.store_id})</option>);
        }
        return (items || []).map(item => <option key={item} value={item}>{item}</option>);
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg h-[400px] border border-slate-700 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-2 sm:mb-0">{title}</h3>
                <select
                    value={selectedItem || ''}
                    onChange={(e) => onItemChange(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-auto p-2"
                    disabled={loading || !items || items.length === 0}
                >
                    <option value="" disabled>Select {itemName}...</option>
                    {renderOptions()}
                </select>
            </div>
            <div className="flex-grow">
                {loading ? (
                    <LoadingSpinner />
                ) : !selectedItem || !data || data.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <FiBarChart2 className="mr-2" />
                        <span>{selectedItem ? 'No forecast data available.' : `Please select a ${itemName}.`}</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="week_start" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
                            <Bar dataKey={dataKey} name="Forecasted Units" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ForecastPage;