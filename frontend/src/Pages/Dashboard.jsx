import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
    FiMenu, FiX, FiTrendingUp, FiSettings,
    FiUpload, FiBarChart2, FiLogOut, FiRefreshCw, FiShoppingBag,
    FiAlertTriangle, FiCheckCircle, FiInfo, FiBox, FiCalendar,
    FiCpu, FiSend, FiFilter, FiArrowRight, FiList // Added new icons
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Tooltip, useMap, Popup } from "react-leaflet"; // Added Popup
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import Chatbot from '../components/Chatbot';

const BASE_URL = "http://localhost:5500";

// --- Leaflet & Map Helper Components (Defined ONCE) ---

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// **MERGED**: Using the new MapStyles with all filter/wos/demand styles
const MapStyles = () => (
  <style>{`
    .custom-marker-container { position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .marker-svg { width: 100%; height: 100%; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3)); }
    
    .severity-high .marker-svg { fill: #ef4444; } /* red-500 */
    .severity-medium .marker-svg { fill: #f59e0b; } /* amber-500 */
    .severity-low .marker-svg { fill: #3b82f6; } /* blue-500 */
    .marker-count { position: absolute; top: 0px; left: 55%; background-color: white; color: #dc2626; font-weight: bold; font-size: 12px; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 1px solid #dc2626; z-index: 10; }
    
    .severity-critical .marker-svg { fill: #ef4444; }
    .severity-low .marker-svg { fill: #f59e0b; }
    .severity-adequate .marker-svg { fill: #10b981; }
    .severity-high .marker-svg { fill: #3b82f6; }
    .severity-all .marker-svg { fill: #6b7280; }
    .marker-count.wos { top: -2px; right: -2px; left: auto; font-size: 10px; width: 16px; height: 16px; }

    .demand-accelerating .marker-svg { fill: #10b981; }
    .demand-stable .marker-svg { fill: #3b82f6; }
    .demand-decelerating .marker-svg { fill: #f59e0b; }
    .marker-count.demand { top: -2px; right: -2px; left: auto; font-size: 10px; width: 16px; height: 16px; }

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

// **KEPT**: Original createAlertIcon
const createAlertIcon = (location) => {
  const { alertStatus } = location;
  const reorderCount = alertStatus?.reorderCount || 0;
  const stockoutCount = alertStatus?.stockoutCount || 0;
  const totalAlerts = reorderCount + stockoutCount;

  let severityClass = 'severity-low'; // Default blue
  if (alertStatus?.hasAlert) severityClass = 'severity-high'; // Red for stockout despite reorder
  else if (reorderCount > 0) severityClass = 'severity-medium'; // Amber for needs reorder

  return new L.DivIcon({
    className: `custom-marker-container ${severityClass}`,
    html: `
      ${totalAlerts > 0 ? `<div class="marker-count">${totalAlerts}</div>` : ''}
      <svg viewBox="0 0 24 24" class="marker-svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42]
  });
};

// **ADDED**: New icon function for Weeks of Supply
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

// **ADDED**: New icon function for Demand Trend
const createDemandTrendIcon = (store, selectedTrend) => {
  const { accelerating_count, stable_count, decelerating_count, total_skus } = store;
  let severityClass = 'demand-stable';
  let count = total_skus || 0;
  
  if (selectedTrend && selectedTrend !== 'all') {
    switch (selectedTrend) {
    case 'Accelerating': severityClass = 'demand-accelerating'; count = accelerating_count; break;
    case 'Stable': severityClass = 'demand-stable'; count = stable_count; break;
    case 'Decelerating': severityClass = 'demand-decelerating'; count = decelerating_count; break;
    default: severityClass = 'demand-stable'; count = total_skus;
    }
  } else {
    if (accelerating_count > 0) { severityClass = 'demand-accelerating'; count = accelerating_count; }
    else if (decelerating_count > 0) { severityClass = 'demand-decelerating'; count = decelerating_count; }
    else { severityClass = 'demand-stable'; count = stable_count || 0; }
  }
  
  return new L.DivIcon({
    className: `custom-marker-container ${severityClass}`,
    html: `<div class="marker-count demand">${count}</div><svg viewBox="0 0 24 24" class="marker-svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42]
  });
};

// **KEPT**: Original FitBounds
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

// **KEPT**: Original ResetMapViewButton
const ResetMapViewButton = ({ locations }) => {
    const map = useMap();
    const fitMapToBounds = () => {
        const validCoords = locations.filter(loc => loc.lat != null && loc.lng != null).map(loc => [loc.lat, loc.lng]);
        if (validCoords.length > 0) {
            const bounds = L.latLngBounds(validCoords);
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
    };
    return (
        <button
            onClick={fitMapToBounds}
            className="absolute top-3 right-3 z-[1000] bg-white text-slate-800 px-3 py-1.5 rounded-md shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Fit all nodes into view"
        >
            ⤢ Fit View
        </button>
    );
};

// **ADDED**: New MapFilterControl component
const MapFilterControl = ({ selectedCategory, onCategoryChange, storeCounts, filterType }) => {
  const categories = [
    { key: 'all', label: 'All Stores', bgColor: '#6b7280', icon: '🏪' },
    { key: 'Critical', label: 'Critical', bgColor: '#ef4444', icon: '🔴' },
    { key: 'Low', label: 'Low', bgColor: '#f59e0b', icon: '🟠' },
    { key: 'Adequate', label: 'Adequate', bgColor: '#10b981', icon: '🟢' },
    { key: 'High', label: 'High', bgColor: '#3b82f6', icon: '🔵' }
  ];

  const trendCategories = [
    { key: 'all', label: 'All Stores', bgColor: '#6b7280', icon: '🏪' },
    { key: 'Accelerating', label: 'Accelerating', bgColor: '#10b981', icon: '📈' },
    { key: 'Stable', label: 'Stable', bgColor: '#3b82f6', icon: '➡️' },
    { key: 'Decelerating', label: 'Decelerating', bgColor: '#f59e0b', icon: '📉' }
  ];

  const categoryList = filterType === 'demand' ? trendCategories : categories;
  const filterLabel = filterType === 'demand' ? 'Demand Trend' : 'Weeks of Supply';

  return (
    <div className="absolute top-3 left-3 z-[1000] map-filter-control">
    <div className="flex items-center space-x-2 mb-2"><FiFilter size={16} className="text-slate-600" /><span className="text-sm font-semibold text-slate-800">{filterLabel}</span></div>
    <div className="space-y-1">
    {categoryList.map(category => (<button key={category.key} onClick={() => onCategoryChange(category.key)} className={`filter-btn ${selectedCategory === category.key ? 'active' : ''}`} style={{ backgroundColor: selectedCategory === category.key ? category.bgColor : 'transparent', color: selectedKategor.key ? 'white' : category.bgColor, border: `1px solid ${category.bgColor}` }}>
    <div className="flex items-center"><span className="mr-2">{category.icon}</span><span>{category.label}</span></div><span className="text-xs opacity-80">{storeCounts[category.key] || 0}</span></button>
    ))}
    </div>
    </div>
  );
};

// **ADDED**: New StoreSummaryTooltip component
const StoreSummaryTooltip = ({ store, onCategoryClick, onViewAllSKUs }) => (
  <div className="text-sm space-y-3 p-3 w-full">
  <div className="border-b border-slate-200 pb-2">
  <div className="flex items-center justify-between gap-2"><strong className="text-lg truncate flex-shrink min-w-0">📍 Store {store.store_id}</strong><button onClick={onViewAllSKUs} className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap flex-shrink-0">View All SKUs <FiArrowRight className="ml-1" size={12} /></button></div>
  <span className="text-slate-500 text-sm truncate block">{store.store_name || `Store ${store.store_id}`}</span>
  </div>
  <div className="grid grid-cols-2 gap-3 text-xs">
  <div className="bg-slate-100 p-2 rounded"><div className="font-semibold truncate">📊 Total SKUs</div><div className="text-lg font-bold">{store.total_skus}</div></div>
  <div className="bg-slate-100 p-2 rounded"><div className="font-semibold truncate">📈 Avg Weeks</div><div className="text-lg font-bold">{store.avg_weeks_of_supply?.toFixed(2) || '0.00'}</div></div>
  </div>
  <div className="space-y-2">
  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">Categories:</span><span className="text-xs text-slate-500 whitespace-nowrap">Click to filter</span></div>
  <div className="flex flex-wrap gap-1">
  {store.critical_count > 0 && <div className="category-tag bg-red-100 text-red-800 border border-red-300 text-xs" onClick={() => onCategoryClick('Critical')}>🔴 Critical: {store.critical_count}</div>}
  {store.low_count > 0 && <div className="category-tag bg-orange-100 text-orange-800 border border-orange-300 text-xs" onClick={() => onCategoryClick('Low')}>🟠 Low: {store.low_count}</div>}
  {store.adequate_count > 0 && <div className="category-tag bg-green-100 text-green-800 border border-green-300 text-xs" onClick={() => onCategoryClick('Adequate')}>🟢 Adequate: {store.adequate_count}</div>}
  {store.high_count > 0 && <div className="category-tag bg-blue-100 text-blue-800 border border-blue-300 text-xs" onClick={() => onCategoryClick('High')}>🔵 High: {store.high_count}</div>}
  </div>
  </div>
  </div>
);

// **ADDED**: New DemandTrendTooltip component
const DemandTrendTooltip = ({ store, onCategoryClick, onViewAllSKUs }) => (
  <div className="text-sm space-y-3 p-3 w-full">
  <div className="border-b border-slate-200 pb-2">
  <div className="flex items-center justify-between gap-2">
  <strong className="text-lg truncate flex-shrink min-w-0">
  📍 Store {store.store_id}
  </strong>
  <button
  onClick={onViewAllSKUs}
  className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap flex-shrink-0"
  >
  View All SKUs <FiArrowRight className="ml-1" size={12} />
  </button>
  </div>
  <span className="text-slate-500 text-sm truncate block">
  {store.store_name || `Store ${store.store_id}`}
  </span>
  </div>

  <div className="grid grid-cols-2 gap-3 text-xs">
  <div className="bg-slate-100 p-2 rounded">
  <div className="font-semibold truncate">📊 Total SKUs</div>
  <div className="text-lg font-bold">{store.total_skus}</div>
  </div>
  <div className="bg-slate-100 p-2 rounded">
  <div className="font-semibold truncate">📈 Avg Variance</div>
  <div className="text-lg font-bold">
  {store.avg_variance_pct?.toFixed(1) || '0.0'}%
  </div>
  </div>
  </div>

  <div className="space-y-2">
  <div className="flex items-center justify-between">
  <span className="text-sm font-semibold text-slate-700">Trends:</span>
  <span className="text-xs text-slate-500 whitespace-nowrap">
  Click to filter
  </span>
  </div>
  <div className="flex flex-wrap gap-1">
  {store.accelerating_count > 0 && (
  <div
  className="category-tag bg-green-100 text-green-800 border border-green-300 text-xs"
  onClick={() => onCategoryClick('Accelerating')}
  >
  📈 Accelerating: {store.accelerating_count}
  </div>
  )}
  {store.stable_count > 0 && (
  <div
  className="category-tag bg-blue-100 text-blue-800 border border-blue-300 text-xs"
  onClick={() => onCategoryClick('Stable')}
  >
  ➡️ Stable: {store.stable_count}
  </div>
  )}
  {store.decelerating_count > 0 && (
  <div
  className="category-tag bg-orange-100 text-orange-800 border border-orange-300 text-xs"
  onClick={() => onCategoryClick('Decelerating')}
  >
  📉 Decelerating: {store.decelerating_count}
  </div>
  )}
  </div>
  </div>
  </div>
);

// **ADDED**: New SKUDetailsPopup component
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

// **ADDED**: New DemandTrendSKUDetailsPopup component
const DemandTrendSKUDetailsPopup = ({ storeId, trendCategory, onClose, storeName }) => {
  const [skuDetails, setSkuDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchSKUDetails = async () => {
    try {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const params = trendCategory && trendCategory !== 'all' ? { trend_category: trendCategory } : {};
    const response = await axios.get(`${BASE_URL}/api/demand-trend/sku-details/${storeId}`, { headers, params });
    if (response.data.success) setSkuDetails(response.data.data || []);
    } catch (error) { console.error('Error fetching demand trend SKU details:', error); } finally { setLoading(false); }
    };
    fetchSKUDetails();
  }, [storeId, trendCategory]);
  if (loading) return <div className="p-4 h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  return (
  <div className="p-4 max-h-80 overflow-y-auto min-w-[550px] bg-white">
  <div className="flex justify-between items-center mb-4">
  <div><h3 className="text-lg font-bold text-slate-800">Demand Trend SKU Details - {storeName}</h3>{trendCategory && trendCategory !== 'all' && <span className="text-sm text-slate-600">Filter: {trendCategory}</span>}</div>
  <button onClick={onClose} className="text-slate-500 hover:text-slate-700"><FiX size={20} /></button>
  </div>
  {skuDetails.length === 0 ? <div className="text-center py-8 text-slate-500"><FiBox className="mx-auto mb-2 text-slate-400" size={32} /><p>No SKUs found.</p></div> : (<div className="space-y-3">
  <div className="grid grid-cols-12 gap-2 text-xs font-semibold border-b pb-2 text-slate-600 bg-slate-50 p-2 rounded-t"><div className="col-span-3">SKU</div><div className="col-span-2">Recent Sales</div><div className="col-span-2">Forecast</div><div className="col-span-2">Trend %</div><div className="col-span-3">Category</div></div>
  {skuDetails.map((sku, index) => <div key={index} className="grid grid-cols-12 gap-2 text-xs border-b pb-2 last:border-b-0 hover:bg-slate-50 rounded p-1"><div className="col-span-3 font-medium text-slate-800">{sku.sku}</div><div className="col-span-2 text-slate-700">{parseFloat(sku.recent_avg_sales || 0).toFixed(2)}</div><div className="col-span-2 text-slate-700">{parseFloat(sku.forecast_demand || 0).toFixed(2)}</div><div className="col-span-2 font-bold text-slate-800">{parseFloat(sku.trend_percentage || 0).toFixed(1)}%</div><div className="col-span-3"><span className={`category-tag text-xs ${sku.trend_category === 'Accelerating' ? 'bg-green-100 text-green-800' : sku.trend_category === 'Stable' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{sku.trend_category}</span></div></div>)}
  </div>)}
  </div>
  );
};

// **KEPT**: Original AutoPanMarker
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

// **KEPT**: Original MetricCard
const MetricCard = React.memo(({ icon, title, value }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 flex items-center space-x-4">
        <div className="bg-slate-900 p-3 rounded-full">{icon}</div>
        <div><p className="text-sm font-medium text-slate-400">{title}</p><p className="text-2xl font-bold text-white">{value}</p></div>
    </motion.div>
));

// **KEPT**: Original Header (with lastUpdated prop)
const Header = React.memo(({ onRefresh, lastUpdated }) => (
    <header className="relative flex justify-center items-center mb-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Control Tower Dashboard</h1>
            {lastUpdated && (
                <p className="text-xs text-slate-400 mt-1">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
            )}
        </div>
        <button onClick={onRefresh} className="absolute right-0 p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition"><FiRefreshCw size={20} /></button>
    </header>
));

// **KEPT**: Original Sidebar
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

// --- [NEW] Custom Tooltip for Availability Chart ---
const CustomAvailabilityTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const availableSkus = data.eligible_count - data.oos_count;
    const formattedLabel = new Date(label + 'T00:00:00').toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-3 text-sm text-slate-300 min-w-[220px]">
        <p className="font-bold text-white mb-2 text-base">
          {formattedLabel}
        </p>
        
        {/* Availability % (the main metric) */}
        <p className="flex justify-between items-center text-base mb-1.5">
          <span className="text-blue-400 font-semibold">Availability:</span>
          <span className="font-bold text-white">{data.availability_rate.toFixed(2)}%</span>
        </p>
        
        {/* Divider */}
        <hr className="border-slate-700 my-1.5" />
        
        {/* # SKUs Available */}
        <p className="flex justify-between items-center text-xs">
          <span className="text-slate-400">SKUs Available:</span>
          <span className="font-medium text-slate-200">{availableSkus.toLocaleString()}</span>
        </p>
        
        {/* Total SKUs */}
        <p className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Total Eligible SKUs:</span>
          <span className="font-medium text-slate-200">{data.eligible_count.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};


// --- Main Dashboard Component ---

function Dashboard() {
  // **KEPT**: Original state
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

  // **ADDED**: New state for map filters
  const [mapView, setMapView] = useState('alerts'); // 'alerts', 'weeksOfSupply', 'demandTrend'
  const [weeksSupplyStores, setWeeksSupplyStores] = useState([]);
  const [demandTrendStores, setDemandTrendStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTrend, setSelectedTrend] = useState('all');
  const [selectedStore, setSelectedStore] = useState(null);
  const [showSKUDetails, setShowSKUDetails] = useState(false);
  const [skuDetailsCategory, setSkuDetailsCategory] = useState(null);
  const [showDemandSKUDetails, setShowDemandSKUDetails] = useState(false);
  const [demandSkuDetailsCategory, setDemandSkuDetailsCategory] = useState(null);


  const hasPermission = (route) => permissions.includes(route);
  
  // **ADDED**: New data fetching functions for map filters
  const fetchWeeksSupplySummary = async () => {
    try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${BASE_URL}/weeks-of-supply/store-summary`, { headers });
        if (response.data.success) {
            setWeeksSupplyStores(response.data.data || []);
        }
    } catch (error) {
        console.error('Error fetching weeks supply summary:', error);
    }
  };

  const fetchDemandTrendSummary = async () => {
    try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${BASE_URL}/api/demand-trend/store-summary`, { headers });
        if (response.data.success) {
            setDemandTrendStores(response.data.data || []);
        }
    } catch (error) {
        console.error('Error fetching demand trend summary:', error);
    }
  };

  // **KEPT & MERGED**: Original useCallback, now calls new fetch functions
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const permRes = await axios.get(`${BASE_URL}/user/permissions`, { headers });
      const allowedRoutes = permRes.data.allowed_routes || [];
      setPermissions(allowedRoutes);

      if (!allowedRoutes.includes("GET:/dashboard")) {
        setLoading(false);
        return;
      }

      const [ dashboardRes, storesRes, alertsRes, availabilityRes, lookaheadRes ] = await Promise.allSettled([
        axios.get(`${BASE_URL}/dashboard`, { headers }),
        axios.get(`${BASE_URL}/stores`, { headers }),
        axios.get(`${BASE_URL}/alerts`, { headers }),
        axios.get(`${BASE_URL}/availability`, { headers }),
        axios.get(`${BASE_URL}/user/lookahead_days`, { headers }),
      ]);
      
      if (availabilityRes.status === 'fulfilled') {
          setAvailabilityData(availabilityRes.value.data.data || []);
      } else {
          setAvailabilityData([]);
      }
      
      const backendDashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {};
      const stores = storesRes.status === 'fulfilled' ? storesRes.value.data.stores : [];
      const backendAlerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
      
      let stockouts = 0;
      let skusBelow = 0;
      
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

      const locations = locationsData.map((results, index) => {
          const store = stores[index];
          const [hoverRes, alertStatusRes] = results;
          const lookaheadDays = lookaheadRes.status === 'fulfilled' ? lookaheadRes.value.data.lookahead_days : 7;
          const hoverData = hoverRes.status === 'fulfilled' ? { ...hoverRes.value.data, lookahead_days: lookaheadDays } : {lookahead_days: lookaheadDays};
          const alertStatusData = alertStatusRes.status === 'fulfilled' ? alertStatusRes.value.data : {};

          return {
              store_id: store.store_id,
              store_name: store.name,
              location: store.city,
              lat: store.lat,
              lng: store.lon,
              alert: backendAlerts.find(a => a.store_id === store.store_id)?.message || null,
              hoverStats: {
                  distinct_skus: hoverData.distinct_skus || 0,
                  inventory_units: hoverData.inventory_units || 0,
                  forecast_units: hoverData.forecast_units || 0,
                  lookahead_days: hoverData.lookahead_days
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
          timestamp: backendDashboard.timestamp ?? new Date().toISOString()
        },
        alerts: backendAlerts.map((a, i) => ({
          id: a.id || `alert-${i}`,
          severity: a.severity || "Low",
          message: a.message,
          type: a.type ? a.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "General",
          store_id: a.store_id,
          sku: a.sku
        })),
        locations
      });

      // **MERGED**: Call new fetch functions
      await fetchWeeksSupplySummary();
      await fetchDemandTrendSummary();

    } catch (err) {
      if (err.response?.status === 401) navigate("/");
    } finally {
      setLoading(false);
    }
  }, [navigate]); // Added navigate as dependency

  // **KEPT**: Original useEffect
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // **ADDED**: New useMemo hooks for filtering map data
  const storesWithCoords = useMemo(() => weeksSupplyStores.map(store => {
    const locationData = data.locations.find(loc => loc.store_id === store.store_id);
    return { ...store, lat: locationData?.lat || null, lng: locationData?.lng || null, store_name: locationData?.store_name || `Store ${store.store_id}` };
  }).filter(store => store.lat != null && store.lng != null), [weeksSupplyStores, data.locations]);

  const demandStoresWithCoords = useMemo(() => demandTrendStores.map(store => {
    const locationData = data.locations.find(loc => loc.store_id === store.store_id);
    return { ...store, lat: locationData?.lat || null, lng: locationData?.lng || null, store_name: locationData?.store_name || `Store ${store.store_id}` };
  }).filter(store => store.lat != null && store.lng != null), [demandTrendStores, data.locations]);

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

  const filteredDemandStores = useMemo(() => {
    if (selectedTrend === 'all') return demandStoresWithCoords;
    return demandStoresWithCoords.filter(store => {
        switch (selectedTrend) {
        case 'Accelerating': return store.accelerating_count > 0;
        case 'Stable': return store.stable_count > 0;
        case 'Decelerating': return store.decelerating_count > 0;
        default: return true;
        }
    });
  }, [demandStoresWithCoords, selectedTrend]);

  const storeCounts = useMemo(() => ({
    'all': storesWithCoords.length, 'Critical': storesWithCoords.filter(s => s.critical_count > 0).length, 'Low': storesWithCoords.filter(s => s.low_count > 0).length,
    'Adequate': storesWithCoords.filter(s => s.adequate_count > 0).length, 'High': storesWithCoords.filter(s => s.high_count > 0).length,
  }), [storesWithCoords]);
  
  const demandStoreCounts = useMemo(() => ({
    'all': demandStoresWithCoords.length, 
    'Accelerating': demandStoresWithCoords.filter(s => s.accelerating_count > 0).length, 
    'Stable': demandStoresWithCoords.filter(s => s.stable_count > 0).length,
    'Decelerating': demandStoresWithCoords.filter(s => s.decelerating_count > 0).length,
  }), [demandStoresWithCoords]);

  // **ADDED**: New handler functions for popups
  const handleCategoryClickFromPopup = (category) => setSelectedCategory(category);
  const handleCloseSKUDetails = () => { setShowSKUDetails(false); setSelectedStore(null); setSkuDetailsCategory(null); };
  const handleViewAllSKUs = (store) => { setSelectedStore(store); setSkuDetailsCategory('all'); setShowSKUDetails(true); };
  
  const handleTrendClickFromPopup = (trend) => setSelectedTrend(trend);
  const handleCloseDemandSKUDetails = () => { setShowDemandSKUDetails(false); setSelectedStore(null); setDemandSkuDetailsCategory(null); };
  const handleViewAllDemandSKUs = (store) => { setSelectedStore(store); setDemandSkuDetailsCategory('all'); setShowDemandSKUDetails(true); };

  // **KEPT**: Original loading/permission checks
  if (loading) {
    return <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center"><div className="flex items-center space-x-3 text-white"><FiRefreshCw className="animate-spin h-5 w-5" /><span>Loading Dashboard...</span></div></div>;
  }
  if (!hasPermission("GET:/dashboard")) {
      return <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white"><h1 className="text-3xl font-bold">Access Denied</h1><p className="mt-2 text-slate-400">You do not have permission to view this page.</p><button onClick={() => navigate("/")} className="mt-6 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition-colors">Go to Login</button></div>;
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white font-sans flex relative">
        <MapStyles />

        {/* **KEPT**: Original Sidebar toggle button */}
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

        {/* **KEPT**: Original Sidebar component */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} permissions={permissions} />

      <main className="flex-1 p-6 pb-24 transition-all duration-300">
        {/* **KEPT**: Original Header call (with lastUpdated and fetchDashboardData) */}
        <Header lastUpdated={data.metrics.timestamp} onRefresh={fetchDashboardData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            {/* **KEPT**: Original Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard icon={<FiTrendingUp size={24} className="text-blue-400" />} title="Current Demand" value={data.metrics.current_demand.toLocaleString()} />
                <MetricCard icon={<FiBox size={24} className="text-green-400" />} title="Inventory Position" value={data.metrics.inventory_position.toLocaleString()}   />
                <MetricCard icon={<FiCalendar size={24} className="text-yellow-400" />} title="Weeks Of Supply" value={data.metrics.weeks_of_supply.toLocaleString()} />
            </div>

            {/* **MERGED**: Replaced original map with new filter-enabled map container */}
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
                    <option value="demandTrend">Demand Trend View</option>
                </select>
              </div>
              <div className="rounded-lg overflow-hidden relative h-[60vh]">
                {mapView === 'alerts' ? (
                  <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <ResetMapViewButton locations={data.locations} />
                    <FitBounds locations={data.locations} />
                    {data.locations.filter(loc => loc.lat != null && loc.lng != null).map((loc) => (
                        <AutoPanMarker key={loc.store_id} position={[loc.lat, loc.lng]} icon={createAlertIcon(loc)}>
                        <Tooltip direction="top" offset={[0, -42]} opacity={1} permanent={false}>
                            <div className="text-sm space-y-3 p-1" style={{ minWidth: "250px", maxWidth: "300px" }}>
                                <div><strong>{loc.store_name}</strong><br /><span className="text-slate-500">{loc.location}</span></div>
                                
                                {loc.alert && <div className="text-red-600 font-bold border-t border-slate-200 pt-2">🚨 Alert: {loc.alert}</div>}

                                {loc.alertStatus && (
                                    <div className="text-slate-800 bg-amber-100 p-2 rounded-md shadow-inner border border-amber-200">
                                        <p className="text-amber-800 font-semibold mb-1">Reorder Status:</p>
                                        <ul className="ml-4 list-disc text-sm space-y-1">
                                        <li>📦 SKUs to Reorder: <strong>{loc.alertStatus.reorderCount}</strong></li>
                                        <li className={loc.alertStatus.hasAlert ? "text-red-600 font-bold" : ""}>
                                            ⚠️ Stockout despite Reorder: <strong>{loc.alertStatus.stockoutCount}</strong>
                                        </li>
                                        </ul>
                                    </div>
                                )}

                                {loc.hoverStats && (
                                    <div className="bg-blue-50 text-slate-800 p-2 rounded-md shadow-inner border border-blue-200 mt-2">
                                        <p className="text-blue-800 font-semibold mb-1">Quick Stats ({loc.hoverStats.lookahead_days}-Day):</p>
                                        <ul className="ml-4 list-disc text-sm space-y-1">
                                        <li>📦 <strong>{loc.hoverStats.distinct_skus}</strong> SKUs</li>
                                        <li>📊 <strong>{loc.hoverStats.inventory_units}</strong> Inventory Units</li>
                                        <li>📈 <strong>{loc.hoverStats.forecast_units}</strong> Forecast Units</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Tooltip>
                        </AutoPanMarker>
                    ))}
                  </MapContainer>
                ) : mapView === 'weeksOfSupply' ? (
                  <MapContainer center={[39.82, -98.57]} zoom={4} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapFilterControl selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} storeCounts={storeCounts} filterType="weeks" />
                    <ResetMapViewButton locations={filteredStores} />
                    <FitBounds locations={filteredStores} />
                    {filteredStores.map((store) => (<Marker key={store.store_id} position={[store.lat, store.lng]} icon={createWeeksSupplyIcon(store, selectedCategory)}>
                    <Popup closeButton={true} autoClose={false} closeOnClick={false}>
                        {showSKUDetails && selectedStore?.store_id === store.store_id ? (<SKUDetailsPopup storeId={store.store_id} category={skuDetailsCategory} onClose={handleCloseSKUDetails} storeName={store.store_name} />) : (<StoreSummaryTooltip store={store} onCategoryClick={handleCategoryClickFromPopup} onViewAllSKUs={() => handleViewAllSKUs(store)} />)}
                    </Popup>
                    </Marker>))}
                  </MapContainer>
                ) : ( // mapView === 'demandTrend'
                  <MapContainer center={[39.82, -98.57]} zoom={4} style={{ height: "100%", width: "100%", backgroundColor: '#f0f0f0' }} scrollWheelZoom={true}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapFilterControl selectedCategory={selectedTrend} onCategoryChange={setSelectedTrend} storeCounts={demandStoreCounts} filterType="demand" />
                    <ResetMapViewButton locations={filteredDemandStores} />
                    <FitBounds locations={filteredDemandStores} />
                    {filteredDemandStores.map((store) => (<Marker key={store.store_id} position={[store.lat, store.lng]} icon={createDemandTrendIcon(store, selectedTrend)}>
                    <Popup closeButton={true} autoClose={false} closeOnClick={false}>
                        {showDemandSKUDetails && selectedStore?.store_id === store.store_id ? (<DemandTrendSKUDetailsPopup storeId={store.store_id} trendCategory={demandSkuDetailsCategory} onClose={handleCloseDemandSKUDetails} storeName={store.store_name} />) : (<DemandTrendTooltip store={store} onCategoryClick={handleTrendClickFromPopup} onViewAllSKUs={() => handleViewAllDemandSKUs(store)} />)}
                    </Popup>
                    </Marker>))}
                  </MapContainer>
                )}
              </div>
            </motion.div>
          </div>

          {/* **KEPT**: Original Right Column (Alerts/Chatbot) */}
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
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={availabilityData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                        <defs><linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} /></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3a56" />
                                        <XAxis dataKey="week_start" stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                                        
                                        {/* --- [MODIFIED] --- */}
                                        <RechartsTooltip 
                                            content={<CustomAvailabilityTooltip />} 
                                            cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }} 
                                        />
                                        {/* --- [END MODIFIED] --- */}

                                        <Bar dataKey="availability_rate" name="Availability Rate" fill="url(#availGrad)" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </main>

      {/* **KEPT**: Original Chatbot FAB */}
      <AnimatePresence>
          {!isChatbotOpen && (
              <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{
                      opacity: 1, y: 0, scale: 1,
                      transition: { type: "spring", stiffness: 260, damping: 20 }
                  }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsChatbotOpen(true)}
                  className="fixed bottom-6 right-6 z-[1001] w-full max-w-xs cursor-pointer"
                  aria-label="Open AI Assistant"
              >
                  <div className="p-3 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl shadow-black/30 flex items-center justify-between gap-3">
                      <FiCpu className="text-violet-400 flex-shrink-0" size={20} />
                      <span className="text-slate-300 text-sm font-medium w-full text-left">
                          Ask Akashvani...
                      </span>
                      <div className="p-1.5 bg-gradient-to-br from-violet-600 to-blue-600 rounded-md text-white">
                          <FiSend size={14} />
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
