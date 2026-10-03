export const TOTAL_PLAN_DAYS = 47;

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.36, ease: easeOut },
};

export const revealPanel = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3, ease: easeOut },
};

export const sprintAccents = [
  "#2fb67c",
  "#3182f6",
  "#9b5de5",
  "#ef6b3b",
  "#18a5a8",
  "#d39820",
  "#e24f7a",
  "#6675e8",
] as const;

export function minutesLabel(minutes = 0) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && !rest) return `${hours}h`;
  return hours ? `${hours}h ${rest}m` : `${rest} min`;
}

export function dateKey(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function initials(email: string) {
  return email.slice(0, 2).toUpperCase() || "US";
}
