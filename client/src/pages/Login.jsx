import { useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
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
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up your chats, calls, and meetings."
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="font-semibold text-indigo-400 transition hover:text-indigo-300"
            onClick={() => setShowSignup(true)}
          >
            Create one
          </button>
        </p>
      }
    >
      <div className="space-y-5">
        <div>
          <label htmlFor="login-user" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Username
          </label>
          <input
            id="login-user"
            autoComplete="username"
            placeholder="yourname"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none ring-0 transition focus:border-indigo-500/50 focus:bg-slate-950/80 focus:ring-2 focus:ring-indigo-500/20"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            value={form.username}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />
        </div>

        <div>
          <label htmlFor="login-pass" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Password
          </label>
          <input
            id="login-pass"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500/50 focus:bg-slate-950/80 focus:ring-2 focus:ring-indigo-500/20"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            value={form.password}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </div>
    </AuthLayout>
  );
};

export default Login;
