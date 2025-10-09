// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { FiSliders, FiDownload, FiPlayCircle, FiArrowLeft, FiLoader, FiAlertTriangle, FiFileText } from 'react-icons/fi';
// import { motion } from 'framer-motion';

// // Set the base URL for your API
// const BASE_URL = "http://localhost:5500";

// // --- Reusable UI Components ---
// const StatCard = ({ title, value, description }) => (
//     <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
//         <p className="text-sm text-slate-400">{title}</p>
//         <p className="text-2xl font-bold text-white mt-1">{value}</p>
//         <p className="text-xs text-slate-500 mt-2">{description}</p>
//     </div>
// );

// const Rebalancer = () => {
//     const navigate = useNavigate();
//     const [ddos, setDdos] = useState(28);
//     const [summaryData, setSummaryData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [hasRun, setHasRun] = useState(false);

//     const handleRunRebalancer = async () => {
//         setLoading(true);
//         setError('');
//         setSummaryData([]);
//         setHasRun(true);
//         const token = localStorage.getItem("token");

//         try {
//             const response = await axios.post(
//                 `${BASE_URL}/api/rebalance`,
//                 { ddos_days: parseInt(ddos, 10) },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             if (response.data.summary) {
//                 setSummaryData(response.data.summary);
//             } else {
//                 setError("Received a valid response, but no summary data was found.");
//             }
//         } catch (err) {
//             const errorMessage = err.response?.data?.error || "An unexpected error occurred while running the rebalancer.";
//             console.error("Rebalancer error:", err);
//             setError(errorMessage);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleDownloadCsv = async () => {
//         const token = localStorage.getItem("token");
//         try {
//             const response = await axios.post(
//                 `${BASE_URL}/api/rebalance/download`,
//                 { ddos_days: parseInt(ddos, 10) },
//                 {
//                     headers: { Authorization: `Bearer ${token}` },
//                     responseType: 'blob', // Important for handling file downloads
//                 }
//             );

//             // Create a URL for the blob and trigger download
//             const url = window.URL.createObjectURL(new Blob([response.data]));
//             const link = document.createElement('a');
//             const today = new Date().toISOString().split('T')[0];
//             link.href = url;
//             link.setAttribute('download', `rebalancing_recommendations_${today}.csv`);
//             document.body.appendChild(link);
//             link.click();
//             link.parentNode.removeChild(link);

//         } catch (err) {
//             const errorMessage = err.response?.data?.error || "Failed to download the report.";
//             console.error("Download error:", err);
//             setError(errorMessage);
//         }
//     };

//     return (
//         <div className="min-h-screen w-full bg-slate-900 text-white font-sans p-6">
//             <motion.div
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5 }}
//                 className="max-w-7xl mx-auto"
//             >
//                 {/* Header */}
//                 <div className="flex items-center mb-8">
//                     <button
//                         onClick={() => navigate('/dashboard')}
//                         className="p-2 rounded-full hover:bg-slate-800 transition-colors mr-4"
//                         aria-label="Back to Dashboard"
//                     >
//                         <FiArrowLeft size={24} />
//                     </button>
//                     <h1 className="text-3xl font-bold">Inventory Rebalancer</h1>
//                 </div>

//                 {/* Main Content Grid */}
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                     {/* Left Column: Explanation and Controls */}
//                     <div className="lg:col-span-1 space-y-6">
//                         <motion.div
//                             initial={{ opacity: 0, x: -20 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ delay: 0.2, duration: 0.5 }}
//                             className="bg-slate-800 p-6 rounded-lg border border-slate-700"
//                         >
//                             <h2 className="text-xl font-semibold text-blue-400 mb-3">How Rebalancing Works</h2>
//                             <p className="text-sm text-slate-400 leading-relaxed">
//                                 When sales patterns differ from forecasts, rebalancing shifts inventory between locations to better meet emergent demand. The optimizer finds the most cost-effective transfers to cover shortages using excess stock from other nodes.
//                             </p>
//                         </motion.div>

//                         <motion.div
//                             initial={{ opacity: 0, x: -20 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ delay: 0.3, duration: 0.5 }}
//                             className="bg-slate-800 p-6 rounded-lg border border-slate-700"
//                         >
//                             <h2 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
//                                 <FiSliders className="mr-3" />
//                                 Controls
//                             </h2>
//                             <div className="space-y-4">
//                                 <div>
//                                     <label htmlFor="ddos" className="block text-sm font-medium text-slate-300 mb-2">
//                                         Desired Days of Supply (DDOS)
//                                     </label>
//                                     <input
//                                         type="number"
//                                         id="ddos"
//                                         value={ddos}
//                                         onChange={(e) => setDdos(e.target.value)}
//                                         className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                         placeholder="e.g., 28"
//                                     />
//                                     <p className="text-xs text-slate-500 mt-2">
//                                         The number of days of supply you want to maintain at each location.
//                                     </p>
//                                 </div>
//                                 <button
//                                     onClick={handleRunRebalancer}
//                                     disabled={loading}
//                                     className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300"
//                                 >
//                                     {loading ? (
//                                         <>
//                                             <FiLoader className="animate-spin mr-2" />
//                                             Calculating...
//                                         </>
//                                     ) : (
//                                         <>
//                                             <FiPlayCircle className="mr-2" />
//                                             Run Rebalancer
//                                         </>
//                                     )}
//                                 </button>
//                             </div>
//                         </motion.div>
//                     </div>

//                     {/* Right Column: Results Summary */}
//                     <motion.div
//                         initial={{ opacity: 0, x: 20 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: 0.4, duration: 0.5 }}
//                         className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700"
//                     >
//                         <div className="flex justify-between items-center mb-4">
//                             <h2 className="text-xl font-semibold text-blue-400">Rebalancing Summary</h2>
//                             {summaryData.length > 0 && (
//                                 <button
//                                     onClick={handleDownloadCsv}
//                                     className="flex items-center bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
//                                 >
//                                     <FiDownload className="mr-2" />
//                                     Download Detailed Report
//                                 </button>
//                             )}
//                         </div>

//                         {error && (
//                             <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md flex items-center">
//                                 <FiAlertTriangle className="mr-3" />
//                                 <p>{error}</p>
//                             </div>
//                         )}

//                         {!hasRun && !loading && (
//                              <div className="text-center py-16 text-slate-500">
//                                 <FiFileText size={48} className="mx-auto mb-4" />
//                                 <h3 className="text-lg font-semibold text-slate-400">Run the Rebalancer</h3>
//                                 <p>Set your DDOS and click "Run Rebalancer" to generate transfer recommendations.</p>
//                             </div>
//                         )}

//                         {loading && (
//                             <div className="text-center py-16 text-slate-400">
//                                 <FiLoader size={40} className="animate-spin mx-auto mb-4" />
//                                 <p>Optimizing inventory transfers...</p>
//                             </div>
//                         )}

//                         {!loading && hasRun && summaryData.length === 0 && !error && (
//                             <div className="text-center py-16 text-slate-500">
//                                 <h3 className="text-lg font-semibold text-slate-400">No Transfers Recommended</h3>
//                                 <p>The optimizer determined that no inventory transfers are necessary at this time.</p>
//                             </div>
//                         )}
                        
//                         {summaryData.length > 0 && !loading && (
//                             <div className="overflow-x-auto">
//                                 <table className="min-w-full divide-y divide-slate-700">
//                                     <thead className="bg-slate-900/50">
//                                         <tr>
//                                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Source</th>
//                                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Destination</th>
//                                             <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Distinct SKUs</th>
//                                             <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Total Units to Transfer</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody className="bg-slate-800 divide-y divide-slate-700">
//                                         {summaryData.map((row, index) => (
//                                             <motion.tr 
//                                                 key={index}
//                                                 initial={{ opacity: 0 }}
//                                                 animate={{ opacity: 1 }}
//                                                 transition={{ delay: index * 0.05 }}
//                                             >
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.src}</td>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row.dest}</td>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-center">{row.distinct_skus}</td>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-400 text-right">{row.total_units.toLocaleString()}</td>
//                                             </motion.tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         )}
//                     </motion.div>
//                 </div>
//             </motion.div>
//         </div>
//     );
// };

// export default Rebalancer;




import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiSliders, FiDownload, FiPlayCircle, FiArrowLeft, FiLoader, FiAlertTriangle, FiFileText, FiMap } from 'react-icons/fi';
import { motion } from 'framer-motion';
import TransferMap from '../components/TransferMap'; // Import the map component
import Chatbot from '../components/Chatbot';

// Set the base URL for your API
const BASE_URL = "http://localhost:5500";

const Rebalancer = () => {
    const navigate = useNavigate();
    const [ddos, setDdos] = useState(28);
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasRun, setHasRun] = useState(false);

    const handleRunRebalancer = async () => {
        setLoading(true);
        setError('');
        setSummaryData([]);
        setHasRun(true);
        const token = localStorage.getItem("token");

        try {
            const response = await axios.post(
                `${BASE_URL}/api/rebalance`,
                { ddos_days: parseInt(ddos, 10) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.summary) {
                setSummaryData(response.data.summary);
            } else {
                setError("Received a valid response, but no summary data was found.");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || "An unexpected error occurred while running the rebalancer.";
            console.error("Rebalancer error:", err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCsv = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.post(
                `${BASE_URL}/api/rebalance/download`,
                { ddos_days: parseInt(ddos, 10) },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const today = new Date().toISOString().split('T')[0];
            link.href = url;
            link.setAttribute('download', `rebalancing_recommendations_${today}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

        } catch (err) {
            const errorMessage = err.response?.data?.error || "Failed to download the report.";
            console.error("Download error:", err);
            setError(errorMessage);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 text-white font-sans p-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-full hover:bg-slate-800 transition-colors mr-4"
                        aria-label="Back to Dashboard"
                    >
                        <FiArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold">Inventory Rebalancer</h1>
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col gap-8">
                    {/* Top Row: Controls and Visualization */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> {/* <-- CHANGED to lg:grid-cols-3 */}
                        
                        {/* Left Column (1/3 width): Explanation and Controls */}
                        <div className="lg:col-span-1 space-y-6"> {/* <-- ADDED lg:col-span-1 */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="bg-slate-800 p-6 rounded-lg border border-slate-700"
                            >
                                <h2 className="text-xl font-semibold text-blue-400 mb-3">How Rebalancing Works</h2>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    When sales patterns differ from forecasts, rebalancing shifts inventory between locations to better meet emergent demand. The optimizer finds the most cost-effective transfers to cover shortages using excess stock from other nodes.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="bg-slate-800 p-6 rounded-lg border border-slate-700"
                            >
                                <h2 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                                    <FiSliders className="mr-3" />
                                    Controls
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="ddos" className="block text-sm font-medium text-slate-300 mb-2">
                                            Desired Days of Supply (DDOS)
                                        </label>
                                        <input
                                            type="number"
                                            id="ddos"
                                            value={ddos}
                                            onChange={(e) => setDdos(e.target.value)}
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 28"
                                        />
                                        <p className="text-xs text-slate-500 mt-2">
                                            The number of days of supply you want to maintain at each location.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleRunRebalancer}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300"
                                    >
                                        {loading ? (
                                            <><FiLoader className="animate-spin mr-2" />Calculating...</>
                                        ) : (
                                            <><FiPlayCircle className="mr-2" />Run Rebalancer</>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column (2/3 width): Transfer Visualization */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col min-h-[400px]" // <-- ADDED lg:col-span-2
                        >
                            <h2 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                                <FiMap className="mr-3" />
                                Transfer Visualization
                            </h2>
                            <div className="flex-grow rounded-md overflow-hidden">
                                {summaryData.length > 0 && !loading ? (
                                    <TransferMap summaryData={summaryData} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-900/50 rounded-lg">
                                        <FiMap size={48} className="mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-400">Map Unavailable</h3>
                                        <p className="text-center px-4">Run the rebalancer to visualize the recommended transfers.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Row: Rebalancing Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="bg-slate-800 p-6 rounded-lg border border-slate-700"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-blue-400">Rebalancing Summary</h2>
                            {summaryData.length > 0 && (
                                <button
                                    onClick={handleDownloadCsv}
                                    className="flex items-center bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                                >
                                    <FiDownload className="mr-2" />
                                    Download Detailed Report
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md flex items-center">
                                <FiAlertTriangle className="mr-3" /><p>{error}</p>
                            </div>
                        )}

                        {!hasRun && !loading && (
                             <div className="text-center py-16 text-slate-500">
                                 <FiFileText size={48} className="mx-auto mb-4" />
                                 <h3 className="text-lg font-semibold text-slate-400">Run the Rebalancer</h3>
                                 <p>Set your DDOS and click "Run Rebalancer" to generate transfer recommendations.</p>
                             </div>
                        )}

                        {loading && (
                            <div className="text-center py-16 text-slate-400">
                                <FiLoader size={40} className="animate-spin mx-auto mb-4" />
                                <p>Optimizing inventory transfers...</p>
                            </div>
                        )}

                        {!loading && hasRun && summaryData.length === 0 && !error && (
                            <div className="text-center py-16 text-slate-500">
                                <h3 className="text-lg font-semibold text-slate-400">No Transfers Recommended</h3>
                                <p>The optimizer determined that no inventory transfers are necessary at this time.</p>
                            </div>
                        )}
                        
                        {summaryData.length > 0 && !loading && (
                            <div className="overflow-auto h-96">
                                <table className="min-w-full divide-y divide-slate-700">
                                    <thead className="bg-slate-900/50 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Source</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Destination</th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Distinct SKUs</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Total Units to Transfer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                                        {summaryData.map((row, index) => (
                                            <motion.tr 
                                                key={`${row.src}-${row.dest}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.src}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row.dest}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-center">{row.distinct_skus}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-400 text-right">{row.total_units.toLocaleString()}</td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        <Chatbot/>
        </div>
    );
};

export default Rebalancer;