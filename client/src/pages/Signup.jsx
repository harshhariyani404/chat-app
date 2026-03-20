import { useState } from "react";
import axios from "axios";

const featurePoints = [
  "Fresh interface with a warm, modern visual style",
  "Responsive messaging layout that adapts to mobile screens",
  "Smooth transitions and cleaner interaction states",
];

const Signup = ({ setUser, setShowSignup }) => {
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSignup = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/signup", form);

      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Signup failed. Please try a different username.");
    }
  };

  return (
    <div className="auth-page">
      <div className="ambient-orb left-[-5rem] top-[10%] h-72 w-72 bg-[#2f8f83]/20" />
      <div className="ambient-orb bottom-[4%] right-[-8rem] h-80 w-80 bg-[#f3b63f]/25" />

      <div className="auth-shell floating-card">
        <section className="auth-showcase">
          <div className="relative z-10">
            <span className="hero-chip text-white/90">
              <span className="h-2 w-2 rounded-full bg-[#f26b5b]" />
              Build your profile in seconds
            </span>

            <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-tight xl:text-5xl">
              Start with a stylish chat experience that already feels production-ready.
            </h1>

            <div className="mt-8 space-y-4">
              {featurePoints.map((point) => (
                <div
                  key={point}
                  className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.22em] text-white/55">
              Design Notes
            </p>
            <p className="mt-3 text-lg leading-8 text-white/84">
              Soft gradients, layered glass panels, bold spacing, and a more
              premium visual rhythm across authentication and chat.
            </p>
          </div>
        </section>

        <section className="auth-card">
          <div className="mx-auto w-full max-w-md">
            <span className="hero-chip text-sm" style={{ color: "var(--primary)" }}>
              New account
            </span>

            <h2 className="auth-title mt-6">Create your chat profile</h2>
            <p className="auth-subtitle">
              Choose a username, set a password, and enter the redesigned workspace.
            </p>

            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  placeholder="Pick a username"
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
                  placeholder="Create a password"
                  className="auth-input"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSignup();
                  }}
                />
              </div>

              <button className="primary-button w-full" onClick={handleSignup}>
                Create account
              </button>
            </div>

            <p className="mt-6 text-sm" style={{ color: "var(--text-soft)" }}>
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-[#2f8f83] transition hover:text-[#236e65]"
                onClick={() => setShowSignup(false)}
              >
                Login instead
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Signup;
