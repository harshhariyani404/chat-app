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

      const updatedUser = res.data?.user || (res.data?._id ? res.data : null);
      const finalUser = updatedUser
        ? { ...user, ...updatedUser }
        : { ...user, username, ...(res.data?.avatar && { avatar: res.data.avatar }) };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-sm">
      <div className="glass-panel floating-card w-full max-w-md rounded-[30px] p-6 sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2f8f83]">
            Profile
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Edit your profile</h2>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-soft)" }}>
            Update your display name or upload a new avatar to personalize the chat.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Profile picture
            </label>
            <input
              type="file"
              accept="image/*"
              className="auth-input file:mr-4 file:rounded-xl file:border-0 file:bg-[#17313e] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              onChange={(e) => setFile(e.target.files[0])}
              disabled={loading}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="secondary-button flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="primary-button flex-1 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
