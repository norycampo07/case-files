import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export const DISCLAIMER = "All characters, clues, incidents, and rumors are fictional and provided for entertainment purposes.";
export function ConsentGate({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(() => sessionStorage.getItem("bds-workplace-consent") === "yes");
  const [checked, setChecked] = useState(false);
  if (accepted) return <>{children}<footer className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">{DISCLAIMER}</footer></>;
  return <div className="min-h-[100dvh] board-bg grid place-items-center p-5">
    <div className="text-center"><h1 className="font-display text-4xl text-primary">BDS Case Files</h1><p className="mt-3">Fictional mysteries. Real teamwork.</p></div>
    <Dialog open>
      <DialogContent className="[&>button:last-child]:hidden" onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()}>
        <DialogTitle className="font-display text-2xl">Before you open a case</DialogTitle>
        <DialogDescription className="text-base leading-relaxed">This game is a fictional workplace mystery designed solely for entertainment and team engagement.
          All cases, clues, rumors, suspects, and outcomes are fictional and do not represent real events, actions, allegations, or behaviors.</DialogDescription>
        <p className="text-sm text-muted-foreground">These characters and portraits are fictional, not representations of real employees. Use a made-up alias, not personal information. Tournament state stays in server memory: refreshing restores your progress, but a server restart clears rooms. New Tournament clears previous cases, ballots, and scores. No database or case history is kept.</p>
        <label className="flex items-start gap-3 text-sm cursor-pointer"><input data-testid="checkbox-consent" type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="mt-1 h-4 w-4 accent-[hsl(43,70%,60%)]" />
          <span>I acknowledge that this is fictional entertainment and does not describe real people or events.</span></label>
        <button data-testid="button-consent" disabled={!checked} className="bg-primary text-primary-foreground rounded px-4 py-3 font-semibold disabled:opacity-40"
          onClick={() => {
            sessionStorage.setItem("bds-workplace-consent", "yes");
            for (const key of Object.keys(sessionStorage)) if (key.startsWith("bds-notes-")) sessionStorage.removeItem(key);
            setAccepted(true);
          }}>Acknowledge and continue</button>
      </DialogContent>
    </Dialog>
    <footer className="text-xs text-muted-foreground fixed bottom-4 px-5 text-center">{DISCLAIMER}</footer>
  </div>;
}
