import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";

// --- Icon Imports ---
// Original Lucide icons, aliased to prevent conflicts
import {
    FilePlus,
    Edit,
    Calculator,
    BarChart,
    Settings as LucideSettings, // Aliased
    Plus,
    RefreshCw as LucideRefreshCw // Aliased
} from 'lucide-react';

// Icons for the new Sidebar
import {
    FiMenu,
    FiX,
    FiTrendingUp,
    FiSettings,
    FiUpload,
    FiBarChart2,
    FiLogOut,
    FiRefreshCw,
    FiShoppingBag
} from "react-icons/fi";

// --- Component Imports ---
import ForecastLookahead from "./ForecastLookahead";
import Chatbot from "../components/Chatbot";

// --- Constants ---
const BASE_URL = "http://127.0.0.1:5001";


// --- START: Added Sidebar Component ---
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
                            <button onClick={() => navigate("/dashboard")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiBarChart2 className="mr-3" /> Dashboard</button>
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
        // Changed icon to LucideSettings
        <SectionCard title="Forecast Settings" icon={LucideSettings}>
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
    // Changed icon to LucideSettings
    { id: "forecastSettings", label: "Forecast Settings", icon: LucideSettings },
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

    // --- START: Added Sidebar State ---
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [permissions, setPermissions] = useState([]);
    // --- END: Added Sidebar State ---

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
    
    const chatbotQuestions = useMemo(() => {
        const addStoreQuestions = [
            "What fields are required for a new store?",
            "How do I find latitude and longitude?",
            "Can I add multiple stores at once?",
            "What is 'Capacity (Units)' used for?",
        ];
        const editStoreQuestions = [
            "How do I update a store's address?",
            "Can I change a store's code after it's created?",
            "What happens when I update store details?",
        ];
        const applyFormulaQuestions = [
            "What do the different formulas do?",
            "How do I apply a formula to all stores?",
            "Explain what 'recompute' means.",
            "Can I apply more than one formula?",
        ];
        const forecastQuestions = [
            "What is a 'forecast lookahead'?",
            "What is the recommended lookahead period?",
            "Does changing this affect past forecasts?",
        ];
        const forecastSettingsQuestions = [
            "How do I set up a weekly schedule?",
            "What's a manual vs. scheduled run?",
            "Can I view the current schedule?",
            "How long does a manual run take?",
        ];

        switch (activeTab) {
            case "addStore": return addStoreQuestions;
            case "editStore": return editStoreQuestions;
            case "applyFormula": return applyFormulaQuestions;
            case "forecast": return forecastQuestions;
            case "forecastSettings": return forecastSettingsQuestions;
            default: return [];
        }
    }, [activeTab]);
    
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) navigate("/login");
        return { 'Authorization': `Bearer ${token}` };
    }, [navigate]);

    // --- START: Added useEffect to fetch permissions for Sidebar ---
    useEffect(() => {
        const fetchPermissions = async () => {
            const headers = getAuthHeaders();
            if (!headers) return; // getAuthHeaders already handles navigation
            try {
                const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
                setPermissions(permRes.data.allowed_routes || []);
            } catch (err) {
                console.error("Failed to fetch permissions", err);
                if (err.response?.status === 401) {
                    navigate("/login"); 
                }
            }
        };
        fetchPermissions();
    }, [getAuthHeaders, navigate]);
    // --- END: Added useEffect ---

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
            // --- START: MODIFIED CODE ---
            case "forecast":
                return (
                    <SectionCard title="Forecast Lookahead" icon={BarChart}>
                        <ForecastLookahead />
                    </SectionCard>
                );
            // --- END: MODIFIED CODE ---
            case "forecastSettings":
                return <ForecastSettings getAuthHeaders={getAuthHeaders} BASE_URL={BASE_URL} />;
            default:
                return null;
        }
    };
    
    return (
        // --- START: Root div modified for sidebar layout ---
        <div className="min-h-screen w-full bg-slate-900 text-slate-200 font-sans flex relative">
        
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

            {/* --- START: New <main> tag to wrap page content --- */}
            <main className="flex-1 p-6 pb-24 transition-all duration-300">
                {/* Original content wrapper, now inside <main> */}
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-1">
                    {/* Header: Removed py-8, added mb-8 to let <main> handle padding */}
                    <header className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-bold text-slate-50">⚙️ Configuration</h1>
                        {/* <button onClick={() => navigate("/dashboard")} className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors">
                            &larr; Back to Dashboard
                        </button> */}
                    </header>
                    {/* This div contained the aside/main split, which is correct */}
                    <div className="flex flex-col md:flex-row gap-8 flex-1">
                        <aside className="md:w-64">
                            <div className="sticky top-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-2 shadow-2xl shadow-black/20">
                                {TABS.map(tab => (
                                    <TabButton key={tab.id} {...tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                                ))}
                            </div>
                        </aside>
                        {/* This is the inner <main> for tabs, which is fine */}
                        <main className="flex-1 flex pb-8"> 
                            <AnimatePresence mode="wait">
                                {renderActiveTab()}
                            </AnimatePresence>
                        </main>
                    </div>
                </div>
            </main>
            {/* --- END: New <main> tag --- */}

            {/* Chatbot remains at the root level, outside the new <main> */}
            <Chatbot questions={chatbotQuestions} />
        </div>
        // --- END: Root div ---
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
                    {/* Changed icons to aliased Lucide versions */}
                    {isUpdate ? <><LucideRefreshCw className="w-4 h-4 mr-2"/> {buttonText}</> : <><Plus className="w-4 h-4 mr-2"/> {buttonText}</>}
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