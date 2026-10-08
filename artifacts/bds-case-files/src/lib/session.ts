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
  "examine-crime-scene": { label: "Examine Crime Scene", hint: "Walk the scene for physical traces." },
  "review-security-logs": { label: "Review Security Logs", hint: "Pull door and system access records." },
  "check-timeline": { label: "Check Timeline", hint: "Reconcile who was where, and when." },
  "verify-alibi": { label: "Verify Alibi", hint: "Test a suspect's story against records." },
  "search-office": { label: "Search Office", hint: "Go through desks and drawers." },
  "analyze-evidence": { label: "Analyze Evidence", hint: "Send collected items for lab review." },
};
export const MOTIVES = ["Money","Promotion","Revenge","Jealousy","Cover-Up","Personal Gain"];
export const METHODS = ["Duplicate Key","Stolen Access Card","Hidden Passage","Log Manipulation","Security Blind Spot","Fake Alibi"];
