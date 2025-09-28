import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Tailwind import
import 'leaflet/dist/leaflet.css'; 
// import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);