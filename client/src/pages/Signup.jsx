import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { persistSession } from "../lib/storage";

const Signup = ({ setUser, setShowSignup }) => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      toast.error("Username and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/auth/signup", form);

      const res = await api.post("/auth/login", form);
      persistSession(res.data);
      setUser(res.data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed. Please try a different username.");
    } finally {
      setIsSubmitting(false);
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
              handleSignup();
            }
          }}
        />

        <button
          className="bg-green-500 text-white w-full p-2"
          onClick={handleSignup}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Signup"}
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
