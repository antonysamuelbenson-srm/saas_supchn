import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UPLOAD_TYPES = [
  { type: "store", label: "Store Master" },
  { type: "inventory", label: "Inventory" },
  { type: "forecast", label: "Forecast" },
  { type: "totalStoreData", label: "Total Store" },
  { type: "transferCostData", label: "Transfer Cost" },
  { type: "capacity", label: "Warehouse Capacity" },
];

const FileUploadPage = () => {
  const [fileMap, setFileMap] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [token, setToken] = useState(null);
  const navigate = useNavigate();  // ← this line is missing


  // 🔐 Load JWT token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.warn("No token found in localStorage.");
    }
  }, []);

  const handleFileChange = (type, file) => {
    setFileMap((prev) => ({ ...prev, [type]: file }));
  };

  const handleUpload = async (type) => {
    const file = fileMap[type];
    if (!file || !token) {
      alert("Missing file or token.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadStatus((prev) => ({ ...prev, [type]: "uploading" }));

    try {
      const response = await axios.post(
        `http://localhost:5500/api/upload/${type}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        setUploadStatus((prev) => ({ ...prev, [type]: "success" }));
      } else {
        setUploadStatus((prev) => ({ ...prev, [type]: "error" }));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Upload failed";
      setUploadStatus((prev) => ({ ...prev, [type]: errorMessage }));
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-6">
      <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex justify-start">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
        <h1 className="text-4xl font-bold mb-6 text-center">📤 Upload CSV Data</h1>

        {!token && (
          <div className="alert alert-warning mb-6 shadow-lg">
            <span>⚠️ No token found. Please login to continue.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {UPLOAD_TYPES.map(({ type, label }) => (
            <div key={type} className="card bg-base-100 shadow-xl p-4">
              <h2 className="font-semibold text-lg mb-2">{label}</h2>
              <input
                type="file"
                accept=".csv"
                className="file-input file-input-bordered w-full mb-2"
                onChange={(e) => handleFileChange(type, e.target.files[0])}
              />
              <button
                className="btn btn-primary w-full"
                onClick={() => handleUpload(type)}
                disabled={!token}
              >
                Upload
              </button>

              {/* Upload status display */}
              {uploadStatus[type] && (
                <div className="mt-2 text-sm">
                  {uploadStatus[type] === "uploading" && (
                    <span className="text-warning">Uploading...</span>
                  )}
                  {uploadStatus[type] === "success" && (
                    <span className="text-success">✅ Upload successful</span>
                  )}
                  {uploadStatus[type] !== "uploading" &&
                    uploadStatus[type] !== "success" && (
                      <span className="text-error">❌ {uploadStatus[type]}</span>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUploadPage;
