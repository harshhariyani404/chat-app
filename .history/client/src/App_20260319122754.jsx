import { useState } from "react";
import Home from "./pages/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";

const App = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [showSignup, setShowSignup] = useState(true);

  if (!user) {
    return showSignup ? (
      <Signup setUser={setUser} setShowSignup={setShowSignup} />
    ) : (
      <Login setUser={setUser} setShowSignup={setShowSignup} />
    )
  }
    return <Home user={user} />

}

export default App;
