"use client";

import { LogOut, Moon, Search, Sun, X } from "lucide-react";
import { motion } from "framer-motion";
import { initials } from "./utils";

type Props = { email: string; query: string; theme: "light" | "dark"; onQueryChange: (value: string) => void; onThemeToggle: () => void; onLogout: () => void };

export function DashboardHeader({ email, query, theme, onQueryChange, onThemeToggle, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-[0_8px_30px_rgba(25,35,55,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#101218]/92 dark:text-white">
      <div className="mx-auto grid min-h-16 max-w-[1900px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:grid-cols-[260px_minmax(280px,620px)_1fr] md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <motion.span whileHover={{ rotate: -6, scale: 1.05 }} className="grid size-9 shrink-0 place-items-center rounded-md bg-[#3182f6] text-sm font-black italic text-white shadow-[0_7px_20px_rgba(49,130,246,0.3)]">U</motion.span>
          <div className="min-w-0"><p className="truncate text-sm font-bold">Upgrading Skills</p><p className="truncate text-[10px] text-slate-500 dark:text-slate-400">Personal learning workspace</p></div>
        </div>
        <label className="order-3 col-span-2 flex h-10 min-w-0 items-center gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-3 text-slate-500 shadow-inner shadow-slate-900/[0.02] transition focus-within:border-[#3182f6] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 md:order-none md:col-span-1 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:shadow-black/20 dark:focus-within:bg-white/[0.07]">
          <Search size={17} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search tasks..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" />
          {query && (
            <button type="button" onClick={() => onQueryChange("")} className="grid size-7 shrink-0 place-items-center rounded text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={onThemeToggle} className="grid size-9 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white" aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}>
            <motion.span key={theme} initial={{ rotate: -40, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</motion.span>
          </button>
          <div className="hidden text-right lg:block"><p className="max-w-52 truncate text-xs font-semibold">{email}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">Private account</p></div>
          <span className="grid size-9 place-items-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold dark:border-white/10 dark:bg-white/10">{initials(email)}</span>
          <button onClick={onLogout} className="grid size-9 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </div>
    </header>
  );
}
