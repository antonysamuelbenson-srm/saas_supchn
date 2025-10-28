// // import React, { useState, useMemo } from 'react';
// // import { FiPlusSquare, FiMinusSquare } from 'react-icons/fi';

// // // A helper function to format numbers
// // const formatNum = (num, isPercentage = false) => {
// //     if (num === null || num === undefined || isNaN(num)) return 'N/A';
// //     const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// //     return isPercentage ? `${formatted}%` : formatted;
// // };

// // // A button component for the table headers to reduce repetition
// // const HeaderButton = ({ level, expanded, onClick, disabled = false }) => (
// //     <button
// //         onClick={onClick}
// //         disabled={disabled}
// //         className="flex items-center gap-2 font-semibold hover:text-indigo-400 transition-colors disabled:text-slate-500 disabled:cursor-not-allowed"
// //     >
// //         {expanded ? <FiMinusSquare /> : <FiPlusSquare />}
// //         <span>{level}</span>
// //     </button>
// // );


// // const HierarchicalTable = ({ data }) => {
// //     // State to track which hierarchical levels are expanded globally
// //     const [expandedLevels, setExpandedLevels] = useState({
// //         week: false,
// //         sku: false,
// //         store: false,
// //     });

// //     // --- DATA AGGREGATION ---

// //     // 1. Group flat data into a nested structure: Week -> SKU -> [Stores]
// //     const groupedData = useMemo(() => {
// //         // This logic is unchanged from the previous version
// //         if (!data || data.length === 0) return {};
// //         return data.reduce((acc, row) => {
// //             const { week_start, sku, store_id, actuals, forecast, mae, wmape } = row;
// //             if (!acc[week_start]) acc[week_start] = { skus: {}, summary: { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0, count: 0 } };
// //             if (!acc[week_start].skus[sku]) acc[week_start].skus[sku] = { stores: [], summary: { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0 } };
// //             acc[week_start].skus[sku].stores.push({ store_id, actuals, forecast, mae, wmape });
// //             const skuSummary = acc[week_start].skus[sku].summary;
// //             skuSummary.actuals += actuals;
// //             skuSummary.forecast += forecast;
// //             skuSummary.mae_sum += mae || 0;
// //             if (actuals > 0) skuSummary.wmape_weighted_sum += (wmape || 0) * actuals;
// //             const weekSummary = acc[week_start].summary;
// //             weekSummary.actuals += actuals;
// //             weekSummary.forecast += forecast;
// //             weekSummary.mae_sum += mae || 0;
// //             if (actuals > 0) weekSummary.wmape_weighted_sum += (wmape || 0) * actuals;
// //             weekSummary.count += 1;
// //             return acc;
// //         }, {});
// //     }, [data]);

// //     // 2. Calculate a single "Grand Total" summary row for the collapsed view
// //     const overallSummary = useMemo(() => {
// //         if (!data || data.length === 0) return null;
// //         const total = { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0, count: data.length };
// //         for (const row of data) {
// //             total.actuals += row.actuals;
// //             total.forecast += row.forecast;
// //             total.mae_sum += row.mae || 0;
// //             if (row.actuals > 0) total.wmape_weighted_sum += (row.wmape || 0) * row.actuals;
// //         }
// //         total.mae = total.count > 0 ? total.mae_sum / total.count : 0;
// //         total.wmape = total.actuals > 0 ? total.wmape_weighted_sum / total.actuals : 0;
// //         return total;
// //     }, [data]);

// //     // --- HANDLERS AND HELPERS ---

// //     const handleToggleLevel = (level) => {
// //         setExpandedLevels(prev => {
// //             const newLevels = { ...prev };
// //             newLevels[level] = !newLevels[level];
// //             // If a higher level is collapsed, all lower levels must also be collapsed
// //             if (level === 'week' && !newLevels.week) {
// //                 newLevels.sku = false;
// //                 newLevels.store = false;
// //             }
// //             if (level === 'sku' && !newLevels.sku) {
// //                 newLevels.store = false;
// //             }
// //             return newLevels;
// //         });
// //     };
    
// //     const sortedWeeks = useMemo(() => Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b)), [groupedData]);
    
// //     if (!overallSummary) {
// //         return <div className="text-center p-8 text-slate-400">No granular data for the selected filters.</div>;
// //     }

// //     return (
// //         <div className="overflow-x-auto max-h-[600px]">
// //             <table className="w-full text-left text-sm">
// //                 <thead className="sticky top-0 bg-slate-800 border-b-2 border-slate-600">
// //                     <tr>
// //                         <th className="p-3 w-[24%]"><HeaderButton level="WEEKS" expanded={expandedLevels.week} onClick={() => handleToggleLevel('week')} /></th>
// //                         <th className="p-3 w-[24%]"><HeaderButton level="SKU" expanded={expandedLevels.sku} onClick={() => handleToggleLevel('sku')} disabled={!expandedLevels.week} /></th>
// //                         <th className="p-3 w-[24%]"><HeaderButton level="STORES" expanded={expandedLevels.store} onClick={() => handleToggleLevel('store')} disabled={!expandedLevels.sku} /></th>
// //                         <th className="p-3 text-right">Actuals</th>
// //                         <th className="p-3 text-right">Forecast</th>
// //                         <th className="p-3 text-right">MAE</th>
// //                         <th className="p-3 text-right">WMAPE</th>
// //                     </tr>
// //                 </thead>
// //                 <tbody>
// //                     {/* LEVEL 0: GRAND TOTAL (Default View) */}
// //                     {!expandedLevels.week && (
// //                         <tr className="bg-slate-700/50 font-bold">
// //                             <td className="p-3">Overall</td>
// //                             <td className="p-3">Overall</td>
// //                             <td className="p-3">Overall</td>
// //                             <td className="p-3 text-right">{formatNum(overallSummary.actuals)}</td>
// //                             <td className="p-3 text-right">{formatNum(overallSummary.forecast)}</td>
// //                             <td className="p-3 text-right text-amber-400">{formatNum(overallSummary.mae)}</td>
// //                             <td className="p-3 text-right text-teal-400">{formatNum(overallSummary.wmape, true)}</td>
// //                         </tr>
// //                     )}
                    
// //                     {/* LEVEL 1: WEEKS */}
// //                     {expandedLevels.week && sortedWeeks.map(week => {
// //                         const weekData = groupedData[week];
// //                         const weekMae = weekData.summary.count > 0 ? weekData.summary.mae_sum / weekData.summary.count : 0;
// //                         const weekWmape = weekData.summary.actuals > 0 ? weekData.summary.wmape_weighted_sum / weekData.summary.actuals : 0;
// //                         return (
// //                             <React.Fragment key={week}>
// //                                 <tr className="bg-slate-700/50 font-bold border-t-4 border-slate-900">
// //                                     <td className="p-3">{week}</td>
// //                                     <td className="p-3">Overall</td>
// //                                     <td className="p-3">Overall</td>
// //                                     <td className="p-3 text-right">{formatNum(weekData.summary.actuals)}</td>
// //                                     <td className="p-3 text-right">{formatNum(weekData.summary.forecast)}</td>
// //                                     <td className="p-3 text-right text-amber-400">{formatNum(weekMae)}</td>
// //                                     <td className="p-3 text-right text-teal-400">{formatNum(weekWmape, true)}</td>
// //                                 </tr>

// //                                 {/* LEVEL 2: SKUs */}
// //                                 {expandedLevels.sku && Object.keys(weekData.skus).sort().map(sku => {
// //                                     const skuData = weekData.skus[sku];
// //                                     const skuMae = skuData.stores.length > 0 ? skuData.summary.mae_sum / skuData.stores.length : 0;
// //                                     const skuWmape = skuData.summary.actuals > 0 ? skuData.summary.wmape_weighted_sum / skuData.summary.actuals : 0;
// //                                     return (
// //                                         <React.Fragment key={`${week}-${sku}`}>
// //                                             <tr className="bg-slate-800/60 border-b border-slate-700">
// //                                                 <td className="p-3 pl-8 text-slate-400">{week}</td>
// //                                                 <td className="p-3">{sku}</td>
// //                                                 <td className="p-3">Overall</td>
// //                                                 <td className="p-3 text-right">{formatNum(skuData.summary.actuals)}</td>
// //                                                 <td className="p-3 text-right">{formatNum(skuData.summary.forecast)}</td>
// //                                                 <td className="p-3 text-right text-amber-400">{formatNum(skuMae)}</td>
// //                                                 <td className="p-3 text-right text-teal-400">{formatNum(skuWmape, true)}</td>
// //                                             </tr>

// //                                             {/* LEVEL 3: STORES */}
// //                                             {expandedLevels.store && skuData.stores.map(store => (
// //                                                 <tr key={`${week}-${sku}-${store.store_id}`} className="hover:bg-slate-700/50 border-b border-slate-700 text-xs">
// //                                                     <td className="p-2 pl-8 text-slate-400">{week}</td>
// //                                                     <td className="p-2 pl-8 text-slate-400">{sku}</td>
// //                                                     <td className="p-2">{store.store_id}</td>
// //                                                     <td className="p-2 text-right">{formatNum(store.actuals)}</td>
// //                                                     <td className="p-2 text-right">{formatNum(store.forecast)}</td>
// //                                                     <td className="p-2 text-right text-amber-400">{formatNum(store.mae)}</td>
// //                                                     <td className="p-2 text-right text-teal-400">{formatNum(store.wmape, true)}</td>
// //                                                 </tr>
// //                                             ))}
// //                                         </React.Fragment>
// //                                     );
// //                                 })}
// //                             </React.Fragment>
// //                         );
// //                     })}
// //                 </tbody>
// //             </table>
// //         </div>
// //     );
// // };

// // export default HierarchicalTable;



// // import React, { useState, useMemo } from 'react';
// // import { FiPlusSquare, FiMinusSquare } from 'react-icons/fi';

// // // A helper function to format numbers (unchanged)
// // const formatNum = (num, isPercentage = false) => {
// //     if (num === null || num === undefined || isNaN(num)) return 'N/A';
// //     const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// //     return isPercentage ? `${formatted}%` : formatted;
// // };

// // // A button component for the table headers (unchanged)
// // const HeaderButton = ({ level, expanded, onClick, disabled = false }) => (
// //     <button
// //         onClick={onClick}
// //         disabled={disabled}
// //         className="flex items-center gap-2 font-semibold hover:text-indigo-400 transition-colors disabled:text-slate-500 disabled:cursor-not-allowed"
// //     >
// //         {expanded ? <FiMinusSquare /> : <FiPlusSquare />}
// //         <span>{level}</span>
// //     </button>
// // );

// // // Defines the structure and labels for each grouping option
// // const HIERARCHY_CONFIG = {
// //     week: { level1: 'WEEKS', level2: 'SKU', level3: 'STORES', level3Key: 'store_id' },
// //     sku: { level1: 'SKU', level2: 'WEEKS', level3: 'STORES', level3Key: 'store_id' },
// //     store: { level1: 'STORES', level2: 'WEEKS', level3: 'SKU', level3Key: 'sku' },
// // };


// // const HierarchicalTable = ({ data }) => {
// //     // NEW: State to control the primary grouping dimension
// //     const [groupBy, setGroupBy] = useState('week'); 
    
// //     // MODIFIED: State now uses generic level names for clarity
// //     const [expandedLevels, setExpandedLevels] = useState({
// //         level1: false,
// //         level2: false,
// //         level3: false,
// //     });

// //     const currentHierarchy = HIERARCHY_CONFIG[groupBy];

// //     // --- DATA AGGREGATION (REFACTORED) ---

// //     // MODIFIED: Grouping logic is now dynamic based on the `groupBy` state
// //     const groupedData = useMemo(() => {
// //         if (!data || data.length === 0) return {};
        
// //         // Helper to perform the summary calculation
// //         const addToSummary = (summary, row) => {
// //             const { actuals, forecast, mae, wmape } = row;
// //             summary.actuals += actuals;
// //             summary.forecast += forecast;
// //             summary.mae_sum += mae || 0;
// //             if (actuals > 0) summary.wmape_weighted_sum += (wmape || 0) * actuals;
// //             summary.count = (summary.count || 0) + 1;
// //         };

// //         return data.reduce((acc, row) => {
// //             const { week_start, sku, store_id } = row;
// //             let level1Key, level2Key, level3Data;

// //             // Determine the keys for each level based on the selected `groupBy`
// //             switch (groupBy) {
// //                 case 'sku':
// //                     level1Key = sku;
// //                     level2Key = week_start;
// //                     level3Data = { store_id, ...row };
// //                     break;
// //                 case 'store':
// //                     level1Key = store_id;
// //                     level2Key = week_start;
// //                     level3Data = { sku, ...row };
// //                     break;
// //                 case 'week':
// //                 default:
// //                     level1Key = week_start;
// //                     level2Key = sku;
// //                     level3Data = { store_id, ...row };
// //                     break;
// //             }

// //             // Dynamically build the nested structure
// //             if (!acc[level1Key]) acc[level1Key] = { level2s: {}, summary: { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0, count: 0 } };
// //             if (!acc[level1Key].level2s[level2Key]) acc[level1Key].level2s[level2Key] = { level3s: [], summary: { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0, count: 0 } };

// //             // Add the raw data row and update summaries at both levels
// //             acc[level1Key].level2s[level2Key].level3s.push(level3Data);
// //             addToSummary(acc[level1Key].level2s[level2Key].summary, row);
// //             addToSummary(acc[level1Key].summary, row);

// //             return acc;
// //         }, {});
// //     }, [data, groupBy]);

// //     // Overall summary logic remains the same
// //     const overallSummary = useMemo(() => {
// //         if (!data || data.length === 0) return null;
// //         const total = data.reduce((acc, row) => {
// //             acc.actuals += row.actuals;
// //             acc.forecast += row.forecast;
// //             acc.mae_sum += row.mae || 0;
// //             if (row.actuals > 0) acc.wmape_weighted_sum += (row.wmape || 0) * row.actuals;
// //             return acc;
// //         }, { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0 });

// //         return {
// //             ...total,
// //             count: data.length,
// //             mae: data.length > 0 ? total.mae_sum / data.length : 0,
// //             wmape: total.actuals > 0 ? total.wmape_weighted_sum / total.actuals : 0,
// //         };
// //     }, [data]);

// //     // --- HANDLERS AND HELPERS (MODIFIED) ---

// //     // MODIFIED: Toggles generic levels instead of hardcoded ones
// //     const handleToggleLevel = (level) => {
// //         setExpandedLevels(prev => {
// //             const newLevels = { ...prev };
// //             newLevels[level] = !newLevels[level];
// //             if (level === 'level1' && !newLevels.level1) {
// //                 newLevels.level2 = false;
// //                 newLevels.level3 = false;
// //             }
// //             if (level === 'level2' && !newLevels.level2) {
// //                 newLevels.level3 = false;
// //             }
// //             return newLevels;
// //         });
// //     };
    
// //     // MODIFIED: Sorting now handles dates for 'week' grouping
// //     const sortedLevel1Keys = useMemo(() => {
// //         const keys = Object.keys(groupedData);
// //         if (groupBy === 'week') {
// //             return keys.sort((a, b) => new Date(a) - new Date(b));
// //         }
// //         return keys.sort((a,b) => a.localeCompare(b)); // Standard sort for SKUs and Stores
// //     }, [groupedData, groupBy]);
    
// //     if (!overallSummary) {
// //         return <div className="text-center p-8 text-slate-400">No granular data for the selected filters.</div>;
// //     }

// //     return (
// //         <div className="flex flex-col gap-4">
// //             {/* NEW: UI to change the grouping */}
// //             <div className="flex items-center gap-2 self-start bg-slate-900 p-1 rounded-md">
// //                 <label htmlFor="groupBySelect" className="text-sm font-semibold pl-2">GROUP BY:</label>
// //                 <select 
// //                     id="groupBySelect"
// //                     value={groupBy} 
// //                     onChange={(e) => setGroupBy(e.target.value)}
// //                     className="bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
// //                 >
// //                     <option value="week">Week</option>
// //                     <option value="sku">SKU</option>
// //                     <option value="store">Store</option>
// //                 </select>
// //             </div>

// //             <div className="overflow-x-auto max-h-[600px] border border-slate-700 rounded-lg">
// //                 <table className="w-full text-left text-sm">
// //                     <thead className="sticky top-0 bg-slate-800 border-b-2 border-slate-600">
// //                         <tr>
// //                             {/* MODIFIED: Headers are now dynamic */}
// //                             <th className="p-3 w-[24%]"><HeaderButton level={currentHierarchy.level1} expanded={expandedLevels.level1} onClick={() => handleToggleLevel('level1')} /></th>
// //                             <th className="p-3 w-[24%]"><HeaderButton level={currentHierarchy.level2} expanded={expandedLevels.level2} onClick={() => handleToggleLevel('level2')} disabled={!expandedLevels.level1} /></th>
// //                             <th className="p-3 w-[24%]"><HeaderButton level={currentHierarchy.level3} expanded={expandedLevels.level3} onClick={() => handleToggleLevel('level3')} disabled={!expandedLevels.level2} /></th>
// //                             <th className="p-3 text-right">Actuals</th>
// //                             <th className="p-3 text-right">Forecast</th>
// //                             <th className="p-3 text-right">MAE</th>
// //                             <th className="p-3 text-right">WMAPE</th>
// //                         </tr>
// //                     </thead>
// //                     <tbody>
// //                         {/* LEVEL 0: GRAND TOTAL (Default View) */}
// //                         {!expandedLevels.level1 && (
// //                             <tr className="bg-slate-700/50 font-bold">
// //                                 <td className="p-3" colSpan="3">Overall Summary</td>
// //                                 <td className="p-3 text-right">{formatNum(overallSummary.actuals)}</td>
// //                                 <td className="p-3 text-right">{formatNum(overallSummary.forecast)}</td>
// //                                 <td className="p-3 text-right text-amber-400">{formatNum(overallSummary.mae)}</td>
// //                                 <td className="p-3 text-right text-teal-400">{formatNum(overallSummary.wmape, true)}</td>
// //                             </tr>
// //                         )}
                        
// //                         {/* DYNAMIC HIERARCHY RENDERING */}
// //                         {expandedLevels.level1 && sortedLevel1Keys.map(level1Key => {
// //                             const level1Data = groupedData[level1Key];
// //                             const level1Mae = level1Data.summary.count > 0 ? level1Data.summary.mae_sum / level1Data.summary.count : 0;
// //                             const level1Wmape = level1Data.summary.actuals > 0 ? level1Data.summary.wmape_weighted_sum / level1Data.summary.actuals : 0;
// //                             const sortedLevel2Keys = Object.keys(level1Data.level2s).sort((a, b) => (currentHierarchy.level2 === 'WEEKS' ? new Date(a) - new Date(b) : a.localeCompare(b)));

// //                             return (
// //                                 <React.Fragment key={level1Key}>
// //                                     {/* LEVEL 1 RENDER */}
// //                                     <tr className="bg-slate-700/50 font-bold border-t-4 border-slate-900">
// //                                         <td className="p-3">{level1Key}</td>
// //                                         <td className="p-3" colSpan="2">Overall</td>
// //                                         <td className="p-3 text-right">{formatNum(level1Data.summary.actuals)}</td>
// //                                         <td className="p-3 text-right">{formatNum(level1Data.summary.forecast)}</td>
// //                                         <td className="p-3 text-right text-amber-400">{formatNum(level1Mae)}</td>
// //                                         <td className="p-3 text-right text-teal-400">{formatNum(level1Wmape, true)}</td>
// //                                     </tr>

// //                                     {/* LEVEL 2 RENDER */}
// //                                     {expandedLevels.level2 && sortedLevel2Keys.map(level2Key => {
// //                                         const level2Data = level1Data.level2s[level2Key];
// //                                         const level2Mae = level2Data.summary.count > 0 ? level2Data.summary.mae_sum / level2Data.summary.count : 0;
// //                                         const level2Wmape = level2Data.summary.actuals > 0 ? level2Data.summary.wmape_weighted_sum / level2Data.summary.actuals : 0;
                                        
// //                                         return (
// //                                             <React.Fragment key={`${level1Key}-${level2Key}`}>
// //                                                 <tr className="bg-slate-800/60 border-b border-slate-700">
// //                                                     <td className="p-3 pl-8 text-slate-400">{level1Key}</td>
// //                                                     <td className="p-3">{level2Key}</td>
// //                                                     <td className="p-3">Overall</td>
// //                                                     <td className="p-3 text-right">{formatNum(level2Data.summary.actuals)}</td>
// //                                                     <td className="p-3 text-right">{formatNum(level2Data.summary.forecast)}</td>
// //                                                     <td className="p-3 text-right text-amber-400">{formatNum(level2Mae)}</td>
// //                                                     <td className="p-3 text-right text-teal-400">{formatNum(level2Wmape, true)}</td>
// //                                                 </tr>

// //                                                 {/* LEVEL 3 RENDER */}
// //                                                 {expandedLevels.level3 && level2Data.level3s.map((item, index) => {
// //                                                     const level3Key = item[currentHierarchy.level3Key];
// //                                                     return (
// //                                                         <tr key={`${level1Key}-${level2Key}-${level3Key}-${index}`} className="hover:bg-slate-700/50 border-b border-slate-700 text-xs">
// //                                                             <td className="p-2 pl-8 text-slate-400">{level1Key}</td>
// //                                                             <td className="p-2 pl-8 text-slate-400">{level2Key}</td>
// //                                                             <td className="p-2">{level3Key}</td>
// //                                                             <td className="p-2 text-right">{formatNum(item.actuals)}</td>
// //                                                             <td className="p-2 text-right">{formatNum(item.forecast)}</td>
// //                                                             <td className="p-2 text-right text-amber-400">{formatNum(item.mae)}</td>
// //                                                             <td className="p-2 text-right text-teal-400">{formatNum(item.wmape, true)}</td>
// //                                                         </tr>
// //                                                     );
// //                                                 })}
// //                                             </React.Fragment>
// //                                         );
// //                                     })}
// //                                 </React.Fragment>
// //                             );
// //                         })}
// //                     </tbody>
// //                 </table>
// //             </div>
// //         </div>
// //     );
// // };

// // export default HierarchicalTable;





// import React, { useState, useMemo } from 'react';
// import { FiPlusSquare, FiMinusSquare } from 'react-icons/fi';

// // A helper function to format numbers (unchanged)
// const formatNum = (num, isPercentage = false) => {
//     if (num === null || num === undefined || isNaN(num)) return 'N/A';
//     const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
//     return isPercentage ? `${formatted}%` : formatted;
// };

// // A button component for the table headers (unchanged)
// const HeaderButton = ({ level, expanded, onClick, disabled = false }) => (
//     <button
//         onClick={onClick}
//         disabled={disabled}
//         className="flex items-center gap-2 font-semibold hover:text-indigo-400 transition-colors disabled:text-slate-500 disabled:cursor-not-allowed"
//     >
//         {expanded ? <FiMinusSquare /> : <FiPlusSquare />}
//         <span>{level}</span>
//     </button>
// );

// // Defines the structure and labels for each grouping option
// const HIERARCHY_CONFIG = {
//     week: { level1: 'WEEKS', level2: 'SKU', level3: 'STORES', level3Key: 'store_id' },
//     sku: { level1: 'SKU', level2: 'WEEKS', level3: 'STORES', level3Key: 'store_id' },
//     store: { level1: 'STORES', level2: 'WEEKS', level3: 'SKU', level3Key: 'sku' },
// };


// const HierarchicalTable = ({ data }) => {
//     // NEW: State to control the primary grouping dimension
//     const [groupBy, setGroupBy] = useState('week'); 
    
//     // MODIFIED: State now uses generic level names for clarity
//     const [expandedLevels, setExpandedLevels] = useState({
//         level1: false,
//         level2: false,
//         level3: false,
//     });

//     const currentHierarchy = HIERARCHY_CONFIG[groupBy];

//     // --- DATA AGGREGATION (REFACTORED) ---

//     // MODIFIED: Grouping logic is now dynamic based on the `groupBy` state
//     const groupedData = useMemo(() => {
//         if (!data || data.length === 0) return {};
        
//         // Helper to perform the summary calculation
//         const addToSummary = (summary, row) => {
//             const { actuals, forecast, mae, wmape } = row;
//             summary.actuals += actuals;
//             summary.forecast += forecast;
//             summary.mae_sum += mae || 0;
//             if (actuals > 0) summary.wmape_weighted_sum += (wmape || 0) * actuals;
//             summary.count = (summary.count || 0) + 1;
//         };

//         return data.reduce((acc, row) => {
//             const { week_start, sku, store_id } = row;
//             let level1Key, level2Key, level3Data;

//             // Determine the keys for each level based on the selected `groupBy`
//             switch (groupBy) {
//                 case 'sku':
//                     level1Key = sku;
//                     level2Key = week_start;
//                     level3Data = { store_id, ...row };
//                     break;
//                 case 'store':
//                     level1Key = store_id;
//                     level2Key = week_start;
//                     level3Data = { sku, ...row };
//                     break;
//                 case 'week':
//                 default:
//                     level1Key = week_start;
//                     level2Key = sku;
//                     level3Data = { store_id, ...row };
//                     break;
//             }

//             // Dynamically build the nested structure
//             if (!acc[level1Key]) acc[level1Key] = { level2s: {}, summary: { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0, count: 0 } };
//             if (!acc[level1Key].level2s[level2Key]) acc[level1Key].level2s[level2Key] = { level3s: [], summary: { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0, count: 0 } };

//             // Add the raw data row and update summaries at both levels
//             acc[level1Key].level2s[level2Key].level3s.push(level3Data);
//             addToSummary(acc[level1Key].level2s[level2Key].summary, row);
//             addToSummary(acc[level1Key].summary, row);

//             return acc;
//         }, {});
//     }, [data, groupBy]);

//     // Overall summary logic remains the same
//     const overallSummary = useMemo(() => {
//         if (!data || data.length === 0) return null;
//         const total = data.reduce((acc, row) => {
//             acc.actuals += row.actuals;
//             acc.forecast += row.forecast;
//             acc.mae_sum += row.mae || 0;
//             if (row.actuals > 0) acc.wmape_weighted_sum += (row.wmape || 0) * row.actuals;
//             return acc;
//         }, { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0 });

//         return {
//             ...total,
//             count: data.length,
//             mae: data.length > 0 ? total.mae_sum / data.length : 0,
//             wmape: total.actuals > 0 ? total.wmape_weighted_sum / total.actuals : 0,
//         };
//     }, [data]);

//     // --- HANDLERS AND HELPERS (MODIFIED) ---

//     // MODIFIED: Toggles generic levels instead of hardcoded ones
//     const handleToggleLevel = (level) => {
//         setExpandedLevels(prev => {
//             const newLevels = { ...prev };
//             newLevels[level] = !newLevels[level];
//             if (level === 'level1' && !newLevels.level1) {
//                 newLevels.level2 = false;
//                 newLevels.level3 = false;
//             }
//             if (level === 'level2' && !newLevels.level2) {
//                 newLevels.level3 = false;
//             }
//             return newLevels;
//         });
//     };
    
//     // MODIFIED: Sorting now handles dates for 'week' grouping
//     const sortedLevel1Keys = useMemo(() => {
//         const keys = Object.keys(groupedData);
//         if (groupBy === 'week') {
//             return keys.sort((a, b) => new Date(a) - new Date(b));
//         }
//         return keys.sort((a,b) => a.localeCompare(b)); // Standard sort for SKUs and Stores
//     }, [groupedData, groupBy]);
    
//     if (!overallSummary) {
//         return <div className="text-center p-8 text-slate-400">No granular data for the selected filters.</div>;
//     }

//     return (
//         <div className="flex flex-col gap-4">
//             {/* NEW: UI to change the grouping */}
//             <div className="flex items-center gap-2 self-start bg-slate-900 p-1 rounded-md">
//                 <label htmlFor="groupBySelect" className="text-sm font-semibold pl-2">GROUP BY:</label>
//                 <select 
//                     id="groupBySelect"
//                     value={groupBy} 
//                     onChange={(e) => setGroupBy(e.target.value)}
//                     className="bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//                 >
//                     <option value="week">Week</option>
//                     <option value="sku">SKU</option>
//                     <option value="store">Store</option>
//                 </select>
//             </div>

//             <div className="overflow-x-auto max-h-[600px] border border-slate-700 rounded-lg">
//                 <table className="w-full text-left text-sm">
//                     <thead className="sticky top-0 bg-slate-800 border-b-2 border-slate-600">
//                         <tr>
//                             {/* MODIFIED: Headers are now dynamic */}
//                             <th className="p-3 w-[24%]"><HeaderButton level={currentHierarchy.level1} expanded={expandedLevels.level1} onClick={() => handleToggleLevel('level1')} /></th>
//                             <th className="p-3 w-[24%]"><HeaderButton level={currentHierarchy.level2} expanded={expandedLevels.level2} onClick={() => handleToggleLevel('level2')} disabled={!expandedLevels.level1} /></th>
//                             <th className="p-3 w-[24%]"><HeaderButton level={currentHierarchy.level3} expanded={expandedLevels.level3} onClick={() => handleToggleLevel('level3')} disabled={!expandedLevels.level2} /></th>
//                             <th className="p-3 text-right">Actuals</th>
//                             <th className="p-3 text-right">Forecast</th>
//                             <th className="p-3 text-right">MAE</th>
//                             <th className="p-3 text-right">WMAPE</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {/* LEVEL 0: GRAND TOTAL (Default View) */}
//                         {!expandedLevels.level1 && (
//                             <tr className="bg-slate-700/50 font-bold">
//                                 <td className="p-3" colSpan="3">Overall Summary</td>
//                                 <td className="p-3 text-right">{formatNum(overallSummary.actuals)}</td>
//                                 <td className="p-3 text-right">{formatNum(overallSummary.forecast)}</td>
//                                 <td className="p-3 text-right text-amber-400">{formatNum(overallSummary.mae)}</td>
//                                 <td className="p-3 text-right text-teal-400">{formatNum(overallSummary.wmape, true)}</td>
//                             </tr>
//                         )}
                        
//                         {/* DYNAMIC HIERARCHY RENDERING */}
//                         {expandedLevels.level1 && sortedLevel1Keys.map(level1Key => {
//                             const level1Data = groupedData[level1Key];
//                             const level1Mae = level1Data.summary.count > 0 ? level1Data.summary.mae_sum / level1Data.summary.count : 0;
//                             const level1Wmape = level1Data.summary.actuals > 0 ? level1Data.summary.wmape_weighted_sum / level1Data.summary.actuals : 0;
//                             const sortedLevel2Keys = Object.keys(level1Data.level2s).sort((a, b) => (currentHierarchy.level2 === 'WEEKS' ? new Date(a) - new Date(b) : a.localeCompare(b)));

//                             return (
//                                 <React.Fragment key={level1Key}>
//                                     {/* LEVEL 1 RENDER */}
//                                     <tr className="bg-slate-700/50 font-bold border-t-4 border-slate-900">
//                                         <td className="p-3">{level1Key}</td>
//                                         <td className="p-3" colSpan="2">Overall</td>
//                                         <td className="p-3 text-right">{formatNum(level1Data.summary.actuals)}</td>
//                                         <td className="p-3 text-right">{formatNum(level1Data.summary.forecast)}</td>
//                                         <td className="p-3 text-right text-amber-400">{formatNum(level1Mae)}</td>
//                                         <td className="p-3 text-right text-teal-400">{formatNum(level1Wmape, true)}</td>
//                                     </tr>

//                                     {/* LEVEL 2 RENDER */}
//                                     {expandedLevels.level2 && sortedLevel2Keys.map(level2Key => {
//                                         const level2Data = level1Data.level2s[level2Key];
//                                         const level2Mae = level2Data.summary.count > 0 ? level2Data.summary.mae_sum / level2Data.summary.count : 0;
//                                         const level2Wmape = level2Data.summary.actuals > 0 ? level2Data.summary.wmape_weighted_sum / level2Data.summary.actuals : 0;
                                        
//                                         return (
//                                             <React.Fragment key={`${level1Key}-${level2Key}`}>
//                                                 <tr className="bg-slate-800/60 border-b border-slate-700">
//                                                     <td className="p-3 pl-8 text-slate-400">{level1Key}</td>
//                                                     <td className="p-3">{level2Key}</td>
//                                                     <td className="p-3">Overall</td>
//                                                     <td className="p-3 text-right">{formatNum(level2Data.summary.actuals)}</td>
//                                                     <td className="p-3 text-right">{formatNum(level2Data.summary.forecast)}</td>
//                                                     <td className="p-3 text-right text-amber-400">{formatNum(level2Mae)}</td>
//                                                     <td className="p-3 text-right text-teal-400">{formatNum(level2Wmape, true)}</td>
//                                                 </tr>

//                                                 {/* LEVEL 3 RENDER */}
//                                                 {expandedLevels.level3 && level2Data.level3s.map((item, index) => {
//                                                     const level3Key = item[currentHierarchy.level3Key];
//                                                     return (
//                                                         <tr key={`${level1Key}-${level2Key}-${level3Key}-${index}`} className="hover:bg-slate-700/50 border-b border-slate-700 text-xs">
//                                                             <td className="p-2 pl-8 text-slate-400">{level1Key}</td>
//                                                             <td className="p-2 pl-8 text-slate-400">{level2Key}</td>
//                                                             <td className="p-2">{level3Key}</td>
//                                                             <td className="p-2 text-right">{formatNum(item.actuals)}</td>
//                                                             <td className="p-2 text-right">{formatNum(item.forecast)}</td>
//                                                             <td className="p-2 text-right text-amber-400">{formatNum(item.mae)}</td>
//                                                             <td className="p-2 text-right text-teal-400">{formatNum(item.wmape, true)}</td>
//                                                         </tr>
//                                                     );
//                                                 })}
//                                             </React.Fragment>
//                                         );
//                                     })}
//                                 </React.Fragment>
//                             );
//                         })}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// export default HierarchicalTable;


















































import React, { useState, useMemo } from 'react';
import { FiPlusSquare, FiMinusSquare } from 'react-icons/fi';

// A helper function to format numbers (unchanged)
const formatNum = (num, isPercentage = false) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return isPercentage ? `${formatted}%` : formatted;
};

// A button component for the table headers (unchanged)
const HeaderButton = ({ level, expanded, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center gap-2 font-semibold hover:text-indigo-400 transition-colors disabled:text-slate-500 disabled:cursor-not-allowed"
    >
        {expanded ? <FiMinusSquare /> : <FiPlusSquare />}
        <span>{level}</span>
    </button>
);

// Defines the structure and labels for each grouping option
const HIERARCHY_CONFIG = {
    week: { level1: 'WEEKS', level2: 'SKU', level3: 'STORES', level3Key: 'store_id' },
    sku: { level1: 'SKU', level2: 'WEEKS', level3: 'STORES', level3Key: 'store_id' },
    store: { level1: 'STORES', level2: 'WEEKS', level3: 'SKU', level3Key: 'sku' },
};


const HierarchicalTable = ({ data }) => {
    // NEW: State to control the primary grouping dimension
    const [groupBy, setGroupBy] = useState('week'); 
    
    // MODIFIED: State now uses generic level names for clarity
    const [expandedLevels, setExpandedLevels] = useState({
        level1: false,
        level2: false,
        level3: false,
    });

    const currentHierarchy = HIERARCHY_CONFIG[groupBy];

    // --- DATA AGGREGATION (REFACTORED) ---

    // MODIFIED: Grouping logic is now dynamic based on the `groupBy` state
    const groupedData = useMemo(() => {
        if (!data || data.length === 0) return {};
        
        // Helper to perform the summary calculation
        const addToSummary = (summary, row) => {
            const { actuals, forecast, mae, wmape } = row;
            summary.actuals += actuals;
            summary.forecast += forecast;
            summary.mae_sum += mae || 0;
            if (actuals > 0) summary.wmape_weighted_sum += (wmape || 0) * actuals;
            summary.count = (summary.count || 0) + 1;
        };

        return data.reduce((acc, row) => {
            const { week_start, sku, store_id } = row;
            let level1Key, level2Key, level3Data;

            // Determine the keys for each level based on the selected `groupBy`
            switch (groupBy) {
                case 'sku':
                    level1Key = sku;
                    level2Key = week_start;
                    level3Data = { store_id, ...row };
                    break;
                case 'store':
                    level1Key = store_id;
                    level2Key = week_start;
                    level3Data = { sku, ...row };
                    break;
                case 'week':
                default:
                    level1Key = week_start;
                    level2Key = sku;
                    level3Data = { store_id, ...row };
                    break;
            }

            // Dynamically build the nested structure
            if (!acc[level1Key]) acc[level1Key] = { level2s: {}, summary: { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0, count: 0 } };
            if (!acc[level1Key].level2s[level2Key]) acc[level1Key].level2s[level2Key] = { level3s: [], summary: { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0, count: 0 } };

            // Add the raw data row and update summaries at both levels
            acc[level1Key].level2s[level2Key].level3s.push(level3Data);
            addToSummary(acc[level1Key].level2s[level2Key].summary, row);
            addToSummary(acc[level1Key].summary, row);

            return acc;
        }, {});
    }, [data, groupBy]);

    // Overall summary logic remains the same
    const overallSummary = useMemo(() => {
        if (!data || data.length === 0) return null;
        const total = data.reduce((acc, row) => {
            acc.actuals += row.actuals;
            acc.forecast += row.forecast;
            acc.mae_sum += row.mae || 0;
            if (row.actuals > 0) acc.wmape_weighted_sum += (row.wmape || 0) * row.actuals;
            return acc;
        }, { actuals: 0, forecast: 0, mae_sum: 0, wmape_weighted_sum: 0 });

        return {
            ...total,
            count: data.length,
            mae: data.length > 0 ? total.mae_sum / data.length : 0,
            wmape: total.actuals > 0 ? total.wmape_weighted_sum / total.actuals : 0,
        };
    }, [data]);

    // --- HANDLERS AND HELPERS (MODIFIED) ---

    // MODIFIED: Toggles generic levels instead of hardcoded ones
    const handleToggleLevel = (level) => {
        setExpandedLevels(prev => {
            const newLevels = { ...prev };
            newLevels[level] = !newLevels[level];
            if (level === 'level1' && !newLevels.level1) {
                newLevels.level2 = false;
                newLevels.level3 = false;
            }
            if (level === 'level2' && !newLevels.level2) {
                newLevels.level3 = false;
            }
            return newLevels;
        });
    };
    
    // MODIFIED: Sorting now handles dates for 'week' grouping
    const sortedLevel1Keys = useMemo(() => {
        const keys = Object.keys(groupedData);
        if (groupBy === 'week') {
            return keys.sort((a, b) => new Date(a) - new Date(b));
        }
        return keys.sort((a,b) => a.localeCompare(b)); // Standard sort for SKUs and Stores
    }, [groupedData, groupBy]);
    
    if (!overallSummary) {
        return <div className="text-center p-8 text-slate-400">No granular data for the selected filters.</div>;
    }

    return (
        <div className="flex flex-col gap-4">
            {/* NEW: UI to change the grouping */}
            <div className="flex items-center gap-2 self-start bg-slate-900 p-1 rounded-md">
                <label htmlFor="groupBySelect" className="text-sm font-semibold pl-2">GROUP BY:</label>
                <select 
                    id="groupBySelect"
                    value={groupBy} 
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                    <option value="week">Week</option>
                    <option value="sku">SKU</option>
                    <option value="store">Store</option>
                </select>
            </div>

            <div className="overflow-x-auto max-h-[600px] border border-slate-700 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-800 border-b-2 border-slate-600">
                        <tr>
                            {/* MODIFIED: Headers are now dynamic */}
                            <th className="p-3 w-[24%]"><HeaderButton level={currentHierarchy.level1} expanded={expandedLevels.level1} onClick={() => handleToggleLevel('level1')} /></th>
                            <th className="p-3 w-[24%]"><HeaderButton level={currentHierarchy.level2} expanded={expandedLevels.level2} onClick={() => handleToggleLevel('level2')} disabled={!expandedLevels.level1} /></th>
                            <th className="p-3 w-[24%]"><HeaderButton level={currentHierarchy.level3} expanded={expandedLevels.level3} onClick={() => handleToggleLevel('level3')} disabled={!expandedLevels.level2} /></th>
                            <th className="p-3 text-right">Actuals</th>
                            <th className="p-3 text-right">Forecast</th>
                            <th className="p-3 text-right">MAE</th>
                            <th className="p-3 text-right">WMAPE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* LEVEL 0: GRAND TOTAL (Default View) */}
                        {!expandedLevels.level1 && (
                            <tr className="bg-slate-700/50 font-bold">
                                <td className="p-3" colSpan="3">Overall Summary</td>
                                <td className="p-3 text-right">{formatNum(overallSummary.actuals)}</td>
                                <td className="p-3 text-right">{formatNum(overallSummary.forecast)}</td>
                                <td className="p-3 text-right text-amber-400">{formatNum(overallSummary.mae)}</td>
                                <td className="p-3 text-right text-teal-400">{formatNum(overallSummary.wmape, true)}</td>
                            </tr>
                        )}
                        
                        {/* DYNAMIC HIERARCHY RENDERING */}
                        {expandedLevels.level1 && sortedLevel1Keys.map(level1Key => {
                            const level1Data = groupedData[level1Key];
                            const level1Mae = level1Data.summary.count > 0 ? level1Data.summary.mae_sum / level1Data.summary.count : 0;
                            const level1Wmape = level1Data.summary.actuals > 0 ? level1Data.summary.wmape_weighted_sum / level1Data.summary.actuals : 0;
                            const sortedLevel2Keys = Object.keys(level1Data.level2s).sort((a, b) => (currentHierarchy.level2 === 'WEEKS' ? new Date(a) - new Date(b) : a.localeCompare(b)));

                            return (
                                <React.Fragment key={level1Key}>
                                    {/* LEVEL 1 RENDER */}
                                    <tr className="bg-slate-700/50 font-bold border-t-4 border-slate-900">
                                        <td className="p-3">{level1Key}</td>
                                        <td className="p-3" colSpan="2">Overall</td>
                                        <td className="p-3 text-right">{formatNum(level1Data.summary.actuals)}</td>
                                        <td className="p-3 text-right">{formatNum(level1Data.summary.forecast)}</td>
                                        <td className="p-3 text-right text-amber-400">{formatNum(level1Mae)}</td>
                                        <td className="p-3 text-right text-teal-400">{formatNum(level1Wmape, true)}</td>
                                    </tr>

                                    {/* LEVEL 2 RENDER */}
                                    {expandedLevels.level2 && sortedLevel2Keys.map(level2Key => {
                                        const level2Data = level1Data.level2s[level2Key];
                                        const level2Mae = level2Data.summary.count > 0 ? level2Data.summary.mae_sum / level2Data.summary.count : 0;
                                        const level2Wmape = level2Data.summary.actuals > 0 ? level2Data.summary.wmape_weighted_sum / level2Data.summary.actuals : 0;
                                        
                                        return (
                                            <React.Fragment key={`${level1Key}-${level2Key}`}>
                                                <tr className="bg-slate-800/60 border-b border-slate-700">
                                                    <td className="p-3 pl-8 text-slate-400">{level1Key}</td>
                                                    <td className="p-3">{level2Key}</td>
                                                    <td className="p-3">Overall</td>
                                                    <td className="p-3 text-right">{formatNum(level2Data.summary.actuals)}</td>
                                                    <td className="p-3 text-right">{formatNum(level2Data.summary.forecast)}</td>
                                                    <td className="p-3 text-right text-amber-400">{formatNum(level2Mae)}</td>
                                                    <td className="p-3 text-right text-teal-400">{formatNum(level2Wmape, true)}</td>
                                                </tr>

                                                {/* LEVEL 3 RENDER */}
                                                {expandedLevels.level3 && level2Data.level3s.map((item, index) => {
                                                    const level3Key = item[currentHierarchy.level3Key];
                                                    return (
                                                        <tr key={`${level1Key}-${level2Key}-${level3Key}-${index}`} className="hover:bg-slate-700/50 border-b border-slate-700 text-xs">
                                                            <td className="p-2 pl-8 text-slate-400">{level1Key}</td>
                                                            <td className="p-2 pl-8 text-slate-400">{level2Key}</td>
                                                            <td className="p-2">{level3Key}</td>
                                                            <td className="p-2 text-right">{formatNum(item.actuals)}</td>
                                                            <td className="p-2 text-right">{formatNum(item.forecast)}</td>
                                                            <td className="p-2 text-right text-amber-400">{formatNum(item.mae)}</td>
                                                            <td className="p-2 text-right text-teal-400">{formatNum(item.wmape, true)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HierarchicalTable;