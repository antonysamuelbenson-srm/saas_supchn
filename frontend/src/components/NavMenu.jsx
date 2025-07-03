import React from "react";

const icons = {
  database: (
    <svg
      className="inline-block w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" strokeLinecap="round" strokeLinejoin="round"></ellipse>
      <path d="M3 5v14c0 1.656 4.03 3 9 3s9-1.344 9-3V5" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  ),
  "trending-up": (
    <svg
      className="inline-block w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8"></path>
    </svg>
  ),
  cog: (
    <svg
      className="inline-block w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10v2m0-18v2m7 10l1.5 1.5m-17 0L5 16m12-12 1.5 1.5M6 6 4.5 4.5m0 15L6 18"
      ></path>
    </svg>
  ),
  menu: (
    <svg
      className="w-6 h-6 stroke-white"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
};

function NavMenu({ icon = "menu", label }) {
  return (
    <button className="border border-blue-800 rounded-lg px-4 py-3 flex items-center justify-center space-x-2 select-none bg-[#132039] hover:bg-[#1c3151] transition-colors duration-200">
      {icon && icons[icon]}
      {label && <span className="text-white font-semibold">{label}</span>}
    </button>
  );
}

export default NavMenu;