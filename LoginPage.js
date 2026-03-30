import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const DEMO_ACCOUNTS = [
  { email: "teacher@classEngage.com", password: "teacher123", role: "teacher", label: "Teacher Demo" },
  { email: "alice@classEngage.com", password: "student123", role: "student", label: "Alice (Student)" },
  { email: "bob@classEngage.com", password: "student123", role: "student", label: "Bob (Student)" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [regRole, setRegRole] = useState("student");

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const name = email.split("@")[0];
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        role: regRole,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        uid: cred.user.uid,
      });
      if (regRole === "student") {
        await setDoc(doc(db, "students", cred.user.uid), {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          email,
          points: 0,
          badges: [],
          uid: cred.user.uid,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (account) => {
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, account.email, account.password);
    } catch (err) {
      // Try registering if doesn't exist
      try {
        const cred = await createUserWithEmailAndPassword(auth, account.email, account.password);
        const name = account.email.split("@")[0];
        await setDoc(doc(db, "users", cred.user.uid), {
          email: account.email,
          role: account.role,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          uid: cred.user.uid,
        });
        if (account.role === "student") {
          await setDoc(doc(db, "students", cred.user.uid), {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            email: account.email,
            points: 0,
            badges: [],
            uid: cred.user.uid,
            createdAt: new Date(),
          });
        }
      } catch (regErr) {
        setError(regErr.message.replace("Firebase: ", ""));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" style={{
      backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.1) 0%, transparent 50%)`
    }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-900/50">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">ClassEngage</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time student participation tracker</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-slate-800 p-1 rounded-xl">
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  mode === m ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}>{m}</button>
            ))}
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-slate-600 transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-slate-600 transition"
                required
              />
            </div>
            {mode === "register" && (
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wider">Role</label>
                <div className="flex gap-3">
                  {["teacher", "student"].map(r => (
                    <button type="button" key={r} onClick={() => setRegRole(r)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize border transition-all ${
                        regRole === r
                          ? "border-violet-500 bg-violet-600/20 text-violet-300"
                          : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}>{r === "teacher" ? "👩‍🏫 Teacher" : "🧑‍🎓 Student"}</button>
                  ))}
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-900/50 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Demo Accounts</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} onClick={() => quickLogin(acc)} disabled={loading}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-2 rounded-xl border border-slate-700 hover:border-slate-600 transition-all font-medium disabled:opacity-50">
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
