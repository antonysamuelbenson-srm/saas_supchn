import React from "react";

function StatusBar() {
  return (
    <div className="border border-blue-800 rounded-lg flex items-center space-x-3 px-4 py-2 select-none">
      <input
        type="checkbox"
        checked
        readOnly
        className="checkbox checkbox-xs checkbox-primary"
      />
      <span className="flex-1 truncate">Austrak copsulat</span>
      <div className="flex-1 h-2 rounded bg-blue-700/50"></div>
      <div className="flex-1 h-2 rounded bg-blue-700/50"></div>
    </div>
  );
}

export default StatusBar;