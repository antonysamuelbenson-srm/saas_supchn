// In src/Pages/HierarchicalTable.jsx

import React, { useState, useMemo } from 'react';
import { FiPlusSquare, FiMinusSquare } from 'react-icons/fi';

// A helper function to format numbers
const formatNum = (num) => num?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A';

// The main component for our hierarchical table
const HierarchicalTable = ({ data }) => {
    // State to track which week and SKU is expanded
    const [expanded, setExpanded] = useState({});

    // Group the flat data into a nested structure: Week -> SKU -> [Stores]
    // useMemo ensures this expensive calculation only runs when the data changes
    const groupedData = useMemo(() => {
        if (!data) return {};
        return data.reduce((acc, row) => {
            const { week_start, sku, store_id, actuals, forecast, mae, wmape } = row;
            
            // Ensure week level exists
            if (!acc[week_start]) acc[week_start] = { skus: {}, summary: { actuals: 0, forecast: 0, mae: 0, wmape_sum: 0, count: 0 } };
            
            // Ensure SKU level exists
            if (!acc[week_start].skus[sku]) acc[week_start].skus[sku] = { stores: [], summary: { actuals: 0, forecast: 0, mae: 0, wmape_sum: 0, count: 0 } };

            // Add store row
            acc[week_start].skus[sku].stores.push({ store_id, actuals, forecast, mae, wmape });
            
            // Aggregate summaries up the chain
            acc[week_start].skus[sku].summary.actuals += actuals;
            acc[week_start].skus[sku].summary.forecast += forecast;
            acc[week_start].skus[sku].summary.mae += mae || 0;
            acc[week_start].skus[sku].summary.wmape_sum += (wmape || 0) * actuals;

            acc[week_start].summary.actuals += actuals;
            acc[week_start].summary.forecast += forecast;
            acc[week_start].summary.mae += mae || 0;
            acc[week_start].summary.wmape_sum += (wmape || 0) * actuals;
            acc[week_start].summary.count += 1;

            return acc;
        }, {});
    }, [data]);

    const handleToggle = (level, key) => {
        setExpanded(prev => ({ ...prev, [level]: prev[level] === key ? null : key }));
    };

    if (Object.keys(groupedData).length === 0) {
        return <div className="text-center p-8 text-slate-400">No granular data for the selected filters.</div>
    }

    return (
        <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-800 border-b-2 border-slate-600">
                    <tr>
                        <th className="p-3 w-1/4">Identifier</th>
                        <th className="p-3 text-right">Actuals</th>
                        <th className="p-3 text-right">Forecast</th>
                        <th className="p-3 text-right">MAE</th>
                        <th className="p-3 text-right">WMAPE (%)</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(groupedData).map(([week, weekData]) => (
                        <React.Fragment key={week}>
                            {/* --- WEEK LEVEL --- */}
                            <tr className="bg-slate-700/50 font-bold border-b-2 border-slate-900">
                                <td className="p-3">
                                    <button onClick={() => handleToggle('week', week)} className="flex items-center gap-2">
                                        {expanded.week === week ? <FiMinusSquare /> : <FiPlusSquare />}
                                        {week}
                                    </button>
                                </td>
                                <td className="p-3 text-right">{formatNum(weekData.summary.actuals)}</td>
                                <td className="p-3 text-right">{formatNum(weekData.summary.forecast)}</td>
                                <td className="p-3 text-right text-amber-400">{formatNum(weekData.summary.mae / weekData.summary.count)}</td>
                                <td className="p-3 text-right text-teal-400">{formatNum(weekData.summary.wmape_sum / weekData.summary.actuals)}%</td>
                            </tr>

                            {/* --- SKU LEVEL (Visible if week is expanded) --- */}
                            {expanded.week === week && Object.entries(weekData.skus).map(([sku, skuData]) => (
                                <React.Fragment key={sku}>
                                    <tr className="bg-slate-800/60 border-b border-slate-700">
                                        <td className="p-3 pl-10">
                                            <button onClick={() => handleToggle('sku', sku)} className="flex items-center gap-2">
                                                 {expanded.sku === sku ? <FiMinusSquare /> : <FiPlusSquare />}
                                                 {sku}
                                            </button>
                                        </td>
                                        <td className="p-3 text-right">{formatNum(skuData.summary.actuals)}</td>
                                        <td className="p-3 text-right">{formatNum(skuData.summary.forecast)}</td>
                                        <td className="p-3 text-right text-amber-400">{formatNum(skuData.summary.mae / skuData.stores.length)}</td>
                                        <td className="p-3 text-right text-teal-400">{formatNum(skuData.summary.wmape_sum / skuData.summary.actuals)}%</td>
                                    </tr>

                                    {/* --- STORE LEVEL (Visible if SKU is expanded) --- */}
                                    {expanded.sku === sku && skuData.stores.map((store) => (
                                        <tr key={store.store_id} className="hover:bg-slate-700/50 border-b border-slate-700">
                                            <td className="p-3 pl-20">{store.store_id}</td>
                                            <td className="p-3 text-right">{formatNum(store.actuals)}</td>
                                            <td className="p-3 text-right">{formatNum(store.forecast)}</td>
                                            <td className="p-3 text-right text-amber-400">{formatNum(store.mae)}</td>
                                            <td className="p-3 text-right text-teal-400">{formatNum(store.wmape)}%</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HierarchicalTable;