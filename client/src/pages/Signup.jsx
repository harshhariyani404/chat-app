import { useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
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
    <AuthLayout
      title="Create your account"
      subtitle="Choose a username and password. You’ll jump straight into Connect."
      footer={
        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold text-indigo-400 transition hover:text-indigo-300"
            onClick={() => setShowSignup(false)}
          >
            Sign in
          </button>
        </p>
      }
    >
      <div className="space-y-5">
        <div>
          <label htmlFor="signup-user" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Username
          </label>
          <input
            id="signup-user"
            autoComplete="username"
            placeholder="pick a unique name"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500/50 focus:bg-slate-950/80 focus:ring-2 focus:ring-indigo-500/20"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            value={form.username}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSignup();
            }}
          />
        </div>

        <div>
          <label htmlFor="signup-pass" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Password
          </label>
          <input
            id="signup-pass"
            type="password"
            autoComplete="new-password"
            placeholder="min. 6 characters"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500/50 focus:bg-slate-950/80 focus:ring-2 focus:ring-indigo-500/20"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            value={form.password}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSignup();
            }}
          />
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSignup}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creating…
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </div>
    </AuthLayout>
  );
};

export default Signup;
