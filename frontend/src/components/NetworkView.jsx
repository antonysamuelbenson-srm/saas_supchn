import React from "react";

function NetworkView() {
  return (
    <div className="w-full min-h-[80px] relative bg-[#112239] rounded-lg border border-blue-900 select-none overflow-hidden">
      <svg
        className="w-full h-full"
        viewBox="0 0 300 120"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Map background shadow */}
        <path opacity="0.05" d="M0 0h300v120H0z" fill="#172A3F" />

        {/* Connection lines */}
        <line x1="40" y1="80" x2="80" y2="40" stroke="#2B82FF" strokeWidth="2" />
        <line x1="80" y1="40" x2="140" y2="60" stroke="#2B82FF" strokeWidth="2" />
        <line x1="40" y1="80" x2="70" y2="90" stroke="#2B82FF" strokeWidth="2" />
        <line x1="70" y1="90" x2="110" y2="70" stroke="#2B82FF" strokeWidth="2" />
        <line x1="110" y1="70" x2="140" y2="60" stroke="#2B82FF" strokeWidth="2" />
        <line x1="110" y1="70" x2="180" y2="20" stroke="#2B82FF" strokeWidth="2" />
        <line x1="180" y1="20" x2="220" y2="40" stroke="#2B82FF" strokeWidth="2" />

        {/* Node Circles */}
        {[ [40,80], [80,40], [70,90], [110,70], [140,60], [180,20], [220,40] ].map(
          ([x,y], i) => (
            <circle key={i} cx={x} cy={y} r="8" fill="#0D1829" stroke="#2B82FF" strokeWidth="3" />
          )
        )}

        {/* Warning Icons */}
        <polygon points="30,30 40,45 20,45" fill="#F77824" />
        <text x="26" y="43" fontSize="20" fill="#fff" fontWeight="bold">!</text>

        <polygon points="210,85 220,100 200,100" fill="#F77824" />
        <text x="206" y="98" fontSize="20" fill="#fff" fontWeight="bold">!</text>
      </svg>
    </div>
  );
}

export default NetworkView;
