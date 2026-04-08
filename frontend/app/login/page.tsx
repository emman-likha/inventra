"use client";

import { useState, useRef, useMemo, Suspense, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { KineticBackground } from "@/components/KineticBackground";
import { FloatingDots } from "@/components/FloatingDots";
import { LoadingScreen } from "@/components/LoadingScreen";


/* ── Staggered field animation ─────────────────────────────────── */

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.06 * i,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const inputClass =
  "w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-2xl px-5 py-3.5 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/20 focus:bg-foreground/[0.06] transition-all duration-200 text-sm";

/* ── Sub-components ─────────────────────────────────────────────── */

function Field({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div custom={index} variants={fieldVariants}>
      {children}
    </motion.div>
  );
}

function SignInForm({ onAuthSuccess }: { onAuthSuccess: (path: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      onAuthSuccess("/dashboard");
    }
  };

  return (
    <motion.form
      onSubmit={handleSignIn}
      className="flex flex-col gap-5"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        visible: { transition: { staggerChildren: 0.06 } },
        exit: { transition: { staggerChildren: 0.03 } },
      }}
    >
      {error && (
        <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <Field index={0}>
        <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
          Email address
        </label>
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field index={1}>
        <div className="flex items-center justify-between mb-2 ml-1">
          <label className="text-foreground/40 text-xs font-medium">
            Password
          </label>
          <button
            type="button"
            className="text-foreground/30 text-xs hover:text-foreground/50 transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field index={2}>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          className="w-full bg-foreground text-background py-3.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 mt-3"
        >
          {loading ? "Signing in..." : "Sign in"}
        </motion.button>
      </Field>
    </motion.form>
  );
}

function SignUpForm({ onAuthSuccess }: { onAuthSuccess: (path: string) => void }) {
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Check if company name already exists
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const checkRes = await fetch(`${API_BASE}/api/companies/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName.trim() }),
      });
      const checkData = await checkRes.json();
      if (checkData.exists) {
        setError(
          `A company named "${companyName.trim()}" already exists. Please contact your company administrator to get an account.`
        );
        setLoading(false);
        return;
      }
    } catch {
      // If check fails, proceed with signup (the DB trigger will handle it)
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company_name: companyName.trim(),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Since email confirmation is disabled, user is automatically signed in or can be signed in immediately
    // New signups always become admin of their company
    if (data.session) {
      onAuthSuccess("/dashboard");
    } else {
      // Fallback if not automatically signed in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError("Account created, but could not sign in automatically. Please sign in manually.");
        setLoading(false);
      } else {
        onAuthSuccess("/dashboard");
      }
    }
  };

  return (
    <motion.form
      onSubmit={handleSignUp}
      className="flex flex-col gap-5"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        visible: { transition: { staggerChildren: 0.06 } },
        exit: { transition: { staggerChildren: 0.03 } },
      }}
    >
      {error && (
        <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <Field index={0}>
        <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
          Company name
        </label>
        <input
          type="text"
          placeholder="Acme Corporation"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field index={1}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
              First name
            </label>
            <input
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
              Last name
            </label>
            <input
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>
      </Field>

      <Field index={2}>
        <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
          Email address
        </label>
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field index={3}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
              Confirm password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </div>
        </div>
      </Field>

      <Field index={4}>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          className="w-full bg-foreground text-background py-3.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 mt-3"
        >
          {loading ? "Creating account..." : "Create account"}
        </motion.button>
      </Field>
    </motion.form>
  );
}

/* ── Kinetic Background Components ────────────────────────────── */


/* ── Main page ──────────────────────────────────────────────────── */

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [showLoading, setShowLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/dashboard");

  const handleAuthSuccess = (path: string) => {
    setRedirectPath(path);
    setShowLoading(true);
  };

  const handleLoadingComplete = () => {
    router.push(redirectPath);
  };

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
      <AnimatePresence>
        {showLoading && (
          <LoadingScreen onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      <KineticBackground />
      <FloatingDots />

      <div className="w-full max-w-lg mx-auto px-6 relative" style={{ zIndex: 10 }}>
        <div className="w-full">
          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full"
          >
            <motion.div
              layout
              transition={{
                layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
              }}
              className="bg-foreground/[0.03] backdrop-blur-xl border border-foreground/[0.08] rounded-[2rem] p-8 sm:p-10 overflow-hidden"
            >
              {/* Header */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? "signup-header" : "signin-header"}
                  initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="mb-8"
                >
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {isSignUp ? "Create account" : "Welcome back"}
                  </h1>
                  <p className="text-foreground/50 mt-2 text-sm">
                    {isSignUp
                      ? "Start managing your assets intelligently."
                      : "Sign in to continue to Inventra."}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Form — crossfade with staggered fields */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? "signup" : "signin"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                  }}
                >
                  {isSignUp ? <SignUpForm onAuthSuccess={handleAuthSuccess} /> : <SignInForm onAuthSuccess={handleAuthSuccess} />}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Toggle mode */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-center px-4"
            >
              <p className="text-foreground/40 text-sm">
                {isSignUp
                  ? "Already have an account?"
                  : "Don\u2019t have an account?"}{" "}
                <button
                  onClick={toggleMode}
                  className="text-foreground font-medium hover:text-foreground/80 transition-colors cursor-pointer"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom subtle detail */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground/20 text-xs z-10"
      >
        &copy; {new Date().getFullYear()} Inventra
      </motion.p>
    </div>
  );
}
