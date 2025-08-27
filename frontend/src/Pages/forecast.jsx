import React, { useState } from 'react';
import { FiCalendar, FiBarChart2, FiDownload, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';

// --- MOCK DATA (Replace with your actual API data) ---
const mockData = [
    // Historical Data
    { date: '2025-07-07', historical: 14500 },
    { date: '2025-07-14', historical: 15200 },
    { date: '2025-07-21', historical: 14900 },
    { date: '2025-07-28', historical: 16100 },
    { date: '2025-08-04', historical: 15800 },
    { date: '2025-08-11', historical: 16500 },
    { date: '2025-08-18', historical: 16300 },
    { date: '2025-08-25', historical: 17000 },
    // Forecasted Data
    { date: '2025-09-01', forecast: 17200, confidence: [16700, 17700] },
    { date: '2025-09-08', forecast: 17500, confidence: [17000, 18000] },
    { date: '2025-09-15', forecast: 17800, confidence: [17200, 18400] },
    { date: '2025-09-22', forecast: 18100, confidence: [17500, 18700] },
];

const ForecastPage = () => {

    const Card = ({ title, value, icon, change }) => (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
                <div className="p-3 bg-slate-700 rounded-md mr-4">
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-slate-400">{title}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                </div>
            </div>
            {change && <p className="text-sm text-green-400 mt-2">{change}</p>}
        </div>
    );

    return (
        <div className="p-8 bg-slate-900 text-slate-300 min-h-screen font-sans">
            {/* 1. Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Sales & Demand Forecast</h1>
                <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    <FiTrendingUp className="mr-2" />
                    Generate Forecast
                </button>
            </div>

            {/* 2. Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-6 bg-slate-800 rounded-lg">
                <div>
                    <label className="text-sm font-semibold mb-2 block">Date Range</label>
                    <input type="text" value="2025-09-01 to 2025-12-31" className="w-full bg-slate-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                 <div>
                    <label className="text-sm font-semibold mb-2 block">Granularity</label>
                    <select className="w-full bg-slate-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Daily</option>
                        <option selected>Weekly</option>
                        <option>Monthly</option>
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-semibold mb-2 block">Category</label>
                    <select className="w-full bg-slate-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>All Categories</option>
                        {/* Add other categories */}
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-semibold mb-2 block">SKU</label>
                    <select className="w-full bg-slate-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>All SKUs</option>
                         {/* Add other skus */}
                    </select>
                </div>
            </div>

            {/* 3. Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card title="Forecasted Units" value="1,240,500" icon={<FiBarChart2 size={24} className="text-blue-400" />} />
                <Card title="Forecasted Revenue" value="$18.6M" icon={<FiTrendingUp size={24} className="text-green-400" />} change="+7.2% vs. previous period" />
                <Card title="Forecast Accuracy" value="94.5%" icon={<FiCheckCircle size={24} className="text-teal-400" />} />
            </div>

            {/* 4. Chart Visualization */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8 h-[500px]">
                 <h2 className="text-xl font-semibold mb-4 text-white">Forecast vs. Historical</h2>
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                        <Legend />
                        <Line type="monotone" dataKey="historical" stroke="#60a5fa" strokeWidth={2} name="Historical Sales" dot={false} />
                        <Line type="monotone" dataKey="forecast" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" name="Forecasted Sales" dot={false} />
                        <Area type="monotone" dataKey="confidence" stroke={false} fill="#34d399" fillOpacity={0.1} name="Confidence Interval" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* 5. Data Table & Adjustments */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Forecast Data</h2>
                    <button className="flex items-center bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 px-4 rounded-lg transition">
                        <FiDownload className="mr-2" />
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-600">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Historical</th>
                                <th className="p-3">Forecast</th>
                                <th className="p-3">Adjustment (%)</th>
                                <th className="p-3">Adjusted Forecast</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockData.filter(d => d.forecast).map((row, index) => (
                                <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="p-3">{row.date}</td>
                                    <td className="p-3 text-slate-400">--</td>
                                    <td className="p-3 text-green-400 font-medium">{row.forecast.toLocaleString()}</td>
                                    <td className="p-3 w-40">
                                        <input type="number" placeholder="e.g., 5 or -10" className="w-full bg-slate-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </td>
                                    <td className="p-3 font-bold text-white">{row.forecast.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ForecastPage;