import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Chatbot from "../components/Chatbot"; // Kept your original chatbot import
import {
    FiMenu, FiX, FiTrendingUp, FiSettings,
    FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag,
} from "react-icons/fi"; // Removed the chatbot-specific icons
import { motion } from "framer-motion";

// --- Configuration ---
const BASE_URL = "http://localhost:5500"; // Standardized Base URL

// --- Layout Components (Copied from Dashboard.js) ---

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


// --- Main Admin User Manager Component ---

const AdminUserManager = () => {
    // --- State ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState("");

    // Layout state
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [permissions, setPermissions] = useState([]);

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    // --- Chatbot Questions (From your original) ---
    const userManagerQuestions = [
        "How many admins are there?",
        "List all deactivated users.",
        "How do I change a user's role?",
        "What's the difference between deactivating and deleting?",
        "Find user 'jane.doe@example.com'",
    ];

    // --- API Headers ---
    const headers = useMemo(() => ({
        Authorization: `Bearer ${token}`,
    }), [token]);

    // --- Data Fetching ---
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/admin/users`, { headers });
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    }, [headers]);

    useEffect(() => {
        if (!token) {
            navigate("/");
            return;
        }

        const fetchPageData = async () => {
            // Fetch Permissions
            try {
                const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
                setPermissions(permRes.data.allowed_routes || []);
            } catch (err) {
                console.error("Failed to fetch permissions", err);
                if (err.response?.status === 401) navigate("/");
            }
            
            // Fetch Users
            await fetchUsers();
        };

        fetchPageData();
    }, [token, navigate, headers, fetchUsers]);

    // --- User Actions ---
    const changeUserRole = async () => {
        if (!selectedUser || !newRole) return;
        try {
            await axios.put(
                `${BASE_URL}/admin/user/${selectedUser.role_user_id}/role`,
                { role: newRole },
                { headers }
            );
            alert("Role updated successfully.");
            fetchUsers();
            setSelectedUser(null);
            setNewRole("");
        } catch (err) {
            console.error("Failed to update role", err);
            alert("Failed to update role.");
        }
    };

    const deleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`)) return;
        try {
            await axios.delete(`${BASE_URL}/admin/user/${user.role_user_id}`, { headers });
            alert("User deleted successfully.");
            fetchUsers();
        } catch (err) {
            console.error("Failed to delete user", err);
        }
    };

    const deactivateUser = async (user) => {
        if (!window.confirm(`Are you sure you want to deactivate ${user.email}? They will no longer be able to log in.`)) return;
        try {
            await axios.post(
                `${BASE_URL}/admin/user/${user.role_user_id}/deactivate`,
                {},
                { headers }
            );
            alert("User deactivated successfully.");
            fetchUsers();
        } catch (err) {
            console.error("Failed to deactivate user", err);
        }
    };

    const reactivateUser = async (user) => {
        try {
            await axios.post(
                `${BASE_URL}/admin/user/${user.role_user_id}/reactivate`,
                {},
                { headers }
            );
            alert("User reactivated successfully.");
            fetchUsers();
        } catch (err) {
            console.error("Failed to reactivate user", err);
        }
    };

    // --- Render ---

    if (loading) {
        return <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center"><div className="flex items-center space-x-3 text-white"><FiRefreshCw className="animate-spin h-5 w-5" /><span>Loading User Data...</span></div></div>;
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
                <Header title="Admin Panel - Manage Users" onRefresh={fetchUsers} lastUpdated={null} />

                {/* --- Content Area (Table & Form) --- */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.6 }} 
                    className="space-y-6"
                >
                    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left table-auto">
                                <thead className="border-b border-slate-700 bg-slate-800">
                                    <tr>
                                        <th className="p-4 text-sm font-semibold text-slate-400 uppercase">Email</th>
                                        <th className="p-4 text-sm font-semibold text-slate-400 uppercase">Role</th>
                                        <th className="p-4 text-sm font-semibold text-slate-400 uppercase">Status</th>
                                        <th className="p-4 text-sm font-semibold text-slate-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {users.map((user) => (
                                        <tr key={user.role_user_id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4 text-sm text-slate-300 font-medium">{user.email}</td>
                                            <td className="p-4 text-sm text-slate-300">{user.role}</td>
                                            <td className="p-4 text-sm">
                                                {user.active ? (
                                                    <span className="text-green-400 font-semibold px-2 py-0.5 bg-green-900/50 rounded-full">Active</span>
                                                ) : (
                                                    <span className="text-red-400 font-semibold px-2 py-0.5 bg-red-900/50 rounded-full">Deactivated</span>
                                                )}
                                            </td>
                                            <td className="p-4 flex gap-2 flex-wrap">
                                                <button
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                                    onClick={() => { setSelectedUser(user); setNewRole(user.role); }}
                                                >
                                                    Change Role
                                                </button>
                                                {user.active ? (
                                                    <button
                                                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                                        onClick={() => deactivateUser(user)}
                                                    >
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                                        onClick={() => reactivateUser(user)}
                                                    >
                                                        Reactivate
                                                    </button>
                                                )}
                                                <button
                                                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                                    onClick={() => deleteUser(user)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- Change Role Modal Form --- */}
                    {selectedUser && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="mt-6 p-6 bg-slate-800 border border-slate-700 rounded-lg shadow-lg"
                        >
                            <h3 className="text-lg font-semibold mb-4 text-white">
                                Change Role for: <span className="font-bold text-blue-400">{selectedUser.email}</span>
                            </h3>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter new role (e.g., admin, viewer)"
                                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full sm:w-auto sm:flex-1"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                />
                                <button 
                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors w-full sm:w-auto" 
                                    onClick={changeUserRole}
                                >
                                    Update Role
                                </button>
                                <button 
                                    className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors w-full sm:w-auto" 
                                    onClick={() => setSelectedUser(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* --- [RESTORED] Original Chatbot Component --- */}
                <div className="mt-8"> {/* Added a margin-top for spacing */}
                    <Chatbot questions={userManagerQuestions} />
                </div>

            </main>

            {/* --- Chatbot FAB Removed --- */}

        </div>
    );
};

export default AdminUserManager;