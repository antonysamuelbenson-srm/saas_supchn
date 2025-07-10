import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiMenu,
  FiX,
  FiDatabase,
  FiTrendingUp,
  FiSettings,
  FiUpload,
  FiBarChart2,
  FiLogOut,
  FiRefreshCw,
  FiShoppingBag
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";

const FitBounds = ({ locations }) => {
  const map = useMap();

  React.useEffect(() => {
    if (!locations || locations.length === 0) return;

    const bounds = L.latLngBounds(
      locations.map((loc) => [loc.lat, loc.lng])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [locations, map]);

  return null;
};


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/store/summary", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const summary = res.data; // already an array of stores
      console.log("📦 Backend summary data:", summary);

      let stockouts = 0;
      let skusBelow = 0;
      const alerts = [];

      // Optional: Compute alerts here if you want to keep it on frontend
      summary.forEach((store) => {
        const storeName = store.store_name;

        store.summary?.forEach((item) => {
          const { quantity, reorder_point } = item;

          if (quantity === 0) {
            stockouts++;
            alerts.push({
              id: `${storeName}-stockout-${item.sku}`,
              severity: "High",
              message: `Stockout for ${item.product_name} at ${storeName}`,
              type: "Stockout"
            });
          } else if (reorder_point && quantity < reorder_point) {
            skusBelow++;
            alerts.push({
              id: `${storeName}-low-${item.sku}`,
              severity: "Medium",
              message: `Low stock for ${item.product_name} at ${storeName}`,
              type: "Below Threshold"
            });
          }
        });
      });

      setData({
        metrics: {
          current_demand: 14250,
          inventory_position: 87500,
          weeks_of_supply: 5.8,
          stockouts,
          skus_below_threshold: skusBelow,
          inventory_turnover: 3.4,
          timestamp: new Date().toISOString()
        },
        alerts,
        locations: summary // use directly
      });

      setLoading(false);
    } catch (err) {
      console.error("❌ Failed to fetch data:", err);
    }
  };

  fetchDashboardData();
}, []);



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

  return (
    <div className="min-h-screen w-full bg-[#0f172a] flex transition-all duration-300">
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
              <button onClick={() => navigate("/file-upload")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
                <FiUpload className="mr-3" /> File Upload
              </button>
              <button className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
                <FiBarChart2 className="mr-3" /> Reports
              </button>
              <button onClick={() => navigate("/add-store")} className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full">
                <FiShoppingBag className="mr-3" /> Add Store
              </button>
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
                <p className="text-sm text-gray-400 mt-1">Last updated: {new Date(data.metrics.timestamp).toLocaleString()}</p>
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
                <p className="text-2xl font-bold tracking-tight leading-tight">{data.metrics.current_demand.toLocaleString()}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-[#1f2a46] rounded-lg p-3 shadow-inner border border-white/20 h-[100px] flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-blue-200">Inventory</p>
                  <p className="text-2xl font-bold tracking-tight leading-tight">{data.metrics.inventory_position.toLocaleString()}</p>
                </div>
                <div className="bg-[#24304b] px-2 py-1 rounded-md border border-[#2e3b5c] text-sm font-semibold">{data.metrics.weeks_of_supply}</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-[#1f2a46] rounded-xl p-4 shadow-inner space-y-3 border border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-md font-medium text-blue-200">Alerts</p>
                  <span className="text-xs bg-red-500/20 px-2 py-1 rounded text-red-300">{data.alerts.length} total</span>
                </div>
                <div className="space-y-2">
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
                className="bg-[#1f2a46] rounded-xl p-5 shadow-inner border border-white/20 md:col-span-2"
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

                <div className="h-[300px] md:h-[400px] w-full rounded-lg overflow-hidden relative">
                  <MapContainer
                    center={[20, 0]} // fallback center
                    zoom={2}         // fallback zoom
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* FitBounds helper */}
                    <FitBounds locations={data.locations} />

                    
                    {data.locations
                      .filter((loc) => loc.lat != null && loc.lng != null) // 🚨 skip invalid
                      .map((loc, i) => (
                        <Marker
                          key={i}
                          position={[loc.lat, loc.lng]}
                          eventHandlers={{
                            mouseover: (e) => e.target.openPopup(),
                            mouseout: (e) => e.target.closePopup(),
                          }}
                        >
                          <Popup>
                            <div className="text-sm space-y-2">
                              <div>
                                <strong>{loc.store_name}</strong><br />
                                <span className="text-gray-500">{loc.location}</span>
                              </div>

                              {loc.alert && (
                                <div className="text-red-500">
                                  🚨 Alert: {loc.alert}
                                </div>
                              )}

                              <div>
                                <p className="font-semibold">Summary:</p>
                                <ul className="list-disc ml-4">
                                  {loc.summary && loc.summary.length > 0 ? (
                                    loc.summary.map((item, j) => (
                                      <li key={j}>
                                        <span className="font-medium">{item.product_name}</span>: {item.quantity} pcs
                                        {item.reorder_point !== undefined && (
                                          <span className="text-xs text-gray-400">
                                            {" "}
                                            (Reorder Point: {item.reorder_point})
                                          </span>
                                        )}
                                      </li>
                                    ))
                                  ) : (
                                    <li>No inventory data</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </Popup>

                          <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                            {loc.store_name}
                          </Tooltip>
                        </Marker>
                    ))}

                    
                  </MapContainer>

                </div>
              </motion.div>
            </section>

            {/* Action Buttons */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[{ icon: <FiDatabase />, label: "Rebalancer" }, { icon: <FiTrendingUp />, label: "Forecast" }, { icon: <FiSettings />, label: "Settings" }].map(({ icon, label }) => (
                <motion.div key={label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#1f2a46] rounded-xl p-4 flex items-center justify-center space-x-3 cursor-pointer hover:bg-[#2a3a56] transition border border-white/20">
                  {icon}
                  <span className="text-lg font-medium">{label}</span>
                </motion.div>
              ))}
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
