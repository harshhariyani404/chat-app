import { useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Signup = ({ setUser, setShowSignup }) => {
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSignup = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/signup`, form);
      
      // Automatically log the user in after successful signup
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Signup failed. Please try a different username.");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-xl mb-4">Signup</h2>

        <input
          placeholder="Username"
          className="border p-2 w-full mb-2"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-2"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          className="bg-green-500 text-white w-full p-2"
          onClick={handleSignup}
        >
          Signup
        </button>

        <p className="mt-2 text-sm">
          Already have account?{" "}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => setShowSignup(false)}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
