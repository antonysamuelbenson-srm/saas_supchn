// import React from 'react';
// import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // --- START: The Fix for 'require is not defined' ---
// // We import the image URLs using the modern ESM 'import' syntax
// import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// import iconUrl from 'leaflet/dist/images/marker-icon.png';
// import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// // Now we use the imported variables to configure the default icon
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: iconRetinaUrl,
//     iconUrl: iconUrl,
//     shadowUrl: shadowUrl,
// });
// // --- END: The Fix ---

// const TransferMap = ({ summaryData }) => {
//   if (!summaryData || summaryData.length === 0) {
//     return null; 
//   }

//   const allCoords = summaryData.flatMap(d => [d.source_coords, d.destination_coords]);
//   const centerLat = allCoords.reduce((sum, coords) => sum + coords[0], 0) / allCoords.length;
//   const centerLon = allCoords.reduce((sum, coords) => sum + coords[1], 0) / allCoords.length;
//   const centerPosition = [centerLat, centerLon];

//   const locations = new Map();
//   summaryData.forEach(item => {
//     locations.set(item.src, item.source_coords);
//     locations.set(item.dest, item.destination_coords);
//   });
  
//   const uniqueLocations = Array.from(locations.entries());

//   return (
//     <div className="rounded-lg overflow-hidden border border-slate-700 h-96 w-full">
//       <MapContainer center={centerPosition} zoom={5} style={{ height: '100%', width: '100%' }}>
//         <TileLayer
//           url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
//         />
        
//         {summaryData.map((transfer, index) => (
//           <Polyline
//             key={index}
//             positions={[transfer.source_coords, transfer.destination_coords]}
//             pathOptions={{ color: '#2563EB', weight: 2, opacity: 0.7 }}
//           />
//         ))}

//         {uniqueLocations.map(([name, coords]) => (
//           <Marker key={name} position={coords}>
//             <Popup>{name}</Popup>
//           </Marker>
//         ))}
//       </MapContainer>
//     </div>
//   );
// };

// export default TransferMap;









// import React, { useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // --- Icon Fix (no changes here) ---
// import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// import iconUrl from 'leaflet/dist/images/marker-icon.png';
// import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: iconRetinaUrl,
//     iconUrl: iconUrl,
//     shadowUrl: shadowUrl,
// });
// // --- End Icon Fix ---

// // --- NEW: CSS Styles and Animation ---
// // This component injects a <style> tag into the document's head with our animation rules.
// const AnimationStyles = () => {
//   const styles = `
//     .animated-ant-path {
//       stroke-dasharray: 10, 20;
//       stroke-linecap: round;
//       animation: ant-path-animation 1.5s linear infinite;
//     }

//     @keyframes ant-path-animation {
//       from {
//         stroke-dashoffset: 0;
//       }
//       to {
//         stroke-dashoffset: -30;
//       }
//     }
//   `;
//   return <style>{styles}</style>;
// };

// // This helper component automatically resizes the map to fit the markers.
// const MapEffect = ({ bounds }) => {
//     const map = useMap();
//     useEffect(() => {
//         if (bounds.isValid()) {
//             map.fitBounds(bounds, { padding: [50, 50] });
//         }
//     }, [map, bounds]);
//     return null;
// };

// const TransferMap = ({ summaryData }) => {
//   if (!summaryData || summaryData.length === 0) {
//     return null; 
//   }

//   const allCoords = summaryData.flatMap(d => [d.source_coords, d.destination_coords]);
//   const bounds = L.latLngBounds(allCoords);

//   const locations = new Map();
//   summaryData.forEach(item => {
//     locations.set(item.src, item.source_coords);
//     locations.set(item.dest, item.destination_coords);
//   });
  
//   const uniqueLocations = Array.from(locations.entries());

//   return (
//     <div className="rounded-lg overflow-hidden border border-slate-700 h-96 w-full">
//       {/* NEW: Add the AnimationStyles component here */}
//       <AnimationStyles />

//       <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }}>
//         <TileLayer
//           url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
//         />

//         <MapEffect bounds={bounds} />
        
//         {summaryData.map((transfer, index) => (
//           <Polyline
//             key={index}
//             positions={[transfer.source_coords, transfer.destination_coords]}
//             className="animated-ant-path" 
//             pathOptions={{ color: '#2563EB', weight: 3 }}
//           />
//         ))}

//         {uniqueLocations.map(([name, coords]) => (
//           <Marker key={name} position={coords}>
//             <Popup>{name}</Popup>
//           </Marker>
//         ))}
//       </MapContainer>
//     </div>
//   );
// };

// export default TransferMap;

// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // --- Icon Fix (Standard Leaflet Markers) ---
// import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// import iconUrl from 'leaflet/dist/images/marker-icon.png';
// import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: iconRetinaUrl,
//     iconUrl: iconUrl,
//     shadowUrl: shadowUrl,
// });

// // --- Truck Icon ---
// import truckIconSvg from '../assets/truck.svg';

// const customTruckIcon = L.icon({
//   iconUrl: truckIconSvg,
//   iconSize: [25, 25],
//   iconAnchor: [12, 12],
//   popupAnchor: [0, -10]
// });

// // --- CSS Styles for Line Animation and Tooltips ---
// const DynamicStyles = () => {
//   const styles = `
//     .animated-ant-path {
//       stroke-dasharray: 10, 20;
//       stroke-linecap: round;
//       animation: ant-path-animation 1.5s linear infinite;
//     }

//     @keyframes ant-path-animation {
//       from {
//         stroke-dashoffset: 0;
//       }
//       to {
//         stroke-dashoffset: -30;
//       }
//     }

//     .leaflet-popup-content-wrapper {
//       background-color: #2D3748;
//       color: #E2E8F0;
//       border-radius: 0.5rem;
//       box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
//     }
//     .leaflet-popup-content {
//       padding: 1rem;
//       font-family: 'Inter', sans-serif;
//       font-size: 0.875rem;
//     }
//     .leaflet-popup-tip {
//       background: #2D3748;
//     }
//     .leaflet-popup-close-button {
//       color: #CBD5E0;
//     }
//     .leaflet-popup-close-button:hover {
//       color: #F8FAFC;
//     }
//     .transfer-tooltip p {
//       margin-bottom: 0.25rem;
//     }
//     .transfer-tooltip strong {
//       color: #63B3ED;
//     }
//     .transfer-tooltip span {
//       color: #A0AEC0;
//     }
//   `;
//   return <style>{styles}</style>;
// };

// // --- Helper component to fit map bounds ---
// const MapBoundsAdjuster = ({ bounds }) => {
//     const map = useMap();
//     useEffect(() => {
//         // The isValid check is good practice.
//         if (bounds && bounds.isValid()) {
//             map.fitBounds(bounds, { padding: [70, 70] });
//         }
//     }, [map, bounds]);
//     return null;
// };

// // --- Main TransferMap Component ---
// const TransferMap = ({ summaryData }) => {
//   const [hoveredTransfer, setHoveredTransfer] = useState(null);
//   const truckPositionsRef = useRef([]); // Initialize as empty array

//   const interpolatePoint = useCallback((start, end, fraction) => {
//     const lat = start[0] + (end[0] - start[0]) * fraction;
//     const lng = start[1] + (end[1] - start[1]) * fraction;
//     return [lat, lng];
//   }, []);

//   // --- START: FIX ---
//   // Guard Clause 1: Handle null, undefined, or empty summaryData array.
//   if (!summaryData || summaryData.length === 0) {
//     return (
//         <div className="rounded-lg border border-slate-700 h-96 w-full flex items-center justify-center bg-slate-800 text-slate-400">
//             <p>No transfer data available to display.</p>
//         </div>
//     );
//   }

//   // Guard Clause 2: Filter coordinates to ensure they are valid before creating bounds.
//   const allCoords = summaryData
//     .flatMap(d => [d.source_coords, d.destination_coords])
//     .filter(coords => Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]));

//   // Guard Clause 3: If, after filtering, there are no valid coordinates, do not render the map.
//   if (allCoords.length === 0) {
//       return (
//           <div className="rounded-lg border border-slate-700 h-96 w-full flex items-center justify-center bg-slate-800 text-slate-400">
//               <p>Transfer data is present but contains no valid geographic coordinates.</p>
//           </div>
//       );
//   }
//   // --- END: FIX ---

//   const bounds = L.latLngBounds(allCoords);

//   const locations = new Map();
//   summaryData.forEach(item => {
//     // Only add locations with valid coordinates
//     if (item.source_coords) locations.set(item.src, item.source_coords);
//     if (item.destination_coords) locations.set(item.dest, item.destination_coords);
//   });
  
//   const uniqueLocations = Array.from(locations.entries());

//   // Effect for animating the trucks (put after all early returns)
//   useEffect(() => {
//     // We already know summaryData has length > 0 here
//     truckPositionsRef.current = summaryData.map(() => [0, 0]); // Initialize positions
//     let animationFrameId;
//     const startTime = performance.now();
//     const duration = 5000;

//     const animateTrucks = (currentTime) => {
//       const elapsedTime = currentTime - startTime;
//       const progress = (elapsedTime % duration) / duration;

//       const newPositions = summaryData.map(transfer => {
//         // Ensure coordinates are valid before interpolating
//         if (transfer.source_coords && transfer.destination_coords) {
//             return interpolatePoint(transfer.source_coords, transfer.destination_coords, progress);
//         }
//         return null; // Return null for invalid data
//       });
//       truckPositionsRef.current = newPositions.filter(Boolean); // Filter out nulls
      
//       // A simple way to trigger re-render for the animation frame
//       setHoveredTransfer(prev => prev);
      
//       animationFrameId = requestAnimationFrame(animateTrucks);
//     };

//     animationFrameId = requestAnimationFrame(animateTrucks);

//     return () => {
//       cancelAnimationFrame(animationFrameId);
//     };
//   }, [summaryData, interpolatePoint]);

//   return (
//     <div className="rounded-lg overflow-hidden border border-slate-700 h-96 w-full relative">
//       <DynamicStyles />

//       <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }}>
//         <TileLayer
//           url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
//         />

//         <MapBoundsAdjuster bounds={bounds} />
        
//         {summaryData.map((transfer, index) => (
//           // Only render the polyline if coordinates are valid
//           (transfer.source_coords && transfer.destination_coords) && (
//             <React.Fragment key={`transfer-${index}`}>
//               <Polyline
//                 positions={[transfer.source_coords, transfer.destination_coords]}
//                 className="animated-ant-path" 
//                 pathOptions={{ 
//                   color: hoveredTransfer === index ? '#F59E0B' : '#2563EB',
//                   weight: hoveredTransfer === index ? 5 : 3,
//                   opacity: 0.8
//                 }}
//                 eventHandlers={{
//                   mouseover: (e) => {
//                     setHoveredTransfer(index);
//                     e.target.openPopup();
//                   },
//                   mouseout: (e) => {
//                     setHoveredTransfer(null);
//                     e.target.closePopup();
//                   },
//                 }}
//               >
//                 <Popup>
//                   <div className="transfer-tooltip">
//                     <p><strong>Transfer:</strong> <span>{transfer.src}</span> to <span>{transfer.dest}</span></p>
//                     <p><strong>Total Units:</strong> <span>{transfer.total_units.toLocaleString()}</span></p>
//                     <p><strong>Distinct SKUs:</strong> <span>{transfer.distinct_skus}</span></p>
//                   </div>
//                 </Popup>
//               </Polyline>

//               {truckPositionsRef.current[index] && (
//                 <Marker 
//                   position={truckPositionsRef.current[index]} 
//                   icon={customTruckIcon} 
//                   zIndexOffset={1000}
//                 />
//               )}
//             </React.Fragment>
//           )
//         ))}

//         {uniqueLocations.map(([name, coords]) => (
//           // Final check for valid coords before rendering marker
//           coords && <Marker key={`location-${name}`} position={coords}>
//             <Popup>{name}</Popup>
//           </Marker>
//         ))}
//       </MapContainer>
//     </div>
//   );
// };

// export default TransferMap;

// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import { FiMaximize, FiMinimize, FiRefreshCw } from 'react-icons/fi';

// // --- Leaflet Icon Fix ---
// import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// import iconUrl from 'leaflet/dist/images/marker-icon.png';
// import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: iconRetinaUrl,
//     iconUrl: iconUrl,
//     shadowUrl: shadowUrl,
// });
// // --- End Icon Fix ---


// // --- HELPER COMPONENTS ---

// const MapControls = ({ bounds, isExpanded, setIsExpanded }) => {
//   const map = useMap();
//   const handleResetView = () => {
//     if (bounds && bounds.isValid()) {
//       map.fitBounds(bounds);
//     }
//   };

//   return (
//     <div className="absolute top-2 right-2 z-[1000] flex flex-col space-y-2">
//       <button
//         onClick={handleResetView}
//         className="p-2 bg-white text-slate-800 rounded-md shadow-md hover:bg-slate-100 transition-colors"
//         aria-label="Reset map view"
//       >
//         <FiRefreshCw size={18} />
//       </button>
//       <button
//         onClick={() => setIsExpanded(!isExpanded)}
//         className="p-2 bg-white text-slate-800 rounded-md shadow-md hover:bg-slate-100 transition-colors"
//         aria-label={isExpanded ? 'Minimize map' : 'Expand map'}
//       >
//         {isExpanded ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
//       </button>
//     </div>
//   );
// };

// const MapResizer = ({ isExpanded }) => {
//   const map = useMap();
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       map.invalidateSize();
//     }, 400);
//     return () => clearTimeout(timer);
//   }, [isExpanded, map]);
//   return null;
// };

// /**
//  * --- START: THIS IS THE FIX ---
//  * Helper to calculate points for a curved line (Bézier curve).
//  * This version ensures the curve's bend direction is consistent,
//  * regardless of the start/end point order, fixing the overlap bug.
//  */
// const getCurvedPath = (start, end, curvature) => {
//     // 1. Determine a consistent order for points to calculate a predictable offset direction.
//     // We sort by longitude to ensure the "lesser" point is always first.
//     const consistentStart = start[1] < end[1] ? start : end;
//     const consistentEnd = start[1] < end[1] ? end : start;

//     const latlng1 = L.latLng(consistentStart);
//     const latlng2 = L.latLng(consistentEnd);

//     const offsetX = latlng2.lng - latlng1.lng;
//     const offsetY = latlng2.lat - latlng1.lat;
//     const mid = L.latLng(latlng1.lat + offsetY / 2, latlng1.lng + offsetX / 2);

//     // 2. The control point is calculated from these consistent points.
//     // A positive curvature will now always offset in the same geographic direction.
//     const controlPoint = L.latLng(
//         mid.lat - offsetX * curvature,
//         mid.lng + offsetY * curvature
//     );

//     // 3. The actual curve is drawn using the original start and end points.
//     const actualStart = L.latLng(start);
//     const actualEnd = L.latLng(end);

//     const points = [];
//     for (let i = 0; i <= 50; i++) {
//         const t = i / 50.0;
//         const lat = (1 - t) * (1 - t) * actualStart.lat + 2 * (1 - t) * t * controlPoint.lat + t * t * actualEnd.lat;
//         const lng = (1 - t) * (1 - t) * actualStart.lng + 2 * (1 - t) * t * controlPoint.lng + t * t * actualEnd.lng;
//         points.push([lat, lng]);
//     }
//     return points;
// };
// // --- END: THIS IS THE FIX ---


// // --- MAIN TRANSFER MAP COMPONENT ---
// const TransferMap = ({ summaryData }) => {
//     const [hoveredTransfer, setHoveredTransfer] = useState(null);
//     const [isExpanded, setIsExpanded] = useState(false);

//     // Guard Clauses for Data Integrity
//     if (!summaryData || summaryData.length === 0) return null;
//     const allCoords = summaryData
//         .flatMap(d => [d.source_coords, d.destination_coords])
//         .filter(coords => Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]));
//     if (allCoords.length === 0) return null;

//     const bounds = L.latLngBounds(allCoords);

//     // Logic for Overlapping Lines (No changes needed here)
//     const pathCurvatures = {};
//     const pathCounts = {};
//     summaryData.forEach((transfer, index) => {
//         const { src, dest } = transfer;
//         const pathKey = [src, dest].sort().join('-');
//         pathCounts[pathKey] = (pathCounts[pathKey] || 0) + 1;
//         const count = pathCounts[pathKey];
//         const curvature = -0.125 * count;
//         pathCurvatures[index] = curvature;
//     });
    
//     const locations = new Map();
//     summaryData.forEach(item => {
//         if (item.source_coords) locations.set(item.src, item.source_coords);
//         if (item.destination_coords) locations.set(item.dest, item.destination_coords);
//     });
//     const uniqueLocations = Array.from(locations.entries());

//     return (
//         <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'fixed inset-0 z-50 p-4 bg-black bg-opacity-70' : 'relative h-96 w-full'}`}>
//             <div className="rounded-lg overflow-hidden border border-slate-300 h-full w-full bg-slate-100">
//                 <MapContainer
//                     bounds={bounds}
//                     style={{ height: '100%', width: '100%', backgroundColor: '#F8FAFC' }}
//                     worldCopyJump={false}
//                 >
//                     <TileLayer
//                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                     />
//                     <MapResizer isExpanded={isExpanded} />
//                     <MapControls bounds={bounds} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />

//                     {summaryData.map((transfer, index) => {
//                         if (!transfer.source_coords || !transfer.destination_coords) return null;

//                         const curvedPath = getCurvedPath(
//                             transfer.source_coords,
//                             transfer.destination_coords,
//                             pathCurvatures[index]
//                         );
                        
//                         return (
//                             <Polyline
//                                 key={`transfer-${index}`}
//                                 positions={curvedPath}
//                                 pathOptions={{
//                                     color: hoveredTransfer === index ? '#F59E0B' : '#2563EB',
//                                     weight: hoveredTransfer === index ? 4 : 2.5,
//                                     opacity: 0.95
//                                 }}
//                                 eventHandlers={{
//                                     mouseover: (e) => { setHoveredTransfer(index); e.target.openPopup(); },
//                                     mouseout: (e) => { setHoveredTransfer(null); e.target.closePopup(); },
//                                 }}
//                             >
//                                 <Popup>
//                                     <div className="font-sans text-sm bg-white text-slate-700 p-1 rounded-md shadow-none border-none">
//                                         <p className="mb-1"><strong>Transfer:</strong> {transfer.src} to {transfer.dest}</p>
//                                         <p className="mb-1"><strong>Units:</strong> {transfer.total_units.toLocaleString()}</p>
//                                         <p><strong>SKUs:</strong> {transfer.distinct_skus}</p>
//                                     </div>
//                                 </Popup>
//                             </Polyline>
//                         );
//                     })}
                    
//                     {uniqueLocations.map(([name, coords]) => (
//                         coords && <Marker key={`location-${name}`} position={coords}><Popup>{name}</Popup></Marker>
//                     ))}
//                 </MapContainer>
//             </div>
//         </div>
//     );
// };

// export default TransferMap;

// import React, { useState, useEffect, Fragment } from 'react';
// import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import { FiMaximize, FiMinimize, FiRefreshCw } from 'react-icons/fi';

// // --- Leaflet Icon Fix ---
// import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// import iconUrl from 'leaflet/dist/images/marker-icon.png';
// import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: iconRetinaUrl,
//     iconUrl: iconUrl,
//     shadowUrl: shadowUrl,
// });
// // --- End Icon Fix ---


// // --- HELPER COMPONENTS ---

// const AnimationStyles = () => {
//   const styles = `
//     .ant-path {
//       stroke-dasharray: 8, 12;
//       animation: ant-path-flow 1s linear infinite;
//     }

//     @keyframes ant-path-flow {
//       from {
//         stroke-dashoffset: 20;
//       }
//       to {
//         stroke-dashoffset: 0;
//       }
//     }
//   `;
//   return <style>{styles}</style>;
// };

// const MapControls = ({ bounds, isExpanded, setIsExpanded }) => {
//   const map = useMap();
//   const handleResetView = () => {
//     if (bounds && bounds.isValid()) {
//       map.fitBounds(bounds);
//     }
//   };

//   return (
//     <div className="absolute top-2 right-2 z-[1000] flex flex-col space-y-2">
//       <button
//         onClick={handleResetView}
//         className="p-2 bg-white text-slate-800 rounded-md shadow-md hover:bg-slate-100 transition-colors"
//         aria-label="Reset map view"
//       >
//         <FiRefreshCw size={18} />
//       </button>
//       <button
//         onClick={() => setIsExpanded(!isExpanded)}
//         className="p-2 bg-white text-slate-800 rounded-md shadow-md hover:bg-slate-100 transition-colors"
//         aria-label={isExpanded ? 'Minimize map' : 'Expand map'}
//       >
//         {isExpanded ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
//       </button>
//     </div>
//   );
// };

// const MapResizer = ({ isExpanded }) => {
//   const map = useMap();
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       map.invalidateSize();
//     }, 400);
//     return () => clearTimeout(timer);
//   }, [isExpanded, map]);
//   return null;
// };

// const getCurvedPath = (start, end, curvature) => {
//     const consistentStart = start[1] < end[1] ? start : end;
//     const consistentEnd = start[1] < end[1] ? end : start;
//     const latlng1 = L.latLng(consistentStart);
//     const latlng2 = L.latLng(consistentEnd);
//     const offsetX = latlng2.lng - latlng1.lng;
//     const offsetY = latlng2.lat - latlng1.lat;
//     const mid = L.latLng(latlng1.lat + offsetY / 2, latlng1.lng + offsetX / 2);
//     const controlPoint = L.latLng(
//         mid.lat - offsetX * curvature,
//         mid.lng + offsetY * curvature
//     );
//     const actualStart = L.latLng(start);
//     const actualEnd = L.latLng(end);
//     const points = [];
//     for (let i = 0; i <= 50; i++) {
//         const t = i / 50.0;
//         const lat = (1 - t) * (1 - t) * actualStart.lat + 2 * (1 - t) * t * controlPoint.lat + t * t * actualEnd.lat;
//         const lng = (1 - t) * (1 - t) * actualStart.lng + 2 * (1 - t) * t * controlPoint.lng + t * t * actualEnd.lng;
//         points.push([lat, lng]);
//     }
//     return points;
// };


// // --- MAIN TRANSFER MAP COMPONENT ---
// const TransferMap = ({ summaryData }) => {
//     const [hoveredTransfer, setHoveredTransfer] = useState(null);
//     const [isExpanded, setIsExpanded] = useState(false);

//     if (!summaryData || summaryData.length === 0) return null;
//     const allCoords = summaryData
//         .flatMap(d => [d.source_coords, d.destination_coords])
//         .filter(coords => Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]));
//     if (allCoords.length === 0) return null;

//     const bounds = L.latLngBounds(allCoords);

//     const pathCurvatures = {};
//     const pathCounts = {};
//     summaryData.forEach((transfer, index) => {
//         const { src, dest } = transfer;
//         const pathKey = [src, dest].sort().join('-');
//         pathCounts[pathKey] = (pathCounts[pathKey] || 0) + 1;
//         const count = pathCounts[pathKey];
//         const curvature = -0.125 * count;
//         pathCurvatures[index] = curvature;
//     });
    
//     const locations = new Map();
//     summaryData.forEach(item => {
//         if (item.source_coords) locations.set(item.src, item.source_coords);
//         if (item.destination_coords) locations.set(item.dest, item.destination_coords);
//     });
//     const uniqueLocations = Array.from(locations.entries());

//     return (
//         <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'fixed inset-0 z-50 p-4 bg-black bg-opacity-70' : 'relative h-96 w-full'}`}>
//             <AnimationStyles />
//             <div className="rounded-lg overflow-hidden border border-slate-300 h-full w-full bg-slate-100">
//                 <MapContainer
//                     bounds={bounds}
//                     style={{ height: '100%', width: '100%', backgroundColor: '#F8FAFC' }}
//                     worldCopyJump={false}
//                 >
//                     <TileLayer
//                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                     />
//                     <MapResizer isExpanded={isExpanded} />
//                     <MapControls bounds={bounds} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />

//                     {summaryData.map((transfer, index) => {
//                         if (!transfer.source_coords || !transfer.destination_coords) return null;

//                         const curvedPath = getCurvedPath(
//                             transfer.source_coords,
//                             transfer.destination_coords,
//                             pathCurvatures[index]
//                         );
                        
//                         return (
//                             <Fragment key={`transfer-${index}`}>
//                                 {/* 1. The Invisible "Ghost Line" for easy hovering */}
//                                 <Polyline
//                                     positions={curvedPath}
//                                     pathOptions={{
//                                         color: 'transparent',
//                                         weight: 20, // Thick and invisible for a large hover target
//                                     }}
//                                     eventHandlers={{
//                                         mouseover: (e) => { setHoveredTransfer(index); e.target.openPopup(); },
//                                         mouseout: (e) => { setHoveredTransfer(null); e.target.closePopup(); },
//                                     }}
//                                 >
//                                     <Popup>
//                                         <div className="font-sans text-sm bg-white text-slate-700 p-1 rounded-md shadow-none border-none">
//                                             <p className="mb-1"><strong>Transfer:</strong> {transfer.src} to {transfer.dest}</p>
//                                             <p className="mb-1"><strong>Units:</strong> {transfer.total_units.toLocaleString()}</p>
//                                             <p><strong>SKUs:</strong> {transfer.distinct_skus}</p>
//                                         </div>
//                                     </Popup>
//                                 </Polyline>

//                                 {/* 2. The Visible, Animated Line */}
//                                 <Polyline
//                                     positions={curvedPath}
//                                     className="ant-path"
//                                     pathOptions={{
//                                         color: hoveredTransfer === index ? '#F59E0B' : '#2563EB',
//                                         weight: hoveredTransfer === index ? 4 : 3,
//                                         opacity: 0.95,
//                                         interactive: false, // This line ignores mouse events
//                                     }}
//                                 />
//                             </Fragment>
//                         );
//                     })}
                    
//                     {uniqueLocations.map(([name, coords]) => (
//                         coords && <Marker key={`location-${name}`} position={coords}><Popup>{name}</Popup></Marker>
//                     ))}
//                 </MapContainer>
//             </div>
//         </div>
//     );
// };

// export default TransferMap;


import React, { useState, useEffect, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FiMaximize, FiMinimize, FiRefreshCw } from 'react-icons/fi';

// --- Leaflet Icon Fix ---
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
});
// --- End Icon Fix ---


// --- HELPER COMPONENTS ---

const AnimationStyles = () => {
  const styles = `
    .ant-path {
      stroke-dasharray: 8, 12;
      animation: ant-path-flow 1s linear infinite;
    }

    @keyframes ant-path-flow {
      from {
        stroke-dashoffset: 20;
      }
      to {
        stroke-dashoffset: 0;
      }
    }
  `;
  return <style>{styles}</style>;
};

const MapControls = ({ bounds, isExpanded, setIsExpanded }) => {
  const map = useMap();
  const handleResetView = () => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds);
    }
  };

  return (
    <div className="absolute top-2 right-2 z-[1000] flex flex-col space-y-2">
      <button
        onClick={handleResetView}
        className="p-2 bg-white text-slate-800 rounded-md shadow-md hover:bg-slate-100 transition-colors"
        aria-label="Reset map view"
      >
        <FiRefreshCw size={18} />
      </button>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2 bg-white text-slate-800 rounded-md shadow-md hover:bg-slate-100 transition-colors"
        aria-label={isExpanded ? 'Minimize map' : 'Expand map'}
      >
        {isExpanded ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
      </button>
    </div>
  );
};

const ProPopupStyles = () => (
  <style>{`
    .leaflet-popup-content-wrapper {
      border-radius: 12px !important;
      border: 1px solid #E2E8F0 !important; /* slate-200 */
      box-shadow: 0 12px 20px rgba(15,23,42,0.12) !important; /* slate-900/12% */
    }
    .leaflet-popup-content {
      margin: 0 !important;
      padding: 0 !important;
    }
    .leaflet-popup-tip {
      display: none; /* cleaner look */
    }
  `}</style>
);


// tries explicit fields, else parses "Store, City" or "Store (City)"
const extractCity = (name, explicit) => {
  if (explicit && typeof explicit === 'string') return explicit;
  if (!name || typeof name !== 'string') return '';
  // (City) pattern
  const paren = name.match(/\(([^)]+)\)\s*$/);
  if (paren && paren[1]) return paren[1].trim();
  // "Store, City" or "Store - City"
  const parts = name.split(/[-,|>]/);
  if (parts.length > 1) return parts[parts.length - 1].trim();
  return '';
};

const formatStoreCity = (store, city) => {
  const safeCity = extractCity(store, city);
  return safeCity ? `${store} (${safeCity})` : store;
};

const MapResizer = ({ isExpanded }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [isExpanded, map]);
  return null;
};

const getCurvedPath = (start, end, curvature) => {
    const consistentStart = start[1] < end[1] ? start : end;
    const consistentEnd = start[1] < end[1] ? end : start;
    const latlng1 = L.latLng(consistentStart);
    const latlng2 = L.latLng(consistentEnd);
    const offsetX = latlng2.lng - latlng1.lng;
    const offsetY = latlng2.lat - latlng1.lat;
    const mid = L.latLng(latlng1.lat + offsetY / 2, latlng1.lng + offsetX / 2);
    const controlPoint = L.latLng(
        mid.lat - offsetX * curvature,
        mid.lng + offsetY * curvature
    );
    const actualStart = L.latLng(start);
    const actualEnd = L.latLng(end);
    const points = [];
    for (let i = 0; i <= 50; i++) {
        const t = i / 50.0;
        const lat = (1 - t) * (1 - t) * actualStart.lat + 2 * (1 - t) * t * controlPoint.lat + t * t * actualEnd.lat;
        const lng = (1 - t) * (1 - t) * actualStart.lng + 2 * (1 - t) * t * controlPoint.lng + t * t * actualEnd.lng;
        points.push([lat, lng]);
    }
    return points;
};


// --- MAIN TRANSFER MAP COMPONENT ---
const TransferMap = ({ summaryData }) => {
    const [hoveredTransfer, setHoveredTransfer] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    if (!summaryData || summaryData.length === 0) return null;
    const allCoords = summaryData
        .flatMap(d => [d.source_coords, d.destination_coords])
        .filter(coords => Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]));
    if (allCoords.length === 0) return null;

    const bounds = L.latLngBounds(allCoords);

    const pathCurvatures = {};
    const pathCounts = {};
    summaryData.forEach((transfer, index) => {
        const { src, dest } = transfer;
        const pathKey = [src, dest].sort().join('-');
        pathCounts[pathKey] = (pathCounts[pathKey] || 0) + 1;
        const count = pathCounts[pathKey];
        const curvature = -0.125 * count;
        pathCurvatures[index] = curvature;
    });
    
    const locations = new Map();
    summaryData.forEach(item => {
        if (item.source_coords) locations.set(item.src, item.source_coords);
        if (item.destination_coords) locations.set(item.dest, item.destination_coords);
    });
    const uniqueLocations = Array.from(locations.entries());

    return (
        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'fixed inset-0 z-50 p-4 bg-black bg-opacity-70' : 'relative h-96 w-full'}`}>
            <AnimationStyles />
            <ProPopupStyles />
            <div className="rounded-lg overflow-hidden border border-slate-300 h-full w-full bg-slate-100">
                <MapContainer
                    bounds={bounds}
                    style={{ height: '100%', width: '100%', backgroundColor: '#F8FAFC' }}
                    worldCopyJump={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapResizer isExpanded={isExpanded} />
                    <MapControls bounds={bounds} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />

                    {summaryData.map((transfer, index) => {
                        if (!transfer.source_coords || !transfer.destination_coords) return null;

                        const curvedPath = getCurvedPath(
                            transfer.source_coords,
                            transfer.destination_coords,
                            pathCurvatures[index]
                        );
                        
                        return (
                            <Fragment key={`transfer-${index}`}>
                                {/* 1. The Invisible "Ghost Line" for easy hovering */}
                                <Polyline
                                    positions={curvedPath}
                                    pathOptions={{
                                        color: 'transparent',
                                        weight: 20, // Thick and invisible for a large hover target
                                    }}
                                    eventHandlers={{
                                        mouseover: (e) => { setHoveredTransfer(index); e.target.openPopup(); },
                                        mouseout: (e) => { setHoveredTransfer(null); e.target.closePopup(); },
                                    }}
                                >
                                <Popup>
                                  <div className="p-3">
                                    <div className="rounded-xl bg-white">
                                      <div className="flex items-start justify-between p-3 border-b border-slate-200">
                                        <div className="min-w-0">
                                          <div className="text-[13px] font-semibold text-slate-800 truncate">
                                            {formatStoreCity(transfer.src, transfer.src_city || transfer.src_location)}
                                          </div>
                                          <div className="text-[12px] text-slate-500">
                                            &#8594; {formatStoreCity(transfer.dest, transfer.dest_city || transfer.dest_location)}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 p-3">
                                        <div className="rounded-lg border border-slate-200 p-2">
                                          <div className="text-[11px] text-slate-500">Total Units</div>
                                          <div className="text-[13px] font-semibold text-slate-800">
                                            {Number(transfer.total_units || 0).toLocaleString()}
                                          </div>
                                        </div>
                                        <div className="rounded-lg border border-slate-200 p-2">
                                          <div className="text-[11px] text-slate-500">Distinct SKUs</div>
                                          <div className="text-[13px] font-semibold text-slate-800">
                                            {transfer.distinct_skus ?? '—'}
                                          </div>
                                        </div>
                                      </div>

                                      
                                    </div>
                                  </div>
                                </Popup>

                                </Polyline>

                                {/* 2. The Visible, Animated Line */}
                                <Polyline
                                    positions={curvedPath}
                                    className="ant-path"
                                    pathOptions={{
                                        // --- THIS IS THE ONLY CHANGE ---
                                        color: hoveredTransfer === index ? '#EC4899' : '#10B981',
                                        // --------------------------------
                                        weight: hoveredTransfer === index ? 4 : 3,
                                        opacity: 0.95,
                                        interactive: false, // This line ignores mouse events
                                    }}
                                />
                            </Fragment>
                        );
                    })}
                    
                    {uniqueLocations.map(([name, coords]) => (
                      coords && (
                        <Marker key={`location-${name}`} position={coords}>
                          <Popup>
                            <div className="p-3">
                              <div className="rounded-xl bg-white border border-slate-200 p-3">
                                <div className="text-[13px] font-semibold text-slate-800">
                                  {formatStoreCity(name)}
                                </div>
                                <div className="text-[12px] text-slate-500 mt-1">
                                  {extractCity(name) ? 'Store • City' : 'Store'}
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    ))}

                </MapContainer>
            </div>
        </div>
    );
};

export default TransferMap;   

// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import 'leaflet-rotatedmarker'; // **CHANGE 1**: Import the new rotated marker plugin

// // --- Icon Fix (no changes here) ---
// import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// import iconUrl from 'leaflet/dist/images/marker-icon.png';
// import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: iconRetinaUrl,
//     iconUrl: iconUrl,
//     shadowUrl: shadowUrl,
// });

// // --- Truck Icon ---
// // For a better visual, you can find a top-down truck icon SVG
// // A simple triangle SVG is used here as a placeholder to show direction clearly.
// const truckIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563EB" width="28px" height="28px"><path d="M21.43,2.57,3.43,12.23a1,1,0,0,0,0,1.54l18,9.66a1,1,0,0,0,1.57-1.23L20,12,23,3.8A1,1,0,0,0,21.43,2.57Z"/></svg>`;
// const truckIconUrl = `data:image/svg+xml;charset=UTF-8,${truckIconSvg}`;

// const customTruckIcon = L.icon({
//   iconUrl: truckIconUrl,
//   iconSize: [28, 28],
//   iconAnchor: [14, 14],
// });

// // **CHANGE 2**: Predefined list of colors for the transfer paths
// const pathColors = ['#1D4ED8', '#047857', '#BE123C', '#9333EA', '#D97706', '#4338CA'];

// // --- Helper component to fit map bounds ---
// const MapBoundsAdjuster = ({ bounds }) => {
//     const map = useMap();
//     useEffect(() => {
//         if (bounds.isValid()) {
//             map.fitBounds(bounds, { padding: [70, 70] });
//         }
//     }, [map, bounds]);
//     return null;
// };

// // --- Component to render the moving truck ---
// const MovingTruck = ({ start, end }) => {
//   const [position, setPosition] = useState(start);
//   const [rotation, setRotation] = useState(0);
//   const markerRef = useRef(null);

//   useEffect(() => {
//     // Calculate rotation angle
//     const lat1 = L.latLng(start).lat;
//     const lng1 = L.latLng(start).lng;
//     const lat2 = L.latLng(end).lat;
//     const lng2 = L.latLng(end).lng;
//     const angle = Math.atan2(lng2 - lng1, lat2 - lat1) * (180 / Math.PI);
//     setRotation(angle);

//     // Animation logic
//     let animationFrameId;
//     const duration = 5000; // 5 seconds for a full loop
//     const startTime = performance.now();

//     const animate = (currentTime) => {
//       const elapsedTime = currentTime - startTime;
//       const progress = (elapsedTime % duration) / duration; // Loops from 0 to 1
      
//       const newLat = lat1 + (lat2 - lat1) * progress;
//       const newLng = lng1 + (lng2 - lng1) * progress;
      
//       const newPosition = [newLat, newLng];
//       setPosition(newPosition);

//       if (markerRef.current) {
//         markerRef.current.setLatLng(newPosition);
//       }
      
//       animationFrameId = requestAnimationFrame(animate);
//     };

//     animationFrameId = requestAnimationFrame(animate);

//     return () => cancelAnimationFrame(animationFrameId);
//   }, [start, end]);

//   return (
//     <Marker
//       ref={markerRef}
//       position={position}
//       icon={customTruckIcon}
//       rotationAngle={rotation} // From the rotated marker plugin
//       zIndexOffset={1000}
//     />
//   );
// };


// // --- Main TransferMap Component ---
// const TransferMap = ({ summaryData }) => {
//   const [hoveredTransfer, setHoveredTransfer] = useState(null);

//   if (!summaryData || summaryData.length === 0) {
//     return null; 
//   }

//   const allCoords = summaryData.flatMap(d => [d.source_coords, d.destination_coords]);
//   const bounds = L.latLngBounds(allCoords);

//   const locations = new Map();
//   summaryData.forEach(item => {
//     locations.set(item.src, item.source_coords);
//     locations.set(item.dest, item.destination_coords);
//   });
  
//   const uniqueLocations = Array.from(locations.entries());

//   return (
//     <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 h-96 w-full relative">
//       <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }}>
//         <TileLayer
//           url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
//         />

//         <MapBoundsAdjuster bounds={bounds} />
        
//         {summaryData.map((transfer, index) => (
//           <React.Fragment key={`transfer-${index}`}>
//             {/* **CHANGE 3**: Invisible "ghost" line for easier hovering */}
//             <Polyline
//               positions={[transfer.source_coords, transfer.destination_coords]}
//               pathOptions={{
//                 color: 'transparent', // Invisible
//                 weight: 20, // Much thicker for an easy hover target
//               }}
//               eventHandlers={{
//                 mouseover: (e) => {
//                   setHoveredTransfer(index);
//                   e.target.openPopup();
//                 },
//                 mouseout: (e) => {
//                   setHoveredTransfer(null);
//                   e.target.closePopup();
//                 },
//               }}
//             >
//               <Popup>
//                 <div className="font-sans text-sm">
//                   <p className="mb-1"><strong>Transfer:</strong> {transfer.src} to {transfer.dest}</p>
//                   <p className="mb-1"><strong>Total Units:</strong> {transfer.total_units.toLocaleString()}</p>
//                   <p><strong>Distinct SKUs:</strong> {transfer.distinct_skus}</p>
//                 </div>
//               </Popup>
//             </Polyline>

//             {/* Visible line with unique color */}
//             <Polyline
//               positions={[transfer.source_coords, transfer.destination_coords]}
//               pathOptions={{ 
//                 color: pathColors[index % pathColors.length], // Use a unique color
//                 weight: hoveredTransfer === index ? 6 : 4, // Thicker on hover
//                 opacity: 0.9,
//               }}
//               interactive={false} // This line doesn't need to handle mouse events
//             />

//             {/* **CHANGE 1**: Moving Truck with Direction */}
//             <MovingTruck start={transfer.source_coords} end={transfer.destination_coords} />
//           </React.Fragment>
//         ))}

//         {/* Static Markers for Source/Destination */}
//         {uniqueLocations.map(([name, coords]) => (
//           <Marker key={`location-${name}`} position={coords}>
//             <Popup>{name}</Popup>
//           </Marker>
//         ))}
//       </MapContainer>
//     </div>
//   );
// };

// export default TransferMap;



// import React, { useEffect, useRef } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import 'leaflet-ant-path';

// // --- Helper Functions & Components ---

// // Function to create colored circle markers
// const createCircleIcon = (color) => L.divIcon({
//     className: 'custom-div-icon',
//     html: `<div style="background-color:${color};" class="marker-pin"></div>`,
//     iconSize: [18, 18],
//     iconAnchor: [9, 9]
// });

// // Component to inject CSS for markers
// const MarkerStyles = () => (
//     <style>{`
//         .marker-pin {
//             width: 18px;
//             height: 18px;
//             border-radius: 50%;
//             border: 3px solid #FFFFFF;
//             box-shadow: 0 1px 3px rgba(0,0,0,0.4);
//         }
//     `}</style>
// );

// // Airplane Icon SVG
// const airplaneIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231E3A8A" width="26px" height="26px"><path d="M21.43,2.57,3.43,12.23a1,1,0,0,0,0,1.54l18,9.66a1,1,0,0,0,1.57-1.23L20,12,23,3.8A1,1,0,0,0,21.43,2.57Z"/></svg>`;
// const airplaneIconUrl = `data:image/svg+xml;charset=UTF-8,${airplaneIconSvg}`;

// // Path & Marker Colors
// const pathAndMarkerColors = ['#1D4ED8', '#047857', '#BE123C', '#9333EA', '#D97706', '#4338CA'];

// // --- Main Animated Airplane Component ---
// const AnimatedAirplane = ({ start, end, color }) => {
//     const map = useMap();
//     const markerRef = useRef();
//     const pathRef = useRef();

//     // Custom bearingTo function
//     const bearingTo = (p1, p2) => {
//         const d2r = Math.PI / 180;
//         const lat1 = p1.lat * d2r;
//         const lat2 = p2.lat * d2r;
//         const dLon = (p2.lng - p1.lng) * d2r;
//         const y = Math.sin(dLon) * Math.cos(lat2);
//         const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
//         return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
//     };
    
//     // Custom rotation function for markers
//     L.Marker.prototype.setRotationAngle = function(angle) {
//         if (this._icon) this._icon.style.transform += ` rotate(${angle}deg)`;
//     };
    
//     useEffect(() => {
//         // 1. Create the curved path
//         const startPoint = L.latLng(start);
//         const endPoint = L.latLng(end);
//         const center = L.latLngBounds(startPoint, endPoint).getCenter();
//         const latlngs = [
//             [startPoint.lat, startPoint.lng],
//             [center.lat + (startPoint.lat - endPoint.lat) * 0.2, center.lng + (startPoint.lng - endPoint.lng) * 0.2],
//             [endPoint.lat, endPoint.lng]
//         ];

//         pathRef.current = L.polyline.antPath(latlngs, {
//             "weight": 2,
//             "color": color,
//             "opacity": 0.4,
//             "paused": true,
//             "interactive": false
//         }).addTo(map);

//         const pathPoints = pathRef.current.getLatLngs();

//         // 2. Create the airplane marker
//         const airplaneIcon = L.icon({ iconUrl: airplaneIconUrl, iconSize: [26, 26], iconAnchor: [13, 13] });
//         markerRef.current = L.marker(start, { icon: airplaneIcon }).addTo(map);

//         // 3. Animate the airplane along the path
//         let animationFrameId;
//         const duration = 5000; // 5 second flight time
//         const startTime = performance.now();

//         const animate = (currentTime) => {
//             const progress = ((currentTime - startTime) % duration) / duration;
//             const pointIndex = Math.floor(progress * (pathPoints.length - 1));
//             const currentPoint = pathPoints[pointIndex];
//             const nextPoint = pathPoints[pointIndex + 1] || currentPoint;

//             const angle = bearingTo(L.latLng(currentPoint), L.latLng(nextPoint));
            
//             if(markerRef.current) {
//                 markerRef.current.setLatLng(currentPoint);
//                 // Reset transform before applying new rotation
//                 markerRef.current._icon.style.transform = `translate(-50%, -50%)`;
//                 markerRef.current.setRotationAngle(angle);
//             }
            
//             animationFrameId = requestAnimationFrame(animate);
//         };
//         animationFrameId = requestAnimationFrame(animate);

//         return () => {
//             cancelAnimationFrame(animationFrameId);
//             map.removeLayer(pathRef.current);
//             map.removeLayer(markerRef.current);
//         };
//     }, [map, start, end, color]);

//     return null;
// };

// // --- Main TransferMap Component ---
// const TransferMap = ({ summaryData }) => {
//     if (!summaryData || summaryData.length === 0) return null;

//     const allCoords = summaryData.flatMap(d => [d.source_coords, d.destination_coords]);
//     const bounds = L.latLngBounds(allCoords);

//     const locations = new Map();
//     summaryData.forEach((item, index) => {
//         const color = pathAndMarkerColors[index % pathAndMarkerColors.length];
//         if (!locations.has(item.src)) locations.set(item.src, { coords: item.source_coords, color });
//         if (!locations.has(item.dest)) locations.set(item.dest, { coords: item.destination_coords, color });
//     });
//     const uniqueLocations = Array.from(locations.entries());

//     return (
//         <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 h-96 w-full relative">
//             <MarkerStyles />
//             <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
//                 <TileLayer
//                     url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
//                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
//                     minZoom={2}
//                 />

//                 {summaryData.map((transfer, index) => (
//                     <AnimatedAirplane
//                         key={`flight-${index}`}
//                         start={transfer.source_coords}
//                         end={transfer.destination_coords}
//                         color={pathAndMarkerColors[index % pathAndMarkerColors.length]}
//                     />
//                 ))}

//                 {uniqueLocations.map(([name, { coords, color }]) => (
//                     <Marker key={`location-${name}`} position={coords} icon={createCircleIcon(color)}>
//                         <Popup>{name}</Popup>
//                     </Marker>
//                 ))}
//             </MapContainer>
//         </div>
//     );
// };

// export default TransferMap;