import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddStoreForm() {
  const [storeName, setStoreName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("❌ User not authenticated.");
      setSuccess(false);
      return;
    }

    const payload = {
      "store-name": storeName,
      "store-location": storeLocation,
    };

    try {
      const res = await fetch("http://localhost:5000/store_upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage("✅ Store added successfully!");
        setStoreName("");
        setStoreLocation("");
      } else {
        setSuccess(false);
        setMessage(`❌ Failed: ${data.error || "Something went wrong"}`);
      }
    } catch (err) {
      setSuccess(false);
      setMessage("❌ Network error.");
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 to-gray-800 p-4">
      <div className="bg-zinc-950 text-gray-200 shadow-2xl rounded-2xl w-full max-w-lg p-8 border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          🏪 Add New Store
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Store Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="input input-bordered w-full bg-zinc-800 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Central Warehouse"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Store Location
            </label>
            <input
              type="text"
              value={storeLocation}
              onChange={(e) => setStoreLocation(e.target.value)}
              className="input input-bordered w-full bg-zinc-800 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Delhi NCR"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2 bg-blue-600 hover:bg-blue-700 border-none text-white text-lg tracking-wide"
          >
            ➕ Add Store
          </button>
        </form>

        {message && (
          <div
            className={`mt-5 p-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              success
                ? "bg-green-900 text-green-300 border border-green-700"
                : "bg-red-900 text-red-300 border border-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={goToDashboard}
            className="btn btn-outline border-gray-500 text-gray-200 w-full hover:bg-gray-700"
          >
            🏠 Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddStoreForm;
