import { useState } from "react";
import axios from "axios";

const showcaseStats = [
  { label: "Real-time chat", value: "Instant" },
  { label: "Designed for teams", value: "Modern" },
  { label: "Secure sessions", value: "Reliable" },
];

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
    <div className="auth-page">
      <div className="ambient-orb left-[-8rem] top-[5%] h-64 w-64 bg-[#f28a7d]/30" />
      <div className="ambient-orb bottom-[8%] right-[-6rem] h-72 w-72 bg-[#2f8f83]/20" />

      <div className="auth-shell floating-card">
        <section className="auth-showcase">
          <div className="relative z-10">
            <span className="hero-chip text-white/90">
              <span className="h-2 w-2 rounded-full bg-[#f3b63f]" />
              Conversations that feel premium
            </span>

            <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-tight xl:text-5xl">
              Bring your chats into a cleaner, brighter, more professional space.
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-white/78 xl:text-base">
              A refreshed messaging experience with calm color, responsive layouts,
              and smooth motion that helps everything feel more polished.
            </p>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-3">
            {showcaseStats.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
              >
                <p className="text-sm text-white/70">{item.label}</p>
                <p className="mt-2 text-xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-card">
          <div className="mx-auto w-full max-w-md">
            <span className="hero-chip text-sm" style={{ color: "var(--secondary)" }}>
              Welcome back
            </span>

            <h2 className="auth-title mt-6">Login to continue chatting</h2>
            <p className="auth-subtitle">
              Enter your account details and jump back into your conversations.
            </p>

            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  placeholder="Enter your username"
                  className="auth-input"
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="auth-input"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                />
              </div>

              <button className="primary-button w-full" onClick={handleLogin}>
                Login
              </button>
            </div>

            <p className="mt-6 text-sm" style={{ color: "var(--text-soft)" }}>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-semibold text-[#e35141] transition hover:text-[#bf4134]"
                onClick={() => setShowSignup(true)}
              >
                Create one
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
