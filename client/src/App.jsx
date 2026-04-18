import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MeetingRoom from "./pages/MeetingRoom";
import Signup from "./pages/Signup";
import { Toaster } from "react-hot-toast";
import { getStoredUser } from "./lib/storage";

const toastBase = {
  style: {
    background: "#1e293b",
    color: "#f1f5f9",
    borderRadius: "14px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    boxShadow: "0 16px 40px -12px rgba(15, 23, 42, 0.45)",
    padding: "12px 16px",
    fontSize: "14px",
  },
};

const App = () => {
  const [user, setUser] = useState(() => getStoredUser());
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: toastBase.style,
          success: {
            iconTheme: { primary: "#34d399", secondary: "#1e293b" },
          },
          error: {
            iconTheme: { primary: "#fb7185", secondary: "#1e293b" },
          },
        }}
        containerStyle={{
          bottom: 100,
        }}
      />

      {!user ? (
        showSignup ? (
          <Signup setUser={setUser} setShowSignup={setShowSignup} />
        ) : (
          <Login setUser={setUser} setShowSignup={setShowSignup} />
        )
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/meeting/:meetingId" element={<MeetingRoom user={user} />} />
            <Route path="/*" element={<Home user={user} setUser={setUser} />} />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
};

export default App;
