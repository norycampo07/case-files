import { useState } from "react";
import { useResetGame, useStartNewCase, useUpdateRoomSettings, type RoomView } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function HostControls({ room, playerId, apply }: { room: RoomView; playerId: string; apply: (room: RoomView) => void }) {
  const settings = useUpdateRoomSettings();
  const reset = useResetGame();
  const next = useStartNewCase();
  const [confirm, setConfirm] = useState<"reset" | "next" | null>(null);
  const [error, setError] = useState("");
  const busy = settings.isPending || reset.isPending || next.isPending;
  const onError = () => setError("The control could not be applied. Try again.");
  const onSuccess = (view: RoomView) => { apply(view); setConfirm(null); setError(""); };
  return <section className="border border-primary/40 bg-card rounded p-4 space-y-3" data-testid="panel-host-controls">
    <h2 className="font-display text-xl">Host controls</h2>
    {(["rumorsEnabled", "chatEnabled"] as const).map(key => <label className="flex items-center gap-3 text-sm" key={key}>
      <input data-testid={`toggle-${key}`} type="checkbox" checked={room.settings[key]} disabled={busy} onChange={e => {
        setError(""); settings.mutate({ code: room.code, data: { playerId, ...room.settings, [key]: e.target.checked } }, { onSuccess, onError });
      }} />{key === "rumorsEnabled" ? "Enable playful office rumors" : "Enable team chat"}
    </label>)}
    <p className="text-xs text-muted-foreground">Disabling chat discards its current messages. Rumors remain harmless and fictional.</p>
    <div className="flex flex-wrap gap-2">
      <button data-testid="button-reset" disabled={busy || room.status === "lobby"} onClick={() => setConfirm("reset")} className="border border-border rounded px-3 py-2 text-sm disabled:opacity-40">Reset Case</button>
      <button data-testid="button-new-case" disabled={busy || room.players.length < 2} onClick={() => setConfirm("next")} className="bg-primary text-primary-foreground rounded px-3 py-2 text-sm font-semibold disabled:opacity-40">Start New Case</button>
    </div>
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    <Dialog open={confirm !== null} onOpenChange={open => { if (!open && !busy) setConfirm(null); }}>
      <DialogContent>
        <DialogTitle>{confirm === "reset" ? "Reset this case?" : "Open a new case?"}</DialogTitle>
        <DialogDescription>Current evidence, votes, private clues, chat, notes, and score will be discarded for this team. The room code, team, and host settings stay the same.
          {confirm === "reset" ? " You will return to the lobby." : " A new random workplace mystery will start immediately."}</DialogDescription>
        <div className="flex gap-3">
          <button data-testid="button-confirm-host-control" disabled={busy} className="bg-primary text-primary-foreground px-4 py-2 rounded font-semibold disabled:opacity-40" onClick={() => {
            setError("");
            const action = confirm === "reset" ? reset : next;
            action.mutate({ code: room.code, data: { playerId } }, { onSuccess, onError });
          }}>{busy ? "Working..." : "Discard and continue"}</button>
          <button disabled={busy} className="border border-border rounded px-4 py-2" onClick={() => setConfirm(null)}>Cancel</button>
        </div>
        {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      </DialogContent>
    </Dialog>
  </section>;
}
