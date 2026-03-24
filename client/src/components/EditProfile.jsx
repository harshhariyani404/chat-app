import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const EditProfile = ({ user, setUser, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.avatar || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(user.avatar || "");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, user.avatar]);

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

      const updatedUser = res.data?.user || (res.data?._id ? res.data : null);
      const finalUser = updatedUser
        ? { ...user, ...updatedUser }
        : { ...user, username };

      setUser(finalUser);
      localStorage.setItem("user", JSON.stringify(finalUser));

      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="w-80 rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

        <div className="mb-4 flex flex-col items-center">
          <img
            src={
              previewUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${
                user?.displayName || user?.username || "default"
              }`
            }
            alt="Profile preview"
            className="mb-3 h-24 w-24 rounded-full object-cover ring-4 ring-sky-100"
          />
          <p className="text-sm text-gray-500">Profile picture preview</p>
        </div>

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
          onChange={(e) => setFile(e.target.files?.[0] || null)}
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
