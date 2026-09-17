"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AuthForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    router.replace(next === "login" ? "/login" : "/signup", { scroll: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (mode === "login") {
      router.push("/");
      router.refresh();
    } else {
      setSignedUp(true);
    }
  };

  if (signedUp) {
    return (
      <div className="w-full max-w-sm glass-panel rounded-3xl p-8 text-center">
        <h1 className="text-xl font-bold mb-2">Check your email</h1>
        <p className="text-muted text-sm">
          We sent a confirmation link to <span className="text-foreground">{email}</span>. Confirm it,
          then log in.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-1 glass-panel rounded-full p-1 mb-6">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === "login" ? "bg-accent text-background" : "text-muted hover:text-foreground"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === "signup" ? "bg-accent text-background" : "text-muted hover:text-foreground"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" ? "Log in to Airwave" : "Create your account"}
        </h1>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <label className="block text-xs font-medium text-muted mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <label className="block text-xs font-medium text-muted mb-1">Password</label>
        <input
          type="password"
          required
          minLength={mode === "signup" ? 6 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-full bg-accent text-background text-sm font-bold hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting
            ? mode === "login"
              ? "Logging in…"
              : "Signing up…"
            : mode === "login"
              ? "Log in"
              : "Sign up"}
        </button>
      </form>
    </div>
  );
}
