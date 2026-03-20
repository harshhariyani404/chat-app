import { useState } from "react";
import axios from "axios";

const EditProfile = ({ user, setUser, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [file, setFile] = useState(null);

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("username", username);
    if (file) formData.append("avatar", file);

    const token = localStorage.getItem("token");

    const res = await axios.put(
      "http://localhost:5000/api/users/profile",
      formData,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    setUser(res.data);
    localStorage.setItem("user", JSON.stringify(res.data));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white p-4 rounded w-80">
        <h2>Edit Profile</h2>

        <input
          className="border p-2 w-full mb-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          className="bg-blue-500 text-white w-full mt-2"
          onClick={handleUpdate}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default EditProfile;