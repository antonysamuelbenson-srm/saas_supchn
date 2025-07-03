import React from "react";

function ControlBox({ label, value, subValue }) {
  return (
    <div className="border border-blue-800 rounded-lg p-4 select-none">
      <div className="text-sm mb-1">{label}</div>
      <div className="flex items-center space-x-3">
        <div className="font-bold text-3xl">{value}</div>
        {subValue && (
          <div className="border border-blue-700 rounded-md px-3 py-1 font-semibold text-xl">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}

export default ControlBox;