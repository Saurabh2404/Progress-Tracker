"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to sign in.");
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase text-[#667085]">Email</span>
        <span className="flex h-12 items-center gap-3 rounded-md border border-[#d9dee8] bg-white px-3 transition focus-within:border-[#2f7df6] focus-within:ring-4 focus-within:ring-[#2f7df6]/10">
          <Mail size={18} className="text-[#98a2b3]" />
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="you@example.com"
          />
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase text-[#667085]">Password</span>
        <span className="flex h-12 items-center gap-3 rounded-md border border-[#d9dee8] bg-white px-3 transition focus-within:border-[#2f7df6] focus-within:ring-4 focus-within:ring-[#2f7df6]/10">
          <LockKeyhole size={18} className="text-[#98a2b3]" />
          <input
            required
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="Enter your password"
          />
          <button
            type="button"
            className="grid size-8 place-items-center text-[#7b8494] transition hover:text-[#20232d]"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {error && <p className="rounded-md bg-[#fff1f2] px-3 py-2 text-sm font-semibold text-[#b4233c]">{error}</p>}
      <button
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#20232d] text-sm font-bold text-white transition hover:bg-[#2f7df6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowRight size={18} />}
        Sign in securely
      </button>
    </form>
  );
}
