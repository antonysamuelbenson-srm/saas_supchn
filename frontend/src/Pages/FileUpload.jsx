// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import Chatbot from "../components/Chatbot";

// const UPLOAD_TYPES = [
//   { type: "store", label: "Store Master" },
//   { type: "inventory", label: "Inventory" },
//   { type: "forecast", label: "Forecast" },
//   { type: "totalStoreData", label: "Total Store" },
//   { type: "transferCostData", label: "Transfer Cost" },
//   { type: "capacity", label: "Warehouse Capacity" },
// ];
//   const accuracyQuestions = [
//         "What file formats are supported?",
//         "Is there a maximum file size?",
//         "How do I upload multiple files?",
//         "What happens to my data after upload?"
//     ];

// const FileUploadPage = () => {
//   const [fileMap, setFileMap] = useState({});
//   const [uploadStatus, setUploadStatus] = useState({});
//   const [token, setToken] = useState(null);
//   const navigate = useNavigate();  // ← this line is missing


//   // 🔐 Load JWT token from localStorage
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     if (storedToken) {
//       setToken(storedToken);
//     } else {
//       console.warn("No token found in localStorage.");
//     }
//   }, []);

//   const handleFileChange = (type, file) => {
//     setFileMap((prev) => ({ ...prev, [type]: file }));
//   };

//   const handleUpload = async (type) => {
//     const file = fileMap[type];
//     if (!file || !token) {
//       alert("Missing file or token.");
//       return;
//     }



//     const formData = new FormData();
//     formData.append("file", file);

//     setUploadStatus((prev) => ({ ...prev, [type]: "uploading" }));

//     try {
//       const response = await axios.post(
//         `http://localhost:5500/api/upload/${type}`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       if (response.status === 201) {
//         setUploadStatus((prev) => ({ ...prev, [type]: "success" }));
//       } else {
//         setUploadStatus((prev) => ({ ...prev, [type]: "error" }));
//       }
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || "Upload failed";
//       setUploadStatus((prev) => ({ ...prev, [type]: errorMessage }));
//     }
//   };



//   return (
//     <div className="min-h-screen bg-base-200 py-10 px-6">
//       <div className="max-w-4xl mx-auto">
//       <div className="mb-4 flex justify-start">
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="btn btn-secondary"
//           >
//             ← Back to Dashboard
//           </button>
//         </div>
//         <h1 className="text-4xl font-bold mb-6 text-center">📤 Upload CSV Data</h1>

//         {!token && (
//           <div className="alert alert-warning mb-6 shadow-lg">
//             <span>⚠️ No token found. Please login to continue.</span>
//           </div>
//         )}

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {UPLOAD_TYPES.map(({ type, label }) => (
//             <div key={type} className="card bg-base-100 shadow-xl p-4">
//               <h2 className="font-semibold text-lg mb-2">{label}</h2>
//               <input
//                 type="file"
//                 accept=".csv"
//                 className="file-input file-input-bordered w-full mb-2"
//                 onChange={(e) => handleFileChange(type, e.target.files[0])}
//               />
//               <button
//                 className="btn btn-primary w-full"
//                 onClick={() => handleUpload(type)}
//                 disabled={!token}
//               >
//                 Upload
//               </button>

//               {/* Upload status display */}
//               {uploadStatus[type] && (
//                 <div className="mt-2 text-sm">
//                   {uploadStatus[type] === "uploading" && (
//                     <span className="text-warning">Uploading...</span>
//                   )}
//                   {uploadStatus[type] === "success" && (
//                     <span className="text-success">✅ Upload successful</span>
//                   )}
//                   {uploadStatus[type] !== "uploading" &&
//                     uploadStatus[type] !== "success" && (
//                       <span className="text-error">❌ {uploadStatus[type]}</span>
//                     )}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     <Chatbot 
//       mode="floating"
//       questions={accuracyQuestions} // Must be spelled 'questions'
//     />
//     </div>
//   );
// };

// export default FileUploadPage;




import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Chatbot from "../components/Chatbot";
import {
    FiMenu, FiX, FiTrendingUp, FiSettings,
    FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag,
    FiFile, FiCheckCircle, FiAlertTriangle, FiLoader // Icons for file/status
} from "react-icons/fi";
import { motion } from "framer-motion";

// --- Configuration ---
const BASE_URL = "http://localhost:5001";

// --- Layout Components (Copied from Dashboard/Admin pages) ---

const Header = React.memo(({ title, onRefresh, lastUpdated }) => (
    <header className="relative flex justify-center items-center mb-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            {lastUpdated && (
                <p className="text-xs text-slate-400 mt-1">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
            )}
        </div>
        {onRefresh && (
            <button onClick={onRefresh} className="absolute right-0 p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition">
                <FiRefreshCw size={20} />
            </button>
        )}
    </header>
));

const Sidebar = React.memo(({ isOpen, onClose, permissions }) => {
    const navigate = useNavigate();
    const hasPermission = (route) => permissions.includes(route);
    
    const location = window.location.pathname;

    const navItems = [
        { name: "Dashboard", icon: FiBarChart2, path: "/dashboard", perm: "GET:/dashboard" },
        { name: "File Upload", icon: FiUpload, path: "/file-upload", perm: "POST:/store_upload" },
        { name: "Manage Users", icon: FiSettings, path: "/adminprivileges", perm: "GET:/admin/users" },
        { name: "Forecast", icon: FiTrendingUp, path: "/forecast", perm: null },
        { name: "Rebalancer", icon: FiRefreshCw, path: "/rebalancer", perm: null },
        { name: "Configuration", icon: FiShoppingBag, path: "/Config", perm: "POST:/config/apply-formula" },
    ];

    return (
        <div className={`bg-slate-800 border-r border-slate-700 shadow-lg transition-all duration-300 ${isOpen ? "w-64 p-6" : "w-0 p-0 overflow-hidden"} flex flex-col`}>
            {isOpen && (
                <>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-white text-xl font-bold">Control</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white"><FiX size={24} /></button>
                    </div>
                    <nav className="space-y-3">
                        {navItems.map(item => {
                            const active = location === item.path;
                            const classes = `flex items-center p-2 rounded-md transition w-full ${active ? "bg-blue-600 text-white font-semibold" : "text-slate-300 hover:bg-slate-700"}`;
                            
                            if (!item.perm || hasPermission(item.perm)) {
                                return (
                                    <button key={item.name} onClick={() => navigate(item.path)} className={classes}>
                                        <item.icon className="mr-3" /> {item.name}
                                    </button>
                                );
                            }
                            return null;
                        })}
                        
                        <div className="!mt-auto pt-4 border-t border-slate-700">
                            <button onClick={() => navigate("/")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiLogOut className="mr-3" /> Logout</button>
                        </div>
                    </nav>
                </>
            )}
        </div>
    );
});

// --- Main File Upload Page Component ---

const UPLOAD_TYPES = [
    { type: "store", label: "Store Master" },
    { type: "inventory", label: "Inventory" },
    { type: "forecast", label: "Forecast" },
    { type: "totalStoreData", label: "Total Store" },
    { type: "transferCostData", label: "Transfer Cost" },
    { type: "capacity", label: "Warehouse Capacity" },
];

const accuracyQuestions = [
    "What file formats are supported?",
    "Is there a maximum file size?",
    "How do I upload multiple files?",
    "What happens to my data after upload?"
];

const FileUploadPage = () => {
    // --- State ---
    const [fileMap, setFileMap] = useState({});
    const [uploadStatus, setUploadStatus] = useState({});
    const [token, setToken] = useState(null);
    const navigate = useNavigate();

    // --- Layout State ---
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- API Headers ---
    const headers = useMemo(() => ({
        Authorization: `Bearer ${token}`,
    }), [token]);

    // --- Load Token & Permissions ---
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (!storedToken) {
            navigate("/");
            return;
        }
        setToken(storedToken);

        const fetchPageData = async () => {
            setLoading(true);
            try {
                const permRes = await axios.get(`${BASE_URL}/user/permissions`, {
                    headers: { Authorization: `Bearer ${storedToken}` }
                });
                setPermissions(permRes.data.allowed_routes || []);
            } catch (err) {
                console.error("Failed to fetch permissions", err);
                if (err.response?.status === 401) navigate("/");
            } finally {
                setLoading(false);
            }
        };
        fetchPageData();
    }, [navigate]);

    // --- Handlers ---
    const handleFileChange = (type, file) => {
        setFileMap((prev) => ({ ...prev, [type]: file }));
        // Reset status on new file selection
        setUploadStatus((prev) => ({ ...prev, [type]: null }));
    };

    const handleUpload = async (type) => {
        const file = fileMap[type];
        if (!file || !token) {
            alert("Missing file or token.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setUploadStatus((prev) => ({ ...prev, [type]: "uploading" }));

        try {
            const response = await axios.post(
                `${BASE_URL}/api/upload/${type}`,
                formData,
                {
                    headers: {
                        ...headers,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.status === 201) {
                setUploadStatus((prev) => ({ ...prev, [type]: "success" }));
            } else {
                setUploadStatus((prev) => ({ ...prev, [type]: "error" }));
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Upload failed";
            setUploadStatus((prev) => ({ ...prev, [type]: errorMessage }));
        }
    };

    // --- Render ---

    if (loading) {
        return <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center"><div className="flex items-center space-x-3 text-white"><FiRefreshCw className="animate-spin h-5 w-5" /><span>Loading Page...</span></div></div>;
    }

    return (
        <div className="min-h-screen w-full bg-slate-900 text-white font-sans flex relative">
            
            {/* --- Sidebar Toggle Button --- */}
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

            {/* --- Sidebar --- */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} permissions={permissions} />

            {/* --- Main Content --- */}
            <main className="flex-1 p-6 pb-24 transition-all duration-300">
                <Header title="Upload CSV Data" onRefresh={null} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-6"
                >
                    {!token && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg shadow-lg">
                            <span>⚠️ No token found. Please login to continue.</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {UPLOAD_TYPES.map(({ type, label }) => (
                            <div key={type} className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg space-y-4">
                                <h2 className="font-semibold text-xl text-white">{label}</h2>
                                
                                <label className="block w-full">
                                    <span className="sr-only">Choose file</span>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => handleFileChange(type, e.target.files[0])}
                                        className="block w-full text-sm text-slate-400
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-md file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-slate-700 file:text-slate-300
                                            hover:file:bg-slate-600"
                                    />
                                </label>
                                
                                {fileMap[type] && (
                                    <div className="text-sm text-slate-400 flex items-center">
                                        <FiFile className="mr-2 flex-shrink-0" />
                                        <span className="truncate">{fileMap[type].name}</span>
                                    </div>
                                )}

                                <button
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors w-full flex items-center justify-center
                                               disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleUpload(type)}
                                    disabled={!token || !fileMap[type] || uploadStatus[type] === 'uploading'}
                                >
                                    {uploadStatus[type] === "uploading" ? (
                                        <>
                                            <FiLoader className="animate-spin mr-2" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <FiUpload className="mr-2" size={16} />
                                            Upload
                                        </>
                                    )}
                                </button>

                                {/* Upload status display */}
                                {uploadStatus[type] && (
                                    <div className="mt-4 text-sm">
                                        {uploadStatus[type] === "uploading" && (
                                            <span className="text-yellow-400 flex items-center">
                                                <FiLoader className="animate-spin mr-2" />
                                                Uploading, please wait...
                                            </span>
                                        )}
                                        {uploadStatus[type] === "success" && (
                                            <span className="text-green-400 flex items-center">
                                                <FiCheckCircle className="mr-2" />
                                                Upload successful
                                            </span>
                                        )}
                                        {uploadStatus[type] !== "uploading" &&
                                         uploadStatus[type] !== "success" && (
                                            <span className="text-red-400 flex items-center">
                                                <FiAlertTriangle className="mr-2" />
                                                {uploadStatus[type]}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* --- [RESTORED] Original Chatbot Component --- */}
                <div className="mt-8">
                    <Chatbot questions={accuracyQuestions} />
                </div>
            </main>
        </div>
    );
};

export default FileUploadPage;