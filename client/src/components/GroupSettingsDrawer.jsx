import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { getAvatarUrl } from "../lib/avatar";

const GroupSettingsDrawer = ({ group, user, onClose, onGroupUpdated, onGroupDeleted }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const adminId = group.admin?._id || group.admin;
  const isAdmin = String(adminId) === String(user._id);
  const members = group.members || [];

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    try {
      const res = await api.get("/users/search", { params: { query: q } });
      const memberIds = new Set(members.map((m) => String(m._id || m)));
      setResults(res.data.filter((u) => u._id !== user._id && !memberIds.has(String(u._id))));
    } catch {
      setResults([]);
    }
  };

  const addMember = async (memberUser) => {
    if (!isAdmin) return;
    setBusyId(memberUser._id);
    try {
      const res = await api.post(`/groups/${group._id}/members`, {
        memberIds: [memberUser._id],
      });
      onGroupUpdated(res.data);
      setSearch("");
      setResults([]);
      toast.success(`${memberUser.username} added`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add member");
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (memberId, username) => {
    if (!isAdmin) return;
    if (!window.confirm(`Remove ${username} from this group?`)) return;
    setBusyId(memberId);
    try {
      const res = await api.delete(`/groups/${group._id}/members/${memberId}`);
      if (res.data?.deleted) {
        onGroupDeleted?.(group._id);
        onClose();
        toast("Group was removed");
        return;
      }
      onGroupUpdated(res.data);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove");
    } finally {
      setBusyId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center">
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
          <h3 className="text-lg font-bold text-slate-900">Group info</h3>
          <p className="mt-1 text-sm text-slate-500">{group.name}</p>
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{members.length}</span> members — only the admin can change
            members.
          </p>
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {members.map((m) => (
              <li key={m._id || m} className="flex items-center gap-2 text-sm text-slate-700">
                <img
                  src={
                    getAvatarUrl(m.avatar) ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${m.username || "u"}`
                  }
                  alt=""
                  className="h-8 w-8 rounded-lg object-cover"
                />
                {m.username}
                {String(m._id || m) === String(adminId) ? (
                  <span className="text-xs font-semibold text-indigo-600">Admin</span>
                ) : null}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl border border-slate-200 bg-white shadow-panel sm:max-h-[90vh] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Group settings</h3>
            <p className="text-sm text-slate-500">{group.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Members</p>
          <p className="text-2xl font-bold text-slate-900">
            {members.length}
            <span className="ml-1 text-base font-normal text-slate-500">people</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Add people</label>
          <input
            type="search"
            value={search}
            onChange={(e) => void handleSearch(e.target.value)}
            placeholder="Search by username…"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
          />
          {results.length > 0 && (
            <ul className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50">
              {results.map((u) => (
                <li key={u._id}>
                  <button
                    type="button"
                    disabled={busyId === u._id}
                    onClick={() => addMember(u)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white"
                  >
                    {u.username}
                    <span className="ml-auto text-xs font-semibold text-indigo-600">Add</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Current members</p>
          <ul className="space-y-2">
            {members.map((m) => {
              const mid = m._id || m;
              const isSelf = String(mid) === String(user._id);
              const isGroupAdminMember = String(mid) === String(adminId);

              return (
                <li
                  key={mid}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-3 py-2"
                >
                  <img
                    src={
                      getAvatarUrl(m.avatar) ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${m.username || "u"}`
                    }
                    alt=""
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{m.username}</p>
                    {isGroupAdminMember && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Admin</span>
                    )}
                  </div>
                  {isSelf ? (
                    <button
                      type="button"
                      disabled={busyId === mid}
                      onClick={() => removeMember(mid, m.username)}
                      className="shrink-0 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                    >
                      Leave
                    </button>
                  ) : (
                    isAdmin && (
                      <button
                        type="button"
                        disabled={busyId === mid}
                        onClick={() => removeMember(mid, m.username)}
                        className="shrink-0 rounded-xl border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-slate-100 p-4 safe-area-pb">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsDrawer;
