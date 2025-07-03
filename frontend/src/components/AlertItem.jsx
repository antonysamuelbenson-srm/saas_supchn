import React from "react";

function AlertItem({ icon, label, bgClass, textClass }) {
  return (
    <div className={`flex items-center space-x-3 rounded-md p-2 ${bgClass} select-none`}>
      <div className="text-lg">{icon}</div>
      <span className={`font-semibold ${textClass}`}>{label}</span>
    </div>
  );
}

export default AlertItem;