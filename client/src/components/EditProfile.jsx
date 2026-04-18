import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { getAvatarUrl } from "../lib/avatar";
import { persistSession } from "../lib/storage";

const EditProfile = ({ user, setUser, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.avatar || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(getAvatarUrl(user.avatar));
      return;
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

      const res = await api.put("/users/profile", formData);

      const updatedUser = res.data?.user || (res.data?._id ? res.data : null);
      const finalUser = updatedUser
        ? { ...user, ...updatedUser }
        : { ...user, username };

      setUser(finalUser);
      persistSession({ user: finalUser });

      toast.success("Profile updated");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 shadow-panel sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Your profile</h2>
            <p className="mt-1 text-sm text-slate-500">Update how others see you in Connect.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <img
              src={
                getAvatarUrl(previewUrl) ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${
                  user?.displayName || user?.username || "default"
                }`
              }
              alt=""
              className="h-28 w-28 rounded-3xl object-cover ring-4 ring-indigo-100 shadow-soft"
            />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-400">Preview</p>
        </div>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Username</label>
        <input
          className="mb-5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Avatar</label>
        <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/30">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
          {file ? file.name : "Choose image…"}
        </label>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
