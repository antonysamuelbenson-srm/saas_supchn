// // // // import React, { useState, useEffect, useCallback } from 'react';
// // // // import { FiBarChart2, FiCpu, FiClock, FiAlertCircle } from 'react-icons/fi';
// // // // import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, BarChart, Bar } from 'recharts';
// // // // import { motion, AnimatePresence } from 'framer-motion';
// // // // import { useNavigate } from "react-router-dom";

// // // // // --- API Configuration ---
// // // // const API_BASE_URL = 'http://127.0.0.1:5500';

// // // // // ✨ Animation variants for panels
// // // // const panelVariants = {
// // // //     hidden: { opacity: 0, y: 20 },
// // // //     visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
// // // //     exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
// // // // };

// // // // const ForecastPage = () => {
// // // //     // --- State Management ---
// // // //     const navigate = useNavigate();
    
// // // //     const [activeTab, setActiveTab] = useState('forecast');
// // // //     const [chartData, setChartData] = useState([]);
// // // //     const [accuracyData, setAccuracyData] = useState([]);
// // // //     const [logData, setLogData] = useState([]);
// // // //     const [stores, setStores] = useState([]);
// // // //     const [skus, setSkus] = useState([]);
// // // //     const [selectedStore, setSelectedStore] = useState('');
// // // //     const [selectedSku, setSelectedSku] = useState('');
// // // //     const [storeForecastData, setStoreForecastData] = useState({});
// // // //     const [skuForecastData, setSkuForecastData] = useState({});
// // // //     const [loading, setLoading] = useState({
// // // //         chart: true,
// // // //         accuracy: false,
// // // //         logs: false,
// // // //         run: false,
// // // //         storeForecast: false,
// // // //         skuForecast: false,
// // // //     });
// // // //     const [error, setError] = useState(null);

// // // //     // --- API Fetching Functions ---
// // // //     const getToken = () => localStorage.getItem('token');

// // // //     const fetchChartData = useCallback(async () => {
// // // //         const token = getToken();
// // // //         if (!token) {
// // // //             setError("No authentication token found. Please log in.");
// // // //             setLoading(prev => ({ ...prev, chart: false }));
// // // //             return;
// // // //         }
// // // //         setLoading(prev => ({ ...prev, chart: true }));
// // // //         setError(null);
// // // //         try {
// // // //             const res = await fetch(`${API_BASE_URL}/forecast/chart-data`, {
// // // //                 headers: { 'Authorization': `Bearer ${token}` },
// // // //             });
// // // //             if (!res.ok) throw new Error(`Failed to fetch chart data (Status: ${res.status})`);
// // // //             const data = await res.json();
            
// // // //             if (data && typeof data === 'object' && !Array.isArray(data)) {
// // // //                 const firstStoreId = Object.keys(data)[0];
// // // //                 if (firstStoreId && Array.isArray(data[firstStoreId])) {
// // // //                     const formattedData = data[firstStoreId].map(item => ({
// // // //                         date: item.week_start || item.date,
// // // //                         historical: item.actual,
// // // //                         forecast: item.forecast,
// // // //                     }));
// // // //                     setChartData(formattedData);
// // // //                 } else {
// // // //                     setChartData([]);
// // // //                 }
// // // //             } else {
// // // //                 setChartData([]);
// // // //             }
// // // //         } catch (err) {
// // // //             setError(err);
// // // //             setChartData([]);
// // // //         } finally {
// // // //             setLoading(prev => ({ ...prev, chart: false }));
// // // //         }
// // // //     }, []);

// // // //     const fetchAccuracyData = useCallback(async (level = 'store') => {
// // // //         const token = getToken();
// // // //         if (!token) return;
// // // //         setLoading(prev => ({ ...prev, accuracy: true }));
// // // //         try {
// // // //             const res = await fetch(`${API_BASE_URL}/forecast/accuracy/${level}`, {
// // // //                 headers: { 'Authorization': `Bearer ${token}` },
// // // //             });
// // // //             if (!res.ok) throw new Error(`Failed to fetch ${level}-level accuracy`);
// // // //             const data = await res.json();
// // // //             setAccuracyData(data || []);
// // // //         } catch (err) {
// // // //             setError(err);
// // // //             setAccuracyData([]);
// // // //         } finally {
// // // //             setLoading(prev => ({ ...prev, accuracy: false }));
// // // //         }
// // // //     }, []);

// // // //     const fetchLogs = useCallback(async () => {
// // // //         const token = getToken();
// // // //         if (!token) return;
// // // //         setLoading(prev => ({ ...prev, logs: true }));
// // // //         try {
// // // //             const res = await fetch(`${API_BASE_URL}/forecast/logs`, {
// // // //                 headers: { 'Authorization': `Bearer ${token}` },
// // // //             });
// // // //             if (!res.ok) throw new Error('Failed to fetch logs');
// // // //             const data = await res.json();
// // // //             setLogData(data.logs || []);
// // // //         } catch (err) {
// // // //             setError(err);
// // // //             setLogData([]);
// // // //         } finally {
// // // //             setLoading(prev => ({ ...prev, logs: false }));
// // // //         }
// // // //     }, []);

// // // //     const handleRunForecast = async () => {
// // // //         const token = getToken();
// // // //         if (!token) {
// // // //             alert("You must be logged in to run a forecast.");
// // // //             return;
// // // //         }
// // // //         setLoading(prev => ({ ...prev, run: true }));
// // // //         setError(null);
// // // //         try {
// // // //             const res = await fetch(`${API_BASE_URL}/forecast/run`, {
// // // //                 method: 'POST',
// // // //                 headers: { 'Authorization': `Bearer ${token}` },
// // // //             });
// // // //             if (!res.ok) throw new Error('Forecast run failed');
// // // //             alert('Forecast run initiated successfully! Data will be updated shortly.');
// // // //             setTimeout(() => {
// // // //                 fetchChartData();
// // // //                 fetchStoreLevelForecast();
// // // //                 fetchSkuLevelForecast();
// // // //             }, 5000);
// // // //         } catch (err) {
// // // //             setError(err);
// // // //             alert(`Error: ${err.message}`);
// // // //         } finally {
// // // //             setLoading(prev => ({ ...prev, run: false }));
// // // //         }
// // // //     };

// // // //     const fetchStores = useCallback(async () => {
// // // //         const token = getToken();
// // // //         if (!token) return;
// // // //         try {
// // // //             const res = await fetch(`${API_BASE_URL}/stores`, {
// // // //                 headers: { 'Authorization': `Bearer ${token}` },
// // // //             });
// // // //             if (!res.ok) throw new Error('Failed to fetch stores');
// // // //             const data = await res.json();
// // // //             const storeList = data.stores || [];
// // // //             setStores(storeList);
// // // //             if (storeList.length > 0) {
// // // //                 setSelectedStore(storeList[0].store_id);
// // // //             }
// // // //         } catch (err) {
// // // //             setError(err);
// // // //             setStores([]);
// // // //         }
// // // //     }, []);

// // // //     const fetchStoreLevelForecast = useCallback(async (n_weeks = 4) => {
// // // //         const token = getToken();
// // // //         if (!token) return;
// // // //         setLoading(prev => ({ ...prev, storeForecast: true }));
// // // //         try {
// // // //             const res = await fetch(`${API_BASE_URL}/forecast/store-level?n_weeks=${n_weeks}`, {
// // // //                 headers: { 'Authorization': `Bearer ${token}` },
// // // //             });
// // // //             if (!res.ok) throw new Error('Failed to fetch store-level forecast');
// // // //             const dataAsList = await res.json();

// // // //             const formattedData = (dataAsList || []).reduce((acc, item) => {
// // // //                 if (item.store_id && item.forecast_weekly) {
// // // //                     acc[item.store_id] = item.forecast_weekly.map(forecastItem => ({
// // // //                         week_start: forecastItem.week_start,
// // // //                         forecast: forecastItem.forecast
// // // //                     }));
// // // //                 }
// // // //                 return acc;
// // // //             }, {});

// // // //             setStoreForecastData(formattedData);

// // // //         } catch (err) {
// // // //             setError(err);
// // // //             setStoreForecastData({});
// // // //         } finally {
// // // //             setLoading(prev => ({ ...prev, storeForecast: false }));
// // // //         }
// // // //     }, []);
    
// // // //     const fetchSkuLevelForecast = useCallback(async (n_weeks = 4) => {
// // // //         const token = getToken();
// // // //         if (!token) return;
// // // //         setLoading(prev => ({ ...prev, skuForecast: true }));
// // // //         try {
// // // //             const res = await fetch(`${API_BASE_URL}/forecast/sku-level?n_weeks=${n_weeks}`, {
// // // //                 headers: { 'Authorization': `Bearer ${token}` },
// // // //             });
// // // //             if (!res.ok) throw new Error('Failed to fetch SKU-level forecast');
// // // //             const dataAsList = await res.json();

// // // //             const formattedData = (dataAsList || []).reduce((acc, item) => {
// // // //                 if (item.product_id && item.forecast_weekly) {
// // // //                      acc[item.product_id] = item.forecast_weekly.map(forecastItem => ({
// // // //                         week_start: forecastItem.week_start,
// // // //                         forecast: forecastItem.forecast
// // // //                     }));
// // // //                 }
// // // //                 return acc;
// // // //             }, {});

// // // //             setSkuForecastData(formattedData);

// // // //             const skuList = Object.keys(formattedData || {});
// // // //             setSkus(skuList);
// // // //             if (skuList.length > 0) {
// // // //                 setSelectedSku(skuList[0]);
// // // //             }
// // // //         } catch (err) {
// // // //             setError(err);
// // // //             setSkuForecastData({});
// // // //         } finally {
// // // //             setLoading(prev => ({ ...prev, skuForecast: false }));
// // // //         }
// // // //     }, []);

// // // //     useEffect(() => {
// // // //         fetchChartData();
// // // //         fetchStores();
// // // //         fetchStoreLevelForecast();
// // // //         fetchSkuLevelForecast();
// // // //     }, [fetchChartData, fetchStores, fetchStoreLevelForecast, fetchSkuLevelForecast]);
    
// // // //     const tabs = [
// // // //         { id: 'forecast', title: 'Forecast Visualization', onClick: null },
// // // //         { id: 'accuracy', title: 'Performance & Accuracy', onClick: () => fetchAccuracyData('store') },
// // // //         { id: 'logs', title: 'Run History', onClick: fetchLogs },
// // // //     ];

// // // //     return (
// // // //         <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-300 min-h-screen font-sans">
// // // //             <div className="max-w-7xl mx-auto">
// // // //                 <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    
// // // //                      <div className="text-center mt-4 sm:mt-0">
// // // //           <h1 className="text-3xl font-bold text-white">Demand Forecast Dashboard</h1>
// // // //           <p className="text-slate-400 mt-1">Analyze historical data and future sales predictions.</p>
// // // //         </div>
// // // //         <button
// // // //             onClick={() => navigate("/dashboard")}
// // // //             className="px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
// // // //           >
// // // //             &larr; Back to Dashboard
// // // //           </button>
// // // //                     {/* <button 
// // // //                         onClick={handleRunForecast}
// // // //                         disabled={loading.run}
// // // //                         className="flex items-center mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30"
// // // //                     >
// // // //                         <FiCpu className={`mr-2 ${loading.run ? 'animate-spin' : ''}`} />
// // // //                         {loading.run ? 'Processing...' : 'Run New Forecast'}
// // // //                     </button> */}
// // // //                 </header>
                
// // // //                 {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center"><FiAlertCircle className="mr-3" /> Error: {error.message}</div>}

// // // //                 <div className="flex border-b border-slate-700 mb-8">
// // // //                     {tabs.map(tab => (
// // // //                         <TabButton 
// // // //                             key={tab.id}
// // // //                             title={tab.title}
// // // //                             tabName={tab.id}
// // // //                             activeTab={activeTab}
// // // //                             setActiveTab={setActiveTab}
// // // //                             onClick={tab.onClick}
// // // //                         />
// // // //                     ))}
// // // //                 </div>

// // // //                 <main>
// // // //                     <AnimatePresence mode="wait">
// // // //                         {activeTab === 'forecast' && (
// // // //                             <motion.div key="forecast" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
// // // //                                 <ForecastChartPanel loading={loading.chart} data={chartData || []} />
// // // //                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
// // // //                                     <ForecastDetailChart
// // // //                                         title="Store-Level Forecast (Next N Weeks)"
// // // //                                         loading={loading.storeForecast}
// // // //                                         items={stores}
// // // //                                         selectedItem={selectedStore}
// // // //                                         onItemChange={setSelectedStore}
// // // //                                         data={storeForecastData[selectedStore] || []}
// // // //                                         dataKey="forecast"
// // // //                                         itemName="store"
// // // //                                     />
// // // //                                     <ForecastDetailChart
// // // //                                         title="SKU-Level Forecast (Next N Weeks)"
// // // //                                         loading={loading.skuForecast}
// // // //                                         items={skus}
// // // //                                         selectedItem={selectedSku}
// // // //                                         onItemChange={setSelectedSku}
// // // //                                         data={skuForecastData[selectedSku] || []}
// // // //                                         dataKey="forecast"
// // // //                                         itemName="sku"
// // // //                                     />
// // // //                                 </div>
// // // //                             </motion.div>
// // // //                         )}
// // // //                         {activeTab === 'accuracy' && (
// // // //                             <motion.div key="accuracy" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
// // // //                                 <AccuracyPanel loading={loading.accuracy} data={accuracyData || []} fetchData={fetchAccuracyData} />
// // // //                             </motion.div>
// // // //                         )}
// // // //                         {activeTab === 'logs' && (
// // // //                              <motion.div key="logs" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
// // // //                                 <LogsPanel loading={loading.logs} data={logData || []} />
// // // //                              </motion.div>
// // // //                         )}
// // // //                     </AnimatePresence>
// // // //                 </main>
// // // //             </div>
// // // //         </div>
// // // //     );
// // // // };

// // // // // --- Child Components ---

// // // // const TabButton = ({ title, tabName, activeTab, setActiveTab, onClick }) => (
// // // //     <button
// // // //         onClick={() => {
// // // //             setActiveTab(tabName);
// // // //             if (onClick) onClick();
// // // //         }}
// // // //         className={`relative py-3 px-2 sm:px-6 font-semibold transition-colors duration-300 text-sm sm:text-base ${
// // // //             activeTab === tabName ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
// // // //         }`}
// // // //     >
// // // //         {title}
// // // //         {activeTab === tabName && (
// // // //             <motion.div 
// // // //                 className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"
// // // //                 layoutId="underline"
// // // //                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
// // // //             />
// // // //         )}
// // // //     </button>
// // // // );

// // // // const LoadingSpinner = () => (
// // // //     <div className="flex items-center justify-center h-full min-h-[300px]">
// // // //         <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
// // // //     </div>
// // // // );

// // // // const ForecastChartPanel = ({ loading, data }) => (
// // // //     <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg h-[500px] border border-slate-700">
// // // //         <h2 className="text-xl font-semibold mb-4 text-white">Forecast vs. Historical Sales (Weekly)</h2>
// // // //         {loading ? (
// // // //             <LoadingSpinner />
// // // //         ) : !data || data.length === 0 ? (
// // // //              <div className="flex items-center justify-center h-full text-slate-400">No data available to display.</div>
// // // //         ) : (
// // // //             <ResponsiveContainer width="100%" height="90%">
// // // //                 <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
// // // //                     <defs>
// // // //                         <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
// // // //                             <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
// // // //                             <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
// // // //                         </linearGradient>
// // // //                          <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
// // // //                             <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
// // // //                             <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
// // // //                         </linearGradient>
// // // //                     </defs>
// // // //                     <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
// // // //                     <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
// // // //                     <YAxis stroke="#94a3b8" fontSize={12} />
// // // //                     <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
// // // //                     <Legend />
// // // //                     <Area type="monotone" dataKey="historical" stroke="#818cf8" strokeWidth={2} name="Historical Sales" fill="url(#colorHistorical)" />
// // // //                     <Area type="monotone" dataKey="forecast" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" name="Forecasted Sales" fill="url(#colorForecast)" />
// // // //                 </LineChart>
// // // //             </ResponsiveContainer>
// // // //         )}
// // // //     </div>
// // // // );

// // // // const AccuracyPanel = ({ loading, data, fetchData }) => (
// // // //     <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
// // // //         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
// // // //             <h2 className="text-xl font-semibold text-white mb-3 sm:mb-0">Forecast Accuracy (MAPE %)</h2>
// // // //             <div className="bg-slate-700 p-1 rounded-lg">
// // // //                 <button onClick={() => fetchData('store')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">Store-Level</button>
// // // //                 <button onClick={() => fetchData('sku')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">SKU-Level</button>
// // // //             </div>
// // // //         </div>
// // // //         {loading ? <LoadingSpinner /> : (
// // // //             <div className="overflow-x-auto">
// // // //                 <table className="w-full text-left">
// // // //                     <thead className="border-b-2 border-slate-600">
// // // //                         <tr>
// // // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Identifier (Store/SKU)</th>
// // // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Week Start</th>
// // // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">MAPE (%)</th>
// // // //                         </tr>
// // // //                     </thead>
// // // //                     <tbody>
// // // //                         {Array.isArray(data) && data.map(item => 
// // // //                            (item.weekly_accuracy || []).map((acc, index) => (
// // // //                                 <tr key={`${item.store_id || item.product_id}-${acc.week_start}`} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
// // // //                                     {index === 0 && <td rowSpan={item.weekly_accuracy.length} className="p-3 font-bold text-white align-top">{item.store_id || item.product_id}</td>}
// // // //                                     <td className="p-3">{acc.week_start}</td>
// // // //                                     <td className="p-3 font-medium text-teal-400">{acc.mape !== null ? `${acc.mape}%` : 'N/A'}</td>
// // // //                                 </tr>
// // // //                             ))
// // // //                         )}
// // // //                     </tbody>
// // // //                 </table>
// // // //             </div>
// // // //         )}
// // // //     </div>
// // // // );

// // // // const LogsPanel = ({ loading, data }) => (
// // // //     <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
// // // //         <h2 className="text-xl font-semibold text-white mb-4">Forecast Run History</h2>
// // // //         {loading ? <LoadingSpinner /> : (
// // // //             <div className="overflow-x-auto">
// // // //                 <table className="w-full text-left">
// // // //                     <thead className="border-b-2 border-slate-600">
// // // //                         <tr>
// // // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Run Time (UTC)</th>
// // // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Store ID</th>
// // // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Product ID</th>
// // // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Forecast Horizon</th>
// // // //                         </tr>
// // // //                     </thead>
// // // //                     <tbody>
// // // //                         {Array.isArray(data) && data.map((log, index) => (
// // // //                             <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
// // // //                                 <td className="p-3 whitespace-nowrap"><FiClock className="inline mr-2 text-slate-400" />{log.run_time}</td>
// // // //                                 <td className="p-3">{log.store_id || 'All'}</td>
// // // //                                 <td className="p-3">{log.product_id || 'All'}</td>
// // // //                                 <td className="p-3">{log.n_weeks} weeks</td>
// // // //                             </tr>
// // // //                         ))}
// // // //                     </tbody>
// // // //                 </table>
// // // //             </div>
// // // //         )}
// // // //     </div>
// // // // );

// // // // const ForecastDetailChart = ({ title, loading, items, selectedItem, onItemChange, data, dataKey, itemName }) => {
    
// // // //     const renderOptions = () => {
// // // //         if (itemName === 'store') {
// // // //             return (items || []).map(item => <option key={item.store_id} value={item.store_id}>{item.name} ({item.store_id})</option>);
// // // //         }
// // // //         return (items || []).map(item => <option key={item} value={item}>{item}</option>);
// // // //     };

// // // //     return (
// // // //         <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg h-[400px] border border-slate-700 flex flex-col">
// // // //             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
// // // //                 <h3 className="text-lg font-semibold text-white mb-2 sm:mb-0">{title}</h3>
// // // //                 <select
// // // //                     value={selectedItem || ''}
// // // //                     onChange={(e) => onItemChange(e.target.value)}
// // // //                     className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-auto p-2"
// // // //                     disabled={loading || !items || items.length === 0}
// // // //                 >
// // // //                     <option value="" disabled>Select {itemName}...</option>
// // // //                     {renderOptions()}
// // // //                 </select>
// // // //             </div>
// // // //             <div className="flex-grow">
// // // //                 {loading ? (
// // // //                     <LoadingSpinner />
// // // //                 ) : !selectedItem || !data || data.length === 0 ? (
// // // //                     <div className="flex items-center justify-center h-full text-slate-400">
// // // //                         <FiBarChart2 className="mr-2" />
// // // //                         <span>{selectedItem ? 'No forecast data available.' : `Please select a ${itemName}.`}</span>
// // // //                     </div>
// // // //                 ) : (
// // // //                     <ResponsiveContainer width="100%" height="100%">
// // // //                         <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
// // // //                             <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
// // // //                             <XAxis dataKey="week_start" stroke="#94a3b8" fontSize={12} />
// // // //                             <YAxis stroke="#94a3b8" fontSize={12} />
// // // //                             <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} />
// // // //                             <Bar dataKey={dataKey} name="Forecasted Units" fill="#6366f1" radius={[4, 4, 0, 0]} />
// // // //                         </BarChart>
// // // //                     </ResponsiveContainer>
// // // //                 )}
// // // //             </div>
// // // //         </div>
// // // //     );
// // // // };

// // // // export default ForecastPage;

// // // import React, { useState, useEffect, useCallback } from 'react';
// // // import { FiBarChart2, FiCpu, FiClock, FiAlertCircle } from 'react-icons/fi';
// // // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// // // import { motion, AnimatePresence } from 'framer-motion';
// // // import { useNavigate } from "react-router-dom";

// // // // --- API Configuration ---
// // // const API_BASE_URL = 'http://127.0.0.1:5500';

// // // // ✨ Animation variants for panels
// // // const panelVariants = {
// // //     hidden: { opacity: 0, y: 20 },
// // //     visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
// // //     exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
// // // };

// // // const ForecastPage = () => {
// // //     // --- State Management ---
// // //     const navigate = useNavigate();
    
// // //     const [activeTab, setActiveTab] = useState('forecast');
// // //     const [chartData, setChartData] = useState([]);
// // //     const [weeksToShow, setWeeksToShow] = useState(8);
// // //     const [accuracyData, setAccuracyData] = useState([]);
// // //     const [logData, setLogData] = useState([]);
// // //     const [stores, setStores] = useState([]);
// // //     const [skus, setSkus] = useState([]);

// // //     // New state for filtering
// // //     const [filterType, setFilterType] = useState('all'); // 'all', 'store', or 'sku'
// // //     const [selectedStore, setSelectedStore] = useState('');
// // //     const [selectedSku, setSelectedSku] = useState('');

// // //     const [loading, setLoading] = useState({
// // //         chart: true,
// // //         accuracy: false,
// // //         logs: false,
// // //         run: false,
// // //     });
// // //     const [error, setError] = useState(null);


// // //     const fetchLogs = useCallback(async () => {
// // //         const token = getToken();
// // //         if (!token) return;
// // //         setLoading(prev => ({ ...prev, logs: true }));
// // //         try {
// // //             const res = await fetch(`${API_BASE_URL}/forecast/logs`, {
// // //                 headers: { 'Authorization': `Bearer ${token}` },
// // //             });
// // //             if (!res.ok) throw new Error('Failed to fetch logs');
// // //             const data = await res.json();
            
// // //             // Correctly access the nested 'logs' array here
// // //             setLogData(data.logs || []); 

// // //         } catch (err) {
// // //             setError(err);
// // //             setLogData([]);
// // //         } finally {
// // //             setLoading(prev => ({ ...prev, logs: false }));
// // //         }
// // //     }, []);


// // //     // --- API Fetching Functions ---
// // //     const getToken = () => localStorage.getItem('token');

// // //     const fetchForecastData = useCallback(async (currentFilterType, value) => {
// // //     const token = getToken();
// // //     if (!token) {
// // //         setError({ message: "No authentication token found. Please log in." });
// // //         setLoading(prev => ({ ...prev, chart: false }));
// // //         return;
// // //     }

// // //     setLoading(prev => ({ ...prev, chart: true }));
// // //     setError(null);

// // //     // Use the dynamic 'weeksToShow' state instead of a hardcoded value.
// // //     const body = { weeks: weeksToShow };

// // //     if (currentFilterType === 'store' && value) {
// // //         body.store_ids = [value];
// // //     } else if (currentFilterType === 'sku' && value) {
// // //         body.skus = [value];
// // //     }

// // //     try {
// // //         const response = await fetch(`${API_BASE_URL}/forecast/weekly`, {
// // //             method: 'POST',
// // //             headers: {
// // //                 'Authorization': `Bearer ${token}`,
// // //                 'Content-Type': 'application/json',
// // //             },
// // //             body: JSON.stringify(body),
// // //         });

// // //         if (!response.ok) {
// // //             throw new Error(`Failed to fetch forecast data (Status: ${response.status})`);
// // //         }

// // //         const data = await response.json();
        
// // //         // Aggregate the forecast data by week
// // //         const aggregatedData = (data.forecasts || []).reduce((accumulator, current) => {
// // //             const week = current.week_start;
// // //             if (!accumulator[week]) {
// // //                 accumulator[week] = { date: week, forecast: 0, actual: null };
// // //             }
// // //             accumulator[week].forecast += current.weekly_forecast;
// // //             if (current.weekly_actual !== null) {
// // //                 accumulator[week].actual = (accumulator[week].actual || 0) + current.weekly_actual;
// // //             }
// // //             return accumulator;
// // //         }, {});

// // //         // Format the aggregated data into an array and sort by date
// // //         const formattedData = Object.values(aggregatedData).sort((a, b) => new Date(a.date) - new Date(b.date));
// // //         setChartData(formattedData);

// // //     } catch (error) {
// // //         setError(error);
// // //         setChartData([]);
// // //     } finally {
// // //         setLoading(prev => ({ ...prev, chart: false }));
// // //     }
// // // }, [weeksToShow]); // Add 'weeksToShow' as a dependency

// // //     const fetchStores = useCallback(async () => {
// // //         const token = getToken();
// // //         if (!token) return;
// // //         try {
// // //             const res = await fetch(`${API_BASE_URL}/stores`, {
// // //                 headers: { 'Authorization': `Bearer ${token}` },
// // //             });
// // //             if (!res.ok) throw new Error('Failed to fetch stores');
// // //             const data = await res.json();
// // //             setStores(data.stores || []);
// // //         } catch (err) {
// // //             console.error(err);
// // //         }
// // //     }, []);

// // // const fetchSkus = useCallback(async () => {
// // //         const token = getToken();
// // //         if (!token) return;
// // //         try {
// // //             // 1. Changed URL from /products to /skus
// // //             const res = await fetch(`${API_BASE_URL}/skus`, {
// // //                 headers: { 'Authorization': `Bearer ${token}` },
// // //             });
// // //             if (!res.ok) throw new Error('Failed to fetch SKUs');
// // //             const data = await res.json();

// // //             // 2. Simplified to match the new backend response {"skus": ["ID1", "ID2"]}
// // //             const skuList = data.skus || [];
            
// // //             console.log("[DEBUG] Processed SKU List:", skuList);
// // //             setSkus(skuList);

// // //         } catch (err) {
// // //             console.error("Could not fetch SKUs:", err);
// // //             setSkus([]);
// // //         }
// // //     }, []);

// // // const fetchAccuracyData = useCallback(async (level = 'store') => {
// // //     const token = getToken();
// // //     if (!token) return;
// // //     setLoading(prev => ({ ...prev, accuracy: true }));
// // //     try {
// // //         const res = await fetch(`${API_BASE_URL}/forecast/accuracy/${level}`, {
// // //             headers: { 'Authorization': `Bearer ${token}` },
// // //         });
// // //         if (!res.ok) throw new Error(`Failed to fetch ${level}-level accuracy`);
// // //         const flatData = await res.json();

// // //         // ✨ TRANSFORM THE FLAT DATA INTO A NESTED STRUCTURE ✨
// // //         const groupedData = (flatData || []).reduce((acc, item) => {
// // //             const identifier = item.store_id || item.sku;
// // //             if (!acc[identifier]) {
// // //                 acc[identifier] = {
// // //                     [level === 'store' ? 'store_id' : 'product_id']: identifier,
// // //                     weekly_accuracy: []
// // //                 };
// // //             }
// // //             acc[identifier].weekly_accuracy.push({
// // //                 week_start: item.week_start,
// // //                 mape: item.mape
// // //             });
// // //             return acc;
// // //         }, {});

// // //         setAccuracyData(Object.values(groupedData)); // Set the newly structured data

// // //     } catch (err) {
// // //         setError(err);
// // //         setAccuracyData([]);
// // //     } finally {
// // //         setLoading(prev => ({ ...prev, accuracy: false }));
// // //     }
// // // }, []);

// // //     // Initial data load effect
// // //     useEffect(() => {
// // //         fetchStores();
// // //         fetchSkus();
// // //     }, [fetchStores, fetchSkus]);

// // //     // Effect to refetch data when filters change
// // //     useEffect(() => {

// // //             if (weeksToShow < 1) {
// // //                 setChartData([]); // Optionally clear the chart
// // //                 return; 
// // //     }



// // //         if (filterType === 'all') {
// // //             fetchForecastData('all');
// // //         } else if (filterType === 'store' && selectedStore) {
// // //             fetchForecastData('store', selectedStore);
// // //         } else if (filterType === 'sku' && selectedSku) {
// // //             fetchForecastData('sku', selectedSku);
// // //         }
// // //     }, [filterType, selectedStore, selectedSku, weeksToShow, fetchForecastData]);
    
// // // // This is the corrected line
// // //     const tabs = [
// // //         { id: 'forecast', title: 'Forecast Visualization', onClick: null },
// // //         { id: 'accuracy', title: 'Performance & Accuracy', onClick: () => fetchAccuracyData('store') },
// // //         { id: 'logs', title: 'Run History', onClick: () => fetchLogs() },
// // //     ];
    
// // //     return (
// // //         <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-300 min-h-screen font-sans">
// // //             <div className="max-w-7xl mx-auto">
// // //                 <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
// // //                     <div className="text-center sm:text-left">
// // //                         <h1 className="text-3xl font-bold text-white">Demand Forecast Dashboard</h1>
// // //                         <p className="text-slate-400 mt-1">Analyze historical data and future sales predictions.</p>
// // //                     </div>
// // //                     <button
// // //                         onClick={() => navigate("/dashboard")}
// // //                         className="mt-4 sm:mt-0 px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
// // //                     >
// // //                         &larr; Back to Dashboard
// // //                     </button>
// // //                 </header>
                
// // //                 {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center"><FiAlertCircle className="mr-3" /> Error: {error.message}</div>}

// // //                 <div className="flex border-b border-slate-700 mb-8">
// // //                     {tabs.map(tab => (
// // //                         <TabButton 
// // //                             key={tab.id}
// // //                             title={tab.title}
// // //                             tabName={tab.id}
// // //                             activeTab={activeTab}
// // //                             setActiveTab={setActiveTab}
// // //                             onClick={tab.onClick}
// // //                         />
// // //                     ))}
// // //                 </div>

// // //                 <main>
// // //                     <AnimatePresence mode="wait">
// // //                         {activeTab === 'forecast' && (
// // //                             <motion.div key="forecast" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
// // //                                 <FilterControls
// // //                                     filterType={filterType}
// // //                                     setFilterType={setFilterType}
// // //                                     selectedStore={selectedStore}
// // //                                     setSelectedStore={setSelectedStore}
// // //                                     selectedSku={selectedSku}
// // //                                     setSelectedSku={setSelectedSku}
// // //                                     stores={stores}
// // //                                     skus={skus}
// // //                                     weeksToShow={weeksToShow}         // ✨ Pass the state
// // //                                     setWeeksToShow={setWeeksToShow} // ✨ Pass the setter function
// // //                                 />
// // //                                 <ForecastLineChart loading={loading.chart} data={chartData} />
// // //                             </motion.div>
// // //                         )}
// // //                         {activeTab === 'accuracy' && (
// // //                             <motion.div key="accuracy" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
// // //                                 <AccuracyPanel loading={loading.accuracy} data={accuracyData || []} fetchData={fetchAccuracyData} />
// // //                             </motion.div>
// // //                         )}
// // //                         {activeTab === 'logs' && (
// // //                              <motion.div key="logs" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
// // //                                 <LogsPanel loading={loading.logs} data={logData || []} />
// // //                              </motion.div>
// // //                         )}
// // //                     </AnimatePresence>
// // //                 </main>
// // //             </div>
// // //         </div>
// // //     );
// // // };

// // // // --- Child Components ---

// // // const FilterControls = ({ filterType, setFilterType, selectedStore, setSelectedStore, selectedSku, setSelectedSku, stores, skus, weeksToShow, setWeeksToShow }) => (
// // //     <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
// // //         <div className="flex items-center gap-2">
// // //             <label htmlFor="filterType" className="font-semibold text-slate-300">View By:</label>
// // //             <select
// // //                 id="filterType"
// // //                 value={filterType}
// // //                 onChange={(e) => {
// // //                     setFilterType(e.target.value);
// // //                     setSelectedStore('');
// // //                     setSelectedSku('');
// // //                 }}
// // //                 className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
// // //             >
// // //                 <option value="all">All</option>
// // //                 <option value="store">Store</option>
// // //                 <option value="sku">SKU</option>
// // //             </select>
// // //             <div className="flex items-center gap-2">
// // //             <label htmlFor="weeksInput" className="font-semibold text-slate-300">Weeks:</label>
// // //             <input
// // //                 id="weeksInput"
// // //                 type="number"
// // //                 value={weeksToShow}
// // //                 onChange={(e) => setWeeksToShow(Number(e.target.value))}
// // //                 className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 w-20"
// // //                 min="1"
// // //                 max="52"
// // //             />
// // //         </div>
// // //         </div>
        
// // //         <AnimatePresence>
// // //             {filterType === 'store' && (
// // //                 <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2">
// // //                     <label htmlFor="storeSelect" className="font-semibold text-slate-300">Select Store:</label>
// // //                     <select
// // //                         id="storeSelect"
// // //                         value={selectedStore}
// // //                         onChange={(e) => setSelectedStore(e.target.value)}
// // //                         className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 min-w-[200px]"
// // //                     >
// // //                         <option value="" disabled>Select a store...</option>
// // //                         {stores.map(store => (
// // //                             <option key={store.store_id} value={store.store_id}>
// // //                                 {store.name} ({store.store_id})
// // //                             </option>
// // //                         ))}
// // //                     </select>
// // //                 </motion.div>
// // //             )}
// // //         </AnimatePresence>

// // //         <AnimatePresence>
// // //             {filterType === 'sku' && (
// // //                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2">
// // //                     <label htmlFor="skuSelect" className="font-semibold text-slate-300">Select SKU:</label>
// // //                     <select
// // //                         id="skuSelect"
// // //                         value={selectedSku}
// // //                         onChange={(e) => setSelectedSku(e.target.value)}
// // //                         className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 min-w-[200px]"
// // //                     >
// // //                         <option value="" disabled>Select a SKU...</option>
// // //                         {skus.map(sku => (
// // //                             <option key={sku} value={sku}>{sku}</option>
// // //                         ))}
// // //                     </select>
// // //                  </motion.div>
// // //             )}
// // //         </AnimatePresence>
// // //     </div>
// // // );

// // // const ForecastLineChart = ({ loading, data }) => (
// // //     <motion.div 
// // //         className="bg-slate-800/50 p-6 rounded-xl shadow-lg h-[500px] border border-slate-700"
// // //         initial={{ opacity: 0, y: 20 }}
// // //         animate={{ opacity: 1, y: 0 }}
// // //         transition={{ duration: 0.5 }}
// // //     >
// // //         <h2 className="text-xl font-semibold mb-4 text-white">Weekly Sales Analysis</h2>
// // //         {loading ? (
// // //             <LoadingSpinner />
// // //         ) : !data || data.length === 0 ? (
// // //              <div className="flex items-center justify-center h-full text-slate-400">
// // //                 <FiBarChart2 className="mr-2" />No data available for the selected filter.
// // //              </div>
// // //         ) : (
// // //             <ResponsiveContainer width="100%" height="90%">
// // //                 <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
// // //                     <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
// // //                     <XAxis 
// // //                         dataKey="date" 
// // //                         stroke="#94a3b8" 
// // //                         fontSize={12} 
// // //                         tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
// // //                     />
// // //                     <YAxis stroke="#94a3b8" fontSize={12} />
// // //                     <Tooltip 
// // //                         contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} 
// // //                         labelStyle={{ color: '#cbd5e1' }}
// // //                     />
// // //                     <Legend wrapperStyle={{ color: '#cbd5e1' }} />
// // //                     <Line 
// // //                         type="monotone" 
// // //                         dataKey="actual" 
// // //                         stroke="#818cf8"
// // //                         strokeWidth={2.5}
// // //                         name="Actual Sales" 
// // //                         dot={{ r: 4, strokeWidth: 2 }}
// // //                         activeDot={{ r: 6 }}
// // //                         connectNulls
// // //                         animationDuration={1000}
// // //                     />
// // //                     <Line 
// // //                         type="monotone" 
// // //                         dataKey="forecast" 
// // //                         stroke="#34d399"
// // //                         strokeWidth={2.5}
// // //                         strokeDasharray="5 5"
// // //                         name="Forecasted Sales" 
// // //                         dot={false}
// // //                         activeDot={{ r: 6 }}
// // //                         animationDuration={1000}
// // //                         animationEasing="ease-in-out"
// // //                     />
// // //                 </LineChart>
// // //             </ResponsiveContainer>
// // //         )}
// // //     </motion.div>
// // // );

// // // const TabButton = ({ title, tabName, activeTab, setActiveTab, onClick }) => (
// // //     <button
// // //         onClick={() => {
// // //             setActiveTab(tabName);
// // //             if (onClick) onClick();
// // //         }}
// // //         className={`relative py-3 px-2 sm:px-6 font-semibold transition-colors duration-300 text-sm sm:text-base ${
// // //             activeTab === tabName ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
// // //         }`}
// // //     >
// // //         {title}
// // //         {activeTab === tabName && (
// // //             <motion.div 
// // //                 className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"
// // //                 layoutId="underline"
// // //                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
// // //             />
// // //         )}
// // //     </button>
// // // );

// // // const LoadingSpinner = () => (
// // //     <div className="flex items-center justify-center h-full min-h-[300px]">
// // //         <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
// // //     </div>
// // // );

// // // const AccuracyPanel = ({ loading, data, fetchData }) => (
// // //     <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
// // //         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
// // //             <h2 className="text-xl font-semibold text-white mb-3 sm:mb-0">Forecast Accuracy (MAPE %)</h2>
// // //             <div className="bg-slate-700 p-1 rounded-lg">
// // //                 <button onClick={() => fetchData('store')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">Store-Level</button>
// // //                 <button onClick={() => fetchData('sku')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">SKU-Level</button>
// // //             </div>
// // //         </div>
// // //         {loading ? <LoadingSpinner /> : (
// // //             <div className="overflow-x-auto">
// // //                 <table className="w-full text-left">
// // //                     <thead className="border-b-2 border-slate-600">
// // //                         <tr>
// // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Identifier (Store/SKU)</th>
// // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Week Start</th>
// // //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">MAPE (%)</th>
// // //                         </tr>
// // //                     </thead>
// // //                     <tbody>
// // //                         {Array.isArray(data) && data.map(item => 
// // //                             (item.weekly_accuracy || []).map((acc, index) => (
// // //                                 <tr key={`${item.store_id || item.product_id}-${acc.week_start}`} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
// // //                                     {index === 0 && <td rowSpan={item.weekly_accuracy.length} className="p-3 font-bold text-white align-top">{item.store_id || item.product_id}</td>}
// // //                                     <td className="p-3">{acc.week_start}</td>
// // //                                     <td className="p-3 font-medium text-teal-400">{acc.mape !== null ? `${acc.mape}%` : 'N/A'}</td>
// // //                                 </tr>
// // //                             ))
// // //                         )}
// // //                     </tbody>
// // //                 </table>
// // //             </div>
// // //         )}
// // //     </div>
// // // );

// // // const LogsPanel = ({ loading, data }) => {
// // //     // Helper function to determine the color of the status badge
// // //     const getStatusBadge = (status) => {
// // //         switch (status?.toLowerCase()) {
// // //             case 'completed':
// // //                 return 'bg-green-500/20 text-green-400';
// // //             case 'running':
// // //                 return 'bg-yellow-500/20 text-yellow-400';
// // //             case 'failed':
// // //                 return 'bg-red-500/20 text-red-400';
// // //             default:
// // //                 return 'bg-slate-600/50 text-slate-300';
// // //         }
// // //     };

// // //     return (
// // //         <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
// // //             <h2 className="text-xl font-semibold text-white mb-4">Forecast Run History</h2>
// // //             {loading ? <LoadingSpinner /> : (
// // //                 <div className="overflow-x-auto">
// // //                     <table className="w-full text-left">
// // //                         <thead className="border-b-2 border-slate-600">
// // //                             <tr>
// // //                                 <th className="p-3 text-sm font-semibold uppercase text-slate-400">Run Time (UTC)</th>
// // //                                 <th className="p-3 text-sm font-semibold uppercase text-slate-400">Forecast Horizon</th>
// // //                                 <th className="p-3 text-sm font-semibold uppercase text-slate-400">Status</th>
// // //                             </tr>
// // //                         </thead>
// // //                         <tbody>
// // //                             {Array.isArray(data) && data.map((log) => (
// // //                                 <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
// // //                                     <td className="p-3 whitespace-nowrap">
// // //                                         <FiClock className="inline mr-2 text-slate-400" />
// // //                                         {log.run_time}
// // //                                     </td>
// // //                                     <td className="p-3">
// // //                                         {log.n_weeks !== null ? `${log.n_weeks} weeks` : 'N/A'}
// // //                                     </td>
// // //                                     <td className="p-3">
// // //                                         <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(log.status)}`}>
// // //                                             {log.status || 'Unknown'}
// // //                                         </span>
// // //                                     </td>
// // //                                 </tr>
// // //                             ))}
// // //                         </tbody>
// // //                     </table>
// // //                 </div>
// // //             )}
// // //         </div>
// // //     );
// // // };  

// // // export default ForecastPage;


// // import React, { useState, useEffect, useCallback } from 'react';
// // import { FiBarChart2, FiCpu, FiClock, FiAlertCircle } from 'react-icons/fi';
// // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { useNavigate } from "react-router-dom";

// // // --- API Configuration ---
// // const API_BASE_URL = 'http://127.0.0.1:5500';

// // // ✨ Animation variants for panels
// // const panelVariants = {
// //     hidden: { opacity: 0, y: 20 },
// //     visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
// //     exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
// // };

// // const ForecastPage = () => {
// //     // --- State Management ---
// //     const navigate = useNavigate();
    
// //     const [activeTab, setActiveTab] = useState('forecast');
// //     const [chartData, setChartData] = useState([]);
// //     const [weeksToShow, setWeeksToShow] = useState(8);
// //     const [accuracyData, setAccuracyData] = useState([]);
// //     const [logData, setLogData] = useState([]);
// //     const [stores, setStores] = useState([]);
// //     const [skus, setSkus] = useState([]);

// //     // New state for filtering
// //     const [filterType, setFilterType] = useState('all'); // 'all', 'store', or 'sku'
// //     const [selectedStore, setSelectedStore] = useState('');
// //     const [selectedSku, setSelectedSku] = useState('');

// //     const [loading, setLoading] = useState({
// //         chart: true,
// //         accuracy: false,
// //         logs: false,
// //         run: false,
// //     });
// //     const [error, setError] = useState(null);


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
            
// //             // Correctly access the nested 'logs' array here
// //             setLogData(data.logs || []); 

// //         } catch (err) {
// //             setError(err);
// //             setLogData([]);
// //         } finally {
// //             setLoading(prev => ({ ...prev, logs: false }));
// //         }
// //     }, []);


// //     // --- API Fetching Functions ---
// //     const getToken = () => localStorage.getItem('token');

// //     const fetchForecastData = useCallback(async (currentFilterType, value) => {
// //         const token = getToken();
// //         if (!token) {
// //             setError({ message: "No authentication token found. Please log in." });
// //             setLoading(prev => ({ ...prev, chart: false }));
// //             return;
// //         }

// //         setLoading(prev => ({ ...prev, chart: true }));
// //         setError(null);

// //         // --- START: CORRECTED LOGIC ---
// //         // The backend expects 'past_weeks' and 'future_weeks', not a single 'weeks' value.
// //         // We split the total 'weeksToShow' from the UI into two parts for the API call.
// //         const past_weeks = Math.floor(weeksToShow / 2);
// //         const future_weeks = Math.ceil(weeksToShow / 2); // Using ceil handles odd numbers

// //         const body = {
// //             past_weeks: past_weeks,
// //             future_weeks: future_weeks,
// //         };
// //         // --- END: CORRECTED LOGIC ---

// //         if (currentFilterType === 'store' && value) {
// //             body.store_ids = [value];
// //         } else if (currentFilterType === 'sku' && value) {
// //             body.skus = [value];
// //         }

// //         try {
// //             const response = await fetch(`${API_BASE_URL}/forecast/weekly`, {
// //                 method: 'POST',
// //                 headers: {
// //                     'Authorization': `Bearer ${token}`,
// //                     'Content-Type': 'application/json',
// //                 },
// //                 body: JSON.stringify(body),
// //             });

// //             if (!response.ok) {
// //                 throw new Error(`Failed to fetch forecast data (Status: ${response.status})`);
// //             }

// //             const data = await response.json();
            
// //             // Aggregate the forecast data by week
// //             const aggregatedData = (data.forecasts || []).reduce((accumulator, current) => {
// //                 const week = current.week_start;
// //                 if (!accumulator[week]) {
// //                     accumulator[week] = { date: week, forecast: 0, actual: null };
// //                 }
// //                 accumulator[week].forecast += current.weekly_forecast;
// //                 if (current.weekly_actual !== null) {
// //                     accumulator[week].actual = (accumulator[week].actual || 0) + current.weekly_actual;
// //                 }
// //                 return accumulator;
// //             }, {});

// //             // Format the aggregated data into an array and sort by date
// //             const formattedData = Object.values(aggregatedData).sort((a, b) => new Date(a.date) - new Date(b.date));
// //             setChartData(formattedData);

// //         } catch (error) {
// //             setError(error);
// //             setChartData([]);
// //         } finally {
// //             setLoading(prev => ({ ...prev, chart: false }));
// //         }
// //     }, [weeksToShow]); // Add 'weeksToShow' as a dependency

// //     const fetchStores = useCallback(async () => {
// //         const token = getToken();
// //         if (!token) return;
// //         try {
// //             const res = await fetch(`${API_BASE_URL}/stores`, {
// //                 headers: { 'Authorization': `Bearer ${token}` },
// //             });
// //             if (!res.ok) throw new Error('Failed to fetch stores');
// //             const data = await res.json();
// //             setStores(data.stores || []);
// //         } catch (err) {
// //             console.error(err);
// //         }
// //     }, []);

// //     const fetchSkus = useCallback(async () => {
// //         const token = getToken();
// //         if (!token) return;
// //         try {
// //             // 1. Changed URL from /products to /skus
// //             const res = await fetch(`${API_BASE_URL}/skus`, {
// //                 headers: { 'Authorization': `Bearer ${token}` },
// //             });
// //             if (!res.ok) throw new Error('Failed to fetch SKUs');
// //             const data = await res.json();

// //             // 2. Simplified to match the new backend response {"skus": ["ID1", "ID2"]}
// //             const skuList = data.skus || [];
            
// //             console.log("[DEBUG] Processed SKU List:", skuList);
// //             setSkus(skuList);

// //         } catch (err) {
// //             console.error("Could not fetch SKUs:", err);
// //             setSkus([]);
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
// //             const flatData = await res.json();

// //             // ✨ TRANSFORM THE FLAT DATA INTO A NESTED STRUCTURE ✨
// //             const groupedData = (flatData || []).reduce((acc, item) => {
// //                 const identifier = item.store_id || item.sku;
// //                 if (!acc[identifier]) {
// //                     acc[identifier] = {
// //                         [level === 'store' ? 'store_id' : 'product_id']: identifier,
// //                         weekly_accuracy: []
// //                     };
// //                 }
// //                 acc[identifier].weekly_accuracy.push({
// //                     week_start: item.week_start,
// //                     mape: item.mape
// //                 });
// //                 return acc;
// //             }, {});

// //             setAccuracyData(Object.values(groupedData)); // Set the newly structured data

// //         } catch (err) {
// //             setError(err);
// //             setAccuracyData([]);
// //         } finally {
// //             setLoading(prev => ({ ...prev, accuracy: false }));
// //         }
// //     }, []);

// //     // Initial data load effect
// //     useEffect(() => {
// //         fetchStores();
// //         fetchSkus();
// //     }, [fetchStores, fetchSkus]);

// //     // Effect to refetch data when filters change
// //     useEffect(() => {
// //             if (weeksToShow < 1) {
// //                 setChartData([]); // Optionally clear the chart
// //                 return; 
// //             }

// //             if (filterType === 'all') {
// //                 fetchForecastData('all');
// //             } else if (filterType === 'store' && selectedStore) {
// //                 fetchForecastData('store', selectedStore);
// //             } else if (filterType === 'sku' && selectedSku) {
// //                 fetchForecastData('sku', selectedSku);
// //             }
// //     }, [filterType, selectedStore, selectedSku, weeksToShow, fetchForecastData]);
    
// //     // This is the corrected line
// //     const tabs = [
// //         { id: 'forecast', title: 'Forecast Visualization', onClick: null },
// //         { id: 'accuracy', title: 'Performance & Accuracy', onClick: () => fetchAccuracyData('store') },
// //         { id: 'logs', title: 'Run History', onClick: () => fetchLogs() },
// //     ];
    
// //     return (
// //         <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-300 min-h-screen font-sans">
// //             <div className="max-w-7xl mx-auto">
// //                 <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
// //                     <div className="text-center sm:text-left">
// //                         <h1 className="text-3xl font-bold text-white">Demand Forecast Dashboard</h1>
// //                         <p className="text-slate-400 mt-1">Analyze historical data and future sales predictions.</p>
// //                     </div>
// //                     <button
// //                         onClick={() => navigate("/dashboard")}
// //                         className="mt-4 sm:mt-0 px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
// //                     >
// //                         &larr; Back to Dashboard
// //                     </button>
// //                 </header>
                
// //                 {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center"><FiAlertCircle className="mr-3" /> Error: {error.message}</div>}

// //                 <div className="flex border-b border-slate-700 mb-8">
// //                     {tabs.map(tab => (
// //                         <TabButton 
// //                             key={tab.id}
// //                             title={tab.title}
// //                             tabName={tab.id}
// //                             activeTab={activeTab}
// //                             setActiveTab={setActiveTab}
// //                             onClick={tab.onClick}
// //                         />
// //                     ))}
// //                 </div>

// //                 <main>
// //                     <AnimatePresence mode="wait">
// //                         {activeTab === 'forecast' && (
// //                             <motion.div key="forecast" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
// //                                 <FilterControls
// //                                     filterType={filterType}
// //                                     setFilterType={setFilterType}
// //                                     selectedStore={selectedStore}
// //                                     setSelectedStore={setSelectedStore}
// //                                     selectedSku={selectedSku}
// //                                     setSelectedSku={setSelectedSku}
// //                                     stores={stores}
// //                                     skus={skus}
// //                                     weeksToShow={weeksToShow}          // ✨ Pass the state
// //                                     setWeeksToShow={setWeeksToShow} // ✨ Pass the setter function
// //                                 />
// //                                 <ForecastLineChart loading={loading.chart} data={chartData} />
// //                             </motion.div>
// //                         )}
// //                         {activeTab === 'accuracy' && (
// //                             <motion.div key="accuracy" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
// //                                 <AccuracyPanel loading={loading.accuracy} data={accuracyData || []} fetchData={fetchAccuracyData} />
// //                             </motion.div>
// //                         )}
// //                         {activeTab === 'logs' && (
// //                              <motion.div key="logs" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
// //                                 <LogsPanel loading={loading.logs} data={logData || []} />
// //                              </motion.div>
// //                         )}
// //                     </AnimatePresence>
// //                 </main>
// //             </div>
// //         </div>
// //     );
// // };

// // // --- Child Components ---

// // const FilterControls = ({ filterType, setFilterType, selectedStore, setSelectedStore, selectedSku, setSelectedSku, stores, skus, weeksToShow, setWeeksToShow }) => (
// //     <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
// //         <div className="flex items-center gap-2">
// //             <label htmlFor="filterType" className="font-semibold text-slate-300">View By:</label>
// //             <select
// //                 id="filterType"
// //                 value={filterType}
// //                 onChange={(e) => {
// //                     setFilterType(e.target.value);
// //                     setSelectedStore('');
// //                     setSelectedSku('');
// //                 }}
// //                 className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
// //             >
// //                 <option value="all">All</option>
// //                 <option value="store">Store</option>
// //                 <option value="sku">SKU</option>
// //             </select>
// //             <div className="flex items-center gap-2">
// //             <label htmlFor="weeksInput" className="font-semibold text-slate-300">Weeks:</label>
// //             <input
// //                 id="weeksInput"
// //                 type="number"
// //                 value={weeksToShow}
// //                 onChange={(e) => setWeeksToShow(Number(e.target.value))}
// //                 className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 w-20"
// //                 min="1"
// //                 max="52"
// //             />
// //         </div>
// //         </div>
        
// //         <AnimatePresence>
// //             {filterType === 'store' && (
// //                 <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2">
// //                     <label htmlFor="storeSelect" className="font-semibold text-slate-300">Select Store:</label>
// //                     <select
// //                         id="storeSelect"
// //                         value={selectedStore}
// //                         onChange={(e) => setSelectedStore(e.target.value)}
// //                         className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 min-w-[200px]"
// //                     >
// //                         <option value="" disabled>Select a store...</option>
// //                         {stores.map(store => (
// //                             <option key={store.store_id} value={store.store_id}>
// //                                 {store.name} ({store.store_id})
// //                             </option>
// //                         ))}
// //                     </select>
// //                 </motion.div>
// //             )}
// //         </AnimatePresence>

// //         <AnimatePresence>
// //             {filterType === 'sku' && (
// //                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2">
// //                     <label htmlFor="skuSelect" className="font-semibold text-slate-300">Select SKU:</label>
// //                     <select
// //                         id="skuSelect"
// //                         value={selectedSku}
// //                         onChange={(e) => setSelectedSku(e.target.value)}
// //                         className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 min-w-[200px]"
// //                     >
// //                         <option value="" disabled>Select a SKU...</option>
// //                         {skus.map(sku => (
// //                             <option key={sku} value={sku}>{sku}</option>
// //                         ))}
// //                     </select>
// //                  </motion.div>
// //             )}
// //         </AnimatePresence>
// //     </div>
// // );

// // const ForecastLineChart = ({ loading, data }) => (
// //     <motion.div 
// //         className="bg-slate-800/50 p-6 rounded-xl shadow-lg h-[500px] border border-slate-700"
// //         initial={{ opacity: 0, y: 20 }}
// //         animate={{ opacity: 1, y: 0 }}
// //         transition={{ duration: 0.5 }}
// //     >
// //         <h2 className="text-xl font-semibold mb-4 text-white">Weekly Sales Analysis</h2>
// //         {loading ? (
// //             <LoadingSpinner />
// //         ) : !data || data.length === 0 ? (
// //              <div className="flex items-center justify-center h-full text-slate-400">
// //                 <FiBarChart2 className="mr-2" />No data available for the selected filter.
// //              </div>
// //         ) : (
// //             <ResponsiveContainer width="100%" height="90%">
// //                 <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
// //                     <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
// //                     <XAxis 
// //                         dataKey="date" 
// //                         stroke="#94a3b8" 
// //                         fontSize={12} 
// //                         tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
// //                     />
// //                     <YAxis stroke="#94a3b8" fontSize={12} />
// //                     <Tooltip 
// //                         contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} 
// //                         labelStyle={{ color: '#cbd5e1' }}
// //                     />
// //                     <Legend wrapperStyle={{ color: '#cbd5e1' }} />
// //                     <Line 
// //                         type="monotone" 
// //                         dataKey="actual" 
// //                         stroke="#818cf8"
// //                         strokeWidth={2.5}
// //                         name="Actual Sales" 
// //                         dot={{ r: 4, strokeWidth: 2 }}
// //                         activeDot={{ r: 6 }}
// //                         connectNulls
// //                         animationDuration={1000}
// //                     />
// //                     <Line 
// //                         type="monotone" 
// //                         dataKey="forecast" 
// //                         stroke="#34d399"
// //                         strokeWidth={2.5}
// //                         strokeDasharray="5 5"
// //                         name="Forecasted Sales" 
// //                         dot={false}
// //                         activeDot={{ r: 6 }}
// //                         animationDuration={1000}
// //                         animationEasing="ease-in-out"
// //                     />
// //                 </LineChart>
// //             </ResponsiveContainer>
// //         )}
// //     </motion.div>
// // );

// // const TabButton = ({ title, tabName, activeTab, setActiveTab, onClick }) => (
// //     <button
// //         onClick={() => {
// //             setActiveTab(tabName);
// //             if (onClick) onClick();
// //         }}
// //         className={`relative py-3 px-2 sm:px-6 font-semibold transition-colors duration-300 text-sm sm:text-base ${
// //             activeTab === tabName ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
// //         }`}
// //     >
// //         {title}
// //         {activeTab === tabName && (
// //             <motion.div 
// //                 className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"
// //                 layoutId="underline"
// //                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
// //             />
// //         )}
// //     </button>
// // );

// // const LoadingSpinner = () => (
// //     <div className="flex items-center justify-center h-full min-h-[300px]">
// //         <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
// //     </div>
// // );

// // const AccuracyPanel = ({ loading, data, fetchData }) => (
// //     <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
// //         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
// //             <h2 className="text-xl font-semibold text-white mb-3 sm:mb-0">Forecast Accuracy (MAPE %)</h2>
// //             <div className="bg-slate-700 p-1 rounded-lg">
// //                 <button onClick={() => fetchData('store')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">Store-Level</button>
// //                 <button onClick={() => fetchData('sku')} className="hover:bg-slate-600 text-sm py-1.5 px-4 rounded-md transition-colors">SKU-Level</button>
// //             </div>
// //         </div>
// //         {loading ? <LoadingSpinner /> : (
// //             <div className="overflow-x-auto">
// //                 <table className="w-full text-left">
// //                     <thead className="border-b-2 border-slate-600">
// //                         <tr>
// //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Identifier (Store/SKU)</th>
// //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">Week Start</th>
// //                             <th className="p-3 text-sm font-semibold uppercase text-slate-400">MAPE (%)</th>
// //                         </tr>
// //                     </thead>
// //                     <tbody>
// //                         {Array.isArray(data) && data.map(item => 
// //                             (item.weekly_accuracy || []).map((acc, index) => (
// //                                 <tr key={`${item.store_id || item.product_id}-${acc.week_start}`} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
// //                                     {index === 0 && <td rowSpan={item.weekly_accuracy.length} className="p-3 font-bold text-white align-top">{item.store_id || item.product_id}</td>}
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

// // const LogsPanel = ({ loading, data }) => {
// //     // Helper function to determine the color of the status badge
// //     const getStatusBadge = (status) => {
// //         switch (status?.toLowerCase()) {
// //             case 'completed':
// //                 return 'bg-green-500/20 text-green-400';
// //             case 'running':
// //                 return 'bg-yellow-500/20 text-yellow-400';
// //             case 'failed':
// //                 return 'bg-red-500/20 text-red-400';
// //             default:
// //                 return 'bg-slate-600/50 text-slate-300';
// //         }
// //     };

// //     return (
// //         <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
// //             <h2 className="text-xl font-semibold text-white mb-4">Forecast Run History</h2>
// //             {loading ? <LoadingSpinner /> : (
// //                 <div className="overflow-x-auto">
// //                     <table className="w-full text-left">
// //                         <thead className="border-b-2 border-slate-600">
// //                             <tr>
// //                                 <th className="p-3 text-sm font-semibold uppercase text-slate-400">Run Time (UTC)</th>
// //                                 <th className="p-3 text-sm font-semibold uppercase text-slate-400">Forecast Horizon</th>
// //                                 <th className="p-3 text-sm font-semibold uppercase text-slate-400">Status</th>
// //                             </tr>
// //                         </thead>
// //                         <tbody>
// //                             {Array.isArray(data) && data.map((log) => (
// //                                 <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
// //                                     <td className="p-3 whitespace-nowrap">
// //                                         <FiClock className="inline mr-2 text-slate-400" />
// //                                         {log.run_time}
// //                                     </td>
// //                                     <td className="p-3">
// //                                         {log.n_weeks !== null ? `${log.n_weeks} weeks` : 'N/A'}
// //                                     </td>
// //                                     <td className="p-3">
// //                                         <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(log.status)}`}>
// //                                             {log.status || 'Unknown'}
// //                                         </span>
// //                                     </td>
// //                                 </tr>
// //                             ))}
// //                         </tbody>
// //                     </table>
// //                 </div>
// //             )}
// //         </div>
// //     );
// // };  

// // export default ForecastPage;



// import React, { useState, useEffect, useCallback } from 'react';
// import { FiBarChart2, FiCpu, FiClock, FiAlertCircle } from 'react-icons/fi';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useNavigate } from "react-router-dom";

// // --- API Configuration ---
// const API_BASE_URL = 'http://127.0.0.1:5500';

// // ✨ Animation variants for panels
// const panelVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
//     exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
// };

// const ForecastPage = () => {
//     // --- State Management ---
//     const navigate = useNavigate();
    
//     const [activeTab, setActiveTab] = useState('forecast');
//     const [chartData, setChartData] = useState([]);
//     const [weeksToShow, setWeeksToShow] = useState(4);
//     const [accuracyData, setAccuracyData] = useState([]);
//     const [logData, setLogData] = useState([]);
//     const [stores, setStores] = useState([]);
//     const [skus, setSkus] = useState([]);

//     const [filterType, setFilterType] = useState('all');
//     const [selectedStore, setSelectedStore] = useState('');
//     const [selectedSku, setSelectedSku] = useState('');

//     const [loading, setLoading] = useState({
//         chart: true,
//         accuracy: false,
//         logs: false,
//         run: false,
//     });
//     const [error, setError] = useState(null);
    
//     // ✨ FIX: State to prevent initial data fetch before settings are loaded.
//     const [isInitialized, setIsInitialized] = useState(false);

//     // --- API Fetching Functions ---
//     const getToken = () => localStorage.getItem('token');

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
//             setError(err);
//             setLogData([]);
//         } finally {
//             setLoading(prev => ({ ...prev, logs: false }));
//         }
//     }, []);

//     const fetchUserLookahead = useCallback(async () => {
//         const token = getToken();
//         if (!token) return 4;
//         try {
//             const res = await fetch(`${API_BASE_URL}/user/lookahead_days`, {
//                 headers: { 'Authorization': `Bearer ${token}` },
//             });
//             if (!res.ok) {
//                 console.error("Failed to fetch lookahead settings, defaulting to 4 weeks.");
//                 return 4;
//             }
//             const data = await res.json();
//             const lookaheadDays = data.lookahead_days || 28;
//             return Math.ceil(lookaheadDays / 7);
//         } catch (err) {
//             console.error("Error fetching lookahead settings:", err);
//             return 4;
//         }
//     }, []);

//     const fetchForecastData = useCallback(async (currentFilterType, value) => {
//         const token = getToken();
//         if (!token) {
//             setError({ message: "No authentication token found. Please log in." });
//             setLoading(prev => ({ ...prev, chart: false }));
//             return;
//         }

//         setLoading(prev => ({ ...prev, chart: true }));
//         setError(null);

//         const past_weeks = weeksToShow;
//         const future_weeks = weeksToShow;

//         const body = {
//             past_weeks: past_weeks,
//             future_weeks: future_weeks,
//         };

//         if (currentFilterType === 'store' && value) {
//             body.store_ids = [value];
//         } else if (currentFilterType === 'sku' && value) {
//             body.skus = [value];
//         }

//         try {
//             const response = await fetch(`${API_BASE_URL}/forecast/weekly`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(body),
//             });

//             if (!response.ok) {
//                 throw new Error(`Failed to fetch forecast data (Status: ${response.status})`);
//             }

//             const data = await response.json();
            
//             const aggregatedData = (data.forecasts || []).reduce((accumulator, current) => {
//                 const week = current.week_start;
//                 if (!accumulator[week]) {
//                     accumulator[week] = { date: week, forecast: 0, actual: null };
//                 }
//                 accumulator[week].forecast += current.weekly_forecast;
//                 if (current.weekly_actual !== null) {
//                     accumulator[week].actual = (accumulator[week].actual || 0) + current.weekly_actual;
//                 }
//                 return accumulator;
//             }, {});

//             const formattedData = Object.values(aggregatedData).sort((a, b) => new Date(a.date) - new Date(b.date));
//             setChartData(formattedData);

//         } catch (error) {
//             setError(error);
//             setChartData([]);
//         } finally {
//             setLoading(prev => ({ ...prev, chart: false }));
//         }
//     }, [weeksToShow]);

//     const fetchStores = useCallback(async () => {
//         const token = getToken();
//         if (!token) return;
//         try {
//             const res = await fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } });
//             if (!res.ok) throw new Error('Failed to fetch stores');
//             const data = await res.json();
//             setStores(data.stores || []);
//         } catch (err) {
//             console.error(err);
//         }
//     }, []);

//     const fetchSkus = useCallback(async () => {
//         const token = getToken();
//         if (!token) return;
//         try {
//             const res = await fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } });
//             if (!res.ok) throw new Error('Failed to fetch SKUs');
//             const data = await res.json();
//             setSkus(data.skus || []);
//         } catch (err) {
//             console.error("Could not fetch SKUs:", err);
//             setSkus([]);
//         }
//     }, []);

//     const fetchAccuracyData = useCallback(async (level = 'store') => {
//         const token = getToken();
//         if (!token) return;
//         setLoading(prev => ({ ...prev, accuracy: true }));
//         try {
//             const res = await fetch(`${API_BASE_URL}/forecast/accuracy/${level}`, { headers: { 'Authorization': `Bearer ${token}` } });
//             if (!res.ok) throw new Error(`Failed to fetch ${level}-level accuracy`);
//             const flatData = await res.json();
//             const groupedData = (flatData || []).reduce((acc, item) => {
//                 const identifier = item.store_id || item.sku;
//                 if (!acc[identifier]) {
//                     acc[identifier] = {
//                         [level === 'store' ? 'store_id' : 'product_id']: identifier,
//                         weekly_accuracy: []
//                     };
//                 }
//                 acc[identifier].weekly_accuracy.push({
//                     week_start: item.week_start,
//                     mape: item.mape
//                 });
//                 return acc;
//             }, {});
//             setAccuracyData(Object.values(groupedData));
//         } catch (err) {
//             setError(err);
//             setAccuracyData([]);
//         } finally {
//             setLoading(prev => ({ ...prev, accuracy: false }));
//         }
//     }, []);

//     // ✨ FIX: This effect now focuses only on initialization.
//     useEffect(() => {
//         const initializePage = async () => {
//             const lookaheadWeeks = await fetchUserLookahead();
//             setWeeksToShow(lookaheadWeeks);
            
//             // Fetch non-critical data
//             fetchStores();
//             fetchSkus();
            
//             // Signal that initialization is complete
//             setIsInitialized(true);
//         };
//         initializePage();
//     }, [fetchUserLookahead, fetchStores, fetchSkus]);

//     // ✨ FIX: This effect now handles all data fetching and waits for initialization.
//     useEffect(() => {
//         // Guard clause: Do not run this effect until initialization is done.
//         if (!isInitialized) {
//             return;
//         }

//         if (weeksToShow < 1) {
//             setChartData([]);
//             return; 
//         }

//         if (filterType === 'all') {
//             fetchForecastData('all');
//         } else if (filterType === 'store' && selectedStore) {
//             fetchForecastData('store', selectedStore);
//         } else if (filterType === 'sku' && selectedSku) {
//             fetchForecastData('sku', selectedSku);
//         }
//     }, [isInitialized, filterType, selectedStore, selectedSku, weeksToShow, fetchForecastData]);
    
//     const tabs = [
//         { id: 'forecast', title: 'Forecast Visualization', onClick: null },
//         { id: 'accuracy', title: 'Performance & Accuracy', onClick: () => fetchAccuracyData('store') },
//         { id: 'logs', title: 'Run History', onClick: () => fetchLogs() },
//     ];
    
//     return (
//         <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-300 min-h-screen font-sans">
//             <div className="max-w-7xl mx-auto">
//                 <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
//                     <div className="text-center sm:text-left">
//                         <h1 className="text-3xl font-bold text-white">Demand Forecast Dashboard</h1>
//                         <p className="text-slate-400 mt-1">Analyze historical data and future sales predictions.</p>
//                     </div>
//                     <button
//                         onClick={() => navigate("/dashboard")}
//                         className="mt-4 sm:mt-0 px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
//                     >
//                         &larr; Back to Dashboard
//                     </button>
//                 </header>
                
//                 {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center"><FiAlertCircle className="mr-3" /> Error: {error.message}</div>}

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

//                 <main>
//                     <AnimatePresence mode="wait">
//                         {activeTab === 'forecast' && (
//                             <motion.div key="forecast" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
//                                 <FilterControls
//                                     filterType={filterType}
//                                     setFilterType={setFilterType}
//                                     selectedStore={selectedStore}
//                                     setSelectedStore={setSelectedStore}
//                                     selectedSku={selectedSku}
//                                     setSelectedSku={setSelectedSku}
//                                     stores={stores}
//                                     skus={skus}
//                                     weeksToShow={weeksToShow}
//                                     setWeeksToShow={setWeeksToShow}
//                                 />
//                                 <ForecastLineChart loading={loading.chart} data={chartData} />
//                             </motion.div>
//                         )}
//                         {activeTab === 'accuracy' && (
//                             <motion.div key="accuracy" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
//                                 <AccuracyPanel loading={loading.accuracy} data={accuracyData || []} fetchData={fetchAccuracyData} />
//                             </motion.div>
//                         )}
//                         {activeTab === 'logs' && (
//                              <motion.div key="logs" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
//                                 <LogsPanel loading={loading.logs} data={logData || []} />
//                              </motion.div>
//                         )}
//                     </AnimatePresence>
//                 </main>
//             </div>
//         </div>
//     );
// };

// // --- Child Components ---

// const FilterControls = ({ filterType, setFilterType, selectedStore, setSelectedStore, selectedSku, setSelectedSku, stores, skus, weeksToShow, setWeeksToShow }) => (
//     <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
//         <div className="flex items-center gap-2">
//             <label htmlFor="filterType" className="font-semibold text-slate-300">View By:</label>
//             <select
//                 id="filterType"
//                 value={filterType}
//                 onChange={(e) => {
//                     setFilterType(e.target.value);
//                     setSelectedStore('');
//                     setSelectedSku('');
//                 }}
//                 className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
//             >
//                 <option value="all">All</option>
//                 <option value="store">Store</option>
//                 <option value="sku">SKU</option>
//             </select>
//         </div>
//         <div className="flex items-center gap-2">
//             <label htmlFor="weeksInput" className="font-semibold text-slate-300">Weeks:</label>
//             <input
//                 id="weeksInput"
//                 type="number"
//                 value={weeksToShow}
//                 onChange={(e) => setWeeksToShow(Number(e.target.value))}
//                 className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 w-20"
//                 min="1"
//                 max="52"
//             />
//         </div>
        
//         <AnimatePresence>
//             {filterType === 'store' && (
//                 <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2">
//                     <label htmlFor="storeSelect" className="font-semibold text-slate-300">Select Store:</label>
//                     <select
//                         id="storeSelect"
//                         value={selectedStore}
//                         onChange={(e) => setSelectedStore(e.target.value)}
//                         className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 min-w-[200px]"
//                     >
//                         <option value="" disabled>Select a store...</option>
//                         {stores.map(store => (
//                             <option key={store.store_id} value={store.store_id}>
//                                 {store.name} ({store.store_id})
//                             </option>
//                         ))}
//                     </select>
//                 </motion.div>
//             )}
//         </AnimatePresence>

//         <AnimatePresence>
//             {filterType === 'sku' && (
//                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2">
//                     <label htmlFor="skuSelect" className="font-semibold text-slate-300">Select SKU:</label>
//                     <select
//                         id="skuSelect"
//                         value={selectedSku}
//                         onChange={(e) => setSelectedSku(e.target.value)}
//                         className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 min-w-[200px]"
//                     >
//                         <option value="" disabled>Select a SKU...</option>
//                         {skus.map(sku => (
//                             <option key={sku} value={sku}>{sku}</option>
//                         ))}
//                     </select>
//                  </motion.div>
//             )}
//         </AnimatePresence>
//     </div>
// );

// const ForecastLineChart = ({ loading, data }) => (
//     <motion.div 
//         className="bg-slate-800/50 p-6 rounded-xl shadow-lg h-[500px] border border-slate-700"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//     >
//         <h2 className="text-xl font-semibold mb-4 text-white">Weekly Sales Analysis</h2>
//         {loading ? (
//             <LoadingSpinner />
//         ) : !data || data.length === 0 ? (
//              <div className="flex items-center justify-center h-full text-slate-400">
//                 <FiBarChart2 className="mr-2" />No data available for the selected filter.
//              </div>
//         ) : (
//             <ResponsiveContainer width="100%" height="90%">
//                 <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
//                     <XAxis 
//                         dataKey="date" 
//                         stroke="#94a3b8" 
//                         fontSize={12} 
//                         tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
//                     />
//                     <YAxis stroke="#94a3b8" fontSize={12} />
//                     <Tooltip 
//                         contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} 
//                         labelStyle={{ color: '#cbd5e1' }}
//                     />
//                     <Legend wrapperStyle={{ color: '#cbd5e1' }} />
//                     <Line 
//                         type="monotone" 
//                         dataKey="actual" 
//                         stroke="#818cf8"
//                         strokeWidth={2.5}
//                         name="Actual Sales" 
//                         dot={{ r: 4, strokeWidth: 2 }}
//                         activeDot={{ r: 6 }}
//                         connectNulls
//                         animationDuration={1000}
//                     />
//                     <Line 
//                         type="monotone" 
//                         dataKey="forecast" 
//                         stroke="#34d399"
//                         strokeWidth={2.5}
//                         strokeDasharray="5 5"
//                         name="Forecasted Sales" 
//                         dot={false}
//                         activeDot={{ r: 6 }}
//                         animationDuration={1000}
//                         animationEasing="ease-in-out"
//                     />
//                 </LineChart>
//             </ResponsiveContainer>
//         )}
//     </motion.div>
// );

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
//                         {Array.isArray(data) && data.map(item => 
//                             (item.weekly_accuracy || []).map((acc, index) => (
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

// const LogsPanel = ({ loading, data }) => {
//     const getStatusBadge = (status) => {
//         switch (status?.toLowerCase()) {
//             case 'completed':
//                 return 'bg-green-500/20 text-green-400';
//             case 'running':
//                 return 'bg-yellow-500/20 text-yellow-400';
//             case 'failed':
//                 return 'bg-red-500/20 text-red-400';
//             default:
//                 return 'bg-slate-600/50 text-slate-300';
//         }
//     };

//     return (
//         <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
//             <h2 className="text-xl font-semibold text-white mb-4">Forecast Run History</h2>
//             {loading ? <LoadingSpinner /> : (
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left">
//                         <thead className="border-b-2 border-slate-600">
//                             <tr>
//                                 <th className="p-3 text-sm font-semibold uppercase text-slate-400">Run Time (UTC)</th>
//                                 <th className="p-3 text-sm font-semibold uppercase text-slate-400">Forecast Horizon</th>
//                                 <th className="p-3 text-sm font-semibold uppercase text-slate-400">Status</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {Array.isArray(data) && data.map((log) => (
//                                 <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
//                                     <td className="p-3 whitespace-nowrap">
//                                         <FiClock className="inline mr-2 text-slate-400" />
//                                         {log.run_time}
//                                     </td>
//                                     <td className="p-3">
//                                         {log.n_weeks !== null ? `${log.n_weeks} weeks` : 'N/A'}
//                                     </td>
//                                     <td className="p-3">
//                                         <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(log.status)}`}>
//                                             {log.status || 'Unknown'}
//                                         </span>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// }; 

// export default ForecastPage;



import React, { useState, useEffect, useCallback } from 'react';
import { FiBarChart2, FiCpu, FiClock, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiTarget, FiInfo } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    const [weeksToShow, setWeeksToShow] = useState(4);
    const [accuracyData, setAccuracyData] = useState([]);
    const [logData, setLogData] = useState([]);
    const [stores, setStores] = useState([]);
    const [skus, setSkus] = useState([]);

    const [filterType, setFilterType] = useState('all');
    const [selectedStore, setSelectedStore] = useState('');
    const [selectedSku, setSelectedSku] = useState('');

    const [loading, setLoading] = useState({
        chart: true,
        accuracy: false,
        logs: false,
        run: false,
    });
    const [error, setError] = useState(null);
    
    // ✨ FIX: State to prevent initial data fetch before settings are loaded.
    const [isInitialized, setIsInitialized] = useState(false);

    // --- API Fetching Functions ---
    const getToken = () => localStorage.getItem('token');

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

    const fetchUserLookahead = useCallback(async () => {
        const token = getToken();
        if (!token) return 4;
        try {
            const res = await fetch(`${API_BASE_URL}/user/lookahead_days`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                console.error("Failed to fetch lookahead settings, defaulting to 4 weeks.");
                return 4;
            }
            const data = await res.json();
            const lookaheadDays = data.lookahead_days || 28;
            return Math.ceil(lookaheadDays / 7);
        } catch (err) {
            console.error("Error fetching lookahead settings:", err);
            return 4;
        }
    }, []);

    const fetchForecastData = useCallback(async (currentFilterType, value) => {
        const token = getToken();
        if (!token) {
            setError({ message: "No authentication token found. Please log in." });
            setLoading(prev => ({ ...prev, chart: false }));
            return;
        }

        setLoading(prev => ({ ...prev, chart: true }));
        setError(null);

        const past_weeks = weeksToShow;
        const future_weeks = weeksToShow;

        const body = {
            past_weeks: past_weeks,
            future_weeks: future_weeks,
        };

        if (currentFilterType === 'store' && value) {
            body.store_ids = [value];
        } else if (currentFilterType === 'sku' && value) {
            body.skus = [value];
        }

        try {
            const response = await fetch(`${API_BASE_URL}/forecast/weekly`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch forecast data (Status: ${response.status})`);
            }

            const data = await response.json();
            
            const aggregatedData = (data.forecasts || []).reduce((accumulator, current) => {
                const week = current.week_start;
                if (!accumulator[week]) {
                    accumulator[week] = { date: week, forecast: 0, actual: null };
                }
                accumulator[week].forecast += current.weekly_forecast;
                if (current.weekly_actual !== null) {
                    accumulator[week].actual = (accumulator[week].actual || 0) + current.weekly_actual;
                }
                return accumulator;
            }, {});

            const formattedData = Object.values(aggregatedData).sort((a, b) => new Date(a.date) - new Date(b.date));
            setChartData(formattedData);

        } catch (error) {
            setError(error);
            setChartData([]);
        } finally {
            setLoading(prev => ({ ...prev, chart: false }));
        }
    }, [weeksToShow]);

    const fetchStores = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/stores`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch stores');
            const data = await res.json();
            setStores(data.stores || []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchSkus = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/skus`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch SKUs');
            const data = await res.json();
            setSkus(data.skus || []);
        } catch (err) {
            console.error("Could not fetch SKUs:", err);
            setSkus([]);
        }
    }, []);

    // ⭐️ MODIFIED: fetchAccuracyData now handles the new data structure from the backend.
    const fetchAccuracyData = useCallback(async (level = 'store') => {
        const token = getToken();
        if (!token) return;
        setLoading(prev => ({ ...prev, accuracy: true }));
        try {
            // The backend now provides dedicated endpoints that respect the user's lookahead setting.
            const res = await fetch(`${API_BASE_URL}/forecast/accuracy/${level}`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!res.ok) throw new Error(`Failed to fetch ${level}-level accuracy`);
            
            const flatData = await res.json();

            // Group the flat data for display purposes (to use rowSpan in the table)
            const groupedData = (flatData || []).reduce((acc, item) => {
                const identifier = item.store_id || item.sku;
                if (!acc[identifier]) {
                    acc[identifier] = {
                        identifier: identifier,
                        weekly_accuracy: []
                    };
                }
                acc[identifier].weekly_accuracy.push({
                    week_start: item.week_start,
                    actuals: item.actuals,
                    predicted: item.predicted,
                    bias: item.bias,
                    wmape: item.wmape,
                    mae: item.mae,
                });
                return acc;
            }, {});
            
            setAccuracyData(Object.values(groupedData));

        } catch (err) {
            setError(err);
            setAccuracyData([]);
        } finally {
            setLoading(prev => ({ ...prev, accuracy: false }));
        }
    }, []);

    // ✨ FIX: This effect now focuses only on initialization.
    useEffect(() => {
        const initializePage = async () => {
            const lookaheadWeeks = await fetchUserLookahead();
            setWeeksToShow(lookaheadWeeks);
            
            // Fetch non-critical data
            fetchStores();
            fetchSkus();
            
            // Signal that initialization is complete
            setIsInitialized(true);
        };
        initializePage();
    }, [fetchUserLookahead, fetchStores, fetchSkus]);

    // ✨ FIX: This effect now handles all data fetching and waits for initialization.
    useEffect(() => {
        // Guard clause: Do not run this effect until initialization is done.
        if (!isInitialized) {
            return;
        }

        if (weeksToShow < 1) {
            setChartData([]);
            return; 
        }

        if (filterType === 'all') {
            fetchForecastData('all');
        } else if (filterType === 'store' && selectedStore) {
            fetchForecastData('store', selectedStore);
        } else if (filterType === 'sku' && selectedSku) {
            fetchForecastData('sku', selectedSku);
        }
    }, [isInitialized, filterType, selectedStore, selectedSku, weeksToShow, fetchForecastData]);
    
    const tabs = [
        { id: 'forecast', title: 'Forecast Visualization', onClick: null },
        { id: 'accuracy', title: 'Performance & Accuracy', onClick: () => fetchAccuracyData('store') },
        { id: 'logs', title: 'Run History', onClick: () => fetchLogs() },
    ];
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-300 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-white">Demand Forecast Dashboard</h1>
                        <p className="text-slate-400 mt-1">Analyze historical data and future sales predictions.</p>
                    </div>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="mt-4 sm:mt-0 px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
                    >
                        &larr; Back to Dashboard
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
                                <FilterControls
                                    filterType={filterType}
                                    setFilterType={setFilterType}
                                    selectedStore={selectedStore}
                                    setSelectedStore={setSelectedStore}
                                    selectedSku={selectedSku}
                                    setSelectedSku={setSelectedSku}
                                    stores={stores}
                                    skus={skus}
                                    weeksToShow={weeksToShow}
                                    setWeeksToShow={setWeeksToShow}
                                />
                                <ForecastLineChart loading={loading.chart} data={chartData} />
                            </motion.div>
                        )}
                        {activeTab === 'accuracy' && (
                            <motion.div key="accuracy" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
                                <AccuracyPanel 
                                    loading={loading.accuracy} 
                                    data={accuracyData || []} 
                                    fetchData={fetchAccuracyData}
                                    getToken={getToken} // Pass getToken for internal fetching
                                />
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

const FilterControls = ({ filterType, setFilterType, selectedStore, setSelectedStore, selectedSku, setSelectedSku, stores, skus, weeksToShow, setWeeksToShow }) => (
    <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2">
            <label htmlFor="filterType" className="font-semibold text-slate-300">View By:</label>
            <select
                id="filterType"
                value={filterType}
                onChange={(e) => {
                    setFilterType(e.target.value);
                    setSelectedStore('');
                    setSelectedSku('');
                }}
                className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
            >
                <option value="all">All</option>
                <option value="store">Store</option>
                <option value="sku">SKU</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
            <label htmlFor="weeksInput" className="font-semibold text-slate-300">Weeks:</label>
            <input
                id="weeksInput"
                type="number"
                value={weeksToShow}
                onChange={(e) => setWeeksToShow(Number(e.target.value))}
                className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 w-20"
                min="1"
                max="52"
            />
        </div>
        
        <AnimatePresence>
            {filterType === 'store' && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2">
                    <label htmlFor="storeSelect" className="font-semibold text-slate-300">Select Store:</label>
                    <select
                        id="storeSelect"
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 min-w-[200px]"
                    >
                        <option value="" disabled>Select a store...</option>
                        {stores.map(store => (
                            <option key={store.store_id} value={store.store_id}>
                                {store.name} ({store.store_id})
                            </option>
                        ))}
                    </select>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {filterType === 'sku' && (
                 <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2">
                    <label htmlFor="skuSelect" className="font-semibold text-slate-300">Select SKU:</label>
                    <select
                        id="skuSelect"
                        value={selectedSku}
                        onChange={(e) => setSelectedSku(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 min-w-[200px]"
                    >
                        <option value="" disabled>Select a SKU...</option>
                        {skus.map(sku => (
                            <option key={sku} value={sku}>{sku}</option>
                        ))}
                    </select>
                 </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const ForecastLineChart = ({ loading, data }) => (
    <motion.div 
        className="bg-slate-800/50 p-6 rounded-xl shadow-lg h-[500px] border border-slate-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <h2 className="text-xl font-semibold mb-4 text-white">Weekly Sales Analysis</h2>
        {loading ? (
            <LoadingSpinner />
        ) : !data || data.length === 0 ? (
             <div className="flex items-center justify-center h-full text-slate-400">
                <FiBarChart2 className="mr-2" />No data available for the selected filter.
             </div>
        ) : (
            <ResponsiveContainer width="100%" height="90%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }} 
                        labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                    <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#818cf8"
                        strokeWidth={2.5}
                        name="Actual Sales" 
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                        animationDuration={1000}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#34d399"
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        name="Forecasted Sales" 
                        dot={false}
                        activeDot={{ r: 6 }}
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                    />
                </LineChart>
            </ResponsiveContainer>
        )}
    </motion.div>
);

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

// ⭐️ NEW: A component to display overall accuracy metric cards.
const OverallStatsDisplay = ({ stats, loading }) => {
    if (loading) return <div className="text-center p-4">Loading overall stats...</div>;
    if (!stats) return <div className="text-center p-4 text-slate-400">No overall accuracy data available.</div>;

    const biasColor = stats.bias > 2 ? 'text-red-400' : stats.bias < -2 ? 'text-yellow-400' : 'text-green-400';

    return (
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Overall Performance (Last {stats.weeks} Weeks)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<FiTrendingUp className="text-indigo-400" />}
                    label="Total Actuals"
                    value={stats.actuals.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                />
                <StatCard
                    icon={<FiCpu className="text-teal-400" />}
                    label="Total Forecast"
                    value={stats.forecast.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                />
                 <StatCard
                    icon={<FiTarget className="text-orange-400" />}
                    label="WMAPE"
                    value={`${stats.wmape.toFixed(2)}%`}
                    tooltip="Weighted Mean Absolute Percentage Error: The average forecast error weighted by volume."
                />
                <StatCard
                    icon={<FiTrendingDown className={biasColor} />}
                    label="Bias"
                    value={`${stats.bias.toFixed(2)}%`}
                    tooltip="Indicates if forecasts are consistently high (positive) or low (negative)."
                />
            </div>
        </div>
    );
};

// ⭐️ NEW: A small helper component for the stat cards.
const StatCard = ({ icon, label, value, tooltip }) => (
    <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
        <div className="bg-slate-900/50 p-3 rounded-full text-2xl">{icon}</div>
        <div>
            <div className="text-slate-400 text-sm flex items-center">
                {label}
                {tooltip && (
                    <div className="relative ml-1 group">
                        <FiInfo className="cursor-pointer" />
                        <div className="absolute bottom-full mb-2 w-60 p-2 text-xs bg-slate-900 text-slate-200 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                            {tooltip}
                        </div>
                    </div>
                )}
            </div>
            <div className="text-xl font-bold text-white">{value}</div>
        </div>
    </div>
);


// ⭐️ MODIFIED: The AccuracyPanel now includes the overall stats and the updated detailed table.
const AccuracyPanel = ({ loading, data, fetchData, getToken }) => {
    const [overallStats, setOverallStats] = useState(null);
    const [loadingOverall, setLoadingOverall] = useState(true);

    useEffect(() => {
        const fetchOverallAccuracy = async () => {
            const token = getToken();
            if (!token) {
                setLoadingOverall(false);
                return;
            }
            setLoadingOverall(true);
            try {
                const res = await fetch(`${API_BASE_URL}/forecast/accuracy/overall`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch overall accuracy');
                const data = await res.json();
                
                if (data && data.results && data.results.length > 0) {
                    const totalActuals = data.results.reduce((sum, week) => sum + week.actuals, 0);
                    const totalForecast = data.results.reduce((sum, week) => sum + week.forecast, 0);
    
                    const overallBias = totalActuals > 0 ? ((totalForecast - totalActuals) / totalActuals) * 100 : 0;
                    
                    // A weighted average of weekly WMAPEs is a good approximation.
                    const weightedWmapeSum = data.results.reduce((sum, week) => sum + (week.wmape * week.actuals), 0);
                    const overallWmape = totalActuals > 0 ? weightedWmapeSum / totalActuals : 0;
    
                    setOverallStats({
                        actuals: totalActuals,
                        forecast: totalForecast,
                        bias: overallBias,
                        wmape: overallWmape,
                        weeks: data.results.length
                    });
                } else {
                    setOverallStats(null);
                }
            } catch (error) {
                console.error("Error fetching overall accuracy:", error);
                setOverallStats(null);
            } finally {
                setLoadingOverall(false);
            }
        };

        fetchOverallAccuracy();
    }, [getToken]);

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
            <OverallStatsDisplay stats={overallStats} loading={loadingOverall} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-3 sm:mb-0">Detailed Accuracy Breakdown</h2>
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
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">Identifier</th>
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">Week Start</th>
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">Actuals</th>
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">Forecast</th>
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">Bias (%)</th>
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">WMAPE (%)</th>
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">MAE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(data) && data.length > 0 ? data.map(item => 
                                (item.weekly_accuracy || []).map((acc, index) => (
                                    <tr key={`${item.identifier}-${acc.week_start}`} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                                        {index === 0 && <td rowSpan={item.weekly_accuracy.length} className="p-3 font-bold text-white align-top">{item.identifier}</td>}
                                        <td className="p-3 whitespace-nowrap">{acc.week_start}</td>
                                        <td className="p-3">{acc.actuals?.toFixed(2) ?? 'N/A'}</td>
                                        <td className="p-3">{acc.predicted?.toFixed(2) ?? 'N/A'}</td>
                                        <td className="p-3 font-medium text-cyan-400">{acc.bias?.toFixed(2) ?? 'N/A'}%</td>
                                        <td className="p-3 font-medium text-teal-400">{acc.wmape?.toFixed(2) ?? 'N/A'}%</td>
                                        <td className="p-3 font-medium text-amber-400">{acc.mae?.toFixed(2) ?? 'N/A'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center p-8 text-slate-400">
                                        No detailed accuracy data to display.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const LogsPanel = ({ loading, data }) => {
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-green-500/20 text-green-400';
            case 'running':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'failed':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-slate-600/50 text-slate-300';
        }
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Forecast Run History</h2>
            {loading ? <LoadingSpinner /> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-slate-600">
                            <tr>
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">Run Time (UTC)</th>
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">Forecast Horizon</th>
                                <th className="p-3 text-sm font-semibold uppercase text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(data) && data.map((log) => (
                                <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                                    <td className="p-3 whitespace-nowrap">
                                        <FiClock className="inline mr-2 text-slate-400" />
                                        {log.run_time}
                                    </td>
                                    <td className="p-3">
                                        {log.n_weeks !== null ? `${log.n_weeks} weeks` : 'N/A'}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(log.status)}`}>
                                            {log.status || 'Unknown'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}; 

export default ForecastPage;