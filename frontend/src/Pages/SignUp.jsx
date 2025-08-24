import React, { useState } from 'react';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('planner');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://127.0.0.1:5500/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('✅ Signup successful!');
      } else {
        setStatus(`❌ ${data.message || 'Signup failed'}`);
      }

    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 dark:bg-neutral-900 p-4">
      <div className="relative">
        <div className="absolute w-full h-full rounded-3xl bg-cyan-400 transform rotate-6"></div>
        <form
          onSubmit={handleSubmit}
          className="relative z-10 bg-white dark:bg-base-100 text-black dark:text-white p-10 rounded-3xl shadow-2xl w-full max-w-sm"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-[#00000]">
            Sign Up
          </h2>

          <div className="form-control mb-4">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="input input-bordered w-full rounded-xl focus:border-[#062f53] focus:outline-none"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="form-control mb-4">
            <input 
              type="password" 
              placeholder="Password" 
              className="input input-bordered w-full rounded-xl focus:border-[#062f53] focus:outline-none"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
{/* 
          <div className="form-control mb-6">
            <select 
              className="select select-bordered w-full rounded-xl focus:border-[#062f53] focus:outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="planner">Planner</option>
              <option value="admin">Admin</option>
            </select>
          </div> */}

          <button 
            type="submit"
            className="w-full rounded-xl bg-[#062f53] p-2 text-white font-semibold hover:bg-blue-900 transition duration-300"
          >
            Sign Up
          </button>

          {status && (
            <div className={`mt-4 text-center text-sm ${
              status.startsWith('✅') ? 'text-green-500' : 'text-red-500'
            }`}>
              {status}
            </div>
          )}

          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Already have an account?{" "}
            <a
              href="/"
              className="text-cyan-500 hover:underline font-semibold"
            >
              Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
