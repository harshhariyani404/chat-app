import { useState } from "react";
import Home from "./pages/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { Toaster } from "react-hot-toast";

const App = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      {/* 🔥 ADD THIS */}
      <Toaster 
        position="bottom-right" 
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
        <Home user={user} setUser={setUser}/>
      )}
    </>
  );
};

export default App;