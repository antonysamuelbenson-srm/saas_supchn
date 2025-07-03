import React from "react";
import AlertItem from "./AlertItem";

function Alerts() {
  return (
    <div className="border border-blue-800 rounded-lg p-4 space-y-3 select-none">
      <AlertItem
        severity="high"
        label="High severity alerts"
        icon="⚠️"
        bgClass="bg-[#63383B]"
        textClass="text-white"
      />
      <AlertItem
        severity="medium"
        label="Medium severit alert"
        icon="⚠️"
        bgClass="bg-[#5F5146]"
        textClass="text-white"
      />
      <AlertItem
        severity="low"
        label="Low severity alert"
        icon="✔️"
        bgClass="bg-[#2A554A]"
        textClass="text-white"
      />
    </div>
  );
}

export default Alerts;