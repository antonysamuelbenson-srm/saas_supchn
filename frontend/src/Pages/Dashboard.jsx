import React, { useState, useEffect , useCallback } from "react";
import axios from "axios";
import {
  FiMenu, FiX, FiDatabase, FiTrendingUp, FiSettings,
  FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BASE_URL = "http://localhost:5500";

// MODIFIED: CSS styles updated for an SVG pointer icon instead of a dot.
// START: Added for Line Chart
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
// END: Added for Line Chart


function ResetMapViewButton({ center, zoom }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(center, zoom)}
      className="absolute top-3 right-3 z-[1000] bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow-md"
    >
      ⤢ Reset View
    </button>
  );
}


const MapStyles = () => (
  <style>{`
    .custom-marker-container {
      position: relative;
      width: 32px; /* Adjusted for pointer size */
      height: 42px; /* Adjusted for pointer size */
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .marker-svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));
    }
    .severity-high .marker-svg {
      fill: #ef4444; /* red-500 */
    }
    .severity-medium .marker-svg {
      fill: #f59e0b; /* amber-500 */
    }
    .severity-low .marker-svg {
      fill: #3b82f6; /* blue-500 */
    }
    .marker-count {
      position: absolute;
      top: 0px; /* Adjusted for pointer */
      left: 55%; /* Adjusted for pointer */
      background-color: white;
      color: #dc2626; /* red-600 */
      font-weight: bold;
      font-size: 12px;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #dc2626;
      z-index: 10;
    }
  `}</style>
);


// Helper to fit map bounds
const FitBounds = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (!locations || locations.length === 0) return;
    const validCoords = locations
      .filter((loc) => loc.lat != null && loc.lng != null)
      .map((loc) => [loc.lat, loc.lng]);

    if (validCoords.length === 0) return;
    const bounds = L.latLngBounds(validCoords);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
};





// NEW COMPONENT: AutoPanMarker
const AutoPanMarker = ({ children, ...props }) => {
  const map = useMap();

  const handleTooltipOpen = useCallback((e) => {
    const tooltip = e.tooltip;
    if (!tooltip || !map) return;

    // Use a small timeout to allow the tooltip to be fully rendered and positioned
    setTimeout(() => {
      // Get the pixel bounds of the tooltip and the map container
      const tooltipBounds = tooltip.getElement().getBoundingClientRect();
      const mapBounds = map.getContainer().getBoundingClientRect();

      // Calculate how much the tooltip is overflowing the map container
      const panOffset = { x: 0, y: 0 };
      const padding = 20; // Add some padding so it's not flush with the edge

      if (tooltipBounds.right + padding > mapBounds.right) {
        panOffset.x = tooltipBounds.right + padding - mapBounds.right;
      }
      if (tooltipBounds.left - padding < mapBounds.left) {
        panOffset.x = tooltipBounds.left - padding - mapBounds.left;
      }
      if (tooltipBounds.bottom + padding > mapBounds.bottom) {
        panOffset.y = tooltipBounds.bottom + padding - mapBounds.bottom;
      }
      if (tooltipBounds.top - padding < mapBounds.top) {
        panOffset.y = tooltipBounds.top - padding - mapBounds.top;
      }
      
      // If there is any overflow, pan the map smoothly
      if (panOffset.x !== 0 || panOffset.y !== 0) {
        map.panBy([panOffset.x, panOffset.y], { animate: true, duration: 0.3 });
      }
    }, 10); // 10ms timeout is usually enough

  }, [map]);

  const eventHandlers = React.useMemo(() => ({
    tooltipopen: handleTooltipOpen,
    click: (e) => e.target.openPopup(), // Keep the click for popup
  }), [handleTooltipOpen]);

  return (
    <Marker {...props} eventHandlers={eventHandlers}>
      {children}
    </Marker>
  );
};


// Leaflet marker setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// MODIFIED: The function now creates an SVG pointer icon.
const createAlertIcon = (location) => {
  const { alertStatus } = location;
  const reorderCount = alertStatus?.reorderCount || 0;
  const stockoutCount = alertStatus?.stockoutCount || 0;
  const totalAlerts = reorderCount + stockoutCount;

  let severityClass = 'severity-low'; // Default blue
  if (alertStatus?.hasAlert) { // This means "stockout despite reorder" is true
    severityClass = 'severity-high'; // Red
  } else if (reorderCount > 0) {
    severityClass = 'severity-medium'; // Yellow/Amber
  }

  // The HTML now contains an SVG path for the map pin.
  return new L.DivIcon({
    className: `custom-marker-container ${severityClass}`,
    html: `
      ${totalAlerts > 0 ? `<div class="marker-count">${totalAlerts}</div>` : ''}
      <svg viewBox="0 0 24 24" class="marker-svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42] // Point of the pointer
  });
};


function Dashboard() {
  const [mapSize, setMapSize] = useState("default");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState([]);

    // START: Added state for availability chart
  const [availabilityData, setAvailabilityData] = useState([]);
  // END: Added state for availability chart

  // Dashboard state
  const [data, setData] = useState({
    metrics: {
      current_demand: 0,
      inventory_position: 0,
      weeks_of_supply: 0,
      stockouts: 0,
      skus_below_threshold: 0,
      inventory_turnover: 0,
      timestamp: new Date().toISOString()
    },
    alerts: [],
    locations: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const hasPermission = (route) => permissions.includes(route);

  const [forecastDays, setForecastDays] = useState(7);
  
  const fetchLookaheadDays = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/user/lookahead_days`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForecastDays(res.data.lookahead_days || 7);
    } catch (err) {
      console.error("❌ Failed to fetch lookahead_days:", err);
    }
  };
useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // First, verify permissions
        const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
        const allowedRoutes = permRes.data.allowed_routes || [];
        setPermissions(allowedRoutes);

        if (!allowedRoutes.includes("GET:/dashboard")) {
          setLoading(false);
          return;
        }

        // Fetch all data sources in parallel
        const [
          dashboardRes,
          storesRes,
          alertsRes,
          availabilityRes,
          lookaheadRes
        ] = await Promise.allSettled([
          axios.get(`${BASE_URL}/dashboard`, { headers }),
          axios.get(`${BASE_URL}/stores`, { headers }),
          axios.get(`${BASE_URL}/alerts`, { headers }),
          axios.get(`${BASE_URL}/availability`, { headers }),
          axios.get(`${BASE_URL}/user/lookahead_days`, { headers }),
        ]);

        // Process lookahead days
        if (lookaheadRes.status === 'fulfilled') {
            setForecastDays(lookaheadRes.value.data.lookahead_days || 7);
        } else {
            console.error("❌ Failed to fetch lookahead_days:", lookaheadRes.reason);
        }

        // Process availability data
        if (availabilityRes.status === 'fulfilled') {
            setAvailabilityData(availabilityRes.value.data.data || []);
        } else {
            console.error("❌ Failed to fetch availability data:", availabilityRes.reason);
            setAvailabilityData([]); // Ensure it's an empty array on failure
        }
        
        const backendDashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {};
        const stores = storesRes.status === 'fulfilled' ? storesRes.value.data.stores : [];
        const backendAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
        
        let stockouts = 0;
        let skusBelow = 0;
        
        if (backendAlerts && backendAlerts.length > 0) {
            backendAlerts.forEach(alert => {
              if (alert.type === "stock_out") stockouts++;
              else if (alert.type === "excess" || alert.type === "low_stock") skusBelow++;
            });
        }
        
        // Fetch detailed location data
        const locationPromises = stores.map(store => Promise.allSettled([
            axios.get(`${BASE_URL}/store/${store.store_id}/summary`, { headers }),
            axios.get(`${BASE_URL}/store/${store.store_id}/hover`, { headers }),
            axios.get(`${BASE_URL}/store/${store.store_id}/with-alert-status`, { headers })
        ]));

        const locationsData = await Promise.all(locationPromises);

        const locations = locationsData.map((results, index) => {
            const store = stores[index];
            const [summaryRes, hoverRes, alertStatusRes] = results;

            const storeKey = summaryRes.status === 'fulfilled' ? Object.keys(summaryRes.value.data)[0] : null;
            const storeSummary = storeKey && summaryRes.value.data[storeKey] ? summaryRes.value.data[storeKey] : {};
            const items = storeSummary.items || [];
            const hoverData = hoverRes.status === 'fulfilled' ? hoverRes.value.data : {};
            const alertStatusData = alertStatusRes.status === 'fulfilled' ? alertStatusRes.value.data : {};

            return {
                store_id: store.store_id,
                store_name: store.name,
                location: store.city,
                lat: store.lat,
                lng: store.lon,
                alert: backendAlerts.find(a => a.store_id === store.store_id)?.message || null,
                summary: items.map(i => ({
                    product_name: i.sku,
                    quantity: i.quantity,
                    reorder_point: i.reorder_point
                })),
                hoverStats: {
                    distinct_skus: hoverData.distinct_skus || 0,
                    inventory_units: hoverData.inventory_units || 0,
                    forecast_units: hoverData.forecast_units || 0,
                    alerts: hoverData.alerts || 0,
                    lookahead_days: hoverData.lookahead_days || 7
                },
                alertStatus: {
                    reorderCount: alertStatusData.num_skus_to_reorder || 0,
                    stockoutCount: alertStatusData.num_skus_stockout_despite_reorder || 0,
                    hasAlert: alertStatusData.alert || false,
                }
            };
        });

        setData({
          metrics: {
            current_demand: backendDashboard.current_demand ?? 0,
            inventory_position: backendDashboard.inventory_position ?? 0,
            weeks_of_supply: backendDashboard.weeks_of_supply ?? 0,
            stockouts,
            skus_below_threshold: skusBelow,
            inventory_turnover: backendDashboard.inventory_turnover ?? 0,
            timestamp: backendDashboard.timestamp ?? new Date().toISOString()
          },
          alerts: backendAlerts.map((a, i) => ({
            id: a.id || `alert-${i}`,
            severity: a.severity || "Low",
            message: a.message,
            type: a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : "General",
            store_id: a.store_id
          })),
          locations
        });

      } catch (err) {
        console.error("❌ Failed to fetch dashboard data:", err);
        if (err.response?.status === 401) {
            navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0f172a] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (!hasPermission("GET:/dashboard")) {
      return (
          <div className="min-h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center text-white">
              <h1 className="text-3xl font-bold">Access Denied</h1>
              <p className="mt-2">You do not have permission to view this page.</p>
              <button onClick={() => navigate("/")} className="mt-4 bg-blue-500 px-4 py-2 rounded">
                  Go to Login
              </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen w-full bg-[#0f172a] flex transition-all duration-300">
      <MapStyles /> {/* Inject the CSS for our markers */}
      {/* Sidebar */}
      <div className={`bg-[#152438] border-r border-[#1f2a46] shadow-lg transition-all duration-300 ${sidebarOpen ? "w-60 p-6" : "w-0 overflow-hidden"} flex flex-col space-y-6`}>
        {sidebarOpen && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">Control</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-white">
                <FiX size={24} />
              </button>
            </div>
            <nav className="space-y-4">
              {hasPermission("POST:/store_upload") && (
                <button onClick={() => navigate("/file-upload")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
                  <FiUpload className="mr-3" /> File Upload
                </button>
              )}
              {hasPermission("GET:/admin/users") && (
                <button onClick={() => navigate("/adminprivileges")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
                  <FiUpload className="mr-3" /> Manage User Access
                </button>
              )}
              {hasPermission("GET:/dashboard") && (
                 <button className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
                    <FiBarChart2 className="mr-3" /> Reports
                </button>
              )}
               {hasPermission("POST:/config/apply-formula") && (
                <button onClick={() => navigate("/Config")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
                  <FiShoppingBag className="mr-3" /> Configuration Page
                </button>
              )}
              <button onClick={() => navigate("/")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
                <FiLogOut className="mr-3" /> Logout
              </button>
            </nav>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="p-4">
          <div className="bg-[#152438] rounded-2xl border border-[#1f2a46] shadow-xl text-white font-sans space-y-8 p-8">
            
            {/* Header */}
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Control Tower Dashboard</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Last updated: {new Date(data.metrics.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={() => window.location.reload()} className="p-2 rounded-md hover:bg-[#1f2a46] transition">
                  <FiRefreshCw size={20} />
                </button>
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-[#1f2a46] transition">
                  <FiMenu size={24} />
                </button>
              </div>
            </header>

            {/* Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-[#1f2a46] rounded-lg p-3 shadow-inner border border-white/20 h-[100px] flex flex-col justify-center">
                <p className="text-xs font-medium text-blue-200">Current Demand</p>
                <p className="text-2xl font-bold tracking-tight leading-tight">
                  {data.metrics.current_demand.toLocaleString()}
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-[#1f2a46] rounded-lg p-3 shadow-inner border border-white/20 h-[100px] flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-blue-200">Inventory</p>
                  <p className="text-2xl font-bold tracking-tight leading-tight">
                    {data.metrics.inventory_position.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#24304b] px-2 py-1 rounded-md border border-[#2e3b5c] text-sm font-semibold">
                  {data.metrics.weeks_of_supply}
                </div>
              </motion.div>

                        
              {/* Alerts Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-[#1f2a46] rounded-xl p-4 shadow-inner space-y-3 border border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-md font-medium text-blue-200">Alerts</p>
                  <span className="text-xs bg-red-500/20 px-2 py-1 rounded text-red-300">{data.alerts.length} total</span>
                </div>
                {/* MODIFIED: Added max-h-32 and overflow-y-auto to make the container scrollable */}
                <div className="space-y-2 max-h-32 overflow-y-auto pr-3">
                  {data.alerts.map((alert) => {
                    const severityColors = {
                      High: "bg-[#743939] text-red-300",
                      Medium: "bg-[#705936] text-yellow-300",
                      Low: "bg-[#375a3f] text-green-300"
                    };
                    return (
                      <motion.div key={alert.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`p-3 rounded-md flex justify-between items-center border border-white/10 ${severityColors[alert.severity] || "bg-[#3a3a3a]"}`}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{alert.message}</span>
                          <span className="text-xs mt-1 opacity-70">Type: {alert.type}</span>
                        </div>
                        <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded">{alert.severity}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
 <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-[#1f2a46] rounded-xl p-5 shadow-inner border border-white/20 md:col-span-3"
    >
      <div className="flex justify-between items-center mb-3">
        <p className="font-medium text-blue-200">Network View</p>
        <div className="text-xs flex space-x-2">
          <span className="bg-green-500/20 px-2 py-1 rounded text-green-300">
            {data.metrics.stockouts} Stockouts
          </span>
          <span className="bg-yellow-500/20 px-2 py-1 rounded text-yellow-300">
            {data.metrics.skus_below_threshold} Below Threshold
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          className={`rounded-lg overflow-hidden relative transition-all duration-300 ${
            mapSize === "default" ? "h-[300px] md:h-[400px]" : "h-[600px]"
          }`}
        >
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Reset Button inside Map */}
            <ResetMapViewButton center={[20, 0]} zoom={2} />

            <FitBounds locations={data.locations} />

            {data.locations
              .filter((loc) => loc.lat != null && loc.lng != null)
              .map((loc, i) => (
                <AutoPanMarker
                  key={loc.store_id || i}
                  position={[loc.lat, loc.lng]}
                  icon={createAlertIcon(loc)}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -42]}
                    opacity={1}
                    permanent={false}
                  >
                    <div
                      className="text-sm space-y-2 text-left"
                      style={{ minWidth: "250px", maxWidth: "300px" }}
                    >
                      <div>
                        <strong>{loc.store_name}</strong>
                        <br />
                        <span className="text-gray-500">{loc.location}</span>
                      </div>

                      {loc.alert && (
                        <div className="text-red-500 font-bold">
                          🚨 Alert: {loc.alert}
                        </div>
                      )}

                      {loc.alertStatus && (
                        <div className="mt-2 text-gray-800 bg-amber-100 p-2 rounded-md shadow-inner border border-amber-300/40">
                          <p className="text-amber-800 font-semibold mb-1">
                            Reorder Status:
                          </p>
                          <ul className="ml-4 list-disc text-sm space-y-1">
                            <li>
                              📦 SKUs to Reorder:{" "}
                              <strong>
                                {loc.alertStatus.reorderCount}
                              </strong>
                            </li>
                            <li
                              className={
                                loc.alertStatus.hasAlert
                                  ? "text-red-600 font-bold"
                                  : ""
                              }
                            >
                              ⚠️ Stockout despite Reorder:{" "}
                              <strong>
                                {loc.alertStatus.stockoutCount}
                              </strong>
                            </li>
                          </ul>
                        </div>
                      )}

                      {loc.hoverStats && (
                        <div className="mt-3 bg-blue-100 text-gray-800 p-2 rounded-md shadow-inner border border-blue-300/40">
                          <p className="text-blue-800 font-semibold mb-1">
                            Quick Stats (
                            {loc.hoverStats.lookahead_days}
                            -Day):
                          </p>
                          <ul className="ml-4 list-disc text-sm space-y-1">
                            <li>
                              📦 <strong>{loc.hoverStats.distinct_skus}</strong>{" "}
                              SKUs
                            </li>
                            <li>
                              📊{" "}
                              <strong>{loc.hoverStats.inventory_units}</strong>{" "}
                              Inventory Units
                            </li>
                            <li>
                              📈{" "}
                              <strong>{loc.hoverStats.forecast_units}</strong>{" "}
                              Forecast Units
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </AutoPanMarker>
              ))}
          </MapContainer>
        </div>
      </div>
    </motion.div>

            </section>

            {/* START: New Availability Rate Chart Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="bg-[#1f2a46] rounded-xl p-5 shadow-inner border border-white/20"
            >
              <h3 className="text-lg font-medium text-blue-200">SKU Availability Rate (Historical)</h3>
              <p className="text-sm text-gray-400 mb-4">
                Percentage of eligible SKUs not out of stock – tracked week by week.
              </p>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={availabilityData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3a56" />
                    <XAxis
                      dataKey="week_start"
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      domain={[dataMin => (Math.floor(dataMin / 5) * 5), 100]}
                      tickFormatter={(tick) => `${tick}%`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ fontWeight: 'bold' }}
                      formatter={(value, name, props) => [`${props.payload.availability_rate.toFixed(2)}%`, "Availability Rate"]}
                      labelFormatter={(label) => `Week of: ${new Date(label + 'T00:00:00').toLocaleDateString()}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px' }}/>
                    <Line
                      type="monotone"
                      dataKey="availability_rate"
                      name="Availability Rate"
                      stroke="#38bdf8" // sky-400
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      dot={{ stroke: '#0ea5e9', strokeWidth: 1, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
            {/* END: New Availability Rate Chart Section */}

            {/* Quick Links */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {hasPermission("GET:/dashboard") && (
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#1f2a46] rounded-xl p-4 flex items-center justify-center space-x-3 cursor-pointer hover:bg-[#2a3a56] transition border border-white/20"
                        onClick={() => alert(`Rebalancer feature coming soon!`)}
                    >
                        <FiDatabase />
                        <span className="text-lg font-medium">Rebalancer</span>
                    </motion.div>
                )}
                {hasPermission("GET:/forecast/store/<param>") && (
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#1f2a46] rounded-xl p-4 flex items-center justify-center space-x-3 cursor-pointer hover:bg-[#2a3a56] transition border border-white/20"
                        onClick={() => alert(`Forecast feature coming soon!`)}
                    >
                        <FiTrendingUp />
                        <span className="text-lg font-medium">Forecast</span>
                    </motion.div>
                )}
                {hasPermission("POST:/config/apply-formula") && (
                     <motion.div
                        key="Configuration Page"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#1f2a46] rounded-xl p-4 flex items-center justify-center space-x-3 cursor-pointer hover:bg-[#2a3a56] transition border border-white/20"
                        onClick={() => navigate("/config")}
                    >
                        <FiSettings />
                        <span className="text-lg font-medium">Configuration Page</span>
                    </motion.div>
                )}
            </section>

            {/* Inventory Health */}
            <section className="bg-[#1f2a46] rounded-lg p-4 flex flex-col md:flex-row items-center justify-between border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Inventory Health</p>
                  <p className="text-sm text-gray-400">Turnover: {data.metrics.inventory_turnover}</p>
                </div>
              </div>
              <div className="w-full md:w-64 mt-4 md:mt-0">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Optimal</span>
                  <span>{data.metrics.skus_below_threshold} issues</span>
                </div>
                <div className="w-full h-2 bg-[#293956] rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded" style={{ width: `${100 - (data.metrics.skus_below_threshold * 5)}%` }}></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;