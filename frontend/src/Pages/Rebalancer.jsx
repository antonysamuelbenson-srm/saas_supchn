import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    // Original Icons
    FiSliders, FiDownload, FiPlayCircle, FiArrowLeft, FiLoader, FiAlertTriangle, FiFileText, FiMap,
    // Icons for Sidebar
    FiMenu, FiX, FiTrendingUp, FiSettings, FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import TransferMap from '../components/TransferMap'; // Import the map component
import Chatbot from '../components/Chatbot';

// Set the base URL for your API
const BASE_URL = "http://localhost:5001";

// --- START: Added Sidebar Component (Copied from Dashboard) ---
const Sidebar = React.memo(({ isOpen, onClose, permissions }) => {
    const navigate = useNavigate();
    const hasPermission = (route) => permissions.includes(route);
    return (
        <div className={`bg-slate-800 border-r border-slate-700 shadow-lg transition-all duration-300 ${isOpen ? "w-64 p-6" : "w-0 p-0 overflow-hidden"} flex flex-col`}>
            {isOpen && (
                <>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-white text-xl font-bold">Control</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white"><FiX size={24} /></button>
                    </div>
                    <nav className="space-y-3">
                        {hasPermission("POST:/store_upload") && (
                            <button onClick={() => navigate("/file-upload")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiUpload className="mr-3" /> File Upload</button>
                        )}
                        {hasPermission("GET:/admin/users") && (
                            <button onClick={() => navigate("/adminprivileges")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiSettings className="mr-3" /> Manage Users</button>
                        )}
                        {hasPermission("GET:/dashboard") && (
                            <button onClick={() => navigate("/dashboard")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiBarChart2 className="mr-3" /> Reports</button>
                        )}
                        <button onClick={() => navigate("/forecast")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiTrendingUp className="mr-3" /> Forecast</button>
                        <button onClick={() => navigate("/rebalancer")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiRefreshCw className="mr-3" /> Rebalancer</button>
                        {hasPermission("POST:/config/apply-formula") && (
                            <button onClick={() => navigate("/Config")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiShoppingBag className="mr-3" /> Configuration</button>
                        )}
                        <div className="!mt-auto pt-4 border-t border-slate-700">
                            <button onClick={() => navigate("/")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiLogOut className="mr-3" /> Logout</button>
                        </div>
                    </nav>
                </>
            )}
        </div>
    );
});
// --- END: Added Sidebar Component ---


const Rebalancer = () => {
    const navigate = useNavigate();

    // --- START: Added Sidebar State ---
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [permissions, setPermissions] = useState([]);
    // --- END: Added Sidebar State ---

    const [ddos, setDdos] = useState(28);
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasRun, setHasRun] = useState(false);

    // ✨ 1. Define the questions for this page
    const rebalancerQuestions = [
        "What does DDOS mean?",
        "Why should I rebalance inventory?",
        "How are transfer costs calculated?",
        "Which location has the most excess stock?",
        "Can I download a detailed report?",
    ];

    // --- START: Added useEffect to fetch permissions ---
    useEffect(() => {
        const fetchPermissions = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/"); // Redirect to login if no token
                return;
            }
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
                setPermissions(permRes.data.allowed_routes || []);
            } catch (err) {
                console.error("Failed to fetch permissions", err);
                if (err.response?.status === 401) {
                    navigate("/");
                }
            }
        };
        fetchPermissions();
    }, [navigate]);
    // --- END: Added useEffect to fetch permissions ---

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
        setError(''); // Clear previous errors

        try {
            const response = await axios.post(
                `${BASE_URL}/api/rebalance/download`,
                { ddos_days: parseInt(ddos, 10) },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob', // This is correct
                }
            );

            // --- FIX 1: Use response.data directly ---
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;

            // --- FIX 2: Parse filename from header ---
            let filename = `rebalancing_recommendations_${new Date().toISOString().split('T')[0]}.csv`; // Fallback
            const disposition = response.headers['content-disposition'];
            if (disposition) {
                const filenameMatch = /filename="?([^"]+)"?/.exec(disposition);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url); // Clean up the URL object

        } catch (err) {
            // --- FIX 3: Correct error handling ---
            let errorMessage = "Failed to download the report.";
            if (err.response && err.response.data instanceof Blob) {
                try {
                    // Read the error blob as text
                    const errorText = await err.response.data.text();
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error) {
                        errorMessage = errorJson.error;
                    }
                } catch (parseError) {
                    console.error("Could not parse error blob:", parseError);
                }
            } else if (err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            }
            
            console.error("Download error:", err);
            setError(errorMessage);
        }
    };


    return (
        // --- START: Modified Root Div for Sidebar layout ---
        <div className="min-h-screen w-full bg-slate-900 text-white font-sans flex relative">
            
            {/* --- START: Added Sidebar Toggle Button --- */}
            {!sidebarOpen && (
                <motion.button
                initial={{ opacity: 0, scale: 0.8, x: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                onClick={() => setSidebarOpen(true)}
                className="absolute top-6 left-6 z-[1000] p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
                aria-label="Open sidebar"
                >
                <FiMenu size={22} />
                </motion.button>
            )}
            {/* --- END: Added Sidebar Toggle Button --- */}

            {/* --- START: Added Sidebar Component --- */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} permissions={permissions} />
            {/* --- END: Added Sidebar Component --- */}

            {/* --- START: Wrapped original content in <main> tag --- */}
            <main className="flex-1 p-6 pb-24 transition-all duration-300">
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Left Column (1/3 width): Explanation and Controls */}
                            <div className="lg:col-span-1 space-y-6">
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
                                className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col min-h-[400px]"
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
            </main>
            {/* --- END: Wrapped original content in <main> tag --- */}


            {/* ✨ 2. Pass the questions to the Chatbot component */}
            <Chatbot questions={rebalancerQuestions}/>
        </div>
        // --- END: Modified Root Div ---
    );
};

export default Rebalancer;