import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const EditProfile = ({ user, setUser, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    setLoading(true);
    try {
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
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Safely extract updated user data (handles both res.data and res.data.user structures)
      const updatedUser = res.data?.user || (res.data?._id ? res.data : null);
      
      // Merge the user object to prevent missing fields (like _id) that cause logouts
      const finalUser = updatedUser ? { ...user, ...updatedUser } : { ...user, username, ...(res.data?.avatar && { avatar: res.data.avatar }) };

      setUser(finalUser);
      localStorage.setItem("user", JSON.stringify(finalUser));
      
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input
          className="border border-gray-300 p-2 w-full rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
        <input
          type="file"
          accept="image/*"
          className="border border-gray-300 p-2 w-full rounded mb-4 focus:outline-none"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={loading}
        />

        <div className="flex gap-2 mt-4">
          <button
            className="bg-gray-400 text-white flex-1 py-2 rounded hover:bg-gray-500 transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="bg-blue-500 text-white flex-1 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;