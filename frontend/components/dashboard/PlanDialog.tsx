"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, X } from "lucide-react";
import type { FormEvent } from "react";

type Props = { open: boolean; planName: string; completionDate: string; saving: boolean; onPlanNameChange: (value: string) => void; onCompletionDateChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void };

export function PlanDialog(props: Props) {
  return <AnimatePresence>{props.open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && props.onClose()}>
    <motion.form initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ type: "spring", stiffness: 380, damping: 30 }} onSubmit={props.onSubmit} className="w-full max-w-md rounded-lg border border-white/40 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#191c23] dark:text-white">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-blue-500">PLAN SETTINGS</p><h2 className="mt-1 text-xl font-bold">Adjust your plan</h2></div><button type="button" onClick={props.onClose} className="grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close plan settings"><X size={19} /></button></div>
      <Field label="Plan name"><input required value={props.planName} onChange={(event) => props.onPlanNameChange(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10" /></Field>
      <Field label="Target completion date"><input required type="date" value={props.completionDate} onChange={(event) => props.onCompletionDateChange(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10" /></Field>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={props.onClose} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-bold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10">Cancel</button><button disabled={props.saving} className="flex h-10 items-center gap-2 rounded-md bg-blue-500 px-4 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-60">{props.saving && <LoaderCircle size={15} className="animate-spin" />} Save changes</button></div>
    </motion.form>
  </motion.div>}</AnimatePresence>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mt-5 block"><span className="mb-2 block text-xs font-bold text-slate-500">{label}</span>{children}</label>; }
