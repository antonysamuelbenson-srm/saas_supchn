import React from "react";
import Dashboard from "./pages/Dashboard";
import SignupForm from "./Pages/SignUp";
import LoginForm from "./Pages/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FileUpload from "./Pages/FileUpload";
import Config from "./Pages/Config";
import Rebalancer from './Pages/Rebalancer';
import Prev from "./Pages/Admin"
import ForecastPage from "./Pages/forecast";

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<LoginForm/>}/>
          <Route path="/register" element={<SignupForm/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/file-upload" element={<FileUpload/>}/>
          <Route path="/config" element={<Config/>}/>
          <Route path="/adminprivileges" element={<Prev/>}/>
          <Route path="/forecast" element={<ForecastPage/>}/>
          <Route path="/rebalancer" element={<Rebalancer />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;