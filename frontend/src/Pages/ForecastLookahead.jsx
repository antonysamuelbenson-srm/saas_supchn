import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";

// --- Configuration ---
const BASE_URL = "http://127.0.0.1:5500";
const token = localStorage.getItem("token");

// --- Reusable Hooks ---

/**
 * Debounce hook to delay value updates, useful for API calls on input change.
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- Reusable UI Components ---

/**
 * A simple loading spinner component, styled for a dark background.
 */
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-indigo-500"></div>
  </div>
);

/**
 * A generic component for displaying empty or informational states on a dark background.
 */
const InfoMessage = ({ icon, title, message }) => (
  <div className="text-center py-16 px-6">
    <div className="text-5xl mb-3">{icon}</div>
    <h3 className="text-xl font-semibold text-slate-100 mb-1">{title}</h3>
    <p className="text-slate-400">{message}</p>
  </div>
);

/**
 * Component for a single SKU's forecast table, styled for a dark theme.
 */
const SkuForecastTable = ({ sku, forecastDays }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
    <h3 className="text-lg font-semibold text-slate-100 p-4 bg-slate-900/50 border-b border-slate-700">{sku}</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-slate-900/50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Forecast Quantity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {forecastDays.map((d, idx) => (
            <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{d.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{d.forecast_qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Main Page Component ---

export default function StoreForecastPage() {
  // --- State Management ---
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [days, setDays] = useState(15);
  const [skuSearchTerm, setSkuSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState({ stores: true, forecast: false });
  const [error, setError] = useState({ stores: null, forecast: null });

  // --- Debouncing Inputs ---
  const debouncedDays = useDebounce(days, 500);
  const debouncedSkuSearch = useDebounce(skuSearchTerm, 300);

  // --- Data Fetching Effects ---

  // Fetch all available stores on component mount
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(prev => ({ ...prev, stores: true }));
      setError(prev => ({ ...prev, stores: null }));
      try {
        const res = await axios.get(`${BASE_URL}/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(res.data.stores);
      } catch (err) {
        setError(prev => ({ ...prev, stores: "Failed to load stores." }));
        console.error(err);
      } finally {
        setIsLoading(prev => ({ ...prev, stores: false }));
      }
    };
    fetchStores();
  }, []);

  // Fetch forecast data when selected store or debounced days change
  useEffect(() => {
    if (!selectedStore || !debouncedDays) {
      setForecast(null);
      return;
    }
    const fetchForecast = async () => {
      setIsLoading(prev => ({ ...prev, forecast: true }));
      setError(prev => ({ ...prev, forecast: null }));
      setForecast(null);
      try {
        const res = await axios.get(
          `${BASE_URL}/forecast/store/${selectedStore.value}?days=${debouncedDays}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setForecast(res.data.forecast);
      } catch (err) {
        setError(prev => ({ ...prev, forecast: "Failed to load forecast data." }));
        console.error(err);
      } finally {
        setIsLoading(prev => ({ ...prev, forecast: false }));
      }
    };
    fetchForecast();
  }, [selectedStore, debouncedDays]);

  // --- Memoized Computations ---

  // Memoize store options for react-select
  const storeOptions = useMemo(() =>
    stores.map(store => ({
      value: store.store_id,
      label: `${store.name} (${store.city})`
    })),
    [stores]
  );

  // Memoize filtered forecast based on SKU search
  const filteredForecastEntries = useMemo(() => {
    if (!forecast) return [];
    return Object.entries(forecast).filter(([sku]) =>
      sku.toLowerCase().includes(debouncedSkuSearch.toLowerCase())
    );
  }, [forecast, debouncedSkuSearch]);
  
  // Custom styles for react-select to match the dark theme
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#1e293b', // slate-800
      borderColor: state.isFocused ? '#6366f1' : '#334155', // indigo-500 : slate-700
      boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#6366f1' : '#475569', // slate-600
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#1e293b', // slate-800
      border: '1px solid #334155', // slate-700
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#334155' : 'transparent', // indigo-600 : slate-700
        color: state.isSelected ? '#ffffff' : '#d1d5db', // white : gray-300
        '&:active': {
            backgroundColor: '#4338ca', // indigo-700
        }
    }),
    singleValue: (provided) => ({
        ...provided,
        color: '#f1f5f9' // slate-100
    }),
    input: (provided) => ({
        ...provided,
        color: '#f1f5f9' // slate-100
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#94a3b8' // slate-400
    }),
    indicatorSeparator: () => ({
        display: 'none'
    }),
    dropdownIndicator: (provided) => ({
        ...provided,
        color: '#94a3b8' // slate-400
    }),
  };

  // --- Render Logic ---

  const renderForecastContent = () => {
    if (isLoading.forecast) {
      return <LoadingSpinner />;
    }
    if (error.forecast) {
      return <InfoMessage icon="😢" title="Error" message={error.forecast} />;
    }
   if (forecast && filteredForecastEntries.length > 0) {
  return (
    // Add this responsive grid container
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredForecastEntries.map(([sku, forecastDays]) => (
        <SkuForecastTable key={sku} sku={sku} forecastDays={forecastDays} />
      ))}
    </div>
  );
}
    if (forecast && filteredForecastEntries.length === 0) {
      return (
        <InfoMessage
          icon="🤷"
          title="No Results"
          message={`No SKUs found matching "${debouncedSkuSearch}".`}
        />
      );
    }
    return (
      <InfoMessage
        icon="👆"
        title="Select a Store"
        message="Choose a store from the dropdown to see its sales forecast."
      />
    );
  };

  return (
    <main className="h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        {/* --- Top Control Panel --- */}
        <header className="flex-shrink-0 bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 mb-6 flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:flex-1">
            <label htmlFor="store-select" className="block text-sm font-semibold text-slate-300 mb-1">🏪 Select Store</label>
            <Select
              inputId="store-select"
              options={storeOptions}
              value={selectedStore}
              onChange={setSelectedStore}
              isLoading={isLoading.stores}
              isClearable
              placeholder="Search for a store by name or city..."
              noOptionsMessage={() => error.stores ? error.stores : "No stores found"}
              styles={selectStyles}
            />
          </div>
          <div className="w-full md:w-auto">
            <label htmlFor="days-input" className="block text-sm font-semibold text-slate-300 mb-1">📅 Forecast Days</label>
            <input
              id="days-input"
              type="number"
              min="1"
              max="60"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full md:w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white"
            />
          </div>
        </header>
        
        {/* --- Forecast Display Area --- */}
        <section className="flex-1 bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700 flex flex-col">
          {selectedStore ? (
            <>
              <div className="flex-shrink-0 flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-100 truncate">
                  Forecast for: <span className="text-indigo-400">{selectedStore.label}</span>
                </h2>
                <div className="w-full md:w-1/3">
                  <input
                    type="text"
                    placeholder="🔍 Search by SKU..."
                    value={skuSearchTerm}
                    onChange={(e) => setSkuSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                {renderForecastContent()}
              </div>
            </>
          ) : (
            renderForecastContent()
          )}
        </section>
      </div>
    </main>
  );
}