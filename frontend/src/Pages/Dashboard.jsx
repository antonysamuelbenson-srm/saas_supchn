import React, { useState, useEffect } from "react";
import {
  FiMenu,
  FiX,
  FiDatabase,
  FiTrendingUp,
  FiSettings,
  FiUpload,
  FiBarChart2,
  FiLogOut,
  FiRefreshCw
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Simulate data fetching from your backend models
  useEffect(() => {
    const fetchData = () => {
      // Mock data matching your Python models
      const mockData = {
        metrics: {
          current_demand: 14250,        // From DashboardMetrics.current_demand
          inventory_position: 87500,    // From DashboardMetrics.inventory_position
          weeks_of_supply: 5.8,         // From DashboardMetrics.weeks_of_supply
          stockouts: 7,                 // From Alert model (type="Stockout")
          skus_below_threshold: 12,     // From Alert model (type="BelowThreshold")
          inventory_turnover: 3.4,      // From DashboardMetrics.inventory_turnover
          timestamp: new Date().toISOString()
        },
        alerts: [
          { id: '1', severity: 'High', message: 'Stockout: SKU-4502 in WH-3', type: 'Stockout' },
          { id: '2', severity: 'Medium', message: 'Below threshold: SKU-7821 in WH-1', type: 'BelowThreshold' },
          { id: '3', severity: 'High', message: 'Stockout: SKU-9015 in WH-2', type: 'Stockout' },
          { id: '4', severity: 'Medium', message: 'Reorder needed: SKU-3367 in WH-4', type: 'Reorder' }
        ]
      };

      setData(mockData);
      setLoading(false);
    };

    // Simulate network delay
    const timer = setTimeout(fetchData, 800);
    return () => clearTimeout(timer);
  }, []);

  // Group alerts by severity
  const alertCounts = data.alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, { High: 0, Medium: 0, Low: 0 });

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
      <div
        className={`bg-[#152438] border-r border-[#1f2a46] shadow-lg transition-all duration-300 ${
          sidebarOpen ? "w-60 p-6" : "w-0 overflow-hidden"
        } flex flex-col space-y-6`}
      >
        {sidebarOpen && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">Control</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white"
              >
                <FiX size={24} />
              </button>
            </div>
            <nav className="space-y-4">
              <button 
                onClick={() => navigate("/file-upload")} 
                className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full"
              >
                <FiUpload className="mr-3" /> File Upload
              </button>
              <button 
                className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full"
              >
                <FiBarChart2 className="mr-3" /> Reports
              </button>
              <button 
                onClick={() => navigate("/")} 
                className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full"
              >
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
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 rounded-md hover:bg-[#1f2a46] transition"
                >
                  <FiRefreshCw size={20} />
                </button>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md hover:bg-[#1f2a46] transition"
                >
                  <FiMenu size={24} />
                </button>
              </div>
            </header>

            {/* Stats Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Current Demand */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-[#1f2a46] rounded-lg p-3 shadow-inner border border-white/20 h-[100px] flex flex-col justify-center"
  >
    <p className="text-xs font-medium text-blue-200">Current Demand</p>
    <p className="text-2xl font-bold tracking-tight leading-tight">
      {data.metrics.current_demand.toLocaleString()}
    </p>
  </motion.div>

  {/* Inventory Position */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-[#1f2a46] rounded-lg p-3 shadow-inner border border-white/20 h-[100px] flex justify-between items-center"
  >
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

              {/* Alerts */}
              {/* Alerts - Detailed List */}
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="bg-[#1f2a46] rounded-xl p-4 shadow-inner space-y-3 border border-white/20"
>
  <div className="flex justify-between items-center mb-2">
    <p className="text-md font-medium text-blue-200">Alerts</p>
    <span className="text-xs bg-red-500/20 px-2 py-1 rounded text-red-300">
      {data.alerts.length} total
    </span>
  </div>

  {/* Render each alert individually */}
  <div className="space-y-2">
    {data.alerts.map((alert) => {
      const severityColors = {
        High: "bg-[#743939] text-red-300",
        Medium: "bg-[#705936] text-yellow-300",
        Low: "bg-[#375a3f] text-green-300"
      };
      return (
        <motion.div
          key={alert.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-3 rounded-md flex justify-between items-center border border-white/10 ${severityColors[alert.severity] || "bg-[#3a3a3a]"}`}
        >
          <div className="flex flex-col">
            <span className="font-semibold">{alert.message}</span>
            <span className="text-xs mt-1 opacity-70">Type: {alert.type}</span>
          </div>
          <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded">
            {alert.severity}
          </span>
        </motion.div>
      );
    })}
  </div>
</motion.div>

            </section>

            {/* Network View */}
            <section className="bg-[#1f2a46] rounded-xl p-5 shadow-inner border border-white/20">
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
              <div className="h-36 md:h-44 bg-[#15243a] rounded-lg flex items-center justify-center relative overflow-hidden">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 300 100"
                  className="opacity-70"
                >
                  {[40, 80, 120, 160, 200, 240].map((x, i) => {
                    const isProblem = i % 3 === 0; // Mark some nodes as problematic
                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={50 + (i % 2 === 0 ? 0 : i % 3 === 0 ? 20 : -20)}
                          r="8"
                          fill={isProblem ? "#f97316" : "#1e2a46"}
                          stroke={isProblem ? "#f97316" : "#5b7db9"}
                          strokeWidth="3"
                        />
                        {isProblem && (
                          <text
                            x={x}
                            y={50 + (i % 2 === 0 ? 0 : i % 3 === 0 ? 20 : -20) + 20}
                            textAnchor="middle"
                            fill="#f97316"
                            fontSize="10"
                          >
                            {i % 2 === 0 ? "Low" : "Out"}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {[
                    [40, 50],
                    [80, 40],
                    [120, 70],
                    [160, 40],
                    [200, 65],
                    [240, 55]
                  ].reduce((acc, point, i, arr) => {
                    if (i < arr.length - 1) {
                      acc.push(
                        <line
                          key={i}
                          x1={point[0]}
                          y1={point[1]}
                          x2={arr[i + 1][0]}
                          y2={arr[i + 1][1]}
                          stroke="#5b7db9"
                          strokeWidth="2"
                        />
                      );
                    }
                    return acc;
                  }, [])}
                </svg>
              </div>
            </section>

            {/* Action Buttons */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <FiDatabase />, label: "Rebalancer" },
                { icon: <FiTrendingUp />, label: "Forecast" },
                { icon: <FiSettings />, label: "Settings" }
              ].map(({ icon, label }) => (
                <motion.div
                  key={label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#1f2a46] rounded-xl p-4 flex items-center justify-center space-x-3 cursor-pointer hover:bg-[#2a3a56] transition border border-white/20"
                >
                  {icon}
                  <span className="text-lg font-medium">{label}</span>
                </motion.div>
              ))}
            </section>

            {/* Inventory Health */}
            <section className="bg-[#1f2a46] rounded-lg p-4 flex flex-col md:flex-row items-center justify-between border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded" 
                    style={{ width: `${100 - (data.metrics.skus_below_threshold * 5)}%` }}
                  ></div>
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

// import React, { useState, useEffect } from "react";
// import {
//   FiMenu,
//   FiX,
//   FiDatabase,
//   FiTrendingUp,
//   FiSettings,
//   FiUpload,
//   FiBarChart2,
//   FiLogOut,
//   FiRefreshCw
// } from "react-icons/fi";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";

// function Dashboard() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [data, setData] = useState({
//     metrics: {
//       current_demand: 0,
//       inventory_position: 0,
//       weeks_of_supply: 0,
//       stockouts: 0,
//       skus_below_threshold: 0,
//       inventory_turnover: 0,
//       timestamp: new Date().toISOString()
//     },
//     alerts: []
//   });
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [dashboardRes, alertsRes] = await Promise.all([
//           fetch("http://127.0.0.1:5000/dashboard"),
//           fetch("http://127.0.0.1:5000/alerts")
//         ]);

//         if (!dashboardRes.ok || !alertsRes.ok) throw new Error("Fetch error");

//         const dashboardData = await dashboardRes.json();
//         const alertsData = await alertsRes.json();

//         setData({
//           metrics: {
//             ...dashboardData,
//             timestamp: new Date().toISOString()
//           },
//           alerts: alertsData
//         });
//       } catch (err) {
//         console.error("Error fetching data:", err);
//         alert("Failed to load dashboard data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const alertCounts = data.alerts.reduce((acc, alert) => {
//     acc[alert.severity] = (acc[alert.severity] || 0) + 1;
//     return acc;
//   }, { High: 0, Medium: 0, Low: 0 });

//   if (loading) {
//     return (
//       <div className="min-h-screen w-full bg-[#0f172a] flex items-center justify-center">
//         <div className="flex items-center space-x-3 text-white">
//           <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//           </svg>
//           <span>Loading dashboard data...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen w-full bg-[#0f172a] flex transition-all duration-300">
//       {/* Sidebar */}
//       <div
//         className={`bg-[#152438] border-r border-[#1f2a46] shadow-lg transition-all duration-300 ${
//           sidebarOpen ? "w-60 p-6" : "w-0 overflow-hidden"
//         } flex flex-col space-y-6`}
//       >
//         {sidebarOpen && (
//           <>
//             <div className="flex items-center justify-between">
//               <h2 className="text-white text-xl font-bold">Control</h2>
//               <button
//                 onClick={() => setSidebarOpen(false)}
//                 className="text-white"
//               >
//                 <FiX size={24} />
//               </button>
//             </div>
//             <nav className="space-y-4">
//               <button 
//                 onClick={() => navigate("/file-upload")} 
//                 className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full"
//               >
//                 <FiUpload className="mr-3" /> File Upload
//               </button>
//               <button 
//                 className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full"
//               >
//                 <FiBarChart2 className="mr-3" /> Reports
//               </button>
//               <button 
//                 onClick={() => navigate("/")} 
//                 className="flex items-center text-white hover:bg-[#1f2a46] p-2 rounded-md transition w-full"
//               >
//                 <FiLogOut className="mr-3" /> Logout
//               </button>
//             </nav>
//           </>
//         )}
//       </div>

//       {/* Main Content */}
//       <div className="flex-1">
//         <div className="p-4">
//           <div className="bg-[#152438] rounded-2xl border border-[#1f2a46] shadow-xl text-white font-sans space-y-8 p-8">
//             {/* Header */}
//             <header className="flex justify-between items-center">
//               <div>
//                 <h1 className="text-3xl font-bold">Control Tower Dashboard</h1>
//                 <p className="text-sm text-gray-400 mt-1">
//                   Last updated: {new Date(data.metrics.timestamp).toLocaleString()}
//                 </p>
//               </div>
//               <div className="flex items-center space-x-3">
//                 <button
//                   onClick={() => window.location.reload()}
//                   className="p-2 rounded-md hover:bg-[#1f2a46] transition"
//                 >
//                   <FiRefreshCw size={20} />
//                 </button>
//                 <button
//                   onClick={() => setSidebarOpen(true)}
//                   className="p-2 rounded-md hover:bg-[#1f2a46] transition"
//                 >
//                   <FiMenu size={24} />
//                 </button>
//               </div>
//             </header>

//             {/* Stats */}
//             <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
//                 className="bg-[#1f2a46] rounded-xl p-6 shadow-inner border border-white/20">
//                 <p className="text-md font-medium mb-1 text-blue-200">Current Demand</p>
//                 <p className="text-4xl font-extrabold">{data.metrics.current_demand.toLocaleString()}</p>
//               </motion.div>

//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
//                 className="bg-[#1f2a46] rounded-xl p-6 shadow-inner flex justify-between items-center border border-white/20">
//                 <div>
//                   <p className="text-md font-medium mb-1 text-blue-200">Inventory</p>
//                   <p className="text-4xl font-extrabold">{data.metrics.inventory_position.toLocaleString()}</p>
//                 </div>
//                 <div className="bg-[#24304b] px-3 py-1 rounded-md border border-[#2e3b5c] text-xl font-semibold">
//                   {data.metrics.weeks_of_supply}
//                 </div>
//               </motion.div>

//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
//                 className="bg-[#1f2a46] rounded-xl p-4 shadow-inner space-y-3 border border-white/20">
//                 <div className="flex justify-between items-center">
//                   <p className="text-md font-medium text-blue-200">Alerts</p>
//                   <span className="text-xs bg-red-500/20 px-2 py-1 rounded text-red-300">{data.alerts.length} total</span>
//                 </div>
//                 <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
//                   onClick={() => alert(data.alerts.filter(a => a.severity === 'High').map(a => `• ${a.message}`).join('\n') || 'No high severity alerts')}
//                   className="cursor-pointer flex items-center justify-between bg-[#743939] rounded-md py-2 px-4 hover:bg-[#8a4646] transition">
//                   <div className="flex items-center">
//                     <span className="mr-3 text-xl">⚠️</span>
//                     <span className="font-medium">High severity</span>
//                   </div>
//                   <span className="font-bold">{alertCounts.High}</span>
//                 </motion.div>
//                 <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
//                   onClick={() => alert(data.alerts.filter(a => a.severity === 'Medium').map(a => `• ${a.message}`).join('\n') || 'No medium severity alerts')}
//                   className="cursor-pointer flex items-center justify-between bg-[#705936] rounded-md py-2 px-4 hover:bg-[#8a7044] transition">
//                   <div className="flex items-center">
//                     <span className="mr-3 text-xl">⚠️</span>
//                     <span className="font-medium">Medium severity</span>
//                   </div>
//                   <span className="font-bold">{alertCounts.Medium}</span>
//                 </motion.div>
//               </motion.div>
//             </section>

//             {/* Network view */}
//             <section className="bg-[#1f2a46] rounded-xl p-5 shadow-inner border border-white/20">
//               <div className="flex justify-between mb-3">
//                 <p className="font-medium text-blue-200">Network View</p>
//                 <div className="text-xs flex space-x-2">
//                   <span className="bg-green-500/20 px-2 py-1 rounded text-green-300">{data.metrics.stockouts} Stockouts</span>
//                   <span className="bg-yellow-500/20 px-2 py-1 rounded text-yellow-300">{data.metrics.skus_below_threshold} Below Threshold</span>
//                 </div>
//               </div>
//               <div className="h-36 md:h-44 bg-[#15243a] rounded-lg flex items-center justify-center relative overflow-hidden">
//                 <svg width="100%" height="100%" viewBox="0 0 300 100" className="opacity-70">
//                   {[40, 80, 120, 160, 200, 240].map((x, i) => {
//                     const isProblem = i % 3 === 0;
//                     return (
//                       <g key={i}>
//                         <circle cx={x} cy={50 + (i % 2 === 0 ? 0 : i % 3 === 0 ? 20 : -20)} r="8"
//                           fill={isProblem ? "#f97316" : "#1e2a46"}
//                           stroke={isProblem ? "#f97316" : "#5b7db9"}
//                           strokeWidth="3" />
//                         {isProblem && (
//                           <text x={x} y={50 + (i % 2 === 0 ? 0 : i % 3 === 0 ? 20 : -20) + 20} textAnchor="middle"
//                             fill="#f97316" fontSize="10">{i % 2 === 0 ? "Low" : "Out"}</text>
//                         )}
//                       </g>
//                     )
//                   })}
//                   {[[40, 50], [80, 40], [120, 70], [160, 40], [200, 65], [240, 55]].reduce((acc, point, i, arr) => {
//                     if (i < arr.length - 1) {
//                       acc.push(<line key={i} x1={point[0]} y1={point[1]} x2={arr[i + 1][0]} y2={arr[i + 1][1]}
//                         stroke="#5b7db9" strokeWidth="2" />);
//                     }
//                     return acc;
//                   }, [])}
//                 </svg>
//               </div>
//             </section>

//             {/* Action buttons */}
//             <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               {[{ icon: <FiDatabase />, label: "Rebalancer" },
//                 { icon: <FiTrendingUp />, label: "Forecast" },
//                 { icon: <FiSettings />, label: "Settings" }]
//                 .map(({ icon, label }) => (
//                   <motion.div key={label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
//                     className="bg-[#1f2a46] rounded-xl p-4 flex items-center justify-center space-x-3 cursor-pointer hover:bg-[#2a3a56] transition border border-white/20">
//                     {icon}
//                     <span className="text-lg font-medium">{label}</span>
//                   </motion.div>
//               ))}
//             </section>

//             {/* Inventory health */}
//             <section className="bg-[#1f2a46] rounded-lg p-4 flex flex-col md:flex-row items-center justify-between border border-white/20">
//               <div className="flex items-center space-x-3">
//                 <div className="text-green-400">
//                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
//                     viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
//                     strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
//                     <polyline points="22 4 12 14.01 9 11.01"></polyline>
//                   </svg>
//                 </div>
//                 <div>
//                   <p className="font-medium">Inventory Health</p>
//                   <p className="text-sm text-gray-400">Turnover: {data.metrics.inventory_turnover}</p>
//                 </div>
//               </div>
//               <div className="w-full md:w-64 mt-4 md:mt-0">
//                 <div className="flex justify-between text-xs text-gray-400 mb-1">
//                   <span>Optimal</span>
//                   <span>{data.metrics.skus_below_threshold} issues</span>
//                 </div>
//                 <div className="w-full h-2 bg-[#293956] rounded overflow-hidden">
//                   <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded"
//                     style={{ width: `${100 - (data.metrics.skus_below_threshold * 5)}%` }}>
//                   </div>
//                 </div>
//               </div>
//             </section>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;
