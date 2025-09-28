import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '@elfalem/leaflet-curve';
import 'leaflet-polylinedecorator'; // <-- Add this
import { FiRefreshCw } from 'react-icons/fi';

// --- Icon Fix ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const RebalanceMap = ({ stores, summaryData }) => {
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current && summaryData.length > 0) {
      const map = mapRef.current;

      // Clear previous arcs
      map.eachLayer((layer) => {
        if (layer.options && layer.options.className === 'rebalance-arc') {
          map.removeLayer(layer);
        }
      });

      const storeCoords = stores.reduce((acc, store) => {
        acc[store.store_code] = [store.lat, store.long];
        return acc;
      }, {});

      summaryData.forEach((transfer) => {
        const from = storeCoords[transfer.src];
        const to = storeCoords[transfer.dest];

        if (from && to) {
          const latlng1 = L.latLng(from);
          const latlng2 = L.latLng(to);

          const offsetX = latlng2.lng - latlng1.lng;
          const offsetY = latlng2.lat - latlng1.lat;

          const r = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2));
          const theta = Math.atan2(offsetY, offsetX);

          const thetaOffset = Math.PI / 10;
          const r2 = r / 2 / Math.cos(thetaOffset);
          const theta2 = theta + thetaOffset;

          const midpointX = r2 * Math.cos(theta2) + latlng1.lng;
          const midpointY = r2 * Math.sin(theta2) + latlng1.lat;

          const midpointLatLng = [midpointY, midpointX];
          const path = ['M', latlng1, 'Q', midpointLatLng, latlng2];

          // Draw curve
          const curve = L.curve(path, {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            className: 'rebalance-arc',
          }).addTo(map);

          // Add arrow decorator
          L.polylineDecorator(curve, {
            patterns: [
              {
                offset: '50%',
                repeat: 0,
                symbol: L.Symbol.arrowHead({
                  pixelSize: 12,
                  polygon: true,
                  pathOptions: { color: '#3b82f6', weight: 2, fillOpacity: 1 },
                }),
              },
            ],
          }).addTo(map);

          // Popup with rebalancing info
          curve.bindPopup(
            `<b>Inventory Transfer</b><br/>
             <span style="color:#10b981;">From:</span> <b>${transfer.src}</b><br/>
             <span style="color:#ef4444;">To:</span> <b>${transfer.dest}</b><br/>
             Distinct SKUs: <b>${transfer.distinct_skus}</b><br/>
             Total Units: <b>${transfer.total_units.toLocaleString()}</b>`
          );
        }
      });
    }
  }, [summaryData, stores]);

  const handleResetView = () => {
    if (mapRef.current && summaryData.length > 0) {
      const map = mapRef.current;
      const storeCoords = stores.reduce((acc, store) => {
        acc[store.store_code] = [store.lat, store.long];
        return acc;
      }, {});

      const boundsCoords = [];
      summaryData.forEach((transfer) => {
        if (storeCoords[transfer.src]) boundsCoords.push(storeCoords[transfer.src]);
        if (storeCoords[transfer.dest]) boundsCoords.push(storeCoords[transfer.dest]);
      });

      if (boundsCoords.length > 0) {
        const bounds = L.latLngBounds(boundsCoords);
        map.fitBounds(bounds.pad(0.2));
      }
    }
  };

  if (!stores || stores.length === 0) {
    return <div>Loading map data...</div>;
  }
  const center = stores.length > 0 ? [stores[0].lat, stores[0].long] : [51.505, -0.09];

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={4}
        ref={mapRef}
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {stores.map((store) => (
          <Marker key={store.store_code} position={[store.lat, store.long]}>
            <Popup>
              <b>{store.name}</b>
              <br />
              {store.store_code}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {summaryData.length > 0 && (
        <button
          onClick={handleResetView}
          title="Reset Map View"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            backgroundColor: 'white',
            border: '2px solid rgba(0,0,0,0.2)',
            borderRadius: '4px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FiRefreshCw size={18} color="#333" />
        </button>
      )}
    </div>
  );
};

export default RebalanceMap;
