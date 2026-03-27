import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { persistSession } from "../lib/storage";

const Login = ({ setUser, setShowSignup }) => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const payload = {
      username: form.username.trim(),
      password: form.password,
    };

    if (!payload.username || !payload.password.trim()) {
      toast.error("Username and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/auth/login", payload);

      persistSession(res.data);
      setUser(res.data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
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
          value={form.username}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-2"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          value={form.password}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin();
            }
          }}
        />

        <button
          className="bg-blue-500 text-white w-full p-2"
          onClick={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
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
