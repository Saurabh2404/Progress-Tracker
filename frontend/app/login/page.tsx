import { Suspense } from "react";
import { BarChart3, CheckCircle2, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f4f6f9] lg:grid-cols-[minmax(340px,0.85fr)_minmax(520px,1.15fr)]">
      <section className="flex min-h-[42vh] flex-col justify-between bg-[#171722] p-7 text-white sm:p-10 lg:min-h-screen lg:p-14">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-[#2f7df6] font-black italic">U</span>
          <div>
            <p className="font-bold">Upgrading Skills</p>
            <p className="text-xs text-[#aeb4c4]">Private learning workspace</p>
          </div>
        </div>
        <div className="max-w-xl py-10">
          <p className="mb-4 text-sm font-bold uppercase text-[#77aaff]">One focused plan</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Your progress stays yours.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#b9bfce]">
            Secure access to your sprint roadmap, completion history, revision queue, and daily momentum.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-[#d6dae4] sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <span className="flex items-center gap-2"><ShieldCheck size={17} /> Signed sessions</span>
          <span className="flex items-center gap-2"><BarChart3 size={17} /> Live progress</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={17} /> Private data</span>
        </div>
      </section>
      <section className="grid place-items-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <p className="text-sm font-bold text-[#2f7df6]">WELCOME BACK</p>
          <h2 className="mt-2 text-3xl font-bold text-[#20232d]">Sign in to your plan</h2>
          <p className="mt-3 text-sm leading-6 text-[#667085]">Only the configured account can access this workspace.</p>
          <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-md bg-white" />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
