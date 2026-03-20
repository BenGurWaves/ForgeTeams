"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createBrowserClient();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const params = new URLSearchParams(window.location.search);
        window.location.href = params.get("redirect") || "/dashboard";
      }
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else if (data.session) {
        // Set cookie so middleware allows access to protected routes
        document.cookie = `sb-auth-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`;
        const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/dashboard";
        window.location.href = redirectTo;
        return;
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="font-heading text-2xl font-bold tracking-tight">
            ForgeTeams
          </Link>
          <p className="text-text-secondary text-sm mt-3">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-text-secondary mb-2 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-2 uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            {message && (
              <p className="text-emerald-400 text-sm bg-emerald-400/10 rounded-xl px-4 py-3">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-bg-primary rounded-xl px-6 py-3 text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Working..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setMessage("");
              }}
              className="text-text-secondary text-sm hover:text-accent transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Need an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
