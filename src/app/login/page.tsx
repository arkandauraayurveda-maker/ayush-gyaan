"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  setPersistence, // 🔥 NEW: Security Import
  browserSessionPersistence // 🔥 NEW: Tab-close logout Import
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldAlert, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

type AuthView = "login" | "register" | "forgot";

export default function LoginPage() {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 🧠 The Bridge: Firebase to MongoDB Sync
  const syncWithDatabaseAndRedirect = async (firebaseUser: any) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: firebaseUser.uid, 
          email: firebaseUser.email,
          name: firebaseUser.displayName || "" 
        })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to sync with database");
      }

      // 🔥 SMART UX: URL se redirect link ko extract karo
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');

      // 2. Smart Routing based on Onboarding Status
      if (data.isNewUser || data.user?.isOnboarded === false) {
        router.push(redirectUrl ? `/onboarding?redirect=${encodeURIComponent(redirectUrl)}` : "/onboarding");
      } else {
        router.push(redirectUrl ? redirectUrl : "/dashboard"); 
      }

    } catch (err: any) {
      console.error("DB Sync Error:", err);
      setError("Account created, but database sync failed. Please try logging in again.");
      setIsLoading(false);
    }
  };

  // 📧 Email & Password Auth (Login / Register)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      // 🔥 SECURITY UPDATE: Tab close = Auto Logout
      await setPersistence(auth, browserSessionPersistence);

      let userCredential;
      if (view === "login") {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else if (view === "register") {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      
      if (userCredential) {
        await syncWithDatabaseAndRedirect(userCredential.user);
      }
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", "").replace("Error (auth/", "").replace(").", ""));
      setIsLoading(false);
    }
  };

  // 🔑 Forgot Password Logic
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("Password reset link sent! Check your inbox.");
      setIsLoading(false);
      setTimeout(() => setView("login"), 3000); 
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", "").replace("Error (auth/", "").replace(").", ""));
      setIsLoading(false);
    }
  };

  // 🌐 Google Auth Logic
  const handleGoogleLogin = async () => {
    setError("");
    setSuccessMsg("");
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      // 🔥 SECURITY UPDATE: Tab close = Auto Logout
      await setPersistence(auth, browserSessionPersistence);

      const userCredential = await signInWithPopup(auth, provider);
      await syncWithDatabaseAndRedirect(userCredential.user);
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030705] flex items-center justify-center relative overflow-hidden px-4 font-sans selection:bg-emerald-500/30">
      
      {/* 3D Glowing Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-teal-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      {/* Back to Home Navigation */}
      <Link href="/" className="absolute top-6 left-6 md:top-10 md:left-10 text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2 text-sm font-medium z-50 group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Home
      </Link>

      {/* Glassmorphism Auth Panel */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-[#050B08]/80 backdrop-blur-2xl border border-white/10 p-8 sm:p-12 rounded-[2rem] w-full max-w-md z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <motion.div whileHover={{ rotate: 180, scale: 1.1 }} transition={{ duration: 0.5 }} className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            {view === "login" ? "Welcome Back" : view === "register" ? "Create Account" : "Reset Password"}
          </h1>
          <p className="text-sm text-gray-400 mt-2 text-center font-medium">
            {view === "login" ? "Enter your details to access your courses." : view === "register" ? "Join India's most advanced BAMS platform." : "Enter your email to receive a reset link."}
          </p>
        </div>

        {/* Error & Success Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed capitalize">{error.replace(/-/g, " ")}</p>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={view === "forgot" ? handleForgotPassword : handleEmailAuth} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600"
              placeholder="medico@example.com"
              required
            />
          </div>
          
          {view !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                {view === "login" && (
                  <button type="button" onClick={() => setView("forgot")} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3.5 rounded-xl mt-2 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : view === "login" ? "Sign In" : view === "register" ? "Register Securely" : "Send Reset Link"}
          </button>
        </form>

        {view !== "forgot" && (
          <>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Or Continue With</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <button onClick={handleGoogleLogin} type="button" disabled={isLoading} className="w-full mt-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all hover:border-white/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </>
        )}

        <div className="mt-8 text-center">
          {view === "forgot" ? (
            <button onClick={() => setView("login")} className="text-sm font-medium text-gray-400 hover:text-emerald-400 transition-colors">
              Remembered your password? Sign In
            </button>
          ) : (
            <button onClick={() => setView(view === "login" ? "register" : "login")} className="text-sm font-medium text-gray-400 hover:text-emerald-400 transition-colors">
              {view === "login" ? "Don't have an account? Sign Up" : "Already registered? Sign In"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}