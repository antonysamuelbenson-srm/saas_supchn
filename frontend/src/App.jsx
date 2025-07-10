import React from "react";
import Dashboard from "./pages/Dashboard";
import SignupForm from "./Pages/SignUp";
import LoginForm from "./Pages/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FileUpload from "./Pages/FileUpload";
import AddStoreForm from "./Pages/AddStoreForm";

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<LoginForm/>}/>
          <Route path="/register" element={<SignupForm/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/file-upload" element={<FileUpload/>}/>
          <Route path="/add-store" element={<AddStoreForm/>}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;