import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/env";
import { getStoredUser } from "../lib/storage";
import {
  clearMeetingGuest,
  readMeetingGuest,
  writeMeetingGuest,
} from "../lib/meetingGuest";
import MeetingRoom from "./MeetingRoom";

const MeetingEnter = () => {
  const { meetingId } = useParams();
  const user = getStoredUser();
  const [guestSession, setGuestSession] = useState(null);
  const [booting, setBooting] = useState(() => !getStoredUser());
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const loggedIn = getStoredUser();
    if (loggedIn) {
      setBooting(false);
      return undefined;
    }

    const stored = readMeetingGuest(meetingId);
    if (!stored?.guestId) {
      setBooting(false);
      return undefined;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await axios.post(`${API_BASE_URL}/api/meetings/public/${meetingId}/join`, {
          existingGuestId: stored.guestId,
          displayName: stored.displayName,
        });
        if (!cancelled) {
          setGuestSession({
            guestId: res.data.guestId,
            displayName: res.data.displayName,
          });
        }
      } catch {
        clearMeetingGuest(meetingId);
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  const joinAsGuest = async (e) => {
    e.preventDefault();
    const trimmed = name.trim().slice(0, 40);
    if (trimmed.length < 1) {
      setFormError("Enter your name to join.");
      return;
    }

    setBusy(true);
    setFormError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/meetings/public/${meetingId}/join`, {
        displayName: trimmed,
      });
      writeMeetingGuest(meetingId, {
        guestId: res.data.guestId,
        displayName: res.data.displayName,
      });
      setGuestSession({
        guestId: res.data.guestId,
        displayName: res.data.displayName,
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Could not join this meeting.";
      setFormError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return <MeetingRoom user={user} />;
  }

  if (booting) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-950 text-slate-300">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
        <p className="mt-4 text-sm font-medium">Loading meeting…</p>
      </div>
    );
  }

  if (guestSession) {
    const guestUser = {
      _id: guestSession.guestId,
      username: guestSession.displayName,
      isGuest: true,
    };
    return <MeetingRoom user={guestUser} />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.35), transparent), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(16, 185, 129, 0.12), transparent)",
        }}
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Video meeting</p>
        <h1 className="mt-2 text-xl font-bold tracking-tight">Join as guest</h1>
        <p className="mt-2 text-sm text-slate-400">
          You are not signed in. Enter the name others will see, or{" "}
          <Link to="/" className="font-semibold text-indigo-400 underline-offset-2 hover:underline">
            log in
          </Link>{" "}
          to use your account name.
        </p>

        <form onSubmit={joinAsGuest} className="mt-6 space-y-4">
          <div>
            <label htmlFor="guest-name" className="mb-1.5 block text-xs font-semibold text-slate-300">
              Display name
            </label>
            <input
              id="guest-name"
              type="text"
              autoComplete="nickname"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-indigo-500/0 transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>

          {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
          >
            {busy ? "Joining…" : "Join meeting"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Room ID: <span className="font-mono text-slate-400">{meetingId}</span>
        </p>
      </div>
    </div>
  );
};

export default MeetingEnter;
