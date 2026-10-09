export interface Session { code: string; playerId: string }
const KEY = "bds-session";
export function loadSession(): Session | null {
  try { const r = sessionStorage.getItem(KEY); return r ? (JSON.parse(r) as Session) : null; } catch { return null; }
}
export function saveSession(s: Session) { sessionStorage.setItem(KEY, JSON.stringify(s)); }
export function clearSession() { sessionStorage.removeItem(KEY); }

export const ACTION_LABELS: Record<string, { label: string; hint: string }> = {
  "interview-suspect": { label: "Interview Suspect", hint: "Question a suspect face to face." },
  "review-emails": { label: "Review Emails", hint: "Read through internal correspondence." },
  "examine-crime-scene": { label: "Examine Scene", hint: "Check the fictional workspace and file views." },
  "review-security-logs": { label: "Review Security Logs", hint: "Pull door and system access records." },
  "check-timeline": { label: "Check Timeline", hint: "Reconcile who was where, and when." },
  "verify-alibi": { label: "Verify Alibi", hint: "Cross-check routine tasks with the calendar." },
  "search-office": { label: "Search Office", hint: "Look through fictional notes and checklists." },
  "analyze-evidence": { label: "Analyze Evidence", hint: "Connect revision details and file behavior." },
  "review-project-tracker": { label: "Review Project Tracker", hint: "Check the handover assignment." },
  "audit-recent-changes": { label: "Audit Recent Changes", hint: "Compare recent edits with the recovery view." },
};
