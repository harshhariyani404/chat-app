import { useState } from "react";
import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";

const App = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [showSignup, setShowSignup] = useState(false);

  if (!user) {
    return showSignup ? (
      <Signup setUser={setUser} setShowSignup={setShowSignup} />
    ) : (
      <Login setUser={setUser} setShowSignup={setShowSignup} />
    )
  }
    return <Home user={user} setUser={setUser} />

}

export default App;
