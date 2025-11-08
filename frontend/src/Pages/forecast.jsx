import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios'; // 1. ADDED axios
import {
    FiBarChart2, FiCpu, FiClock, FiAlertCircle, FiTrendingUp,
    FiMenu, FiX, FiSettings, FiUpload, FiLogOut, FiRefreshCw, FiShoppingBag // 2. ADDED sidebar icons
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import AccuracyDashboard from './AccuracyDashboard';
import Chatbot from '../components/Chatbot';

// --- API Configuration ---
const API_BASE_URL = 'http://127.0.0.1:5500';

// ✨ Animation variants for panels
const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
};

// --- DEFINE TAB-SPECIFIC QUESTIONS ---
const FORECAST_QUESTIONS = [
  "What's the total forecast for next 4 weeks?",
  "Compare actuals vs. forecast for store 101",
  "Which SKU has the highest forecast?",
  "Show me the forecast trend"
];

const ACCURACY_QUESTIONS = [
  "What is WMAPE?",
  "Explain forecast bias",
  "Which store is the least accurate?",
  "What was the overall accuracy last week?"
];

const LOGS_QUESTIONS = [
  "When was the last forecast run?",
  "Did the last run succeed?",
  "How many runs failed this month?",
  "Show me the logs for run ID 123"
];


const ForecastPage = () => {
    // --- State Management ---
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('forecast');
    const [chartData, setChartData] = useState([]);
    const [weeksToShow, setWeeksToShow] = useState(4);
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
    
    const [isInitialized, setIsInitialized] = useState(false);

    // 3. ADDED State for Sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [permissions, setPermissions] = useState([]);

    // --- SET CHATBOT QUESTIONS BASED ON ACTIVE TAB ---
    const chatbotQuestions = useMemo(() => {
        switch (activeTab) {
            case 'forecast':
                return FORECAST_QUESTIONS;
            case 'accuracy':
                return ACCURACY_QUESTIONS;
            case 'logs':
                return LOGS_QUESTIONS;
            default:
                return FORECAST_QUESTIONS;
        }
    }, [activeTab]);

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
    }, [weeksToShow]); // weeksToShow is a dependency

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

    // 4. ADDED function to fetch permissions
    const fetchPermissions = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const permRes = await axios.get(`${API_BASE_URL}/user/permissions`, { headers });
            setPermissions(permRes.data.allowed_routes || []);
        } catch (err) {
            console.error("Failed to fetch permissions", err);
            if (err.response?.status === 401) navigate("/");
        }
    }, [navigate]);

    // 5. MODIFIED useEffect to call fetchPermissions
    useEffect(() => {
        const initializePage = async () => {
            fetchPermissions(); // Fetch permissions on load
            const lookaheadWeeks = await fetchUserLookahead();
            setWeeksToShow(lookaheadWeeks);
            
            fetchStores();
            fetchSkus();
            
            setIsInitialized(true);
        };
        initializePage();
    }, [fetchUserLookahead, fetchStores, fetchSkus, fetchPermissions]); // Added fetchPermissions

    // This effect handles all data fetching and waits for initialization.
    useEffect(() => {
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
        { id: 'accuracy', title: 'Performance & Accuracy', onClick: null },
        { id: 'logs', title: 'Run History', onClick: () => fetchLogs() },
    ];
    
    return (
        // 6. MODIFIED main div to be a flex container
        <div className="min-h-screen w-full bg-slate-900 text-slate-300 font-sans flex relative">
            
            {/* 7. ADDED Sidebar toggle button */}
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

            {/* 8. ADDED Sidebar component */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} permissions={permissions} />

            {/* 9. MODIFIED original content to be in a 'main' tag */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl font-bold text-white">Demand Forecast Dashboard</h1>
                            <p className="text-slate-400 mt-1">Analyze historical data and future sales predictions.</p>
                        </div>
                        {/* <button
                            onClick={() => navigate("/dashboard")}
                            className="mt-4 sm:mt-0 px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
                        >
                            &larr; Back to Dashboard
                        </button> */}
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
                                    <AccuracyDashboard />
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
        
                {/* --- RENDER THE CHATBOT COMPONENT --- */}
                <Chatbot 
                    mode="floating"
                    questions={chatbotQuestions}
                />
            </main>
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
                            {Array.isArray(data) && data.length > 0 ? data.map((log) => (
                                <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                                    <td className="p-3 whitespace-nowrap">
                                        <FiClock className="inline mr-2 text-slate-400" />
                                        {new Date(log.run_time).toLocaleString('en-US', { timeZone: 'UTC' })}
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
                            )) : (
                                <tr>
                                    <td colSpan="3" className="text-center p-8 text-slate-400">
                                        No log data to display.
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

// 10. ADDED Sidebar component definition from Dashboard.js
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
                            <button className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiBarChart2 className="mr-3" /> Reports</button>
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

export default ForecastPage;