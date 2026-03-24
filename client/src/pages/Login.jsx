import { useState } from "react";
import axios from "axios";

const Login = ({ setUser, setShowSignup }) => {
  const [form, setForm] = useState({ username: "", password: "" });

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
  
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
  
      setUser(res.data.user);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-xl mb-4">Login</h2>

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
          className="bg-blue-500 text-white w-full p-2"
          onClick={handleLogin}
        >
          Login
        </button>

        <p className="mt-2 text-sm">
          Don't have account?{" "}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => setShowSignup(true)}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
