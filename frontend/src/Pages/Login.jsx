import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.token) {
        setMessage("Login successful!");
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
        
      } else {
        setMessage(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Error during login", err);
      setMessage("Server error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 dark:bg-neutral-900 p-4">
      <div className="relative">
        <div className="absolute w-full h-full rounded-3xl bg-cyan-400 transform rotate-6"></div>
        <div className="relative z-10 bg-white dark:bg-base-100 text-black dark:text-white p-10 rounded-3xl shadow-2xl w-full max-w-sm">
          <h2 className="text-3xl font-bold mb-6 text-center text-[#00000]">
            Login
          </h2>

          {message && (
            <div
              className={`mb-4 text-center text-sm ${
                message === "Login successful!" ? "text-green-500" : "text-red-500"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-control mb-4">
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full rounded-xl focus:border-[#062f53] focus:outline-none"
                placeholder="Enter your email"
              />
            </div>

            <div className="form-control mb-6">
              <label className="block text-sm font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full rounded-xl focus:border-[#062f53] focus:outline-none"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#062f53] p-2 text-white font-semibold hover:bg-blue-900 transition duration-300"
            >
              Login
            </button>
          </form>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Don’t have an account?{" "}
            <a
              href="/register"
              className="text-cyan-500 hover:underline font-semibold"
            >
              Register
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
