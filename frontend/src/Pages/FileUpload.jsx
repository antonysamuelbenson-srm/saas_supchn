// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// const UploadCard = ({ type, title }) => {
//   const [file, setFile] = useState(null);
//   const [status, setStatus] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
    
//     if (!selectedFile) {
//       setStatus(null);
//       return;
//     }
    
//     // Check file type
//     if (!selectedFile.name.endsWith('.csv')) {
//       setStatus({
//         success: false,
//         message: "Only CSV files are allowed"
//       });
//       return;
//     }
    
//     // Check file size
//     if (selectedFile.size > process.env.REACT_APP_MAX_FILE_SIZE) {
//       setStatus({
//         success: false,
//         message: `File too large. Max size is ${process.env.REACT_APP_MAX_FILE_SIZE/1024/1024}MB`
//       });
//       return;
//     }
    
//     setFile(selectedFile);
//     setStatus(null);
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       setStatus({ success: false, message: "Please select a CSV file." });
//       return;
//     }

//     const token = localStorage.getItem("token");
//     if (!token) {
//       setStatus({ success: false, message: "User not authenticated. Please login again." });
//       return;
//     }

//     setIsUploading(true);
    
//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const response = await axios.post(
//         `${process.env.REACT_APP_API_URL}/api/upload/${type}`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//             Authorization: `Bearer ${token}`,
//           },
//           timeout: 30000 // 30 seconds timeout
//         }
//       );
      
//       setStatus({ 
//         success: true, 
//         message: "✅ Upload successful!",
//         details: response.data.message,
//         rowsProcessed: response.data.rows_processed
//       });
      
//       // Reset file input after successful upload
//       setFile(null);
//       document.querySelector(`input[type="file"][data-type="${type}"]`).value = "";
//     } catch (err) {
//       let msg = "❌ Upload failed. Please try again.";
      
//       if (err.response) {
//         if (err.response.data?.errors) {
//           msg = (
//             <div className="text-left">
//               <p>Validation errors:</p>
//               <ul className="list-disc pl-5">
//                 {err.response.data.errors.map((error, i) => (
//                   <li key={i}>{error}</li>
//                 ))}
//               </ul>
//             </div>
//           );
//         } else if (err.response.data?.message) {
//           msg = err.response.data.message;
//         }
//       } else if (err.message.includes("timeout")) {
//         msg = "Request timed out. Please try again.";
//       }
      
//       setStatus({ 
//         success: false, 
//         message: msg,
//         isHtml: React.isValidElement(msg)
//       });
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="bg-gray-900 shadow-lg shadow-black/40 p-6 rounded-xl w-full border border-gray-700">
//       <h2 className="text-xl font-semibold mb-4 text-gray-100">
//         {title} Upload
//       </h2>

//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-300 mb-1">
//           Select CSV File
//         </label>
//         <input
//           type="file"
//           accept=".csv"
//           onChange={handleFileChange}
//           data-type={type}
//           className="w-full text-gray-300 
//             file:mr-4 file:py-2 file:px-4 file:rounded-lg 
//             file:border-0 file:text-sm file:font-medium 
//             file:bg-blue-600 file:text-white hover:file:bg-blue-700
//             disabled:opacity-50"
//           disabled={isUploading}
//         />
//         {file && (
//           <p className="mt-1 text-xs text-gray-400">
//             Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
//           </p>
//         )}
//       </div>

//       <button
//         onClick={handleUpload}
//         disabled={!file || isUploading}
//         className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200
//           ${(!file || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
//       >
//         {isUploading ? (
//           <span className="flex items-center justify-center">
//             <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//             </svg>
//             Uploading...
//           </span>
//         ) : "Upload"}
//       </button>

//       {status && (
//         <div className={`mt-4 p-3 rounded-md text-sm ${
//           status.success ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
//         }`}>
//           <div className="font-medium">
//             {status.success ? "Success" : "Error"}
//           </div>
//           {status.isHtml ? (
//             status.message
//           ) : (
//             <p>{status.message}</p>
//           )}
//           {status.details && (
//             <p className="mt-1 text-xs opacity-80">{status.details}</p>
//           )}
//           {status.rowsProcessed && (
//             <p className="mt-1 text-xs opacity-80">
//               Processed {status.rowsProcessed} rows
//             </p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// const FileUploadPage = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-4 md:p-8">
//       <div className="max-w-7xl mx-auto">
//         <div className="flex justify-between items-center mb-8">
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-md transition-all duration-200 shadow-md"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
//             </svg>
//             Back to Dashboard
//           </button>
//           <h1 className="text-2xl md:text-3xl font-bold text-white">
//             CSV File Upload Center
//           </h1>
//           <div className="w-10"></div> {/* Spacer for alignment */}
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           <UploadCard type="store" title="Store Data" />
//           <UploadCard type="inventory" title="Inventory Data" />
//           <UploadCard type="forecast" title="Forecast Data" />
//           <UploadCard type="totalStoreData" title="Stock Levels" />
//           <UploadCard type="transferCostData" title="Transfer Costs" />
//           <UploadCard type="warehouseMaxData" title="Warehouse Capacity" />
//         </div>

//         <div className="mt-8 p-4 bg-gray-800/50 rounded-lg text-sm text-gray-400">
//           <h3 className="font-medium text-gray-300 mb-2">Upload Instructions:</h3>
//           <ul className="list-disc pl-5 space-y-1">
//             <li>Only CSV files are accepted</li>
//             <li>Maximum file size: 5MB</li>
//             <li>Ensure files have the correct columns</li>
//             <li>Check validation errors if upload fails</li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FileUploadPage;



import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UPLOAD_TYPES = [
  { type: "store", label: "Store Data" },
  { type: "inventory", label: "Inventory Data" },
  { type: "forecast", label: "Forecast Data" },
  { type: "totalStoreData", label: "Total Store Data" },
  { type: "transferCostData", label: "Transfer Cost Data" },
  { type: "warehouseMaxData", label: "Warehouse Max Data" },
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
