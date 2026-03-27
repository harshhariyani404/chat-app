import { useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { Toaster } from "react-hot-toast";
import { getStoredUser } from "./lib/storage";

const App = () => {
  const [user, setUser] = useState(() => getStoredUser());
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>

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
