import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 🔁 For navigation

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [serverResponse, setServerResponse] = useState(null);

  const navigate = useNavigate(); // ✅ React Router hook

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setMessage('');
      setServerResponse(null);
    } else {
      setSelectedFile(null);
      setMessage('❌ Please upload a valid .csv file.');
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setMessage('❌ No file selected.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('❌ Missing authentication token.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:5000/upload/validate', true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onloadstart = () => {
      setUploading(true);
      setUploadProgress(0);
      setMessage('');
      setServerResponse(null);
    };

    xhr.onload = () => {
      setUploading(false);

      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && result.valid) {
          setMessage(`✅ Uploaded ${result.inserted} rows. Alerts triggered: ${result.alerts_triggered}`);
          setServerResponse(result);
        } else if (result.errors) {
          setMessage(`❌ Validation failed:\n- ${result.errors.join('\n- ')}`);
        } else {
          setMessage('❌ Upload failed.');
        }
      } catch (err) {
        setMessage('❌ Unexpected server response.');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setMessage('❌ Upload error.');
    };

    xhr.send(formData);
  };

  const getProgressClass = () => {
    if (uploadProgress < 50) return 'progress-error';
    if (uploadProgress < 80) return 'progress-warning';
    return 'progress-success';
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard'); // 🔁 Navigate to dashboard
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-6">
      <div className="card w-full max-w-2xl shadow-xl bg-base-100 p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">File Upload</h2>

        <input
          type="file"
          accept=".csv"
          className="file-input file-input-bordered w-full"
          onChange={handleFileChange}
          disabled={uploading}
        />

        <button
          className={`btn btn-primary mt-4 ${uploading ? 'btn-disabled' : ''}`}
          onClick={handleUpload}
        >
          {uploading && (
            <span className="loading loading-spinner loading-sm mr-2"></span>
          )}
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </button>

        {uploading && (
          <div className="mt-4 text-center">
            <label className="block text-sm mb-1">
              Uploading: {uploadProgress}%
            </label>
            <progress
              className={`progress w-full ${getProgressClass()}`}
              value={uploadProgress}
              max="100"
            ></progress>
            <div className="text-sm mt-1">
              {uploadProgress === 100 ? '✅ Completed!' : `${uploadProgress}%`}
            </div>
          </div>
        )}

        {message && (
          <div className="alert mt-4 text-sm whitespace-pre-wrap">
            <span>{message}</span>
          </div>
        )}

        {serverResponse && (
          <div className="mt-4 text-center">
            <p className="text-sm">✅ Inserted rows: {serverResponse.inserted}</p>
            <p className="text-sm">🔔 Alerts triggered: {serverResponse.alerts_triggered}</p>
          </div>
        )}

        {/* 🚀 Go to Dashboard Button */}
        <button
          className="btn btn-outline btn-secondary mt-6"
          onClick={handleGoToDashboard}
        >
          🏠 Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
