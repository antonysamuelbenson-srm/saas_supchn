// // // import React, { useState, useEffect , useCallback } from "react";
// // // import axios from "axios";
// // // import {
// // //   FiMenu, FiX, FiDatabase, FiTrendingUp, FiSettings,
// // //   FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag
// // // } from "react-icons/fi";
// // // import { motion } from "framer-motion";
// // // import { useNavigate } from "react-router-dom";
// // // import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
// // // import L from "leaflet";
// // // import "leaflet/dist/leaflet.css";
// // // import {
// // //   LineChart, Line,BarChart,Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
// // // } from 'recharts';

// // // const BASE_URL = "http://localhost:5500";


// // // // MODIFIED: This button now fits the map to the bounds of all locations.
// // // function ResetMapViewButton({ locations }) {
// // //   const map = useMap();

// // //   const fitMapToBounds = () => {
// // //     // Filter out any locations that don't have valid coordinates
// // //     const validCoords = locations
// // //       .filter((loc) => loc.lat != null && loc.lng != null)
// // //       .map((loc) => [loc.lat, loc.lng]);

// // //     // If there are no valid coordinates, do nothing
// // //     if (validCoords.length === 0) return;
    
// // //     // Create a LatLngBounds object from the coordinates
// // //     const bounds = L.latLngBounds(validCoords);
    
// // //     // Tell the map to fit itself to these bounds with some padding
// // //     if (bounds.isValid()) {
// // //       map.fitBounds(bounds, { padding: [50, 50] });
// // //     }
// // //   };

// // //   return (
// // //     <button
// // //       onClick={fitMapToBounds}
// // //       className="absolute top-3 right-3 z-[1000] bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow-md"
// // //       title="Fit all nodes into view"
// // //     >
// // //       ⤢ Fit View
// // //     </button>
// // //   );
// // // }


// // // const MapStyles = () => (
// // //   <style>{`
// // //     .custom-marker-container {
// // //       position: relative;
// // //       width: 32px; /* Adjusted for pointer size */
// // //       height: 42px; /* Adjusted for pointer size */
// // //       display: flex;
// // //       align-items: center;
// // //       justify-content: center;
// // //     }
// // //     .marker-svg {
// // //       width: 100%;
// // //       height: 100%;
// // //       filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));
// // //     }
// // //     .severity-high .marker-svg {
// // //       fill: #ef4444; /* red-500 */
// // //     }
// // //     .severity-medium .marker-svg {
// // //       fill: #f59e0b; /* amber-500 */
// // //     }
// // //     .severity-low .marker-svg {
// // //       fill: #3b82f6; /* blue-500 */
// // //     }
// // //     .marker-count {
// // //       position: absolute;
// // //       top: 0px; /* Adjusted for pointer */
// // //       left: 55%; /* Adjusted for pointer */
// // //       background-color: white;
// // //       color: #dc2626; /* red-600 */
// // //       font-weight: bold;
// // //       font-size: 12px;
// // //       border-radius: 50%;
// // //       width: 18px;
// // //       height: 18px;
// // //       display: flex;
// // //       align-items: center;
// // //       justify-content: center;
// // //       border: 1px solid #dc2626;
// // //       z-index: 10;
// // //     }
// // //   `}</style>
// // // );


// // // // Helper to fit map bounds
// // // const FitBounds = ({ locations }) => {
// // //   const map = useMap();

// // //   useEffect(() => {
// // //     if (!locations || locations.length === 0) return;
// // //     const validCoords = locations
// // //       .filter((loc) => loc.lat != null && loc.lng != null)
// // //       .map((loc) => [loc.lat, loc.lng]);

// // //     if (validCoords.length === 0) return;
// // //     const bounds = L.latLngBounds(validCoords);
// // //     if (bounds.isValid()) {
// // //       map.fitBounds(bounds, { padding: [50, 50] });
// // //     }
// // //   }, [locations, map]);

// // //   return null;
// // // };





// // // // NEW COMPONENT: AutoPanMarker
// // // const AutoPanMarker = ({ children, ...props }) => {
// // //   const map = useMap();

// // //   const handleTooltipOpen = useCallback((e) => {
// // //     const tooltip = e.tooltip;
// // //     if (!tooltip || !map) return;

// // //     // Use a small timeout to allow the tooltip to be fully rendered and positioned
// // //     setTimeout(() => {
// // //       // Get the pixel bounds of the tooltip and the map container
// // //       const tooltipBounds = tooltip.getElement().getBoundingClientRect();
// // //       const mapBounds = map.getContainer().getBoundingClientRect();

// // //       // Calculate how much the tooltip is overflowing the map container
// // //       const panOffset = { x: 0, y: 0 };
// // //       const padding = 20; // Add some padding so it's not flush with the edge

// // //       if (tooltipBounds.right + padding > mapBounds.right) {
// // //         panOffset.x = tooltipBounds.right + padding - mapBounds.right;
// // //       }
// // //       if (tooltipBounds.left - padding < mapBounds.left) {
// // //         panOffset.x = tooltipBounds.left - padding - mapBounds.left;
// // //       }
// // //       if (tooltipBounds.bottom + padding > mapBounds.bottom) {
// // //         panOffset.y = tooltipBounds.bottom + padding - mapBounds.bottom;
// // //       }
// // //       if (tooltipBounds.top - padding < mapBounds.top) {
// // //         panOffset.y = tooltipBounds.top - padding - mapBounds.top;
// // //       }
      
// // //       // If there is any overflow, pan the map smoothly
// // //       if (panOffset.x !== 0 || panOffset.y !== 0) {
// // //         map.panBy([panOffset.x, panOffset.y], { animate: true, duration: 0.3 });
// // //       }
// // //     }, 10); // 10ms timeout is usually enough

// // //   }, [map]);


  
// // //   const eventHandlers = React.useMemo(() => ({
// // //     tooltipopen: handleTooltipOpen,
// // //     click: (e) => e.target.openPopup(), // Keep the click for popup
// // //   }), [handleTooltipOpen]);

// // //   return (
// // //     <Marker {...props} eventHandlers={eventHandlers}>
// // //       {children}
// // //     </Marker>
// // //   );
// // // };


// // // // Leaflet marker setup
// // // delete L.Icon.Default.prototype._getIconUrl;
// // // L.Icon.Default.mergeOptions({
// // //   iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
// // //   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
// // //   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// // // });

// // // const createAlertIcon = (location) => {
// // //   const { alertStatus } = location;
// // //   const reorderCount = alertStatus?.reorderCount || 0;
// // //   const stockoutCount = alertStatus?.stockoutCount || 0;
// // //   const totalAlerts = reorderCount + stockoutCount;

// // //   let severityClass = 'severity-low'; // Default blue
// // //   if (alertStatus?.hasAlert) { // This means "stockout despite reorder" is true
// // //     severityClass = 'severity-high'; // Red
// // //   } else if (reorderCount > 0) {
// // //     severityClass = 'severity-medium'; // Yellow/Amber
// // //   }

// // //   return new L.DivIcon({
// // //     className: `custom-marker-container ${severityClass}`,
// // //     html: `
// // //       ${totalAlerts > 0 ? `<div class="marker-count">${totalAlerts}</div>` : ''}
// // //       <svg viewBox="0 0 24 24" class="marker-svg">
// // //         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
// // //       </svg>
// // //     `,
// // //     iconSize: [32, 42],
// // //     iconAnchor: [16, 42] // Point of the pointer
// // //   });
// // // };


// // // function Dashboard() {
// // //   const [mapSize, setMapSize] = useState("default");
// // //   const [sidebarOpen, setSidebarOpen] = useState(false);
// // //   const [permissions, setPermissions] = useState([]);
// // //   const [availabilityData, setAvailabilityData] = useState([]);
// // //   const [data, setData] = useState({
// // //     metrics: {
// // //       current_demand: 0,
// // //       inventory_position: 0,
// // //       weeks_of_supply: 0,
// // //       stockouts: 0,
// // //       skus_below_threshold: 0,
// // //       inventory_turnover: 0,
// // //       timestamp: new Date().toISOString()
// // //     },
// // //     alerts: [],
// // //     locations: []
// // //   });
// // //   const [loading, setLoading] = useState(true);
// // //   const navigate = useNavigate();

// // //   const hasPermission = (route) => permissions.includes(route);

// // //   const [forecastDays, setForecastDays] = useState(7);
  
// // // useEffect(() => {
// // //     const fetchDashboardData = async () => {
// // //       setLoading(true);
// // //       const token = localStorage.getItem("token");
// // //       if (!token) {
// // //         navigate("/");
// // //         return;
// // //       }
// // //       const headers = { Authorization: `Bearer ${token}` };

// // //       try {
// // //         const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
// // //         const allowedRoutes = permRes.data.allowed_routes || [];
// // //         setPermissions(allowedRoutes);

// // //         if (!allowedRoutes.includes("GET:/dashboard")) {
// // //           setLoading(false);
// // //           return;
// // //         }

// // //         const [
// // //           dashboardRes,
// // //           storesRes,
// // //           alertsRes,
// // //           availabilityRes,
// // //           lookaheadRes
// // //         ] = await Promise.allSettled([
// // //           axios.get(`${BASE_URL}/dashboard`, { headers }),
// // //           axios.get(`${BASE_URL}/stores`, { headers }),
// // //           axios.get(`${BASE_URL}/alerts`, { headers }),
// // //           axios.get(`${BASE_URL}/availability`, { headers }),
// // //           axios.get(`${BASE_URL}/user/lookahead_days`, { headers }),
// // //         ]);

// // //         if (lookaheadRes.status === 'fulfilled') {
// // //             setForecastDays(lookaheadRes.value.data.lookahead_days || 7);
// // //         } else {
// // //             console.error("❌ Failed to fetch lookahead_days:", lookaheadRes.reason);
// // //         }

// // //         if (availabilityRes.status === 'fulfilled') {
// // //             setAvailabilityData(availabilityRes.value.data.data || []);
// // //         } else {
// // //             console.error("❌ Failed to fetch availability data:", availabilityRes.reason);
// // //             setAvailabilityData([]);
// // //         }
        
// // //         const backendDashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {};
// // //         const stores = storesRes.status === 'fulfilled' ? storesRes.value.data.stores : [];
// // //         const backendAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
        
// // //         let stockouts = 0;
// // //         let skusBelow = 0;
        
// // //         if (backendAlerts && backendAlerts.length > 0) {
// // //             backendAlerts.forEach(alert => {
// // //               if (alert.type === "stock_out") stockouts++;
// // //               else if (alert.type === "excess" || alert.type === "low_stock") skusBelow++;
// // //             });
// // //         }
        
// // //         const locationPromises = stores.map(store => Promise.allSettled([
// // //             axios.get(`${BASE_URL}/store/${store.store_id}/summary`, { headers }),
// // //             axios.get(`${BASE_URL}/store/${store.store_id}/hover`, { headers }),
// // //             axios.get(`${BASE_URL}/store/${store.store_id}/with-alert-status`, { headers })
// // //         ]));

// // //         const locationsData = await Promise.all(locationPromises);

// // //         const locations = locationsData.map((results, index) => {
// // //             const store = stores[index];
// // //             const [summaryRes, hoverRes, alertStatusRes] = results;

// // //             const storeKey = summaryRes.status === 'fulfilled' ? Object.keys(summaryRes.value.data)[0] : null;
// // //             const storeSummary = storeKey && summaryRes.value.data[storeKey] ? summaryRes.value.data[storeKey] : {};
// // //             const items = storeSummary.items || [];
// // //             const hoverData = hoverRes.status === 'fulfilled' ? hoverRes.value.data : {};
// // //             const alertStatusData = alertStatusRes.status === 'fulfilled' ? alertStatusRes.value.data : {};

// // //             return {
// // //                 store_id: store.store_id,
// // //                 store_name: store.name,
// // //                 location: store.city,
// // //                 lat: store.lat,
// // //                 lng: store.lon,
// // //                 alert: backendAlerts.find(a => a.store_id === store.store_id)?.message || null,
// // //                 summary: items.map(i => ({
// // //                     product_name: i.sku,
// // //                     quantity: i.quantity,
// // //                     reorder_point: i.reorder_point
// // //                 })),
// // //                 hoverStats: {
// // //                     distinct_skus: hoverData.distinct_skus || 0,
// // //                     inventory_units: hoverData.inventory_units || 0,
// // //                     forecast_units: hoverData.forecast_units || 0,
// // //                     alerts: hoverData.alerts || 0,
// // //                     lookahead_days: hoverData.lookahead_days || 7
// // //                 },
// // //                 alertStatus: {
// // //                     reorderCount: alertStatusData.num_skus_to_reorder || 0,
// // //                     stockoutCount: alertStatusData.num_skus_stockout_despite_reorder || 0,
// // //                     hasAlert: alertStatusData.alert || false,
// // //                 }
// // //             };
// // //         });

// // //         setData({
// // //           metrics: {
// // //             current_demand: backendDashboard.current_demand ?? 0,
// // //             inventory_position: backendDashboard.inventory_position ?? 0,
// // //             weeks_of_supply: backendDashboard.weeks_of_supply ?? 0,
// // //             stockouts,
// // //             skus_below_threshold: skusBelow,
// // //             inventory_turnover: backendDashboard.inventory_turnover ?? 0,
// // //             timestamp: backendDashboard.timestamp ?? new Date().toISOString()
// // //           },
// // //           alerts: backendAlerts.map((a, i) => ({
// // //             id: a.id || `alert-${i}`,
// // //             severity: a.severity || "Low",
// // //             message: a.message,
// // //             type: a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : "General",
// // //             store_id: a.store_id
// // //           })),
// // //           locations
// // //         });

// // //       } catch (err) {
// // //         console.error("❌ Failed to fetch dashboard data:", err);
// // //         if (err.response?.status === 401) {
// // //             navigate("/");
// // //         }
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };

// // //     fetchDashboardData();
// // //   }, [navigate]);

// // //   if (loading) {
// // //     return (
// // //       <div className="min-h-screen w-full bg-[#0f172a] flex items-center justify-center">
// // //         <div className="flex items-center space-x-3 text-white">
// // //           <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
// // //             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
// // //             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
// // //           </svg>
// // //           <span>Loading dashboard data...</span>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   if (!hasPermission("GET:/dashboard")) {
// // //       return (
// // //           <div className="min-h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center text-white">
// // //               <h1 className="text-3xl font-bold">Access Denied</h1>
// // //               <p className="mt-2">You do not have permission to view this page.</p>
// // //               <button onClick={() => navigate("/")} className="mt-4 bg-blue-500 px-4 py-2 rounded">
// // //                   Go to Login
// // //               </button>
// // //           </div>
// // //       );
// // //   }

// // //   return (
// // //     <div className="min-h-screen w-full bg-[#0f172a] relative flex transition-all duration-300">
// // //       <MapStyles />

// // //       {/* Floating Sidebar Button */}
// // //       {!sidebarOpen && (
// // //         <motion.button
// // //           initial={{ opacity: 0, scale: 0.8, x: -50 }}
// // //           animate={{ opacity: 1, scale: 1, x: 0 }}
// // //           transition={{ type: "spring", stiffness: 260, damping: 20 }}
// // //           onClick={() => setSidebarOpen(true)}
// // //           className="absolute top-4 left-4 z-50 p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all duration-300"
// // //           aria-label="Open sidebar"
// // //         >
// // //           <FiMenu size={22} />
// // //         </motion.button>
// // //       )}

// // //       {/* Sidebar */}
// // //       <div className={`bg-[#152438] border-r border-[#1f2a46] shadow-lg transition-all duration-300 ${sidebarOpen ? "w-60 p-6" : "w-0 overflow-hidden"} flex flex-col space-y-6`}>
// // //         {sidebarOpen && (
// // //           <>
// // //             <div className="flex items-center justify-between">
// // //               <h2 className="text-white text-xl font-bold">Control</h2>
// // //               <button onClick={() => setSidebarOpen(false)} className="text-white">
// // //                 <FiX size={24} />
// // //               </button>
// // //             </div>
// // //             <nav className="space-y-4">
// // //               {hasPermission("POST:/store_upload") && (
// // //                 <button onClick={() => navigate("/file-upload")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
// // //                   <FiUpload className="mr-3" /> File Upload
// // //                 </button>
// // //               )}
// // //               {hasPermission("GET:/admin/users") && (
// // //                 <button onClick={() => navigate("/adminprivileges")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
// // //                   <FiUpload className="mr-3" /> Manage User Access
// // //                 </button>
// // //               )}
// // //               {hasPermission("GET:/dashboard") && (
// // //                  <button className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
// // //                     <FiBarChart2 className="mr-3" /> Reports
// // //                 </button>
// // //               )}
// // //               <button onClick={() => navigate("/rebelancer")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
// // //                 <FiLogOut className="mr-3" /> Rebalancer
// // //               </button>
// // //                {hasPermission("POST:/config/apply-formula") && (
// // //                 <button onClick={() => navigate("/Config")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
// // //                   <FiShoppingBag className="mr-3" /> Configuration Page
// // //                 </button>
// // //               )}
// // //               <button onClick={() => navigate("/")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
// // //                 <FiLogOut className="mr-3" /> Logout
// // //               </button>
// // //             </nav>
// // //           </>
// // //         )}
// // //       </div>

// // //       {/* Main Content */}
// // //       <div className="flex-1">
// // //         <div className="p-4">
// // //           <div className="bg-[#152438] rounded-2xl border border-[#1f2a46] shadow-xl text-white font-sans space-y-8 p-8">
            
// // //             {/* Header */}
// // //             <header className="flex justify-between items-center">
// // //               <div>
// // //                 <h1 className="text-3xl font-bold">Control Tower Dashboard</h1>
// // //                 {/* <p className="text-sm text-gray-400 mt-1">
// // //                   Last updated: {new Date(data.metrics.timestamp).toLocaleString()}
// // //                 </p> */}
// // //               </div>
// // //               <div className="flex items-center space-x-3">
// // //                 <button onClick={() => window.location.reload()} className="p-2 rounded-md hover:bg-[#1f2a46] transition">
// // //                   <FiRefreshCw size={20} />
// // //                 </button>
// // //               </div>
// // //             </header>

// // //             {/* Metrics */}
// // //             <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
// // //               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-[#1f2a46] rounded-lg p-3 shadow-inner border border-white/20 h-[100px] flex flex-col justify-center">
// // //                 <p className="text-xs font-medium text-blue-200">Current Demand</p>
// // //                 <p className="text-2xl font-bold tracking-tight leading-tight">
// // //                   {data.metrics.current_demand.toLocaleString()}
// // //                 </p>
// // //               </motion.div>

// // //               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-[#1f2a46] rounded-lg p-3 shadow-inner border border-white/20 h-[100px] flex justify-between items-center">
// // //                 <div>
// // //                   <p className="text-xs font-medium text-blue-200">Inventory</p>
// // //                   <p className="text-2xl font-bold tracking-tight leading-tight">
// // //                     {data.metrics.inventory_position.toLocaleString()}
// // //                   </p>
// // //                 </div>
// // //                 <div className="bg-[#24304b] px-2 py-1 rounded-md border border-[#2e3b5c] text-sm font-semibold">
// // //                   {data.metrics.weeks_of_supply}
// // //                 </div>
// // //               </motion.div>

                        
// // //               {/* Alerts Card */}
// // //               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-[#1f2a46] rounded-xl p-4 shadow-inner space-y-3 border border-white/20">
// // //                 <div className="flex justify-between items-center mb-2">
// // //                   <p className="text-md font-medium text-blue-200">Alerts</p>
// // //                   <span className="text-xs bg-red-500/20 px-2 py-1 rounded text-red-300">{data.alerts.length} total</span>
// // //                 </div>
// // //                 {/* MODIFIED: Added max-h-32 and overflow-y-auto to make the container scrollable */}
// // //                 <div className="space-y-2 max-h-32 overflow-y-auto pr-3">
// // //                   {data.alerts.map((alert) => {
// // //                     const severityColors = {
// // //                       High: "bg-[#743939] text-red-300",
// // //                       Medium: "bg-[#705936] text-yellow-300",
// // //                       Low: "bg-[#375a3f] text-green-300"
// // //                     };
// // //                     return (
// // //                       <motion.div key={alert.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`p-3 rounded-md flex justify-between items-center border border-white/10 ${severityColors[alert.severity] || "bg-[#3a3a3a]"}`}>
// // //                         <div className="flex flex-col">
// // //                           <span className="font-semibold">{alert.message}</span>
// // //                           <span className="text-xs mt-1 opacity-70">Type: {alert.type}</span>
// // //                         </div>
// // //                         <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded">{alert.severity}</span>
// // //                       </motion.div>
// // //                     );
// // //                   })}
// // //                 </div>
// // //               </motion.div>
// // //  <motion.div
// // //       initial={{ opacity: 0, y: 10 }}
// // //       animate={{ opacity: 1, y: 0 }}
// // //       transition={{ duration: 0.6 }}
// // //       className="bg-[#1f2a46] rounded-xl p-5 shadow-inner border border-white/20 md:col-span-3"
// // //     >
// // //       <div className="flex justify-between items-center mb-3">
// // //         <p className="font-medium text-blue-200">Network View</p>
// // //         <div className="text-xs flex space-x-2">
// // //           <span className="bg-green-500/20 px-2 py-1 rounded text-green-300">
// // //             {data.metrics.stockouts} Stockouts
// // //           </span>
// // //           <span className="bg-yellow-500/20 px-2 py-1 rounded text-yellow-300">
// // //             {data.metrics.skus_below_threshold} Below Threshold
// // //           </span>
// // //         </div>
// // //       </div>

// // // {/* Map Container - MODIFIED SECTION */}
// // // <div className="relative">
// // //   {/* MODIFIED: Removed mapSize state and conditional height for a fixed, responsive height. */}
// // //   <div
// // //     className="rounded-lg overflow-hidden relative h-[400px] md:h-[500px]"
// // //   >
// // //     <MapContainer
// // //       center={[20, 0]}
// // //       zoom={2}
// // //       style={{ height: "100%", width: "100%" }}
// // //       scrollWheelZoom={true}
// // //     >
// // //       <TileLayer
// // //         attribution='&copy; OpenStreetMap contributors'
// // //         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
// // //       />

// // //       {/* MODIFIED: Pass locations to the button instead of static center/zoom. */}
// // //       <ResetMapViewButton locations={data.locations} />

// // //       {/* This component sets the initial view to fit all markers */}
// // //       <FitBounds locations={data.locations} />

// // //       {data.locations
// // //         .filter((loc) => loc.lat != null && loc.lng != null)
// // //         .map((loc, i) => (
// // //           <AutoPanMarker
// // //             key={loc.store_id || i}
// // //             position={[loc.lat, loc.lng]}
// // //             icon={createAlertIcon(loc)}
// // //           >
// // //             {/* Tooltip content remains unchanged... */}
// // //             <Tooltip
// // //               direction="top"
// // //               offset={[0, -42]}
// // //               opacity={1}
// // //               permanent={false}
// // //             >
// // //               <div
// // //                 className="text-sm space-y-2 text-left"
// // //                 style={{ minWidth: "250px", maxWidth: "300px" }}
// // //               >
// // //                 <div>
// // //                   <strong>{loc.store_name}</strong>
// // //                   <br />
// // //                   <span className="text-gray-500">{loc.location}</span>
// // //                 </div>

// // //                 {loc.alert && (
// // //                   <div className="text-red-500 font-bold">
// // //                     🚨 Alert: {loc.alert}
// // //                   </div>
// // //                 )}

// // //                 {loc.alertStatus && (
// // //                   <div className="mt-2 text-gray-800 bg-amber-100 p-2 rounded-md shadow-inner border border-amber-300/40">
// // //                     <p className="text-amber-800 font-semibold mb-1">
// // //                       Reorder Status:
// // //                     </p>
// // //                     <ul className="ml-4 list-disc text-sm space-y-1">
// // //                       <li>
// // //                         📦 SKUs to Reorder:{" "}
// // //                         <strong>
// // //                           {loc.alertStatus.reorderCount}
// // //                         </strong>
// // //                       </li>
// // //                       <li
// // //                         className={
// // //                           loc.alertStatus.hasAlert
// // //                             ? "text-red-600 font-bold"
// // //                             : ""
// // //                         }
// // //                       >
// // //                         ⚠️ Stockout despite Reorder:{" "}
// // //                         <strong>
// // //                           {loc.alertStatus.stockoutCount}
// // //                         </strong>
// // //                       </li>
// // //                     </ul>
// // //                   </div>
// // //                 )}

// // //                 {loc.hoverStats && (
// // //                   <div className="mt-3 bg-blue-100 text-gray-800 p-2 rounded-md shadow-inner border border-blue-300/40">
// // //                     <p className="text-blue-800 font-semibold mb-1">
// // //                       Quick Stats (
// // //                       {loc.hoverStats.lookahead_days}
// // //                       -Day):
// // //                     </p>
// // //                     <ul className="ml-4 list-disc text-sm space-y-1">
// // //                       <li>
// // //                         📦 <strong>{loc.hoverStats.distinct_skus}</strong>{" "}
// // //                         SKUs
// // //                       </li>
// // //                       <li>
// // //                         📊{" "}
// // //                         <strong>{loc.hoverStats.inventory_units}</strong>{" "}
// // //                         Inventory Units
// // //                       </li>
// // //                       <li>
// // //                         📈{" "}
// // //                         <strong>{loc.hoverStats.forecast_units}</strong>{" "}
// // //                         Forecast Units
// // //                       </li>
// // //                     </ul>
// // //                   </div>
// // //                 )}
// // //               </div>
// // //             </Tooltip>
// // //           </AutoPanMarker>
// // //         ))}
// // //     </MapContainer>

// // //         </div>
// // //       </div>
// // //     </motion.div>

// // //             </section>

// // //             <motion.section
// // //               initial={{ opacity: 0, y: 10 }}
// // //               animate={{ opacity: 1, y: 0 }}
// // //               transition={{ duration: 0.7 }}
// // //               className="bg-[#1f2a46] rounded-xl p-5 shadow-inner border border-white/20"
// // //             >
// // //               <h3 className="text-lg font-medium text-blue-200">SKU Availability Rate (Historical)</h3>
// // //               <p className="text-sm text-gray-400 mb-4">
// // //                 Percentage of eligible SKUs not out of stock – tracked week by week.
// // //               </p>
// // //               <div className="h-[250px] w-full">
// // // <ResponsiveContainer width="100%" height="100%">
// // //   <BarChart data={availabilityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
// // //     <defs>
// // //       <linearGradient id="availabilityGradient" x1="0" y1="0" x2="0" y2="1">
// // //         <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9} />
// // //         <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.2} />
// // //       </linearGradient>
// // //     </defs>
// // //     <CartesianGrid strokeDasharray="3 3" stroke="#2a3a56" />
// // //     <XAxis
// // //       dataKey="week_start"
// // //       stroke="#9ca3af"
// // //       tick={{ fontSize: 12 }}
// // //       tickFormatter={(label) =>
// // //         new Date(label + 'T00:00:00').toLocaleDateString('en-US', {
// // //           month: 'short',
// // //           day: 'numeric',
// // //         })
// // //       }
// // //     />
// // //     <YAxis
// // //       stroke="#9ca3af"
// // //       tick={{ fontSize: 12 }}
// // //       domain={[dataMin => Math.floor(dataMin / 5) * 5, 100]}
// // //       tickFormatter={(tick) => `${tick}%`}
// // //     />
// // //     <RechartsTooltip
// // //       contentStyle={{
// // //         backgroundColor: '#0f172a',
// // //         borderColor: '#334155',
// // //         borderRadius: '0.5rem',
// // //       }}
// // //       labelStyle={{ fontWeight: 'bold' }}
// // //       formatter={(value, name, props) => [
// // //         `${props.payload.availability_rate.toFixed(2)}%`,
// // //         "Availability Rate",
// // //       ]}
// // //       labelFormatter={(label) =>
// // //         `Week of: ${new Date(label + 'T00:00:00').toLocaleDateString()}`
// // //       }
// // //     />
// // //     <Legend wrapperStyle={{ fontSize: '14px' }} />
// // //     <Bar
// // //       dataKey="availability_rate"
// // //       name="Availability Rate"
// // //       fill="url(#availabilityGradient)"
// // //       radius={[6, 6, 0, 0]}
// // //     />
// // //   </BarChart>
// // // </ResponsiveContainer>

// // //               </div>
// // //             </motion.section>

// // //             {/* Inventory Health */}
// // //             <section className="bg-[#1f2a46] rounded-lg p-4 flex flex-col md:flex-row items-center justify-between border border-white/20">
// // //               <div className="flex items-center space-x-3">
// // //                 <div className="text-green-400">
// // //                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
// // //                     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
// // //                     <polyline points="22 4 12 14.01 9 11.01"></polyline>
// // //                   </svg>
// // //                 </div>
// // //                 <div>
// // //                   <p className="font-medium">Inventory Health</p>
// // //                   <p className="text-sm text-gray-400">Turnover: {data.metrics.inventory_turnover}</p>
// // //                 </div>
// // //               </div>
// // //               <div className="w-full md:w-64 mt-4 md:mt-0">
// // //                 <div className="flex justify-between text-xs text-gray-400 mb-1">
// // //                   <span>Optimal</span>
// // //                   <span>{data.metrics.skus_below_threshold} issues</span>
// // //                 </div>
// // //                 <div className="w-full h-2 bg-[#293956] rounded overflow-hidden">
// // //                   <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded" style={{ width: `${100 - (data.metrics.skus_below_threshold * 5)}%` }}></div>
// // //                 </div>
// // //               </div>
// // //             </section>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }
// // // export default Dashboard;



















// // // import React, { useState, useEffect, useCallback, useMemo } from "react";
// // // import axios from "axios";
// // // import {
// // //   FiMenu, FiX, FiDatabase, FiTrendingUp, FiSettings,
// // //   FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag,
// // //   FiAlertTriangle, FiCheckCircle, FiInfo, FiBox, FiCalendar
// // // } from "react-icons/fi";
// // // import { motion, AnimatePresence } from "framer-motion";
// // // import { useNavigate } from "react-router-dom";
// // // import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
// // // import L from "leaflet";
// // // import "leaflet/dist/leaflet.css";
// // // import {
// // //   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
// // // } from 'recharts';

// // // const BASE_URL = "http://localhost:5500";

// // // // --- Leaflet & Map Helper Components ---

// // // // Setup for Leaflet's default icon
// // // delete L.Icon.Default.prototype._getIconUrl;
// // // L.Icon.Default.mergeOptions({
// // //   iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
// // //   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
// // //   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// // // });

// // // // Injects CSS for custom map markers and tooltips
// // // const MapStyles = () => (
// // //   <style>{`
// // //     .custom-marker-container { position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; }
// // //     .marker-svg { width: 100%; height: 100%; filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5)); }
// // //     .severity-high .marker-svg { fill: #ef4444; } /* red-500 */
// // //     .severity-medium .marker-svg { fill: #f59e0b; } /* amber-500 */
// // //     .severity-low .marker-svg { fill: #3b82f6; } /* blue-500 */
// // //     .marker-count { position: absolute; top: 0px; left: 55%; background-color: white; color: #dc2626; font-weight: bold; font-size: 12px; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 1px solid #dc2626; z-index: 10; }
// // //     .leaflet-tooltip { background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
// // //     .leaflet-tooltip-top:before { border-top-color: #e2e8f0; }
// // //   `}</style>
// // // );

// // // // Creates custom HTML icons for map markers based on alert status
// // // const createAlertIcon = (location) => {
// // //   const { alertStatus } = location;
// // //   const reorderCount = alertStatus?.reorderCount || 0;
// // //   const stockoutCount = alertStatus?.stockoutCount || 0;
// // //   const totalAlerts = reorderCount + stockoutCount;

// // //   let severityClass = 'severity-low'; // Default blue
// // //   if (alertStatus?.hasAlert) severityClass = 'severity-high'; // Red for stockout despite reorder
// // //   else if (reorderCount > 0) severityClass = 'severity-medium'; // Amber for needs reorder

// // //   return new L.DivIcon({
// // //     className: `custom-marker-container ${severityClass}`,
// // //     html: `
// // //       ${totalAlerts > 0 ? `<div class="marker-count">${totalAlerts}</div>` : ''}
// // //       <svg viewBox="0 0 24 24" class="marker-svg">
// // //         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
// // //       </svg>
// // //     `,
// // //     iconSize: [32, 42],
// // //     iconAnchor: [16, 42]
// // //   });
// // // };

// // // // A component that automatically fits the map view to contain all markers
// // // const FitBounds = ({ locations }) => {
// // //   const map = useMap();
// // //   useEffect(() => {
// // //     if (!locations || locations.length === 0) return;
// // //     const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
// // //     if (validCoords.length === 0) return;
// // //     const bounds = L.latLngBounds(validCoords);
// // //     if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
// // //   }, [locations, map]);
// // //   return null;
// // // };

// // // // A button on the map to reset the view to fit all markers
// // // const ResetMapViewButton = ({ locations }) => {
// // //     const map = useMap();
// // //     const fitMapToBounds = () => {
// // //         const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
// // //         if (validCoords.length > 0) {
// // //             const bounds = L.latLngBounds(validCoords);
// // //             if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], animate: true });
// // //         }
// // //     };
// // //     return (
// // //         <button
// // //             onClick={fitMapToBounds}
// // //             className="absolute top-3 right-3 z-[1000] bg-white text-slate-800 px-3 py-1.5 rounded-md shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
// // //             title="Fit all nodes into view"
// // //         >
// // //            ⤢ Fit View
// // //         </button>
// // //     );
// // // };

// // // // A custom Marker component that pans the map if its tooltip goes off-screen
// // // const AutoPanMarker = ({ children, ...props }) => {
// // //     const map = useMap();
  
// // //     const handleTooltipOpen = useCallback((e) => {
// // //       const tooltip = e.tooltip;
// // //       if (!tooltip || !map) return;
  
// // //       setTimeout(() => {
// // //         const tooltipBounds = tooltip.getElement().getBoundingClientRect();
// // //         const mapBounds = map.getContainer().getBoundingClientRect();
// // //         const panOffset = { x: 0, y: 0 };
// // //         const padding = 20;
  
// // //         if (tooltipBounds.right + padding > mapBounds.right) panOffset.x = tooltipBounds.right + padding - mapBounds.right;
// // //         if (tooltipBounds.left - padding < mapBounds.left) panOffset.x = tooltipBounds.left - padding - mapBounds.left;
// // //         if (tooltipBounds.bottom + padding > mapBounds.bottom) panOffset.y = tooltipBounds.bottom + padding - mapBounds.bottom;
// // //         if (tooltipBounds.top - padding < mapBounds.top) panOffset.y = tooltipBounds.top - padding - mapBounds.top;
        
// // //         if (panOffset.x !== 0 || panOffset.y !== 0) {
// // //           map.panBy([panOffset.x, panOffset.y], { animate: true, duration: 0.3 });
// // //         }
// // //       }, 10);
  
// // //     }, [map]);
    
// // //     const eventHandlers = useMemo(() => ({
// // //       tooltipopen: handleTooltipOpen,
// // //     }), [handleTooltipOpen]);
  
// // //     return (
// // //       <Marker {...props} eventHandlers={eventHandlers}>
// // //         {children}
// // //       </Marker>
// // //     );
// // // };

// // // // --- Reusable UI Components ---

// // // const MetricCard = React.memo(({ icon, title, value, subValue = null }) => (
// // //   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex items-center space-x-4">
// // //     <div className="bg-slate-900 p-3 rounded-full">{icon}</div>
// // //     <div>
// // //       <p className="text-sm font-medium text-slate-400">{title}</p>
// // //       <p className="text-2xl font-bold text-white">{value}</p>
// // //     </div>
// // //     {subValue && <div className="ml-auto text-sm font-semibold text-slate-300 bg-slate-700 px-2 py-1 rounded-md">{subValue}</div>}
// // //   </motion.div>
// // // ));

// // // const Header = React.memo(({ onRefresh }) => (
// // //   <header className="relative flex justify-center items-center mb-6">
// // //     <div className="text-center">
// // //       <h1 className="text-3xl font-bold text-white">Control Tower Dashboard</h1>
// // //     </div>
// // //     <button 
// // //       onClick={onRefresh} 
// // //       className="absolute right-0 p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition"
// // //     >
// // //       <FiRefreshCw size={20} />
// // //     </button>
// // //   </header>
// // // ));

// // // const Sidebar = React.memo(({ isOpen, onClose, permissions }) => {
// // //     const navigate = useNavigate();
// // //     const hasPermission = (route) => permissions.includes(route);

// // //     return (
// // //         <div className={`bg-slate-800 border-r border-slate-700 shadow-lg transition-all duration-300 ${isOpen ? "w-64 p-6" : "w-0 p-0 overflow-hidden"} flex flex-col`}>
// // //           {isOpen && (
// // //                 <>
// // //                     <div className="flex items-center justify-between mb-8">
// // //                         <h2 className="text-white text-xl font-bold">Control</h2>
// // //                         <button onClick={onClose} className="text-slate-400 hover:text-white"><FiX size={24} /></button>
// // //                     </div>
// // //                     <nav className="space-y-3">
// // //                       {hasPermission("POST:/store_upload") && (
// // //                           <button onClick={() => navigate("/file-upload")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiUpload className="mr-3" /> File Upload</button>
// // //                       )}
// // //                       {hasPermission("GET:/admin/users") && (
// // //                           <button onClick={() => navigate("/adminprivileges")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiSettings className="mr-3" /> Manage Users</button>
// // //                       )}
// // //                       {hasPermission("GET:/dashboard") && (
// // //                           <button className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiBarChart2 className="mr-3" /> Reports</button>
// // //                       )}
// // //                       {/* Added Forecast Button */}
// // //                       <button onClick={() => navigate("/forecast")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiTrendingUp className="mr-3" /> Forecast</button>
// // //                       <button onClick={() => navigate("/rebalancer")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiRefreshCw className="mr-3" /> Rebalancer</button>
// // //                       {hasPermission("POST:/config/apply-formula") && (
// // //                           <button onClick={() => navigate("/Config")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiShoppingBag className="mr-3" /> Configuration</button>
// // //                       )}
// // //                       <div className="!mt-auto pt-4 border-t border-slate-700">
// // //                           <button onClick={() => navigate("/")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiLogOut className="mr-3" /> Logout</button>
// // //                       </div>
// // //                   </nav>
// // //                 </>
// // //             )}  
// // //         </div>
// // //     );
// // // });

// // // // --- Main Dashboard Component ---

// // // function Dashboard() {
// // //   const [sidebarOpen, setSidebarOpen] = useState(false);
// // //   const [permissions, setPermissions] = useState([]);
// // //   const [availabilityData, setAvailabilityData] = useState([]);
// // //   const [data, setData] = useState({
// // //     metrics: { current_demand: 0, inventory_position: 0, weeks_of_supply: 0, stockouts: 0, skus_below_threshold: 0, timestamp: new Date().toISOString() },
// // //     alerts: [],
// // //     locations: []
// // //   });
// // //   const [loading, setLoading] = useState(true);
// // //   const navigate = useNavigate();

// // //   const hasPermission = (route) => permissions.includes(route);

// // //   useEffect(() => {
// // //     const fetchDashboardData = async () => {
// // //         setLoading(true);
// // //         const token = localStorage.getItem("token");
// // //         if (!token) {
// // //           navigate("/");
// // //           return;
// // //         }
// // //         const headers = { Authorization: `Bearer ${token}` };
  
// // //         try {
// // //           const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
// // //           const allowedRoutes = permRes.data.allowed_routes || [];
// // //           setPermissions(allowedRoutes);
  
// // //           if (!allowedRoutes.includes("GET:/dashboard")) {
// // //             setLoading(false);
// // //             return;
// // //           }
  
// // //           const [ dashboardRes, storesRes, alertsRes, availabilityRes, lookaheadRes ] = await Promise.allSettled([
// // //             axios.get(`${BASE_URL}/dashboard`, { headers }),
// // //             axios.get(`${BASE_URL}/stores`, { headers }),
// // //             axios.get(`${BASE_URL}/alerts`, { headers }),
// // //             axios.get(`${BASE_URL}/availability`, { headers }),
// // //             axios.get(`${BASE_URL}/user/lookahead_days`, { headers }),
// // //           ]);
          
// // //           if (availabilityRes.status === 'fulfilled') {
// // //               setAvailabilityData(availabilityRes.value.data.data || []);
// // //           } else {
// // //               setAvailabilityData([]);
// // //           }
          
// // //           const backendDashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {};
// // //           const stores = storesRes.status === 'fulfilled' ? storesRes.value.data.stores : [];
// // //           const backendAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
          
// // //           let stockouts = 0;
// // //           let skusBelow = 0;
          
// // //           if (backendAlerts?.length > 0) {
// // //               backendAlerts.forEach(alert => {
// // //                 if (alert.type === "STOCK_OUT") stockouts++;
// // //                 else if (alert.type === "UNDER_STOCK") skusBelow++;
// // //               });
// // //           }
          
// // //           const locationPromises = stores.map(store => Promise.allSettled([
// // //               axios.get(`${BASE_URL}/store/${store.store_id}/hover`, { headers }),
// // //               axios.get(`${BASE_URL}/store/${store.store_id}/with-alert-status`, { headers })
// // //           ]));
  
// // //           const locationsData = await Promise.all(locationPromises);
  
// // //           const locations = locationsData.map((results, index) => {
// // //               const store = stores[index];
// // //               const [hoverRes, alertStatusRes] = results;
// // //               const lookaheadDays = lookaheadRes.status === 'fulfilled' ? lookaheadRes.value.data.lookahead_days : 7;
// // //               const hoverData = hoverRes.status === 'fulfilled' ? { ...hoverRes.value.data, lookahead_days: lookaheadDays } : {lookahead_days: lookaheadDays};
// // //               const alertStatusData = alertStatusRes.status === 'fulfilled' ? alertStatusRes.value.data : {};
  
// // //               return {
// // //                   store_id: store.store_id,
// // //                   store_name: store.name,
// // //                   location: store.city,
// // //                   lat: store.lat,
// // //                   lng: store.lon,
// // //                   alert: backendAlerts.find(a => a.store_id === store.store_id)?.message || null,
// // //                   hoverStats: {
// // //                       distinct_skus: hoverData.distinct_skus || 0,
// // //                       inventory_units: hoverData.inventory_units || 0,
// // //                       forecast_units: hoverData.forecast_units || 0,
// // //                       lookahead_days: hoverData.lookahead_days
// // //                   },
// // //                   alertStatus: {
// // //                       reorderCount: alertStatusData.num_skus_to_reorder || 0,
// // //                       stockoutCount: alertStatusData.num_skus_stockout_despite_reorder || 0,
// // //                       hasAlert: alertStatusData.alert || false,
// // //                   }
// // //               };
// // //           });
  
// // //           setData({
// // //             metrics: {
// // //               current_demand: backendDashboard.current_demand ?? 0,
// // //               inventory_position: backendDashboard.inventory_position ?? 0,
// // //               weeks_of_supply: backendDashboard.weeks_of_supply ?? 0,
// // //               stockouts,
// // //               skus_below_threshold: skusBelow,
// // //               timestamp: backendDashboard.timestamp ?? new Date().toISOString()
// // //             },
// // //             alerts: backendAlerts.map((a, i) => ({
// // //               id: a.id || `alert-${i}`,
// // //               severity: a.severity || "Low",
// // //               message: a.message,
// // //               type: a.type ? a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "General",
// // //               store_id: a.store_id,
// // //               sku: a.sku // Add this line
// // //             })),
// // //             locations
// // //           });
  
// // //         } catch (err) {
// // //           if (err.response?.status === 401) navigate("/");
// // //         } finally {
// // //           setLoading(false);
// // //         }
// // //       };
// // //     fetchDashboardData();
// // //   }, [navigate]);

// // //   if (loading) {
// // //     return <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center"><div className="flex items-center space-x-3 text-white"><FiRefreshCw className="animate-spin h-5 w-5" /><span>Loading Dashboard...</span></div></div>;
// // //   }
// // //   if (!hasPermission("GET:/dashboard")) {
// // //       return <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white"><h1 className="text-3xl font-bold">Access Denied</h1><p className="mt-2 text-slate-400">You do not have permission to view this page.</p><button onClick={() => navigate("/")} className="mt-6 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition-colors">Go to Login</button></div>;
// // //   }

// // //   return (
// // //     <div className="min-h-screen w-full bg-slate-900 text-white font-sans flex relative">
// // //         <MapStyles />

// // //         {!sidebarOpen && (
// // //             <motion.button
// // //             initial={{ opacity: 0, scale: 0.8, x: -50 }}
// // //             animate={{ opacity: 1, scale: 1, x: 0 }}
// // //             transition={{ type: "spring", stiffness: 260, damping: 20 }}
// // //             onClick={() => setSidebarOpen(true)}
// // //             className="absolute top-6 left-6 z-[1000] p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
// // //             aria-label="Open sidebar"
// // //             >
// // //             <FiMenu size={22} />
// // //             </motion.button>
// // //         )}

// // //         <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} permissions={permissions} />

// // //       <main className="flex-1 p-6 transition-all duration-300">
// // //         <Header lastUpdated={data.metrics.timestamp} onRefresh={() => window.location.reload()} />

// // //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
// // //           {/* Main Content Column */}
// // //           <div className="lg:col-span-2 space-y-6 flex flex-col">
// // // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // //  <MetricCard icon={<FiTrendingUp size={24} className="text-blue-400" />} title="Current Demand" value={data.metrics.current_demand.toLocaleString()} />
// // //     <MetricCard icon={<FiBox size={24} className="text-green-400" />} title="Inventory Position" value={data.metrics.inventory_position.toLocaleString()}  />
// // //     <MetricCard icon={<FiCalendar size={24} className="text-yellow-400" />} title="Weeks Of Supply" value={data.metrics.weeks_of_supply.toLocaleString()} />
// // //             </div>

// // //             {/* Network View Map */}
// // //             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex-1 flex flex-col">
// // //               <div className="flex justify-between items-center mb-4 flex-shrink-0">
// // //                 <p className="font-bold text-white text-lg">Network View</p>
// // //                 <div className="text-xs flex space-x-2">
// // //                   <span className="bg-red-900/50 px-2 py-1 rounded text-red-300">{data.metrics.stockouts} Stockouts</span>
// // //                   <span className="bg-yellow-900/50 px-2 py-1 rounded text-yellow-300">{data.metrics.skus_below_threshold} Below Threshold</span>
// // //                 </div>
// // //               </div>
// // //               <div className="rounded-lg overflow-hidden relative h-[60vh]">
// // //                 <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
// // //                   <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
// // //                   <ResetMapViewButton locations={data.locations} />
// // //                   <FitBounds locations={data.locations} />
// // //                   {data.locations.filter(loc => loc.lat != null && loc.lng != null).map((loc) => (
// // //                     <AutoPanMarker key={loc.store_id} position={[loc.lat, loc.lng]} icon={createAlertIcon(loc)}>
// // //                       <Tooltip direction="top" offset={[0, -42]} opacity={1} permanent={false}>
// // //                         <div className="text-sm space-y-3 p-1" style={{ minWidth: "250px", maxWidth: "300px" }}>
// // //                             <div><strong>{loc.store_name}</strong><br /><span className="text-slate-500">{loc.location}</span></div>
                            
// // //                             {loc.alert && <div className="text-red-600 font-bold border-t border-slate-200 pt-2">🚨 Alert: {loc.alert}</div>}

// // //                             {loc.alertStatus && (
// // //                                 <div className="text-slate-800 bg-amber-100 p-2 rounded-md shadow-inner border border-amber-200">
// // //                                     <p className="text-amber-800 font-semibold mb-1">Reorder Status:</p>
// // //                                     <ul className="ml-4 list-disc text-sm space-y-1">
// // //                                     <li>📦 SKUs to Reorder: <strong>{loc.alertStatus.reorderCount}</strong></li>
// // //                                     <li className={loc.alertStatus.hasAlert ? "text-red-600 font-bold" : ""}>
// // //                                         ⚠️ Stockout despite Reorder: <strong>{loc.alertStatus.stockoutCount}</strong>
// // //                                     </li>
// // //                                     </ul>
// // //                                 </div>
// // //                             )}

// // //                             {loc.hoverStats && (
// // //                                 <div className="bg-blue-50 text-slate-800 p-2 rounded-md shadow-inner border border-blue-200">
// // //                                     <p className="text-blue-800 font-semibold mb-1">Quick Stats ({loc.hoverStats.lookahead_days}-Day):</p>
// // //                                     <ul className="ml-4 list-disc text-sm space-y-1">
// // //                                     <li>📦 <strong>{loc.hoverStats.distinct_skus}</strong> SKUs</li>
// // //                                     <li>📊 <strong>{loc.hoverStats.inventory_units}</strong> Inventory Units</li>
// // //                                     <li>📈 <strong>{loc.hoverStats.forecast_units}</strong> Forecast Units</li>
// // //                                     </ul>
// // //                                 </div>
// // //                             )}
// // //                         </div>
// // //                       </Tooltip>
// // //                     </AutoPanMarker>
// // //                   ))}
// // //                 </MapContainer>
// // //               </div>
// // //             </motion.div>
// // //           </div>

// // //           {/* Right Column */}
// // //           <div className="lg:col-span-1 space-y-6 flex flex-col">
// // //             {/* Alerts Panel */}
// // //             <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[285px]">
// // //               <div className="flex justify-between items-center mb-4 flex-shrink-0">
// // //                 <h3 className="text-lg font-bold text-white">Alerts</h3>
// // //                 <span className="text-sm bg-red-900/50 px-2 py-1 rounded text-red-300 font-semibold">{data.alerts.length} Total</span>
// // //               </div>
// // //               <div className="space-y-3 overflow-y-auto flex-1 pr-2">
// // //                 {data.alerts.length > 0 ? data.alerts.map((alert) => (
// // //                   <div key={alert.id} className="bg-slate-700/50 p-3 rounded-md border border-slate-600">
// // //                     <div className="flex items-start">
// // //                         {alert.severity === 'High' && <FiAlertTriangle className="text-red-400 mr-3 mt-1 flex-shrink-0" />}
// // //                         {alert.severity === 'Medium' && <FiInfo className="text-yellow-400 mr-3 mt-1 flex-shrink-0" />}
// // //                         {alert.severity === 'Low' && <FiCheckCircle className="text-green-400 mr-3 mt-1 flex-shrink-0" />}
// // //                       <div>
// // //                         <p className="text-sm font-semibold text-slate-200">{alert.message}</p>
// // //                         <p className="text-xs text-slate-400 mt-1">{alert.type} (SKU: {alert.sku}, Store: {alert.store_id})</p>
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                 )) : (
// // //                   <div className="text-center py-10 text-slate-400"><FiCheckCircle size={32} className="mx-auto mb-2 text-green-500" /><p>No active alerts.</p></div>
// // //                 )}
// // //               </div>
// // //             </div>

// // // {/* Availability Chart */}
// // //             <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[320px]">
// // //                 <h3 className="text-lg font-bold text-white">SKU Availability Rate</h3>
// // //                 <p className="text-sm text-slate-400 mb-4 flex-shrink-0">Weekly historical availability.</p>
// // //                 <div className="w-full flex-1">
// // //                     <ResponsiveContainer width="100%" height="100%">
// // //                         <BarChart data={availabilityData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
// // //                             <defs><linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} /></linearGradient></defs>
// // //                             <CartesianGrid strokeDasharray="3 3" stroke="#2a3a56" />
// // //                             <XAxis dataKey="week_start" stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
// // //                             <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
// // //                             <RechartsTooltip
// // //                               contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
// // //                               labelStyle={{ color: '#e2e8f0' }}
// // //                               formatter={(value) => [`${value.toFixed(2)}%`, "Availability"]}
// // //                               cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }} // Changed this line
// // //                             />
// // //                             <Bar dataKey="availability_rate" name="Availability Rate" fill="url(#availGrad)" radius={[4, 4, 0, 0]} />
// // //                         </BarChart>
// // //                     </ResponsiveContainer>
// // //                 </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </main>
// // //     </div>
// // //   );
// // // }

// // // export default Dashboard;



















































// // // import React, { useState, useEffect, useCallback, useMemo } from "react";
// // // import axios from "axios";
// // // import {
// // //   FiMenu, FiX, FiDatabase, FiTrendingUp, FiSettings,
// // //   FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag,
// // //   FiAlertTriangle, FiCheckCircle, FiInfo, FiBox, FiCalendar
// // // } from "react-icons/fi";
// // // import { motion, AnimatePresence } from "framer-motion";
// // // import { useNavigate } from "react-router-dom";
// // // import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
// // // import L from "leaflet";
// // // import "leaflet/dist/leaflet.css";
// // // import {
// // //   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
// // // } from 'recharts';
// // // import Chatbot from '../components/Chatbot'; // Import the new Chatbot component

// // // const BASE_URL = "http://localhost:5500";

// // // // --- Leaflet & Map Helper Components ---

// // // // Setup for Leaflet's default icon
// // // delete L.Icon.Default.prototype._getIconUrl;
// // // L.Icon.Default.mergeOptions({
// // //   iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
// // //   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
// // //   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// // // });

// // // // Injects CSS for custom map markers and tooltips
// // // const MapStyles = () => (
// // //   <style>{`
// // //     .custom-marker-container { position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; }
// // //     .marker-svg { width: 100%; height: 100%; filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5)); }
// // //     .severity-high .marker-svg { fill: #ef4444; } /* red-500 */
// // //     .severity-medium .marker-svg { fill: #f59e0b; } /* amber-500 */
// // //     .severity-low .marker-svg { fill: #3b82f6; } /* blue-500 */
// // //     .marker-count { position: absolute; top: 0px; left: 55%; background-color: white; color: #dc2626; font-weight: bold; font-size: 12px; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 1px solid #dc2626; z-index: 10; }
// // //     .leaflet-tooltip { background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
// // //     .leaflet-tooltip-top:before { border-top-color: #e2e8f0; }
// // //   `}</style>
// // // );

// // // // Creates custom HTML icons for map markers based on alert status
// // // const createAlertIcon = (location) => {
// // //   const { alertStatus } = location;
// // //   const reorderCount = alertStatus?.reorderCount || 0;
// // //   const stockoutCount = alertStatus?.stockoutCount || 0;
// // //   const totalAlerts = reorderCount + stockoutCount;

// // //   let severityClass = 'severity-low'; // Default blue
// // //   if (alertStatus?.hasAlert) severityClass = 'severity-high'; // Red for stockout despite reorder
// // //   else if (reorderCount > 0) severityClass = 'severity-medium'; // Amber for needs reorder

// // //   return new L.DivIcon({
// // //     className: `custom-marker-container ${severityClass}`,
// // //     html: `
// // //       ${totalAlerts > 0 ? `<div class="marker-count">${totalAlerts}</div>` : ''}
// // //       <svg viewBox="0 0 24 24" class="marker-svg">
// // //         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
// // //       </svg>
// // //     `,
// // //     iconSize: [32, 42],
// // //     iconAnchor: [16, 42]
// // //   });
// // // };

// // // // A component that automatically fits the map view to contain all markers
// // // const FitBounds = ({ locations }) => {
// // //   const map = useMap();
// // //   useEffect(() => {
// // //     if (!locations || locations.length === 0) return;
// // //     const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
// // //     if (validCoords.length === 0) return;
// // //     const bounds = L.latLngBounds(validCoords);
// // //     if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
// // //   }, [locations, map]);
// // //   return null;
// // // };

// // // // A button on the map to reset the view to fit all markers
// // // const ResetMapViewButton = ({ locations }) => {
// // //     const map = useMap();
// // //     const fitMapToBounds = () => {
// // //         const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
// // //         if (validCoords.length > 0) {
// // //             const bounds = L.latLngBounds(validCoords);
// // //             if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], animate: true });
// // //         }
// // //     };
// // //     return (
// // //         <button
// // //             onClick={fitMapToBounds}
// // //             className="absolute top-3 right-3 z-[1000] bg-white text-slate-800 px-3 py-1.5 rounded-md shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
// // //             title="Fit all nodes into view"
// // //         >
// // //             ⤢ Fit View
// // //         </button>
// // //     );
// // // };

// // // // A custom Marker component that pans the map if its tooltip goes off-screen
// // // const AutoPanMarker = ({ children, ...props }) => {
// // //     const map = useMap();
 
// // //     const handleTooltipOpen = useCallback((e) => {
// // //       const tooltip = e.tooltip;
// // //       if (!tooltip || !map) return;
 
// // //       setTimeout(() => {
// // //         const tooltipBounds = tooltip.getElement().getBoundingClientRect();
// // //         const mapBounds = map.getContainer().getBoundingClientRect();
// // //         const panOffset = { x: 0, y: 0 };
// // //         const padding = 20;
 
// // //         if (tooltipBounds.right + padding > mapBounds.right) panOffset.x = tooltipBounds.right + padding - mapBounds.right;
// // //         if (tooltipBounds.left - padding < mapBounds.left) panOffset.x = tooltipBounds.left - padding - mapBounds.left;
// // //         if (tooltipBounds.bottom + padding > mapBounds.bottom) panOffset.y = tooltipBounds.bottom + padding - mapBounds.bottom;
// // //         if (tooltipBounds.top - padding < mapBounds.top) panOffset.y = tooltipBounds.top - padding - mapBounds.top;
        
// // //         if (panOffset.x !== 0 || panOffset.y !== 0) {
// // //           map.panBy([panOffset.x, panOffset.y], { animate: true, duration: 0.3 });
// // //         }
// // //       }, 10);
 
// // //     }, [map]);
    
// // //     const eventHandlers = useMemo(() => ({
// // //       tooltipopen: handleTooltipOpen,
// // //     }), [handleTooltipOpen]);
 
// // //     return (
// // //       <Marker {...props} eventHandlers={eventHandlers}>
// // //         {children}
// // //       </Marker>
// // //     );
// // // };

// // // // --- Reusable UI Components ---

// // // const MetricCard = React.memo(({ icon, title, value, subValue = null }) => (
// // //   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex items-center space-x-4">
// // //     <div className="bg-slate-900 p-3 rounded-full">{icon}</div>
// // //     <div>
// // //       <p className="text-sm font-medium text-slate-400">{title}</p>
// // //       <p className="text-2xl font-bold text-white">{value}</p>
// // //     </div>
// // //     {subValue && <div className="ml-auto text-sm font-semibold text-slate-300 bg-slate-700 px-2 py-1 rounded-md">{subValue}</div>}
// // //   </motion.div>
// // // ));

// // // const Header = React.memo(({ onRefresh }) => (
// // //   <header className="relative flex justify-center items-center mb-6">
// // //     <div className="text-center">
// // //       <h1 className="text-3xl font-bold text-white">Control Tower Dashboard</h1>
// // //     </div>
// // //     <button 
// // //       onClick={onRefresh} 
// // //       className="absolute right-0 p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition"
// // //     >
// // //       <FiRefreshCw size={20} />
// // //     </button>
// // //   </header>
// // // ));

// // // const Sidebar = React.memo(({ isOpen, onClose, permissions }) => {
// // //     const navigate = useNavigate();
// // //     const hasPermission = (route) => permissions.includes(route);

// // //     return (
// // //         <div className={`bg-slate-800 border-r border-slate-700 shadow-lg transition-all duration-300 ${isOpen ? "w-64 p-6" : "w-0 p-0 overflow-hidden"} flex flex-col`}>
// // //           {isOpen && (
// // //               <>
// // //                   <div className="flex items-center justify-between mb-8">
// // //                       <h2 className="text-white text-xl font-bold">Control</h2>
// // //                       <button onClick={onClose} className="text-slate-400 hover:text-white"><FiX size={24} /></button>
// // //                   </div>
// // //                   <nav className="space-y-3">
// // //                     {hasPermission("POST:/store_upload") && (
// // //                         <button onClick={() => navigate("/file-upload")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiUpload className="mr-3" /> File Upload</button>
// // //                     )}
// // //                     {hasPermission("GET:/admin/users") && (
// // //                         <button onClick={() => navigate("/adminprivileges")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiSettings className="mr-3" /> Manage Users</button>
// // //                     )}
// // //                     {hasPermission("GET:/dashboard") && (
// // //                         <button className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiBarChart2 className="mr-3" /> Reports</button>
// // //                     )}
// // //                     {/* Added Forecast Button */}
// // //                     <button onClick={() => navigate("/forecast")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiTrendingUp className="mr-3" /> Forecast</button>
// // //                     <button onClick={() => navigate("/rebalancer")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiRefreshCw className="mr-3" /> Rebalancer</button>
// // //                     {hasPermission("POST:/config/apply-formula") && (
// // //                         <button onClick={() => navigate("/Config")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiShoppingBag className="mr-3" /> Configuration</button>
// // //                     )}
// // //                     <div className="!mt-auto pt-4 border-t border-slate-700">
// // //                         <button onClick={() => navigate("/")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiLogOut className="mr-3" /> Logout</button>
// // //                     </div>
// // //                   </nav>
// // //               </>
// // //           )}  
// // //         </div>
// // //     );
// // // });

// // // // --- Main Dashboard Component ---

// // // function Dashboard() {
// // //   const [sidebarOpen, setSidebarOpen] = useState(false);
// // //   const [permissions, setPermissions] = useState([]);
// // //   const [availabilityData, setAvailabilityData] = useState([]);
// // //   const [data, setData] = useState({
// // //     metrics: { current_demand: 0, inventory_position: 0, weeks_of_supply: 0, stockouts: 0, skus_below_threshold: 0, timestamp: new Date().toISOString() },
// // //     alerts: [],
// // //     locations: []
// // //   });
// // //   const [loading, setLoading] = useState(true);
// // //   const navigate = useNavigate();

// // //   const hasPermission = (route) => permissions.includes(route);

// // //   useEffect(() => {
// // //     const fetchDashboardData = async () => {
// // //         setLoading(true);
// // //         const token = localStorage.getItem("token");
// // //         if (!token) {
// // //           navigate("/");
// // //           return;
// // //         }
// // //         const headers = { Authorization: `Bearer ${token}` };
 
// // //         try {
// // //           const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
// // //           const allowedRoutes = permRes.data.allowed_routes || [];
// // //           setPermissions(allowedRoutes);
 
// // //           if (!allowedRoutes.includes("GET:/dashboard")) {
// // //             setLoading(false);
// // //             return;
// // //           }
 
// // //           const [ dashboardRes, storesRes, alertsRes, availabilityRes, lookaheadRes ] = await Promise.allSettled([
// // //             axios.get(`${BASE_URL}/dashboard`, { headers }),
// // //             axios.get(`${BASE_URL}/stores`, { headers }),
// // //             axios.get(`${BASE_URL}/alerts`, { headers }),
// // //             axios.get(`${BASE_URL}/availability`, { headers }),
// // //             axios.get(`${BASE_URL}/user/lookahead_days`, { headers }),
// // //           ]);
          
// // //           if (availabilityRes.status === 'fulfilled') {
// // //               setAvailabilityData(availabilityRes.value.data.data || []);
// // //           } else {
// // //               setAvailabilityData([]);
// // //           }
          
// // //           const backendDashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {};
// // //           const stores = storesRes.status === 'fulfilled' ? storesRes.value.data.stores : [];
// // //           const backendAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
          
// // //           let stockouts = 0;
// // //           let skusBelow = 0;
          
// // //           if (backendAlerts?.length > 0) {
// // //               backendAlerts.forEach(alert => {
// // //                 if (alert.type === "STOCK_OUT") stockouts++;
// // //                 else if (alert.type === "UNDER_STOCK") skusBelow++;
// // //               });
// // //           }
          
// // //           const locationPromises = stores.map(store => Promise.allSettled([
// // //               axios.get(`${BASE_URL}/store/${store.store_id}/hover`, { headers }),
// // //               axios.get(`${BASE_URL}/store/${store.store_id}/with-alert-status`, { headers })
// // //           ]));
 
// // //           const locationsData = await Promise.all(locationPromises);
 
// // //           const locations = locationsData.map((results, index) => {
// // //               const store = stores[index];
// // //               const [hoverRes, alertStatusRes] = results;
// // //               const lookaheadDays = lookaheadRes.status === 'fulfilled' ? lookaheadRes.value.data.lookahead_days : 7;
// // //               const hoverData = hoverRes.status === 'fulfilled' ? { ...hoverRes.value.data, lookahead_days: lookaheadDays } : {lookahead_days: lookaheadDays};
// // //               const alertStatusData = alertStatusRes.status === 'fulfilled' ? alertStatusRes.value.data : {};
 
// // //               return {
// // //                   store_id: store.store_id,
// // //                   store_name: store.name,
// // //                   location: store.city,
// // //                   lat: store.lat,
// // //                   lng: store.lon,
// // //                   alert: backendAlerts.find(a => a.store_id === store.store_id)?.message || null,
// // //                   hoverStats: {
// // //                       distinct_skus: hoverData.distinct_skus || 0,
// // //                       inventory_units: hoverData.inventory_units || 0,
// // //                       forecast_units: hoverData.forecast_units || 0,
// // //                       lookahead_days: hoverData.lookahead_days
// // //                   },
// // //                   alertStatus: {
// // //                       reorderCount: alertStatusData.num_skus_to_reorder || 0,
// // //                       stockoutCount: alertStatusData.num_skus_stockout_despite_reorder || 0,
// // //                       hasAlert: alertStatusData.alert || false,
// // //                   }
// // //               };
// // //           });
 
// // //           setData({
// // //             metrics: {
// // //               current_demand: backendDashboard.current_demand ?? 0,
// // //               inventory_position: backendDashboard.inventory_position ?? 0,
// // //               weeks_of_supply: backendDashboard.weeks_of_supply ?? 0,
// // //               stockouts,
// // //               skus_below_threshold: skusBelow,
// // //               timestamp: backendDashboard.timestamp ?? new Date().toISOString()
// // //             },
// // //             alerts: backendAlerts.map((a, i) => ({
// // //               id: a.id || `alert-${i}`,
// // //               severity: a.severity || "Low",
// // //               message: a.message,
// // //               type: a.type ? a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "General",
// // //               store_id: a.store_id,
// // //               sku: a.sku
// // //             })),
// // //             locations
// // //           });
 
// // //         } catch (err) {
// // //           if (err.response?.status === 401) navigate("/");
// // //         } finally {
// // //           setLoading(false);
// // //         }
// // //       };
// // //     fetchDashboardData();
// // //   }, [navigate]);

// // //   if (loading) {
// // //     return <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center"><div className="flex items-center space-x-3 text-white"><FiRefreshCw className="animate-spin h-5 w-5" /><span>Loading Dashboard...</span></div></div>;
// // //   }
// // //   if (!hasPermission("GET:/dashboard")) {
// // //       return <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white"><h1 className="text-3xl font-bold">Access Denied</h1><p className="mt-2 text-slate-400">You do not have permission to view this page.</p><button onClick={() => navigate("/")} className="mt-6 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition-colors">Go to Login</button></div>;
// // //   }

// // //   return (
// // //     <div className="min-h-screen w-full bg-slate-900 text-white font-sans flex relative">
// // //         <MapStyles />

// // //         {!sidebarOpen && (
// // //             <motion.button
// // //             initial={{ opacity: 0, scale: 0.8, x: -50 }}
// // //             animate={{ opacity: 1, scale: 1, x: 0 }}
// // //             transition={{ type: "spring", stiffness: 260, damping: 20 }}
// // //             onClick={() => setSidebarOpen(true)}
// // //             className="absolute top-6 left-6 z-[1000] p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
// // //             aria-label="Open sidebar"
// // //             >
// // //             <FiMenu size={22} />
// // //             </motion.button>
// // //         )}

// // //         <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} permissions={permissions} />

// // //       <main className="flex-1 p-6 transition-all duration-300">
// // //         <Header lastUpdated={data.metrics.timestamp} onRefresh={() => window.location.reload()} />

// // //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
// // //           {/* Main Content Column */}
// // //           <div className="lg:col-span-2 space-y-6 flex flex-col">
// // //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // //               <MetricCard icon={<FiTrendingUp size={24} className="text-blue-400" />} title="Current Demand" value={data.metrics.current_demand.toLocaleString()} />
// // //               <MetricCard icon={<FiBox size={24} className="text-green-400" />} title="Inventory Position" value={data.metrics.inventory_position.toLocaleString()}  />
// // //               <MetricCard icon={<FiCalendar size={24} className="text-yellow-400" />} title="Weeks Of Supply" value={data.metrics.weeks_of_supply.toLocaleString()} />
// // //             </div>

// // //             {/* Network View Map */}
// // //             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex-1 flex flex-col">
// // //               <div className="flex justify-between items-center mb-4 flex-shrink-0">
// // //                 <p className="font-bold text-white text-lg">Network View</p>
// // //                 <div className="text-xs flex space-x-2">
// // //                   <span className="bg-red-900/50 px-2 py-1 rounded text-red-300">{data.metrics.stockouts} Stockouts</span>
// // //                   <span className="bg-yellow-900/50 px-2 py-1 rounded text-yellow-300">{data.metrics.skus_below_threshold} Below Threshold</span>
// // //                 </div>
// // //               </div>
// // //               <div className="rounded-lg overflow-hidden relative h-[60vh]">
// // //                 <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
// // //                   <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
// // //                   <ResetMapViewButton locations={data.locations} />
// // //                   <FitBounds locations={data.locations} />
// // //                   {data.locations.filter(loc => loc.lat != null && loc.lng != null).map((loc) => (
// // //                     <AutoPanMarker key={loc.store_id} position={[loc.lat, loc.lng]} icon={createAlertIcon(loc)}>
// // //                       <Tooltip direction="top" offset={[0, -42]} opacity={1} permanent={false}>
// // //                         <div className="text-sm space-y-3 p-1" style={{ minWidth: "250px", maxWidth: "300px" }}>
// // //                             <div><strong>{loc.store_name}</strong><br /><span className="text-slate-500">{loc.location}</span></div>
                            
// // //                             {loc.alert && <div className="text-red-600 font-bold border-t border-slate-200 pt-2">🚨 Alert: {loc.alert}</div>}

// // //                             {loc.alertStatus && (
// // //                                 <div className="text-slate-800 bg-amber-100 p-2 rounded-md shadow-inner border border-amber-200">
// // //                                     <p className="text-amber-800 font-semibold mb-1">Reorder Status:</p>
// // //                                     <ul className="ml-4 list-disc text-sm space-y-1">
// // //                                     <li>📦 SKUs to Reorder: <strong>{loc.alertStatus.reorderCount}</strong></li>
// // //                                     <li className={loc.alertStatus.hasAlert ? "text-red-600 font-bold" : ""}>
// // //                                         ⚠️ Stockout despite Reorder: <strong>{loc.alertStatus.stockoutCount}</strong>
// // //                                     </li>
// // //                                     </ul>
// // //                                 </div>
// // //                             )}

// // //                             {loc.hoverStats && (
// // //                                 <div className="bg-blue-50 text-slate-800 p-2 rounded-md shadow-inner border border-blue-200">
// // //                                     <p className="text-blue-800 font-semibold mb-1">Quick Stats ({loc.hoverStats.lookahead_days}-Day):</p>
// // //                                     <ul className="ml-4 list-disc text-sm space-y-1">
// // //                                     <li>📦 <strong>{loc.hoverStats.distinct_skus}</strong> SKUs</li>
// // //                                     <li>📊 <strong>{loc.hoverStats.inventory_units}</strong> Inventory Units</li>
// // //                                     <li>📈 <strong>{loc.hoverStats.forecast_units}</strong> Forecast Units</li>
// // //                                     </ul>
// // //                                 </div>
// // //                             )}
// // //                         </div>
// // //                       </Tooltip>
// // //                     </AutoPanMarker>
// // //                   ))}
// // //                 </MapContainer>
// // //               </div>
// // //             </motion.div>
// // //           </div>

// // //           {/* Right Column */}
// // //           <div className="lg:col-span-1 space-y-6 flex flex-col">
// // //             {/* Alerts Panel */}
// // //             <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[285px]">
// // //               <div className="flex justify-between items-center mb-4 flex-shrink-0">
// // //                 <h3 className="text-lg font-bold text-white">Alerts</h3>
// // //                 <span className="text-sm bg-red-900/50 px-2 py-1 rounded text-red-300 font-semibold">{data.alerts.length} Total</span>
// // //               </div>
// // //               <div className="space-y-3 overflow-y-auto flex-1 pr-2">
// // //                 {data.alerts.length > 0 ? data.alerts.map((alert) => (
// // //                   <div key={alert.id} className="bg-slate-700/50 p-3 rounded-md border border-slate-600">
// // //                     <div className="flex items-start">
// // //                         {alert.severity === 'High' && <FiAlertTriangle className="text-red-400 mr-3 mt-1 flex-shrink-0" />}
// // //                         {alert.severity === 'Medium' && <FiInfo className="text-yellow-400 mr-3 mt-1 flex-shrink-0" />}
// // //                         {alert.severity === 'Low' && <FiCheckCircle className="text-green-400 mr-3 mt-1 flex-shrink-0" />}
// // //                       <div>
// // //                         <p className="text-sm font-semibold text-slate-200">{alert.message}</p>
// // //                         <p className="text-xs text-slate-400 mt-1">{alert.type} (SKU: {alert.sku}, Store: {alert.store_id})</p>
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                 )) : (
// // //                   <div className="text-center py-10 text-slate-400"><FiCheckCircle size={32} className="mx-auto mb-2 text-green-500" /><p>No active alerts.</p></div>
// // //                 )}
// // //               </div>
// // //             </div>

// // //             {/* Availability Chart */}
// // //             <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[320px]">
// // //                 <h3 className="text-lg font-bold text-white">SKU Availability Rate</h3>
// // //                 <p className="text-sm text-slate-400 mb-4 flex-shrink-0">Weekly historical availability.</p>
// // //                 <div className="w-full flex-1">
// // //                     <ResponsiveContainer width="100%" height="100%">
// // //                         <BarChart data={availabilityData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
// // //                             <defs><linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} /></linearGradient></defs>
// // //                             <CartesianGrid strokeDasharray="3 3" stroke="#2a3a56" />
// // //                             <XAxis dataKey="week_start" stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
// // //                             <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
// // //                             <RechartsTooltip
// // //                               contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
// // //                               labelStyle={{ color: '#e2e8f0' }}
// // //                               formatter={(value) => [`${value.toFixed(2)}%`, "Availability"]}
// // //                               cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }}
// // //                             />
// // //                             <Bar dataKey="availability_rate" name="Availability Rate" fill="url(#availGrad)" radius={[4, 4, 0, 0]} />
// // //                         </BarChart>
// // //                     </ResponsiveContainer>
// // //                 </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </main>
// // //       <Chatbot />
// // //     </div>
// // //   );
// // // }

// // // export default Dashboard;







// // import React, { useState, useEffect, useCallback, useMemo } from "react";
// // import axios from "axios";
// // import {
// //     FiMenu, FiX, FiDatabase, FiTrendingUp, FiSettings,
// //     FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag,
// //     FiAlertTriangle, FiCheckCircle, FiInfo, FiBox, FiCalendar, FiMessageSquare
// // } from "react-icons/fi";
// // import { motion, AnimatePresence } from "framer-motion";
// // import { useNavigate } from "react-router-dom";
// // import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from "react-leaflet";
// // import L from "leaflet";
// // import "leaflet/dist/leaflet.css";
// // import {
// //     BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
// // } from 'recharts';
// // import Chatbot from '../components/Chatbot'; // Import the flexible Chatbot component

// // const BASE_URL = "http://localhost:5500";

// // // --- Leaflet & Map Helper Components ---

// // delete L.Icon.Default.prototype._getIconUrl;
// // L.Icon.Default.mergeOptions({
// //     iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
// //     iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
// //     shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// // });

// // const MapStyles = () => (
// //     <style>{`
// //      .custom-marker-container { position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; }
// //      .marker-svg { width: 100%; height: 100%; filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5)); }
// //      .severity-high .marker-svg { fill: #ef4444; } /* red-500 */
// //      .severity-medium .marker-svg { fill: #f59e0b; } /* amber-500 */
// //      .severity-low .marker-svg { fill: #3b82f6; } /* blue-500 */
// //      .marker-count { position: absolute; top: 0px; left: 55%; background-color: white; color: #dc2626; font-weight: bold; font-size: 12px; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 1px solid #dc2626; z-index: 10; }
// //      .leaflet-tooltip { background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
// //      .leaflet-tooltip-top:before { border-top-color: #e2e8f0; }
// //    `}</style>
// // );

// // // Creates custom HTML icons for map markers based on alert status
// // const createAlertIcon = (location) => {
// //     const { alertStatus } = location;
// //     const reorderCount = alertStatus?.reorderCount || 0;
// //     const stockoutCount = alertStatus?.stockoutCount || 0;
// //     const totalAlerts = reorderCount + stockoutCount;

// //     let severityClass = 'severity-low'; // Default blue
// //     if (alertStatus?.hasAlert) severityClass = 'severity-high'; // Red for stockout despite reorder
// //     else if (reorderCount > 0) severityClass = 'severity-medium'; // Amber for needs reorder

// //     return new L.DivIcon({
// //         className: `custom-marker-container ${severityClass}`,
// //         html: `
// //        ${totalAlerts > 0 ? `<div class="marker-count">${totalAlerts}</div>` : ''}
// //        <svg viewBox="0 0 24 24" class="marker-svg">
// //          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
// //        </svg>
// //      `,
// //         iconSize: [32, 42],
// //         iconAnchor: [16, 42]
// //     });
// // };

// // // Fit bounds component
// // const FitBounds = ({ locations }) => {
// //     const map = useMap();
// //     useEffect(() => {
// //         if (!locations || locations.length === 0) return;
// //         const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
// //         if (validCoords.length === 0) return;
// //         const bounds = L.latLngBounds(validCoords);
// //         if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
// //     }, [locations, map]);
// //     return null;
// // };

// // // Reset view button
// // const ResetMapViewButton = ({ locations }) => {
// //     const map = useMap();
// //     const fitMapToBounds = () => {
// //         const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
// //         if (validCoords.length > 0) {
// //             const bounds = L.latLngBounds(validCoords);
// //             if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], animate: true });
// //         }
// //     };
// //     return (
// //         <button
// //             onClick={fitMapToBounds}
// //             className="absolute top-3 right-3 z-[1000] bg-white text-slate-800 px-3 py-1.5 rounded-md shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
// //             title="Fit all nodes into view"
// //         >
// //             ⤢ Fit View
// //         </button>
// //     );
// // };

// // // Map Filter Control Component
// // const MapFilterControl = ({ selectedCategory, onCategoryChange, storeCounts }) => {
// //   const categories = [
// //     { key: 'all', label: 'All Stores', color: 'gray', bgColor: '#6b7280', icon: '🏪' },
// //     { key: 'Critical', label: 'Critical', color: 'red', bgColor: '#ef4444', icon: '🔴' },
// //     { key: 'Low', label: 'Low', color: 'orange', bgColor: '#f59e0b', icon: '🟠' },
// //     { key: 'Adequate', label: 'Adequate', color: 'green', bgColor: '#10b981', icon: '🟢' },
// //     { key: 'High', label: 'High', color: 'blue', bgColor: '#3b82f6', icon: '🔵' }
// //   ];

// //   return (
// //     <div className="absolute top-3 left-3 z-[1000] map-filter-control">
// //       <div className="flex items-center space-x-2 mb-2">
// //         <FiFilter size={16} className="text-slate-600" />
// //         <span className="text-sm font-semibold text-slate-800">Weeks of Supply</span>
// //       </div>
// //       <div className="space-y-1">
// //         {categories.map(category => (
// //           <button
// //             key={category.key}
// //             onClick={() => onCategoryChange(category.key)}
// //             className={`filter-btn ${selectedCategory === category.key ? 'active' : ''}`}
// //             style={{
// //               backgroundColor: selectedCategory === category.key ? category.bgColor : 'transparent',
// //               color: selectedCategory === category.key ? 'white' : category.bgColor,
// //               border: `1px solid ${category.bgColor}`
// //             }}
// //           >
// //             <div className="flex items-center">
// //               <span className="mr-2">{category.icon}</span>
// //               <span>{category.label}</span>
// //             </div>
// //             <span className="text-xs opacity-80">
// //               {storeCounts[category.key]}
// //             </span>
// //           </button>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // };

// // // Store Summary Tooltip Component with Interactive Tags
// // const StoreSummaryTooltip = ({ store, onCategoryClick, onViewAllSKUs }) => {
// //   const [expandedSection, setExpandedSection] = useState(null);

// //   const toggleSection = (section) => {
// //     setExpandedSection(expandedSection === section ? null : section);
// //   };

// //   const handleCategoryClick = (category) => {
// //     if (onCategoryClick) {
// //       onCategoryClick(category);
// //     }
// //   };

// //   const handleViewAllSKUs = () => {
// //     if (onViewAllSKUs) {
// //       onViewAllSKUs();
// //     }
// //   };

// //   return (
// //     <div className="text-sm space-y-3 p-2 min-w-[320px]">
// //       {/* Store Header */}
// //       <div className="border-b border-slate-200 pb-2">
// //         <div className="flex items-center justify-between">
// //           <strong className="text-lg">📍 Store {store.store_id}</strong>
// //           <button 
// //             onClick={handleViewAllSKUs}
// //             className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
// //           >
// //             View All SKUs <FiArrowRight className="ml-1" size={12} />
// //           </button>
// //         </div>
// //         <span className="text-slate-500 text-sm">{store.store_name || `Store ${store.store_id}`}</span>
// //       </div>
      
// //       {/* Quick Stats */}
// //       <div className="grid grid-cols-2 gap-3 text-xs">
// //         <div className="bg-slate-100 p-2 rounded">
// //           <div className="font-semibold">📊 Total SKUs</div>
// //           <div className="text-lg font-bold">{store.total_skus}</div>
// //         </div>
// //         <div className="bg-slate-100 p-2 rounded">
// //           <div className="font-semibold">📈 Avg Weeks</div>
// //           <div className="text-lg font-bold">{store.avg_weeks_of_supply?.toFixed(2) || '0.00'}</div>
// //         </div>
// //       </div>

// //       {/* Categories Summary - Clickable Tags */}
// //       <div className="space-y-2">
// //         <div className="flex items-center justify-between">
// //           <span className="text-sm font-semibold text-slate-700">Categories:</span>
// //           <span className="text-xs text-slate-500">Click to filter</span>
// //         </div>
// //         <div className="flex flex-wrap gap-1">
// //           {store.critical_count > 0 && (
// //             <div 
// //               className="category-tag bg-red-100 text-red-800 border border-red-300"
// //               onClick={() => handleCategoryClick('Critical')}
// //             >
// //               🔴 Critical: {store.critical_count}
// //             </div>
// //           )}
// //           {store.low_count > 0 && (
// //             <div 
// //               className="category-tag bg-orange-100 text-orange-800 border border-orange-300"
// //               onClick={() => handleCategoryClick('Low')}
// //             >
// //               🟠 Low: {store.low_count}
// //             </div>
// //           )}
// //           {store.adequate_count > 0 && (
// //             <div 
// //               className="category-tag bg-green-100 text-green-800 border border-green-300"
// //               onClick={() => handleCategoryClick('Adequate')}
// //             >
// //               🟢 Adequate: {store.adequate_count}
// //             </div>
// //           )}
// //           {store.high_count > 0 && (
// //             <div 
// //               className="category-tag bg-blue-100 text-blue-800 border border-blue-300"
// //               onClick={() => handleCategoryClick('High')}
// //             >
// //               🔵 High: {store.high_count}
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {/* Expandable SKU Details Section */}
// //       <div className="sku-details-section">
// //         <div 
// //           className="sku-details-header"
// //           onClick={() => toggleSection('summary')}
// //         >
// //           <div className="flex items-center justify-between w-full">
// //             <div className="flex items-center">
// //               <FiList className="mr-2 text-slate-600" size={16} />
// //               <span className="font-semibold text-slate-800">Quick SKU Summary</span>
// //             </div>
// //             <FiChevronDown 
// //               className={`expand-icon text-slate-500 ${expandedSection === 'summary' ? 'expanded' : ''}`}
// //               size={16}
// //             />
// //           </div>
// //         </div>
        
// //         <AnimatePresence>
// //           {expandedSection === 'summary' && (
// //             <motion.div
// //               initial={{ height: 0, opacity: 0 }}
// //               animate={{ height: 'auto', opacity: 1 }}
// //               exit={{ height: 0, opacity: 0 }}
// //               transition={{ duration: 0.3 }}
// //             >
// //               <div className="sku-details-content">
// //                 <div className="space-y-2 text-xs">
// //                   {store.critical_count > 0 && (
// //                     <div className="flex justify-between items-center p-1 hover:bg-red-50 rounded">
// //                       <span className="text-red-700 font-medium">Critical SKUs</span>
// //                       <button 
// //                         onClick={() => handleCategoryClick('Critical')}
// //                         className="flex items-center text-red-600 hover:text-red-800"
// //                       >
// //                         {store.critical_count} items <FiChevronRight className="ml-1" size={12} />
// //                       </button>
// //                     </div>
// //                   )}
// //                   {store.low_count > 0 && (
// //                     <div className="flex justify-between items-center p-1 hover:bg-orange-50 rounded">
// //                       <span className="text-orange-700 font-medium">Low SKUs</span>
// //                       <button 
// //                         onClick={() => handleCategoryClick('Low')}
// //                         className="flex items-center text-orange-600 hover:text-orange-800"
// //                       >
// //                         {store.low_count} items <FiChevronRight className="ml-1" size={12} />
// //                       </button>
// //                     </div>
// //                   )}
// //                   {store.adequate_count > 0 && (
// //                     <div className="flex justify-between items-center p-1 hover:bg-green-50 rounded">
// //                       <span className="text-green-700 font-medium">Adequate SKUs</span>
// //                       <button 
// //                         onClick={() => handleCategoryClick('Adequate')}
// //                         className="flex items-center text-green-600 hover:text-green-800"
// //                       >
// //                         {store.adequate_count} items <FiChevronRight className="ml-1" size={12} />
// //                       </button>
// //                     </div>
// //                   )}
// //                   {store.high_count > 0 && (
// //                     <div className="flex justify-between items-center p-1 hover:bg-blue-50 rounded">
// //                       <span className="text-blue-700 font-medium">High SKUs</span>
// //                       <button 
// //                         onClick={() => handleCategoryClick('High')}
// //                         className="flex items-center text-blue-600 hover:text-blue-800"
// //                       >
// //                         {store.high_count} items <FiChevronRight className="ml-1" size={12} />
// //                       </button>
// //                     </div>
// //                   )}
// //                 </div>
// //               </div>
// //             </motion.div>
// //           )}
// //         </AnimatePresence>
// //       </div>
// //     </div>
// //   );
// // };

// // // SKU Details Popup Component
// // const SKUDetailsPopup = ({ storeId, category, onClose, storeName }) => {
// //   const [skuDetails, setSkuDetails] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [sortField, setSortField] = useState('weeks_of_supply');
// //   const [sortDirection, setSortDirection] = useState('asc');

// //   useEffect(() => {
// //     const fetchSKUDetails = async () => {
// //       try {
// //         const token = localStorage.getItem("token");
// //         const headers = { Authorization: `Bearer ${token}` };
        
// //         const params = category && category !== 'all' ? { category } : {};
// //         const response = await axios.get(
// //           `${BASE_URL}/weeks-of-supply/sku-details/${storeId}`,
// //           { headers, params }
// //         );

// //         if (response.data.success) {
// //           setSkuDetails(response.data.data || []);
// //         }
// //       } catch (error) {
// //         console.error('Error fetching SKU details:', error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchSKUDetails();
// //   }, [storeId, category]);

// //   const handleSort = (field) => {
// //     if (sortField === field) {
// //       setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
// //     } else {
// //       setSortField(field);
// //       setSortDirection('asc');
// //     }
// //   };

// //   const sortedSKUs = useMemo(() => {
// //     return [...skuDetails].sort((a, b) => {
// //       let aValue = a[sortField];
// //       let bValue = b[sortField];
      
// //       if (sortField === 'sku') {
// //         aValue = aValue || '';
// //         bValue = bValue || '';
// //       } else {
// //         aValue = Number(aValue) || 0;
// //         bValue = Number(bValue) || 0;
// //       }
      
// //       if (sortDirection === 'asc') {
// //         return aValue < bValue ? -1 : 1;
// //       } else {
// //         return aValue > bValue ? -1 : 1;
// //       }
// //     });
// //   }, [skuDetails, sortField, sortDirection]);

// //   const getCategoryColor = (category) => {
// //     switch (category) {
// //       case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
// //       case 'Low': return 'bg-orange-100 text-orange-800 border-orange-300';
// //       case 'Adequate': return 'bg-green-100 text-green-800 border-green-300';
// //       case 'High': return 'bg-blue-100 text-blue-800 border-blue-300';
// //       default: return 'bg-gray-100 text-gray-800 border-gray-300';
// //     }
// //   };

// //   const getCategoryIcon = (category) => {
// //     switch (category) {
// //       case 'Critical': return '🔴';
// //       case 'Low': return '🟠';
// //       case 'Adequate': return '🟢';
// //       case 'High': return '🔵';
// //       default: return '⚪';
// //     }
// //   };

// //   const SortableHeader = ({ field, children }) => (
// //     <button
// //       onClick={() => handleSort(field)}
// //       className="flex items-center space-x-1 font-semibold hover:text-blue-600 transition-colors"
// //     >
// //       <span>{children}</span>
// //       {sortField === field && (
// //         <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
// //       )}
// //     </button>
// //   );

// //   if (loading) {
// //     return (
// //       <div className="p-4 max-h-80 overflow-y-auto">
// //         <div className="flex items-center justify-center py-8">
// //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="p-4 max-h-80 overflow-y-auto min-w-[500px] bg-white">
// //       <div className="flex justify-between items-center mb-4">
// //         <div>
// //           <h3 className="text-lg font-bold text-slate-800">
// //             SKU Details - {storeName}
// //           </h3>
// //           {category && category !== 'all' && (
// //             <span className="text-sm text-slate-600">Filter: {category}</span>
// //           )}
// //         </div>
// //         <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
// //           <FiX size={20} />
// //         </button>
// //       </div>

// //       {skuDetails.length === 0 ? (
// //         <div className="text-center py-8 text-slate-500">
// //           <FiBox className="mx-auto mb-2 text-slate-400" size={32} />
// //           <p>No SKUs found for the selected filter.</p>
// //         </div>
// //       ) : (
// //         <div className="space-y-3">
// //           <div className="grid grid-cols-12 gap-2 text-xs font-semibold border-b pb-2 text-slate-600 bg-slate-50 p-2 rounded-t">
// //             <div className="col-span-3">
// //               <SortableHeader field="sku">SKU</SortableHeader>
// //             </div>
// //             <div className="col-span-2">
// //               <SortableHeader field="current_inventory">Current Inv</SortableHeader>
// //             </div>
// //             <div className="col-span-2">
// //               <SortableHeader field="avg_weekly_demand">Weekly Demand</SortableHeader>
// //             </div>
// //             <div className="col-span-2">
// //               <SortableHeader field="weeks_of_supply">Weeks Left</SortableHeader>
// //             </div>
// //             <div className="col-span-3">
// //               <SortableHeader field="category">Category</SortableHeader>
// //             </div>
// //           </div>
// //           {sortedSKUs.map((sku, index) => (
// //             <div key={index} className="grid grid-cols-12 gap-2 text-xs border-b pb-2 last:border-b-0 hover:bg-slate-50 rounded p-1">
// //               <div className="col-span-3 font-medium text-slate-800">{sku.sku}</div>
// //               <div className="col-span-2 text-slate-700">{sku.current_inventory?.toLocaleString()}</div>
// //               <div className="col-span-2 text-slate-700">{sku.avg_weekly_demand?.toFixed(2)}</div>
// //               <div className="col-span-2 font-bold text-slate-800">
// //                 {sku.weeks_of_supply?.toFixed(1)}
// //               </div>
// //               <div className="col-span-3">
// //                 <span className={`category-tag ${getCategoryColor(sku.category)}`}>
// //                   {getCategoryIcon(sku.category)} {sku.category}
// //                 </span>
// //               </div>
// //             </div>
// //           ))}
// //           <div className="text-xs text-slate-500 mt-2 flex justify-between items-center">
// //             <span>📊 Showing {skuDetails.length} SKU(s)</span>
// //             <span>Sorted by: {sortField} ({sortDirection})</span>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // Auto pan marker
// // const AutoPanMarker = ({ children, ...props }) => {
// //     const map = useMap();
// //     const handleTooltipOpen = useCallback((e) => {
// //         const tooltip = e.tooltip;
// //         if (!tooltip || !map) return;
// //         setTimeout(() => {
// //             const tooltipBounds = tooltip.getElement().getBoundingClientRect();
// //             const mapBounds = map.getContainer().getBoundingClientRect();
// //             const panOffset = { x: 0, y: 0 };
// //             const padding = 20;
// //             if (tooltipBounds.right + padding > mapBounds.right) panOffset.x = tooltipBounds.right + padding - mapBounds.right;
// //             if (tooltipBounds.left - padding < mapBounds.left) panOffset.x = tooltipBounds.left - padding - mapBounds.left;
// //             if (tooltipBounds.bottom + padding > mapBounds.bottom) panOffset.y = tooltipBounds.bottom + padding - mapBounds.bottom;
// //             if (tooltipBounds.top - padding < mapBounds.top) panOffset.y = tooltipBounds.top - padding - mapBounds.top;
// //             if (panOffset.x !== 0 || panOffset.y !== 0) {
// //                 map.panBy([panOffset.x, panOffset.y], { animate: true, duration: 0.3 });
// //             }
// //         }, 10);
// //     }, [map]);
// //     const eventHandlers = useMemo(() => ({
// //         tooltipopen: handleTooltipOpen,
// //     }), [handleTooltipOpen]);
// //     return (
// //         <Marker {...props} eventHandlers={eventHandlers}>
// //             {children}
// //         </Marker>
// //     );
// // };

// // // --- Reusable UI Components ---

// // const MetricCard = React.memo(({ icon, title, value, subValue = null }) => (
// //     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex items-center space-x-4">
// //         <div className="bg-slate-900 p-3 rounded-full">{icon}</div>
// //         <div>
// //             <p className="text-sm font-medium text-slate-400">{title}</p>
// //             <p className="text-2xl font-bold text-white">{value}</p>
// //         </div>
// //         {subValue && <div className="ml-auto text-sm font-semibold text-slate-300 bg-slate-700 px-2 py-1 rounded-md">{subValue}</div>}
// //     </motion.div>
// // ));

// // const Header = React.memo(({ onRefresh }) => (
// //     <header className="relative flex justify-center items-center mb-6">
// //         <div className="text-center">
// //             <h1 className="text-3xl font-bold text-white">Control Tower Dashboard</h1>
// //         </div>
// //         <button
// //             onClick={onRefresh}
// //             className="absolute right-0 p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition"
// //         >
// //             <FiRefreshCw size={20} />
// //         </button>
// //     </header>
// // ));

// // const Sidebar = React.memo(({ isOpen, onClose, permissions }) => {
// //     const navigate = useNavigate();
// //     const hasPermission = (route) => permissions.includes(route);
// //     return (
// //         <div className={`bg-slate-800 border-r border-slate-700 shadow-lg transition-all duration-300 ${isOpen ? "w-64 p-6" : "w-0 p-0 overflow-hidden"} flex flex-col`}>
// //             {isOpen && (
// //                 <>
// //                     <div className="flex items-center justify-between mb-8">
// //                         <h2 className="text-white text-xl font-bold">Control</h2>
// //                         <button onClick={onClose} className="text-slate-400 hover:text-white"><FiX size={24} /></button>
// //                     </div>
// //                     <nav className="space-y-3">
// //                         {hasPermission("POST:/store_upload") && (
// //                             <button onClick={() => navigate("/file-upload")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiUpload className="mr-3" /> File Upload</button>
// //                         )}
// //                         {hasPermission("GET:/admin/users") && (
// //                             <button onClick={() => navigate("/adminprivileges")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiSettings className="mr-3" /> Manage Users</button>
// //                         )}
// //                         {hasPermission("GET:/dashboard") && (
// //                             <button className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiBarChart2 className="mr-3" /> Reports</button>
// //                         )}
// //                         <button onClick={() => navigate("/forecast")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiTrendingUp className="mr-3" /> Forecast</button>
// //                         <button onClick={() => navigate("/rebalancer")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiRefreshCw className="mr-3" /> Rebalancer</button>
// //                         {hasPermission("POST:/config/apply-formula") && (
// //                             <button onClick={() => navigate("/Config")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiShoppingBag className="mr-3" /> Configuration</button>
// //                         )}
// //                         <div className="!mt-auto pt-4 border-t border-slate-700">
// //                             <button onClick={() => navigate("/")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiLogOut className="mr-3" /> Logout</button>
// //                         </div>
// //                     </nav>
// //                 </>
// //             )}
// //         </div>
// //     );
// // });

// // // --- Main Dashboard Component ---
// // function Dashboard() {
// //     const [sidebarOpen, setSidebarOpen] = useState(false);
// //     const [isChatbotOpen, setIsChatbotOpen] = useState(false); // State to control integrated chatbot
// //     const [permissions, setPermissions] = useState([]);
// //     const [availabilityData, setAvailabilityData] = useState([]);
// //     const [data, setData] = useState({
// //         metrics: { current_demand: 0, inventory_position: 0, weeks_of_supply: 0, stockouts: 0, skus_below_threshold: 0, timestamp: new Date().toISOString() },
// //         alerts: [],
// //         locations: []
// //     });
// //     const [loading, setLoading] = useState(true);
// //     const navigate = useNavigate();

// //     useEffect(() => {
// //         const fetchDashboardData = async () => {
// //             setLoading(true);
// //             const token = localStorage.getItem("token");
// //             if (!token) {
// //                 navigate("/");
// //                 return;
// //             }
// //             const headers = { Authorization: `Bearer ${token}` };
// //             try {
// //                 const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
// //                 const allowedRoutes = permRes.data.allowed_routes || [];
// //                 setPermissions(allowedRoutes);
// //                 if (!allowedRoutes.includes("GET:/dashboard")) {
// //                     setLoading(false);
// //                     return;
// //                 }
// //                 const [dashboardRes, storesRes, alertsRes, availabilityRes, lookaheadRes] = await Promise.allSettled([
// //                     axios.get(`${BASE_URL}/dashboard`, { headers }),
// //                     axios.get(`${BASE_URL}/stores`, { headers }),
// //                     axios.get(`${BASE_URL}/alerts`, { headers }),
// //                     axios.get(`${BASE_URL}/availability`, { headers }),
// //                     axios.get(`${BASE_URL}/user/lookahead_days`, { headers }),
// //                 ]);
// //                 if (availabilityRes.status === 'fulfilled') {
// //                     setAvailabilityData(availabilityRes.value.data.data || []);
// //                 } else {
// //                     setAvailabilityData([]);
// //                 }
// //                 const backendDashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {};
// //                 const stores = storesRes.status === 'fulfilled' ? storesRes.value.data.stores : [];
// //                 const backendAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
// //                 let stockouts = 0;
// //                 let skusBelow = 0;
// //                 if (backendAlerts?.length > 0) {
// //                     backendAlerts.forEach(alert => {
// //                         if (alert.type === "STOCK_OUT") stockouts++;
// //                         else if (alert.type === "UNDER_STOCK") skusBelow++;
// //                     });
// //                 }
// //                 const locationPromises = stores.map(store => Promise.allSettled([
// //                     axios.get(`${BASE_URL}/store/${store.store_id}/hover`, { headers }),
// //                     axios.get(`${BASE_URL}/store/${store.store_id}/with-alert-status`, { headers })
// //                 ]));
// //                 const locationsData = await Promise.all(locationPromises);
// //                 const locations = locationsData.map((results, index) => {
// //                     const store = stores[index];
// //                     const [hoverRes, alertStatusRes] = results;
// //                     const lookaheadDays = lookaheadRes.status === 'fulfilled' ? lookaheadRes.value.data.lookahead_days : 7;
// //                     const hoverData = hoverRes.status === 'fulfilled' ? { ...hoverRes.value.data, lookahead_days: lookaheadDays } : { lookahead_days: lookaheadDays };
// //                     const alertStatusData = alertStatusRes.status === 'fulfilled' ? alertStatusRes.value.data : {};
// //                     return {
// //                         store_id: store.store_id,
// //                         store_name: store.name,
// //                         location: store.city,
// //                         lat: store.lat,
// //                         lng: store.lon,
// //                         alert: backendAlerts.find(a => a.store_id === store.store_id)?.message || null,
// //                         hoverStats: {
// //                             distinct_skus: hoverData.distinct_skus || 0,
// //                             inventory_units: hoverData.inventory_units || 0,
// //                             forecast_units: hoverData.forecast_units || 0,
// //                             lookahead_days: hoverData.lookahead_days
// //                         },
// //                         alertStatus: {
// //                             reorderCount: alertStatusData.num_skus_to_reorder || 0,
// //                             stockoutCount: alertStatusData.num_skus_stockout_despite_reorder || 0,
// //                             hasAlert: alertStatusData.alert || false,
// //                         }
// //                     };
// //                 });
// //                 setData({
// //                     metrics: {
// //                         current_demand: backendDashboard.current_demand ?? 0,
// //                         inventory_position: backendDashboard.inventory_position ?? 0,
// //                         weeks_of_supply: backendDashboard.weeks_of_supply ?? 0,
// //                         stockouts,
// //                         skus_below_threshold: skusBelow,
// //                         timestamp: backendDashboard.timestamp ?? new Date().toISOString()
// //                     },
// //                     alerts: backendAlerts.map((a, i) => ({
// //                         id: a.id || `alert-${i}`,
// //                         severity: a.severity || "Low",
// //                         message: a.message,
// //                         type: a.type ? a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "General",
// //                         store_id: a.store_id,
// //                         sku: a.sku
// //                     })),
// //                     locations
// //                 });
// //             } catch (err) {
// //                 if (err.response?.status === 401) navigate("/");
// //             } finally {
// //                 setLoading(false);
// //             }
// //         };
// //         fetchDashboardData();
// //     }, [navigate]);


// //     if (loading) {
// //         return <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center"><div className="flex items-center space-x-3 text-white"><FiRefreshCw className="animate-spin h-5 w-5" /><span>Loading Dashboard...</span></div></div>;
// //     }
// //     if (!permissions.includes("GET:/dashboard")) {
// //         return <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white"><h1 className="text-3xl font-bold">Access Denied</h1><p className="mt-2 text-slate-400">You do not have permission to view this page.</p><button onClick={() => navigate("/")} className="mt-6 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition-colors">Go to Login</button></div>;
// //     }

// //     return (
// //         <div className="min-h-screen w-full bg-slate-900 text-white font-sans flex relative">
// //             <MapStyles />
// //             {!sidebarOpen && (
// //                 <motion.button
// //                     initial={{ opacity: 0, scale: 0.8, x: -50 }}
// //                     animate={{ opacity: 1, scale: 1, x: 0 }}
// //                     transition={{ type: "spring", stiffness: 260, damping: 20 }}
// //                     onClick={() => setSidebarOpen(true)}
// //                     className="absolute top-6 left-6 z-[1000] p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
// //                     aria-label="Open sidebar"
// //                 >
// //                     <FiMenu size={22} />
// //                 </motion.button>
// //             )}
// //             <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} permissions={permissions} />
// //             <main className="flex-1 p-6 transition-all duration-300">
// //                 <Header onRefresh={() => window.location.reload()} />
// //                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
// //                     {/* Main Content Column */}
// //                     <div className="lg:col-span-2 space-y-6 flex flex-col">
// //                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //                             <MetricCard icon={<FiTrendingUp size={24} className="text-blue-400" />} title="Current Demand" value={data.metrics.current_demand.toLocaleString()} />
// //                             <MetricCard icon={<FiBox size={24} className="text-green-400" />} title="Inventory Position" value={data.metrics.inventory_position.toLocaleString()} />
// //                             <MetricCard icon={<FiCalendar size={24} className="text-yellow-400" />} title="Weeks Of Supply" value={data.metrics.weeks_of_supply.toLocaleString()} />
// //                         </div>
// //                         {/* Network View Map */}
// //                         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex-1 flex flex-col">
// //                             <div className="flex justify-between items-center mb-4 flex-shrink-0">
// //                                 <p className="font-bold text-white text-lg">Network View</p>
// //                                 <div className="text-xs flex space-x-2">
// //                                     <span className="bg-red-900/50 px-2 py-1 rounded text-red-300">{data.metrics.stockouts} Stockouts</span>
// //                                     <span className="bg-yellow-900/50 px-2 py-1 rounded text-yellow-300">{data.metrics.skus_below_threshold} Below Threshold</span>
// //                                 </div>
// //                             </div>
// //                             <div className="rounded-lg overflow-hidden relative h-[60vh]">
// //                                 <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
// //                                     <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
// //                                     <ResetMapViewButton locations={data.locations} />
// //                                     <FitBounds locations={data.locations} />
// //                                     {data.locations.filter(loc => loc.lat != null && loc.lng != null).map((loc) => (
// //                                         <AutoPanMarker key={loc.store_id} position={[loc.lat, loc.lng]} icon={createAlertIcon(loc)}>
// //                                             <Tooltip direction="top" offset={[0, -42]} opacity={1} permanent={false}>
// //                                                 <div className="text-sm space-y-3 p-1" style={{ minWidth: "250px", maxWidth: "300px" }}>
// //                                                     <div><strong>{loc.store_name}</strong><br /><span className="text-slate-500">{loc.location}</span></div>
// //                                                     {loc.alert && <div className="text-red-600 font-bold border-t border-slate-200 pt-2">🚨 Alert: {loc.alert}</div>}
// //                                                     {loc.alertStatus && (
// //                                                         <div className="text-slate-800 bg-amber-100 p-2 rounded-md shadow-inner border border-amber-200">
// //                                                             <p className="text-amber-800 font-semibold mb-1">Reorder Status:</p>
// //                                                             <ul className="ml-4 list-disc text-sm space-y-1">
// //                                                                 <li>📦 SKUs to Reorder: <strong>{loc.alertStatus.reorderCount}</strong></li>
// //                                                                 <li className={loc.alertStatus.hasAlert ? "text-red-600 font-bold" : ""}>
// //                                                                     ⚠️ Stockout despite Reorder: <strong>{loc.alertStatus.stockoutCount}</strong>
// //                                                                 </li>
// //                                                             </ul>
// //                                                         </div>
// //                                                     )}
// //                                                     {loc.hoverStats && (
// //                                                         <div className="bg-blue-50 text-slate-800 p-2 rounded-md shadow-inner border border-blue-200">
// //                                                             <p className="text-blue-800 font-semibold mb-1">Quick Stats ({loc.hoverStats.lookahead_days}-Day):</p>
// //                                                             <ul className="ml-4 list-disc text-sm space-y-1">
// //                                                                 <li>📦 <strong>{loc.hoverStats.distinct_skus}</strong> SKUs</li>
// //                                                                 <li>📊 <strong>{loc.hoverStats.inventory_units}</strong> Inventory Units</li>
// //                                                                 <li>📈 <strong>{loc.hoverStats.forecast_units}</strong> Forecast Units</li>
// //                                                             </ul>
// //                                                         </div>
// //                                                     )}
// //                                                 </div>
// //                                             </Tooltip>
// //                                         </AutoPanMarker>
// //                                     ))}
// //                                 </MapContainer>
// //                             </div>
// //                         </motion.div>
// //                     </div>

// //                     {/* Right Column --- THIS IS NOW CONDITIONAL */}
// //                     <div className="lg:col-span-1">
// //                         <AnimatePresence mode="wait">
// //                             {isChatbotOpen ? (
// //                                 <motion.div
// //                                     key="chatbot-view"
// //                                     initial={{ opacity: 0, x: 50 }}
// //                                     animate={{ opacity: 1, x: 0 }}
// //                                     exit={{ opacity: 0, x: 50 }}
// //                                     transition={{ duration: 0.3, ease: "easeInOut" }}
// //                                     className="h-full"
// //                                 >
// //                                     <Chatbot
// //                                         mode="integrated"
// //                                         isOpen={isChatbotOpen}
// //                                         onClose={() => setIsChatbotOpen(false)}
// //                                     />
// //                                 </motion.div>
// //                             ) : (
// //                                 <motion.div
// //                                     key="alerts-view"
// //                                     initial={{ opacity: 0, x: -50 }}
// //                                     animate={{ opacity: 1, x: 0 }}
// //                                     exit={{ opacity: 0, x: -50 }}
// //                                     transition={{ duration: 0.3, ease: "easeInOut" }}
// //                                     className="space-y-6 flex flex-col"
// //                                 >
// //                                     {/* Alerts Panel */}
// //                                     <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[285px]">
// //                                         <div className="flex justify-between items-center mb-4 flex-shrink-0">
// //                                             <h3 className="text-lg font-bold text-white">Alerts</h3>
// //                                             <span className="text-sm bg-red-900/50 px-2 py-1 rounded text-red-300 font-semibold">{data.alerts.length} Total</span>
// //                                         </div>
// //                                         <div className="space-y-3 overflow-y-auto flex-1 pr-2">
// //                                             {data.alerts.length > 0 ? data.alerts.map((alert) => (
// //                                                 <div key={alert.id} className="bg-slate-700/50 p-3 rounded-md border border-slate-600">
// //                                                     <div className="flex items-start">
// //                                                         {alert.severity === 'High' && <FiAlertTriangle className="text-red-400 mr-3 mt-1 flex-shrink-0" />}
// //                                                         {alert.severity === 'Medium' && <FiInfo className="text-yellow-400 mr-3 mt-1 flex-shrink-0" />}
// //                                                         {alert.severity === 'Low' && <FiCheckCircle className="text-green-400 mr-3 mt-1 flex-shrink-0" />}
// //                                                         <div>
// //                                                             <p className="text-sm font-semibold text-slate-200">{alert.message}</p>
// //                                                             <p className="text-xs text-slate-400 mt-1">{alert.type} (SKU: {alert.sku}, Store: {alert.store_id})</p>
// //                                                         </div>
// //                                                     </div>
// //                                                 </div>
// //                                             )) : (
// //                                                 <div className="text-center py-10 text-slate-400"><FiCheckCircle size={32} className="mx-auto mb-2 text-green-500" /><p>No active alerts.</p></div>
// //                                             )}
// //                                         </div>
// //                                     </div>
// //                                     {/* Availability Chart */}
// //                                     <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[320px]">
// //                                         <h3 className="text-lg font-bold text-white">SKU Availability Rate</h3>
// //                                         <p className="text-sm text-slate-400 mb-4 flex-shrink-0">Weekly historical availability.</p>
// //                                         <div className="w-full flex-1">
// //                                             <ResponsiveContainer width="100%" height="100%">
// //                                                 <BarChart data={availabilityData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
// //                                                     <defs><linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} /></linearGradient></defs>
// //                                                     <CartesianGrid strokeDasharray="3 3" stroke="#2a3a56" />
// //                                                     <XAxis dataKey="week_start" stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
// //                                                     <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
// //                                                     <RechartsTooltip
// //                                                         contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
// //                                                         labelStyle={{ color: '#e2e8f0' }}
// //                                                         formatter={(value) => [`${value.toFixed(2)}%`, "Availability"]}
// //                                                         cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }}
// //                                                     />
// //                                                     <Bar dataKey="availability_rate" name="Availability Rate" fill="url(#availGrad)" radius={[4, 4, 0, 0]} />
// //                                                 </BarChart>
// //                                             </ResponsiveContainer>
// //                                         </div>
// //                                     </div>
// //                                 </motion.div>
// //                             )}
// //                         </AnimatePresence>
// //                     </div>
// //                 </div>
// //             </main>

// //             {/* Floating button to OPEN the integrated chatbot */}
// //             <AnimatePresence>
// //                 {!isChatbotOpen && (
// //                     <motion.button
// //                         initial={{ opacity: 0, scale: 0.8, y: 50 }}
// //                         animate={{
// //                             opacity: 1, scale: 1, y: 0,
// //                             transition: { type: "spring", stiffness: 260, damping: 20 }
// //                         }}
// //                         whileHover={{ scale: 1.1 }}
// //                         whileTap={{ scale: 0.9 }}
// //                         exit={{ opacity: 0, scale: 0.8, y: 50 }}
// //                         onClick={() => setIsChatbotOpen(true)}
// //                         className="fixed bottom-6 right-6 z-[1001] p-4 bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-full shadow-2xl shadow-black/30 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
// //                         aria-label="Open AI Assistant"
// //                     >
// //                         <motion.div
// //                             animate={{
// //                                 scale: [1, 1.1, 1],
// //                                 transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
// //                             }}
// //                         >
// //                             <FiMessageSquare size={24} />
// //                         </motion.div>
// //                     </motion.button>
// //                 )}
// //             </AnimatePresence>
// //         </div>
// //     );
// // }

// // export default Dashboard;

// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import axios from "axios";
// import {
//     FiMenu, FiX, FiTrendingUp, FiSettings,
//     FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag,
//     FiAlertTriangle, FiCheckCircle, FiInfo, FiBox, FiCalendar, FiMessageSquare,
//     FiFilter, FiArrowRight, FiChevronDown, FiList
// } from "react-icons/fi";
// import { motion, AnimatePresence } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import {
//     BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
// } from 'recharts';
// import Chatbot from '../components/Chatbot';

// const BASE_URL = "http://localhost:5500";

// // --- Leaflet & Map Helper Components ---

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//     iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//     shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });

// const MapStyles = () => (
//     <style>{`
//      .custom-marker-container { position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
//      .marker-svg { width: 100%; height: 100%; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3)); }
     
//      /* Alert Map Styles */
//      .severity-high .marker-svg { fill: #ef4444; }
//      .severity-medium .marker-svg { fill: #f59e0b; }
//      .severity-low .marker-svg { fill: #3b82f6; }
//      .marker-count { position: absolute; top: 0px; left: 55%; background-color: white; color: #dc2626; font-weight: bold; font-size: 12px; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 1px solid #dc2626; z-index: 10; }
     
//      /* Weeks of Supply Map Styles */
//      .severity-critical .marker-svg { fill: #ef4444; }
//      .severity-adequate .marker-svg { fill: #10b981; }
//      .severity-all .marker-svg { fill: #6b7280; }
//      .marker-count.wos { top: -2px; right: -2px; left: auto; font-size: 10px; width: 16px; height: 16px; }

//      .leaflet-tooltip { background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
//      .leaflet-tooltip-top:before { border-top-color: #e2e8f0; }
//      .leaflet-popup-content-wrapper { border-radius: 8px; }
//      .leaflet-popup-content { margin: 0; }
//      .leaflet-popup-tip-container { display: none; }

//      .map-filter-control { background: white; border-radius: 8px; padding: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; min-width: 200px; }
//      .filter-btn { padding: 6px 12px; margin: 2px; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: space-between; width: 100%; }
//      .filter-btn.active { color: white; }
//      .filter-btn:not(.active):hover { background: #f3f4f6; }

//      .category-tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin: 2px; cursor: pointer; transition: all 0.2s; }
//      .category-tag:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
     
//      .sku-details-section { border: 1px solid #e5e7eb; border-radius: 8px; margin: 8px 0; overflow: hidden; }
//      .sku-details-header { padding: 12px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
//      .sku-details-content { padding: 12px; background: white; }
//      .expand-icon { transition: transform 0.2s; }
//      .expand-icon.expanded { transform: rotate(180deg); }
//    `}</style>
// );

// // --- Alert Map Icon Creator ---
// const createAlertIcon = (location) => {
//     const { alertStatus } = location;
//     const reorderCount = alertStatus?.reorderCount || 0;
//     const stockoutCount = alertStatus?.stockoutCount || 0;
//     const totalAlerts = reorderCount + stockoutCount;
//     let severityClass = 'severity-low';
//     if (alertStatus?.hasAlert) severityClass = 'severity-high';
//     else if (reorderCount > 0) severityClass = 'severity-medium';
//     return new L.DivIcon({
//         className: `custom-marker-container ${severityClass}`,
//         html: `
//        ${totalAlerts > 0 ? `<div class="marker-count">${totalAlerts}</div>` : ''}
//        <svg viewBox="0 0 24 24" class="marker-svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
//         iconSize: [32, 42],
//         iconAnchor: [16, 42]
//     });
// };

// // --- WEEKS OF SUPPLY: New Components & Functions ---

// const createWeeksSupplyIcon = (store, selectedCategory) => {
//     const { critical_count, low_count } = store;
//     let severityClass = 'severity-all';
//     let count = store.total_skus || 0;

//     if (selectedCategory && selectedCategory !== 'all') {
//         switch (selectedCategory) {
//             case 'Critical': severityClass = 'severity-critical'; count = store.critical_count; break;
//             case 'Low': severityClass = 'severity-low'; count = store.low_count; break;
//             case 'Adequate': severityClass = 'severity-adequate'; count = store.adequate_count; break;
//             case 'High': severityClass = 'severity-high'; count = store.high_count; break;
//             default: severityClass = 'severity-all'; count = store.total_skus;
//         }
//     } else {
//         if (critical_count > 0) { severityClass = 'severity-critical'; count = critical_count; } 
//         else if (low_count > 0) { severityClass = 'severity-low'; count = low_count; } 
//         else { severityClass = 'severity-all'; count = store.total_skus; }
//     }

//     return new L.DivIcon({
//         className: `custom-marker-container ${severityClass}`,
//         html: `<div class="marker-count wos">${count}</div><svg viewBox="0 0 24 24" class="marker-svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
//         iconSize: [32, 42],
//         iconAnchor: [16, 42]
//     });
// };

// const MapFilterControl = ({ selectedCategory, onCategoryChange, storeCounts }) => {
//     const categories = [
//         { key: 'all', label: 'All Stores', bgColor: '#6b7280', icon: '🏪' },
//         { key: 'Critical', label: 'Critical', bgColor: '#ef4444', icon: '🔴' },
//         { key: 'Low', label: 'Low', bgColor: '#f59e0b', icon: '🟠' },
//         { key: 'Adequate', label: 'Adequate', bgColor: '#10b981', icon: '🟢' },
//         { key: 'High', label: 'High', bgColor: '#3b82f6', icon: '🔵' }
//     ];

//     return (
//         <div className="absolute top-3 left-3 z-[1000] map-filter-control">
//             <div className="flex items-center space-x-2 mb-2">
//                 <FiFilter size={16} className="text-slate-600" />
//                 <span className="text-sm font-semibold text-slate-800">Weeks of Supply</span>
//             </div>
//             <div className="space-y-1">
//                 {categories.map(category => (
//                     <button
//                         key={category.key}
//                         onClick={() => onCategoryChange(category.key)}
//                         className={`filter-btn ${selectedCategory === category.key ? 'active' : ''}`}
//                         style={{
//                             backgroundColor: selectedCategory === category.key ? category.bgColor : 'transparent',
//                             color: selectedCategory === category.key ? 'white' : category.bgColor,
//                             border: `1px solid ${category.bgColor}`
//                         }}
//                     >
//                         <div className="flex items-center"><span className="mr-2">{category.icon}</span><span>{category.label}</span></div>
//                         <span className="text-xs opacity-80">{storeCounts[category.key]}</span>
//                     </button>
//                 ))}
//             </div>
//         </div>
//     );
// };

// const StoreSummaryTooltip = ({ store, onCategoryClick, onViewAllSKUs }) => {
//     return (
//         <div className="text-sm space-y-3 p-2 min-w-[320px]">
//             <div className="border-b border-slate-200 pb-2">
//                 <div className="flex items-center justify-between">
//                     <strong className="text-lg">📍 Store {store.store_id}</strong>
//                     <button onClick={onViewAllSKUs} className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium">View All SKUs <FiArrowRight className="ml-1" size={12} /></button>
//                 </div>
//                 <span className="text-slate-500 text-sm">{store.store_name || `Store ${store.store_id}`}</span>
//             </div>
//             <div className="grid grid-cols-2 gap-3 text-xs">
//                 <div className="bg-slate-100 p-2 rounded"><div className="font-semibold">📊 Total SKUs</div><div className="text-lg font-bold">{store.total_skus}</div></div>
//                 <div className="bg-slate-100 p-2 rounded"><div className="font-semibold">📈 Avg Weeks</div><div className="text-lg font-bold">{store.avg_weeks_of_supply?.toFixed(2) || '0.00'}</div></div>
//             </div>
//             <div className="space-y-2">
//                 <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">Categories:</span><span className="text-xs text-slate-500">Click to filter</span></div>
//                 <div className="flex flex-wrap gap-1">
//                     {store.critical_count > 0 && <div className="category-tag bg-red-100 text-red-800 border border-red-300" onClick={() => onCategoryClick('Critical')}>🔴 Critical: {store.critical_count}</div>}
//                     {store.low_count > 0 && <div className="category-tag bg-orange-100 text-orange-800 border border-orange-300" onClick={() => onCategoryClick('Low')}>🟠 Low: {store.low_count}</div>}
//                     {store.adequate_count > 0 && <div className="category-tag bg-green-100 text-green-800 border border-green-300" onClick={() => onCategoryClick('Adequate')}>🟢 Adequate: {store.adequate_count}</div>}
//                     {store.high_count > 0 && <div className="category-tag bg-blue-100 text-blue-800 border border-blue-300" onClick={() => onCategoryClick('High')}>🔵 High: {store.high_count}</div>}
//                 </div>
//             </div>
//         </div>
//     );
// };

// const SKUDetailsPopup = ({ storeId, category, onClose, storeName }) => {
//     const [skuDetails, setSkuDetails] = useState([]);
//     const [loading, setLoading] = useState(true);
//     useEffect(() => {
//         const fetchSKUDetails = async () => {
//             try {
//                 const token = localStorage.getItem("token");
//                 const headers = { Authorization: `Bearer ${token}` };
//                 const params = category && category !== 'all' ? { category } : {};
//                 const response = await axios.get(`${BASE_URL}/weeks-of-supply/sku-details/${storeId}`, { headers, params });
//                 if (response.data.success) setSkuDetails(response.data.data || []);
//             } catch (error) { console.error('Error fetching SKU details:', error); } finally { setLoading(false); }
//         };
//         fetchSKUDetails();
//     }, [storeId, category]);

//     if (loading) return <div className="p-4 h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
//     return (
//         <div className="p-4 max-h-80 overflow-y-auto min-w-[500px] bg-white">
//             <div className="flex justify-between items-center mb-4">
//                 <div><h3 className="text-lg font-bold text-slate-800">SKU Details - {storeName}</h3>{category && category !== 'all' && <span className="text-sm text-slate-600">Filter: {category}</span>}</div>
//                 <button onClick={onClose} className="text-slate-500 hover:text-slate-700"><FiX size={20} /></button>
//             </div>
//             {skuDetails.length === 0 ? <div className="text-center py-8 text-slate-500"><FiBox className="mx-auto mb-2 text-slate-400" size={32} /><p>No SKUs found.</p></div> : (
//                 <div className="space-y-3">
//                     <div className="grid grid-cols-12 gap-2 text-xs font-semibold border-b pb-2 text-slate-600 bg-slate-50 p-2 rounded-t">
//                         <div className="col-span-4">SKU</div><div className="col-span-2">Current Inv</div><div className="col-span-2">Weekly Demand</div><div className="col-span-2">Weeks Left</div><div className="col-span-2">Category</div>
//                     </div>
//                     {skuDetails.map((sku, index) => <div key={index} className="grid grid-cols-12 gap-2 text-xs border-b pb-2 last:border-b-0 hover:bg-slate-50 rounded p-1"><div className="col-span-4 font-medium text-slate-800">{sku.sku}</div><div className="col-span-2 text-slate-700">{sku.current_inventory?.toLocaleString()}</div><div className="col-span-2 text-slate-700">{sku.avg_weekly_demand?.toFixed(2)}</div><div className="col-span-2 font-bold text-slate-800">{sku.weeks_of_supply?.toFixed(1)}</div><div className="col-span-2"><span className={`category-tag text-xs`}>{sku.category}</span></div></div>)}
//                 </div>
//             )}
//         </div>
//     );
// };

// // --- Universal Helper Components ---

// const FitBounds = ({ locations }) => {
//     const map = useMap();
//     useEffect(() => {
//         if (!locations || locations.length === 0) return;
//         const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
//         if (validCoords.length === 0) return;
//         const bounds = L.latLngBounds(validCoords);
//         if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
//     }, [locations, map]);
//     return null;
// };

// const ResetMapViewButton = ({ locations }) => {
//     const map = useMap();
//     const fitMapToBounds = () => {
//         const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
//         if (validCoords.length > 0) { const bounds = L.latLngBounds(validCoords); if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], animate: true }); }
//     };
//     return <button onClick={fitMapToBounds} className="absolute top-3 right-3 z-[1000] bg-white text-slate-800 px-3 py-1.5 rounded-md shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors" title="Fit all nodes into view">⤢ Fit View</button>;
// };

// const AutoPanMarker = ({ children, ...props }) => {
//     const map = useMap();
//     const handleTooltipOpen = useCallback((e) => {
//         const tooltip = e.tooltip; if (!tooltip || !map) return;
//         setTimeout(() => {
//             const tooltipBounds = tooltip.getElement().getBoundingClientRect();
//             const mapBounds = map.getContainer().getBoundingClientRect();
//             const panOffset = { x: 0, y: 0 }; const padding = 20;
//             if (tooltipBounds.right + padding > mapBounds.right) panOffset.x = tooltipBounds.right + padding - mapBounds.right;
//             if (tooltipBounds.left - padding < mapBounds.left) panOffset.x = tooltipBounds.left - padding - mapBounds.left;
//             if (tooltipBounds.bottom + padding > mapBounds.bottom) panOffset.y = tooltipBounds.bottom + padding - mapBounds.bottom;
//             if (tooltipBounds.top - padding < mapBounds.top) panOffset.y = tooltipBounds.top - padding - mapBounds.top;
//             if (panOffset.x !== 0 || panOffset.y !== 0) map.panBy([panOffset.x, panOffset.y], { animate: true, duration: 0.3 });
//         }, 10);
//     }, [map]);
//     const eventHandlers = useMemo(() => ({ tooltipopen: handleTooltipOpen }), [handleTooltipOpen]);
//     return <Marker {...props} eventHandlers={eventHandlers}>{children}</Marker>;
// };

// // --- Reusable UI Components ---

// const MetricCard = React.memo(({ icon, title, value }) => (
//     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex items-center space-x-4">
//         <div className="bg-slate-900 p-3 rounded-full">{icon}</div>
//         <div><p className="text-sm font-medium text-slate-400">{title}</p><p className="text-2xl font-bold text-white">{value}</p></div>
//     </motion.div>
// ));
// const Header = React.memo(({ onRefresh }) => (
//     <header className="relative flex justify-center items-center mb-6">
//         <div className="text-center"><h1 className="text-3xl font-bold text-white">Control Tower Dashboard</h1></div>
//         <button onClick={onRefresh} className="absolute right-0 p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition"><FiRefreshCw size={20} /></button>
//     </header>
// ));
// const Sidebar = React.memo(({ isOpen, onClose, permissions }) => {
//     const navigate = useNavigate();
//     const hasPermission = (route) => permissions.includes(route);
//     return (
//         <div className={`bg-slate-800 border-r border-slate-700 shadow-lg transition-all duration-300 ${isOpen ? "w-64 p-6" : "w-0 p-0 overflow-hidden"} flex flex-col`}>
//             {isOpen && (<>
//                 <div className="flex items-center justify-between mb-8"><h2 className="text-white text-xl font-bold">Control</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><FiX size={24} /></button></div>
//                 <nav className="space-y-3">
//                     {hasPermission("POST:/store_upload") && <button onClick={() => navigate("/file-upload")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiUpload className="mr-3" /> File Upload</button>}
//                     {hasPermission("GET:/admin/users") && <button onClick={() => navigate("/adminprivileges")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiSettings className="mr-3" /> Manage Users</button>}
//                     {hasPermission("GET:/dashboard") && <button className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiBarChart2 className="mr-3" /> Reports</button>}
//                     <button onClick={() => navigate("/forecast")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiTrendingUp className="mr-3" /> Forecast</button>
//                     <button onClick={() => navigate("/rebalancer")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiRefreshCw className="mr-3" /> Rebalancer</button>
//                     {hasPermission("POST:/config/apply-formula") && <button onClick={() => navigate("/Config")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiShoppingBag className="mr-3" /> Configuration</button>}
//                     <div className="!mt-auto pt-4 border-t border-slate-700"><button onClick={() => navigate("/")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiLogOut className="mr-3" /> Logout</button></div>
//                 </nav>
//             </>)}
//         </div>
//     );
// });

// // --- Main Dashboard Component ---
// function Dashboard() {
//     const [sidebarOpen, setSidebarOpen] = useState(false);
//     const [isChatbotOpen, setIsChatbotOpen] = useState(false);
//     const [permissions, setPermissions] = useState([]);
//     const [availabilityData, setAvailabilityData] = useState([]);
//     const [data, setData] = useState({
//         metrics: { current_demand: 0, inventory_position: 0, weeks_of_supply: 0, stockouts: 0, skus_below_threshold: 0, timestamp: new Date().toISOString() },
//         alerts: [],
//         locations: []
//     });
//     const [loading, setLoading] = useState(true);
//     const navigate = useNavigate();

//     const [mapView, setMapView] = useState('alerts');
//     const [weeksSupplyStores, setWeeksSupplyStores] = useState([]);
//     const [selectedCategory, setSelectedCategory] = useState('all');
//     const [selectedStore, setSelectedStore] = useState(null);
//     const [showSKUDetails, setShowSKUDetails] = useState(false);
//     const [skuDetailsCategory, setSkuDetailsCategory] = useState(null);

//     const fetchWeeksSupplySummary = async () => {
//         try {
//             const token = localStorage.getItem("token");
//             const headers = { Authorization: `Bearer ${token}` };
//             const response = await axios.get(`${BASE_URL}/weeks-of-supply/store-summary`, { headers });
//             if (response.data.success) {
//                 setWeeksSupplyStores(response.data.data || []);
//             }
//         } catch (error) { console.error('Error fetching weeks supply summary:', error); }
//     };
    
//     useEffect(() => {
//         const fetchDashboardData = async () => {
//             setLoading(true);
//             const token = localStorage.getItem("token");
//             if (!token) { navigate("/"); return; }
//             const headers = { Authorization: `Bearer ${token}` };
//             try {
//                 const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
//                 const allowedRoutes = permRes.data.allowed_routes || [];
//                 setPermissions(allowedRoutes);
//                 if (!allowedRoutes.includes("GET:/dashboard")) { setLoading(false); return; }

//                 // MODIFIED: Added lookahead_days back to promise chain
//                 const [dashboardRes, storesRes, alertsRes, availabilityRes, lookaheadRes] = await Promise.allSettled([
//                     axios.get(`${BASE_URL}/dashboard`, { headers }),
//                     axios.get(`${BASE_URL}/stores`, { headers }),
//                     axios.get(`${BASE_URL}/alerts`, { headers }),
//                     axios.get(`${BASE_URL}/availability`, { headers }),
//                     axios.get(`${BASE_URL}/user/lookahead_days`, { headers }),
//                 ]);

//                 if (availabilityRes.status === 'fulfilled') setAvailabilityData(availabilityRes.value.data.data || []);
//                 const backendDashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {};
//                 const stores = storesRes.status === 'fulfilled' ? storesRes.value.data.stores : [];
//                 const backendAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
//                 let stockouts = 0, skusBelow = 0;
//                 if (backendAlerts?.length > 0) {
//                     backendAlerts.forEach(alert => {
//                         if (alert.type === "STOCK_OUT") stockouts++;
//                         else if (alert.type === "UNDER_STOCK") skusBelow++;
//                     });
//                 }
                
//                 // MODIFIED: Fetch both hover and alert status for each store
//                 const locationPromises = stores.map(store => Promise.allSettled([
//                     axios.get(`${BASE_URL}/store/${store.store_id}/hover`, { headers }),
//                     axios.get(`${BASE_URL}/store/${store.store_id}/with-alert-status`, { headers })
//                 ]));
//                 const locationsData = await Promise.all(locationPromises);
                
//                 const locations = locationsData.map((results, index) => {
//                     const store = stores[index];
//                     const [hoverRes, alertStatusRes] = results;

//                     const lookaheadDays = lookaheadRes.status === 'fulfilled' ? lookaheadRes.value.data.lookahead_days : 7;
//                     const hoverData = hoverRes.status === 'fulfilled' ? { ...hoverRes.value.data, lookahead_days: lookaheadDays } : { lookahead_days: lookaheadDays };
//                     const alertStatusData = alertStatusRes.status === 'fulfilled' ? alertStatusRes.value.data : {};
                    
//                     return {
//                         store_id: store.store_id, store_name: store.name, location: store.city, lat: store.lat, lng: store.lon,
//                         alert: backendAlerts.find(a => a.store_id === store.store_id)?.message || null,
//                         hoverStats: {
//                             distinct_skus: hoverData.distinct_skus || 0,
//                             inventory_units: hoverData.inventory_units || 0,
//                             forecast_units: hoverData.forecast_units || 0,
//                             lookahead_days: hoverData.lookahead_days
//                         },
//                         alertStatus: { 
//                             reorderCount: alertStatusData.num_skus_to_reorder || 0, 
//                             stockoutCount: alertStatusData.num_skus_stockout_despite_reorder || 0, 
//                             hasAlert: alertStatusData.alert || false 
//                         }
//                     };
//                 });

//                 setData({
//                     metrics: { current_demand: backendDashboard.current_demand ?? 0, inventory_position: backendDashboard.inventory_position ?? 0, weeks_of_supply: backendDashboard.weeks_of_supply ?? 0, stockouts, skus_below_threshold: skusBelow, timestamp: backendDashboard.timestamp ?? new Date().toISOString() },
//                     alerts: backendAlerts.map((a, i) => ({ id: a.id || `alert-${i}`, severity: a.severity || "Low", message: a.message, type: a.type ? a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "General", store_id: a.store_id, sku: a.sku })),
//                     locations
//                 });

//                 await fetchWeeksSupplySummary();
//             } catch (err) { if (err.response?.status === 401) navigate("/"); } 
//             finally { setLoading(false); }
//         };
//         fetchDashboardData();
//     }, [navigate]);

//     const storesWithCoords = useMemo(() => {
//         return weeksSupplyStores.map(store => {
//             const locationData = data.locations.find(loc => loc.store_id === store.store_id);
//             return { ...store, lat: locationData?.lat || null, lng: locationData?.lng || null, store_name: locationData?.store_name || `Store ${store.store_id}` };
//         }).filter(store => store.lat != null && store.lng != null);
//     }, [weeksSupplyStores, data.locations]);

//     const filteredStores = useMemo(() => {
//         if (selectedCategory === 'all') return storesWithCoords;
//         return storesWithCoords.filter(store => {
//             switch (selectedCategory) {
//                 case 'Critical': return store.critical_count > 0;
//                 case 'Low': return store.low_count > 0;
//                 case 'Adequate': return store.adequate_count > 0;
//                 case 'High': return store.high_count > 0;
//                 default: return true;
//             }
//         });
//     }, [storesWithCoords, selectedCategory]);

//     const storeCounts = useMemo(() => ({
//         'all': storesWithCoords.length,
//         'Critical': storesWithCoords.filter(s => s.critical_count > 0).length,
//         'Low': storesWithCoords.filter(s => s.low_count > 0).length,
//         'Adequate': storesWithCoords.filter(s => s.adequate_count > 0).length,
//         'High': storesWithCoords.filter(s => s.high_count > 0).length,
//     }), [storesWithCoords]);

//     const handleCategoryClickFromPopup = (category) => { setSelectedCategory(category); };
//     const handleCloseSKUDetails = () => { setShowSKUDetails(false); setSelectedStore(null); setSkuDetailsCategory(null); };
//     const handleViewAllSKUs = (store) => { setSelectedStore(store); setSkuDetailsCategory('all'); setShowSKUDetails(true); };


//     if (loading) { return <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center"><div className="flex items-center space-x-3 text-white"><FiRefreshCw className="animate-spin h-5 w-5" /><span>Loading Dashboard...</span></div></div>; }
//     if (!permissions.includes("GET:/dashboard")) { return <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white"><h1 className="text-3xl font-bold">Access Denied</h1><p className="mt-2 text-slate-400">You do not have permission.</p><button onClick={() => navigate("/")} className="mt-6 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition-colors">Go to Login</button></div>; }

//     return (
//         <div className="min-h-screen w-full bg-slate-900 text-white font-sans flex relative">
//             <MapStyles />
//             {!sidebarOpen && <motion.button initial={{ opacity: 0, scale: 0.8, x: -50 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} onClick={() => setSidebarOpen(true)} className="absolute top-6 left-6 z-[1000] p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500" aria-label="Open sidebar"><FiMenu size={22} /></motion.button>}
//             <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} permissions={permissions} />

//             <main className="flex-1 p-6 transition-all duration-300">
//                 <Header onRefresh={() => window.location.reload()} />
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
//                     <div className="lg:col-span-2 space-y-6 flex flex-col">
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                             <MetricCard icon={<FiTrendingUp size={24} className="text-blue-400" />} title="Current Demand" value={data.metrics.current_demand.toLocaleString()} />
//                             <MetricCard icon={<FiBox size={24} className="text-green-400" />} title="Inventory Position" value={data.metrics.inventory_position.toLocaleString()} />
//                             <MetricCard icon={<FiCalendar size={24} className="text-yellow-400" />} title="Weeks Of Supply" value={data.metrics.weeks_of_supply.toLocaleString()} />
//                         </div>

//                         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex-1 flex flex-col">
//                             <div className="flex justify-between items-center mb-4 flex-shrink-0">
//                                 <p className="font-bold text-white text-lg">Network View</p>
//                                 <div className="flex items-center p-1 bg-slate-900 rounded-md">
//                                     <button onClick={() => setMapView('alerts')} className={`px-3 py-1 text-sm rounded ${mapView === 'alerts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Alerts</button>
//                                     <button onClick={() => setMapView('weeksOfSupply')} className={`px-3 py-1 text-sm rounded ${mapView === 'weeksOfSupply' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Weeks of Supply</button>
//                                 </div>
//                             </div>
//                             <div className="rounded-lg overflow-hidden relative h-[60vh]">
//                                 {mapView === 'alerts' ? (
//                                     <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
//                                         <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
//                                         <ResetMapViewButton locations={data.locations} />
//                                         <FitBounds locations={data.locations} />
//                                         {data.locations.filter(loc => loc.lat != null && loc.lng != null).map((loc) => (
//                                             <AutoPanMarker key={loc.store_id} position={[loc.lat, loc.lng]} icon={createAlertIcon(loc)}>
//                                                 <Tooltip direction="top" offset={[0, -42]} opacity={1}>
//                                                     <div className="text-sm space-y-3 p-1" style={{ minWidth: "250px" }}>
//                                                         <div><strong>{loc.store_name}</strong><br /><span className="text-slate-500">{loc.location}</span></div>
//                                                         {loc.alert && <div className="text-red-600 font-bold border-t border-slate-200 pt-2">🚨 Alert: {loc.alert}</div>}
//                                                         {loc.alertStatus && (
//                                                             <div className="text-slate-800 bg-amber-100 p-2 rounded-md border border-amber-200">
//                                                                 <p className="text-amber-800 font-semibold mb-1">Reorder Status:</p>
//                                                                 <ul className="ml-4 list-disc text-sm space-y-1">
//                                                                     <li>📦 SKUs to Reorder: <strong>{loc.alertStatus.reorderCount}</strong></li>
//                                                                     <li className={loc.alertStatus.hasAlert ? "text-red-600 font-bold" : ""}>⚠️ Stockout despite Reorder: <strong>{loc.alertStatus.stockoutCount}</strong></li>
//                                                                 </ul>
//                                                             </div>
//                                                         )}
//                                                         {/* MODIFIED: Quick Stats section restored */}
//                                                         {loc.hoverStats && (
//                                                             <div className="bg-blue-50 text-slate-800 p-2 rounded-md shadow-inner border border-blue-200">
//                                                                 <p className="text-blue-800 font-semibold mb-1">Quick Stats ({loc.hoverStats.lookahead_days}-Day):</p>
//                                                                 <ul className="ml-4 list-disc text-sm space-y-1">
//                                                                     <li>📦 <strong>{loc.hoverStats.distinct_skus}</strong> SKUs</li>
//                                                                     <li>📊 <strong>{loc.hoverStats.inventory_units}</strong> Inventory Units</li>
//                                                                     <li>📈 <strong>{loc.hoverStats.forecast_units}</strong> Forecast Units</li>
//                                                                 </ul>
//                                                             </div>
//                                                         )}
//                                                     </div>
//                                                 </Tooltip>
//                                             </AutoPanMarker>
//                                         ))}
//                                     </MapContainer>
//                                 ) : (
//                                     <MapContainer center={[39.82, -98.57]} zoom={4} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
//                                         <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//                                         <MapFilterControl selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} storeCounts={storeCounts} />
//                                         <ResetMapViewButton locations={filteredStores} />
//                                         <FitBounds locations={filteredStores} />
//                                         {filteredStores.map((store) => (
//                                             <Marker key={store.store_id} position={[store.lat, store.lng]} icon={createWeeksSupplyIcon(store, selectedCategory)}>
//                                                 <Popup closeButton={true} autoClose={false} closeOnClick={false}>
//                                                     {showSKUDetails && selectedStore?.store_id === store.store_id ? (
//                                                         <SKUDetailsPopup storeId={store.store_id} category={skuDetailsCategory} onClose={handleCloseSKUDetails} storeName={store.store_name} />
//                                                     ) : (
//                                                         <StoreSummaryTooltip store={store} onCategoryClick={handleCategoryClickFromPopup} onViewAllSKUs={() => handleViewAllSKUs(store)} />
//                                                     )}
//                                                 </Popup>
//                                             </Marker>
//                                         ))}
//                                     </MapContainer>
//                                 )}
//                             </div>
//                         </motion.div>
//                     </div>

//                     <div className="lg:col-span-1">
//                          <AnimatePresence mode="wait">
//                             {isChatbotOpen ? (
//                                 <motion.div key="chatbot-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="h-full">
//                                     <Chatbot mode="integrated" isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
//                                 </motion.div>
//                             ) : (
//                                 <motion.div key="alerts-view" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="space-y-6 flex flex-col">
//                                     <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[285px]">
//                                         <div className="flex justify-between items-center mb-4 flex-shrink-0"><h3 className="text-lg font-bold text-white">Alerts</h3><span className="text-sm bg-red-900/50 px-2 py-1 rounded text-red-300 font-semibold">{data.alerts.length} Total</span></div>
//                                         <div className="space-y-3 overflow-y-auto flex-1 pr-2">
//                                             {data.alerts.length > 0 ? data.alerts.map((alert) => (
//                                                 <div key={alert.id} className="bg-slate-700/50 p-3 rounded-md border border-slate-600"><div className="flex items-start">
//                                                     {alert.severity === 'High' && <FiAlertTriangle className="text-red-400 mr-3 mt-1 flex-shrink-0" />}
//                                                     {alert.severity === 'Medium' && <FiInfo className="text-yellow-400 mr-3 mt-1 flex-shrink-0" />}
//                                                     {alert.severity === 'Low' && <FiCheckCircle className="text-green-400 mr-3 mt-1 flex-shrink-0" />}
//                                                     <div><p className="text-sm font-semibold text-slate-200">{alert.message}</p><p className="text-xs text-slate-400 mt-1">{alert.type} (SKU: {alert.sku}, Store: {alert.store_id})</p></div>
//                                                 </div></div>
//                                             )) : <div className="text-center py-10 text-slate-400"><FiCheckCircle size={32} className="mx-auto mb-2 text-green-500" /><p>No active alerts.</p></div>}
//                                         </div>
//                                     </div>
//                                     <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[320px]">
//                                         <h3 className="text-lg font-bold text-white">SKU Availability Rate</h3><p className="text-sm text-slate-400 mb-4 flex-shrink-0">Weekly historical availability.</p>
//                                         <div className="w-full flex-1">
//                                             <ResponsiveContainer width="100%" height="100%">
//                                                 <BarChart data={availabilityData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
//                                                     <defs><linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} /></linearGradient></defs>
//                                                     <CartesianGrid strokeDasharray="3 3" stroke="#2a3a56" />
//                                                     <XAxis dataKey="week_start" stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
//                                                     <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
//                                                     <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }} labelStyle={{ color: '#e2e8f0' }} formatter={(value) => [`${value.toFixed(2)}%`, "Availability"]} cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }} />
//                                                     <Bar dataKey="availability_rate" name="Availability Rate" fill="url(#availGrad)" radius={[4, 4, 0, 0]} />
//                                                 </BarChart>
//                                             </ResponsiveContainer>
//                                         </div>
//                                     </div>
//                                 </motion.div>
//                             )}
//                         </AnimatePresence>
//                     </div>
//                 </div>
//             </main>

//             <AnimatePresence>
//                 {!isChatbotOpen && (
//                     <motion.button initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} exit={{ opacity: 0, scale: 0.8, y: 50 }} onClick={() => setIsChatbotOpen(true)} className="fixed bottom-6 right-6 z-[1001] p-4 bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-full shadow-2xl shadow-black/30 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500" aria-label="Open AI Assistant">
//                         <motion.div animate={{ scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}><FiMessageSquare size={24} /></motion.div>
//                     </motion.button>
//                 )}
//             </AnimatePresence>
//         </div>
//     );
// }

// export default Dashboard;


import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
    FiMenu, FiX, FiTrendingUp, FiSettings,
    FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag,
    FiAlertTriangle, FiCheckCircle, FiInfo, FiBox, FiCalendar, FiMessageSquare,
    FiFilter, FiArrowRight, FiList
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import Chatbot from '../components/Chatbot';

const BASE_URL = "http://localhost:5500";

// --- Leaflet & Map Helper Components ---

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapStyles = () => (
    <style>{`
     .custom-marker-container { position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
     .marker-svg { width: 100%; height: 100%; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3)); }
     
     .severity-high .marker-svg { fill: #ef4444; }
     .severity-medium .marker-svg { fill: #f59e0b; }
     .severity-low .marker-svg { fill: #3b82f6; }
     .marker-count { position: absolute; top: 0px; left: 55%; background-color: white; color: #dc2626; font-weight: bold; font-size: 12px; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 1px solid #dc2626; z-index: 10; }
     
     .severity-critical .marker-svg { fill: #ef4444; }
     .severity-adequate .marker-svg { fill: #10b981; }
     .severity-all .marker-svg { fill: #6b7280; }
     .marker-count.wos { top: -2px; right: -2px; left: auto; font-size: 10px; width: 16px; height: 16px; }

     .leaflet-tooltip { background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
     .leaflet-tooltip-top:before { border-top-color: #e2e8f0; }
     .leaflet-popup-content-wrapper { border-radius: 8px; }
     .leaflet-popup-content { margin: 0; }
     .leaflet-popup-tip-container { display: none; }

     .map-filter-control { background: white; border-radius: 8px; padding: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; min-width: 200px; }
     .filter-btn { padding: 6px 12px; margin: 2px; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: space-between; width: 100%; }
     .filter-btn.active { color: white; }
     .filter-btn:not(.active):hover { background: #f3f4f6; }

     .category-tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin: 2px; cursor: pointer; transition: all 0.2s; }
     .category-tag:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
   `}</style>
);

const createAlertIcon = (location) => {
    const { alertStatus } = location;
    const reorderCount = alertStatus?.reorderCount || 0;
    const stockoutCount = alertStatus?.stockoutCount || 0;
    const totalAlerts = reorderCount + stockoutCount;
    let severityClass = 'severity-low';
    if (alertStatus?.hasAlert) severityClass = 'severity-high';
    else if (reorderCount > 0) severityClass = 'severity-medium';
    return new L.DivIcon({
        className: `custom-marker-container ${severityClass}`,
        html: `${totalAlerts > 0 ? `<div class="marker-count">${totalAlerts}</div>` : ''}<svg viewBox="0 0 24 24" class="marker-svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
        iconSize: [32, 42],
        iconAnchor: [16, 42]
    });
};

const createWeeksSupplyIcon = (store, selectedCategory) => {
    const { critical_count, low_count } = store;
    let severityClass = 'severity-all';
    let count = store.total_skus || 0;
    if (selectedCategory && selectedCategory !== 'all') {
        switch (selectedCategory) {
            case 'Critical': severityClass = 'severity-critical'; count = store.critical_count; break;
            case 'Low': severityClass = 'severity-low'; count = store.low_count; break;
            case 'Adequate': severityClass = 'severity-adequate'; count = store.adequate_count; break;
            case 'High': severityClass = 'severity-high'; count = store.high_count; break;
            default: severityClass = 'severity-all'; count = store.total_skus;
        }
    } else {
        if (critical_count > 0) { severityClass = 'severity-critical'; count = critical_count; }
        else if (low_count > 0) { severityClass = 'severity-low'; count = low_count; }
        else { severityClass = 'severity-all'; count = store.total_skus; }
    }
    return new L.DivIcon({
        className: `custom-marker-container ${severityClass}`,
        html: `<div class="marker-count wos">${count}</div><svg viewBox="0 0 24 24" class="marker-svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
        iconSize: [32, 42],
        iconAnchor: [16, 42]
    });
};

const MapFilterControl = ({ selectedCategory, onCategoryChange, storeCounts }) => {
    const categories = [
        { key: 'all', label: 'All Stores', bgColor: '#6b7280', icon: '🏪' },
        { key: 'Critical', label: 'Critical', bgColor: '#ef4444', icon: '🔴' },
        { key: 'Low', label: 'Low', bgColor: '#f59e0b', icon: '🟠' },
        { key: 'Adequate', label: 'Adequate', bgColor: '#10b981', icon: '🟢' },
        { key: 'High', label: 'High', bgColor: '#3b82f6', icon: '🔵' }
    ];
    return (
        <div className="absolute top-3 left-3 z-[1000] map-filter-control">
            <div className="flex items-center space-x-2 mb-2"><FiFilter size={16} className="text-slate-600" /><span className="text-sm font-semibold text-slate-800">Weeks of Supply</span></div>
            <div className="space-y-1">
                {categories.map(category => (<button key={category.key} onClick={() => onCategoryChange(category.key)} className={`filter-btn ${selectedCategory === category.key ? 'active' : ''}`} style={{ backgroundColor: selectedCategory === category.key ? category.bgColor : 'transparent', color: selectedCategory === category.key ? 'white' : category.bgColor, border: `1px solid ${category.bgColor}` }}>
                    <div className="flex items-center"><span className="mr-2">{category.icon}</span><span>{category.label}</span></div><span className="text-xs opacity-80">{storeCounts[category.key]}</span></button>
                ))}
            </div>
        </div>
    );
};

const StoreSummaryTooltip = ({ store, onCategoryClick, onViewAllSKUs }) => (
    <div className="text-sm space-y-3 p-2 min-w-[320px]">
        <div className="border-b border-slate-200 pb-2">
            <div className="flex items-center justify-between"><strong className="text-lg">📍 Store {store.store_id}</strong><button onClick={onViewAllSKUs} className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium">View All SKUs <FiArrowRight className="ml-1" size={12} /></button></div>
            <span className="text-slate-500 text-sm">{store.store_name || `Store ${store.store_id}`}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-100 p-2 rounded"><div className="font-semibold">📊 Total SKUs</div><div className="text-lg font-bold">{store.total_skus}</div></div>
            <div className="bg-slate-100 p-2 rounded"><div className="font-semibold">📈 Avg Weeks</div><div className="text-lg font-bold">{store.avg_weeks_of_supply?.toFixed(2) || '0.00'}</div></div>
        </div>
        <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">Categories:</span><span className="text-xs text-slate-500">Click to filter</span></div>
            <div className="flex flex-wrap gap-1">
                {store.critical_count > 0 && <div className="category-tag bg-red-100 text-red-800 border border-red-300" onClick={() => onCategoryClick('Critical')}>🔴 Critical: {store.critical_count}</div>}
                {store.low_count > 0 && <div className="category-tag bg-orange-100 text-orange-800 border border-orange-300" onClick={() => onCategoryClick('Low')}>🟠 Low: {store.low_count}</div>}
                {store.adequate_count > 0 && <div className="category-tag bg-green-100 text-green-800 border border-green-300" onClick={() => onCategoryClick('Adequate')}>🟢 Adequate: {store.adequate_count}</div>}
                {store.high_count > 0 && <div className="category-tag bg-blue-100 text-blue-800 border border-blue-300" onClick={() => onCategoryClick('High')}>🔵 High: {store.high_count}</div>}
            </div>
        </div>
    </div>
);

const SKUDetailsPopup = ({ storeId, category, onClose, storeName }) => {
    const [skuDetails, setSkuDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchSKUDetails = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const params = category && category !== 'all' ? { category } : {};
                const response = await axios.get(`${BASE_URL}/weeks-of-supply/sku-details/${storeId}`, { headers, params });
                if (response.data.success) setSkuDetails(response.data.data || []);
            } catch (error) { console.error('Error fetching SKU details:', error); } finally { setLoading(false); }
        };
        fetchSKUDetails();
    }, [storeId, category]);
    if (loading) return <div className="p-4 h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    return (
        <div className="p-4 max-h-80 overflow-y-auto min-w-[500px] bg-white">
            <div className="flex justify-between items-center mb-4">
                <div><h3 className="text-lg font-bold text-slate-800">SKU Details - {storeName}</h3>{category && category !== 'all' && <span className="text-sm text-slate-600">Filter: {category}</span>}</div>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-700"><FiX size={20} /></button>
            </div>
            {skuDetails.length === 0 ? <div className="text-center py-8 text-slate-500"><FiBox className="mx-auto mb-2 text-slate-400" size={32} /><p>No SKUs found.</p></div> : (<div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold border-b pb-2 text-slate-600 bg-slate-50 p-2 rounded-t"><div className="col-span-4">SKU</div><div className="col-span-2">Current Inv</div><div className="col-span-2">Weekly Demand</div><div className="col-span-2">Weeks Left</div><div className="col-span-2">Category</div></div>
                {skuDetails.map((sku, index) => <div key={index} className="grid grid-cols-12 gap-2 text-xs border-b pb-2 last:border-b-0 hover:bg-slate-50 rounded p-1"><div className="col-span-4 font-medium text-slate-800">{sku.sku}</div><div className="col-span-2 text-slate-700">{sku.current_inventory?.toLocaleString()}</div><div className="col-span-2 text-slate-700">{sku.avg_weekly_demand?.toFixed(2)}</div><div className="col-span-2 font-bold text-slate-800">{sku.weeks_of_supply?.toFixed(1)}</div><div className="col-span-2"><span className={`category-tag text-xs`}>{sku.category}</span></div></div>)}
            </div>)}
        </div>
    );
};

const FitBounds = ({ locations }) => {
    const map = useMap();
    useEffect(() => {
        if (!locations || locations.length === 0) return;
        const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
        if (validCoords.length === 0) return;
        const bounds = L.latLngBounds(validCoords);
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }, [locations, map]);
    return null;
};

const ResetMapViewButton = ({ locations }) => {
    const map = useMap();
    const fitMapToBounds = () => {
        const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
        if (validCoords.length > 0) { const bounds = L.latLngBounds(validCoords); if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], animate: true }); }
    };
    return <button onClick={fitMapToBounds} className="absolute top-3 right-3 z-[1000] bg-white text-slate-800 px-3 py-1.5 rounded-md shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors" title="Fit all nodes into view">⤢ Fit View</button>;
};

const AutoPanMarker = ({ children, ...props }) => {
    const map = useMap();
    const handleTooltipOpen = useCallback((e) => {
        const tooltip = e.tooltip; if (!tooltip || !map) return;
        setTimeout(() => {
            const tooltipBounds = tooltip.getElement().getBoundingClientRect();
            const mapBounds = map.getContainer().getBoundingClientRect();
            const panOffset = { x: 0, y: 0 }; const padding = 20;
            if (tooltipBounds.right + padding > mapBounds.right) panOffset.x = tooltipBounds.right + padding - mapBounds.right;
            if (tooltipBounds.left - padding < mapBounds.left) panOffset.x = tooltipBounds.left - padding - mapBounds.left;
            if (tooltipBounds.bottom + padding > mapBounds.bottom) panOffset.y = tooltipBounds.bottom + padding - mapBounds.bottom;
            if (tooltipBounds.top - padding < mapBounds.top) panOffset.y = tooltipBounds.top - padding - mapBounds.top;
            if (panOffset.x !== 0 || panOffset.y !== 0) map.panBy([panOffset.x, panOffset.y], { animate: true, duration: 0.3 });
        }, 10);
    }, [map]);
    const eventHandlers = useMemo(() => ({ tooltipopen: handleTooltipOpen }), [handleTooltipOpen]);
    return <Marker {...props} eventHandlers={eventHandlers}>{children}</Marker>;
};

const MetricCard = React.memo(({ icon, title, value }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex items-center space-x-4">
        <div className="bg-slate-900 p-3 rounded-full">{icon}</div>
        <div><p className="text-sm font-medium text-slate-400">{title}</p><p className="text-2xl font-bold text-white">{value}</p></div>
    </motion.div>
));
const Header = React.memo(({ onRefresh }) => (
    <header className="relative flex justify-center items-center mb-6">
        <div className="text-center"><h1 className="text-3xl font-bold text-white">Control Tower Dashboard</h1></div>
        <button onClick={onRefresh} className="absolute right-0 p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition"><FiRefreshCw size={20} /></button>
    </header>
));
const Sidebar = React.memo(({ isOpen, onClose, permissions }) => {
    const navigate = useNavigate();
    const hasPermission = (route) => permissions.includes(route);
    return (<div className={`bg-slate-800 border-r border-slate-700 shadow-lg transition-all duration-300 ${isOpen ? "w-64 p-6" : "w-0 p-0 overflow-hidden"} flex flex-col`}>
        {isOpen && (<>
            <div className="flex items-center justify-between mb-8"><h2 className="text-white text-xl font-bold">Control</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><FiX size={24} /></button></div>
            <nav className="space-y-3">
                {hasPermission("POST:/store_upload") && <button onClick={() => navigate("/file-upload")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiUpload className="mr-3" /> File Upload</button>}
                {hasPermission("GET:/admin/users") && <button onClick={() => navigate("/adminprivileges")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiSettings className="mr-3" /> Manage Users</button>}
                {hasPermission("GET:/dashboard") && <button className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiBarChart2 className="mr-3" /> Reports</button>}
                <button onClick={() => navigate("/forecast")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiTrendingUp className="mr-3" /> Forecast</button>
                <button onClick={() => navigate("/rebalancer")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiRefreshCw className="mr-3" /> Rebalancer</button>
                {hasPermission("POST:/config/apply-formula") && <button onClick={() => navigate("/Config")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiShoppingBag className="mr-3" /> Configuration</button>}
                <div className="!mt-auto pt-4 border-t border-slate-700"><button onClick={() => navigate("/")} className="flex items-center text-slate-300 hover:bg-slate-700 p-2 rounded-md transition w-full"><FiLogOut className="mr-3" /> Logout</button></div>
            </nav>
        </>)}
    </div>);
});

// --- Main Dashboard Component ---
function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [availabilityData, setAvailabilityData] = useState([]);
    const [data, setData] = useState({
        metrics: { current_demand: 0, inventory_position: 0, weeks_of_supply: 0, stockouts: 0, skus_below_threshold: 0, timestamp: new Date().toISOString() },
        alerts: [],
        locations: []
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [mapView, setMapView] = useState('alerts');
    const [weeksSupplyStores, setWeeksSupplyStores] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStore, setSelectedStore] = useState(null);
    const [showSKUDetails, setShowSKUDetails] = useState(false);
    const [skuDetailsCategory, setSkuDetailsCategory] = useState(null);

    const fetchWeeksSupplySummary = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get(`${BASE_URL}/weeks-of-supply/store-summary`, { headers });
            if (response.data.success) setWeeksSupplyStores(response.data.data || []);
        } catch (error) { console.error('Error fetching weeks supply summary:', error); }
    };
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate("/"); return; }
            const headers = { Authorization: `Bearer ${token}` };
            try {
                const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
                const allowedRoutes = permRes.data.allowed_routes || [];
                setPermissions(allowedRoutes);
                if (!allowedRoutes.includes("GET:/dashboard")) { setLoading(false); return; }

                const [dashboardRes, storesRes, alertsRes, availabilityRes, lookaheadRes] = await Promise.allSettled([
                    axios.get(`${BASE_URL}/dashboard`, { headers }),
                    axios.get(`${BASE_URL}/stores`, { headers }),
                    axios.get(`${BASE_URL}/alerts`, { headers }),
                    axios.get(`${BASE_URL}/availability`, { headers }),
                    axios.get(`${BASE_URL}/user/lookahead_days`, { headers }),
                ]);

                if (availabilityRes.status === 'fulfilled') setAvailabilityData(availabilityRes.value.data.data || []);
                const backendDashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {};
                const stores = storesRes.status === 'fulfilled' ? storesRes.value.data.stores : [];
                const backendAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
                
                let stockouts = 0, skusBelow = 0;
                if (backendAlerts?.length > 0) {
                    backendAlerts.forEach(alert => {
                        if (alert.type === "STOCK_OUT") stockouts++;
                        else if (alert.type === "UNDER_STOCK") skusBelow++;
                    });
                }
                
                const locationPromises = stores.map(store => Promise.allSettled([
                    axios.get(`${BASE_URL}/store/${store.store_id}/hover`, { headers }),
                    axios.get(`${BASE_URL}/store/${store.store_id}/with-alert-status`, { headers })
                ]));
                
                const locationsData = await Promise.all(locationPromises);
                const lookaheadDays = lookaheadRes.status === 'fulfilled' ? lookaheadRes.value.data.lookahead_days : 7;

                const locations = locationsData.map((results, index) => {
                    const store = stores[index];
                    const [hoverRes, alertStatusRes] = results;
                    const hoverData = hoverRes.status === 'fulfilled' ? { ...hoverRes.value.data, lookahead_days: lookaheadDays } : { lookahead_days: lookaheadDays };
                    const alertStatusData = alertStatusRes.status === 'fulfilled' ? alertStatusRes.value.data : {};
                    return {
                        store_id: store.store_id, store_name: store.name, location: store.city, lat: store.lat, lng: store.lon,
                        alert: backendAlerts.find(a => a.store_id === store.store_id)?.message || null,
                        hoverStats: { distinct_skus: hoverData.distinct_skus || 0, inventory_units: hoverData.inventory_units || 0, forecast_units: hoverData.forecast_units || 0, lookahead_days: hoverData.lookahead_days },
                        alertStatus: { reorderCount: alertStatusData.num_skus_to_reorder || 0, stockoutCount: alertStatusData.num_skus_stockout_despite_reorder || 0, hasAlert: alertStatusData.alert || false }
                    };
                });

                setData({
                    metrics: { current_demand: backendDashboard.current_demand ?? 0, inventory_position: backendDashboard.inventory_position ?? 0, weeks_of_supply: backendDashboard.weeks_of_supply ?? 0, stockouts, skus_below_threshold: skusBelow, timestamp: backendDashboard.timestamp ?? new Date().toISOString() },
                    alerts: backendAlerts.map((a, i) => ({ id: a.id || `alert-${i}`, severity: a.severity || "Low", message: a.message, type: a.type ? a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "General", store_id: a.store_id, sku: a.sku })),
                    locations
                });
                await fetchWeeksSupplySummary();

            } catch (err) { if (err.response?.status === 401) navigate("/"); } 
            finally { setLoading(false); }
        };
        fetchDashboardData();
    }, [navigate]);

    const storesWithCoords = useMemo(() => weeksSupplyStores.map(store => {
        const locationData = data.locations.find(loc => loc.store_id === store.store_id);
        return { ...store, lat: locationData?.lat || null, lng: locationData?.lng || null, store_name: locationData?.store_name || `Store ${store.store_id}` };
    }).filter(store => store.lat != null && store.lng != null), [weeksSupplyStores, data.locations]);

    const filteredStores = useMemo(() => {
        if (selectedCategory === 'all') return storesWithCoords;
        return storesWithCoords.filter(store => {
            switch (selectedCategory) {
                case 'Critical': return store.critical_count > 0;
                case 'Low': return store.low_count > 0;
                case 'Adequate': return store.adequate_count > 0;
                case 'High': return store.high_count > 0;
                default: return true;
            }
        });
    }, [storesWithCoords, selectedCategory]);

    const storeCounts = useMemo(() => ({
        'all': storesWithCoords.length, 'Critical': storesWithCoords.filter(s => s.critical_count > 0).length, 'Low': storesWithCoords.filter(s => s.low_count > 0).length,
        'Adequate': storesWithCoords.filter(s => s.adequate_count > 0).length, 'High': storesWithCoords.filter(s => s.high_count > 0).length,
    }), [storesWithCoords]);

    const handleCategoryClickFromPopup = (category) => setSelectedCategory(category);
    const handleCloseSKUDetails = () => { setShowSKUDetails(false); setSelectedStore(null); setSkuDetailsCategory(null); };
    const handleViewAllSKUs = (store) => { setSelectedStore(store); setSkuDetailsCategory('all'); setShowSKUDetails(true); };

    if (loading) { return <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center"><div className="flex items-center space-x-3 text-white"><FiRefreshCw className="animate-spin h-5 w-5" /><span>Loading...</span></div></div>; }
    if (!permissions.includes("GET:/dashboard")) { return <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white"><h1 className="text-3xl font-bold">Access Denied</h1><button onClick={() => navigate("/")} className="mt-6 bg-blue-600 px-4 py-2 rounded">Go to Login</button></div>; }

    return (
        <div className="min-h-screen w-full bg-slate-900 text-white font-sans flex relative">
            <MapStyles />
            {!sidebarOpen && <motion.button initial={{ opacity: 0, scale: 0.8, x: -50 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} onClick={() => setSidebarOpen(true)} className="absolute top-6 left-6 z-[1000] p-3 bg-slate-800 rounded-full hover:bg-slate-700 focus:outline-none" aria-label="Open sidebar"><FiMenu size={22} /></motion.button>}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} permissions={permissions} />
            <main className="flex-1 p-6 transition-all duration-300">
                <Header onRefresh={() => window.location.reload()} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
                    <div className="lg:col-span-2 space-y-6 flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <MetricCard icon={<FiTrendingUp size={24} className="text-blue-400" />} title="Current Demand" value={data.metrics.current_demand.toLocaleString()} />
                            <MetricCard icon={<FiBox size={24} className="text-green-400" />} title="Inventory Position" value={data.metrics.inventory_position.toLocaleString()} />
                            <MetricCard icon={<FiCalendar size={24} className="text-yellow-400" />} title="Weeks Of Supply" value={data.metrics.weeks_of_supply.toLocaleString()} />
                        </div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                <div>
                                    <p className="font-bold text-white text-lg">Network View</p>
                                    <div className="text-xs flex space-x-2 mt-1">
                                        <span className="bg-red-900/50 px-2 py-1 rounded text-red-300">{data.metrics.stockouts} Stockouts</span>
                                        <span className="bg-yellow-900/50 px-2 py-1 rounded text-yellow-300">{data.metrics.skus_below_threshold} Below Threshold</span>
                                    </div>
                                </div>
                                <select value={mapView} onChange={(e) => setMapView(e.target.value)} className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2">
                                    <option value="alerts">Alerts View</option>
                                    <option value="weeksOfSupply">Weeks of Supply View</option>
                                </select>
                            </div>
                            <div className="rounded-lg overflow-hidden relative h-[60vh]">
                                {mapView === 'alerts' ? (
                                    <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
                                        <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                        <ResetMapViewButton locations={data.locations} />
                                        <FitBounds locations={data.locations} />
                                        {data.locations.filter(loc => loc.lat != null && loc.lng != null).map((loc) => (
                                            <AutoPanMarker key={loc.store_id} position={[loc.lat, loc.lng]} icon={createAlertIcon(loc)}>
                                                <Tooltip direction="top" offset={[0, -42]} opacity={1}>
                                                    <div className="text-sm space-y-3 p-1" style={{ minWidth: "250px" }}>
                                                        <div><strong>{loc.store_name}</strong><br /><span className="text-slate-500">{loc.location}</span></div>
                                                        {loc.alertStatus && (<div className="text-slate-800 bg-amber-100 p-2 rounded-md border border-amber-200">
                                                            <p className="text-amber-800 font-semibold mb-1">Reorder Status:</p>
                                                            <ul className="ml-4 list-disc text-sm space-y-1"><li>📦 SKUs to Reorder: <strong>{loc.alertStatus.reorderCount}</strong></li><li className={loc.alertStatus.hasAlert ? "text-red-600 font-bold" : ""}>⚠️ Stockout despite Reorder: <strong>{loc.alertStatus.stockoutCount}</strong></li></ul>
                                                        </div>)}
                                                        {loc.hoverStats && (<div className="mt-3 bg-blue-100 text-gray-800 p-2 rounded-md border border-blue-300/40">
                                                            <p className="text-blue-800 font-semibold mb-1">Quick Stats ({loc.hoverStats.lookahead_days}-Day):</p>
                                                            <ul className="ml-4 list-disc text-sm space-y-1"><li>📦 <strong>{loc.hoverStats.distinct_skus}</strong> SKUs</li><li>📊 <strong>{loc.hoverStats.inventory_units}</strong> Inventory Units</li><li>📈 <strong>{loc.hoverStats.forecast_units}</strong> Forecast Units</li></ul>
                                                        </div>)}
                                                    </div>
                                                </Tooltip>
                                            </AutoPanMarker>
                                        ))}
                                    </MapContainer>
                                ) : (
                                    <MapContainer center={[39.82, -98.57]} zoom={4} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
                                        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <MapFilterControl selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} storeCounts={storeCounts} />
                                        <ResetMapViewButton locations={filteredStores} />
                                        <FitBounds locations={filteredStores} />
                                        {filteredStores.map((store) => (<Marker key={store.store_id} position={[store.lat, store.lng]} icon={createWeeksSupplyIcon(store, selectedCategory)}>
                                            <Popup closeButton={true} autoClose={false} closeOnClick={false}>
                                                {showSKUDetails && selectedStore?.store_id === store.store_id ? (<SKUDetailsPopup storeId={store.store_id} category={skuDetailsCategory} onClose={handleCloseSKUDetails} storeName={store.store_name} />) : (<StoreSummaryTooltip store={store} onCategoryClick={handleCategoryClickFromPopup} onViewAllSKUs={() => handleViewAllSKUs(store)} />)}
                                            </Popup>
                                        </Marker>))}
                                    </MapContainer>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-1">
                         <AnimatePresence mode="wait">
                            {isChatbotOpen ? (
                                <motion.div key="chatbot-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.3 }} className="h-full">
                                    <Chatbot mode="integrated" isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
                                </motion.div>
                            ) : (
                                <motion.div key="alerts-view" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-6 flex flex-col">
                                    <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[285px]">
                                        <div className="flex justify-between items-center mb-4 flex-shrink-0"><h3 className="text-lg font-bold text-white">Alerts</h3><span className="text-sm bg-red-900/50 px-2 py-1 rounded text-red-300 font-semibold">{data.alerts.length} Total</span></div>
                                        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                                            {data.alerts.length > 0 ? data.alerts.map((alert) => (<div key={alert.id} className="bg-slate-700/50 p-3 rounded-md border border-slate-600"><div className="flex items-start">
                                                {alert.severity === 'High' && <FiAlertTriangle className="text-red-400 mr-3 mt-1 flex-shrink-0" />}
                                                {alert.severity === 'Medium' && <FiInfo className="text-yellow-400 mr-3 mt-1 flex-shrink-0" />}
                                                {alert.severity === 'Low' && <FiCheckCircle className="text-green-400 mr-3 mt-1 flex-shrink-0" />}
                                                <div><p className="text-sm font-semibold text-slate-200">{alert.message}</p><p className="text-xs text-slate-400 mt-1">{alert.type} (SKU: {alert.sku}, Store: {alert.store_id})</p></div>
                                            </div></div>)) : <div className="text-center py-10 text-slate-400"><FiCheckCircle size={32} className="mx-auto mb-2 text-green-500" /><p>No active alerts.</p></div>}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex flex-col h-[320px]">
                                        <h3 className="text-lg font-bold text-white">SKU Availability Rate</h3><p className="text-sm text-slate-400 mb-4 flex-shrink-0">Weekly historical availability.</p>
                                        <div className="w-full flex-1">
                                            <ResponsiveContainer width="100%" height="100%"><BarChart data={availabilityData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                                <defs><linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} /></linearGradient></defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a56" />
                                                <XAxis dataKey="week_start" stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }} labelStyle={{ color: '#e2e8f0' }} formatter={(value) => [`${value.toFixed(2)}%`, "Availability"]} cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }} />
                                                <Bar dataKey="availability_rate" name="Availability Rate" fill="url(#availGrad)" radius={[4, 4, 0, 0]} />
                                            </BarChart></ResponsiveContainer>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
            <AnimatePresence>
                {!isChatbotOpen && (<motion.button initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} exit={{ opacity: 0, scale: 0.8, y: 50 }} onClick={() => setIsChatbotOpen(true)} className="fixed bottom-6 right-6 z-[1001] p-4 bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-full shadow-2xl shadow-black/30 focus:outline-none" aria-label="Open AI Assistant">
                    <motion.div animate={{ scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}><FiMessageSquare size={24} /></motion.div>
                </motion.button>)}
            </AnimatePresence>
        </div>
    );
}

export default Dashboard;