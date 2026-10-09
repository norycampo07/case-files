export function errMsg(e: unknown, fallback = "That did not go through. Try again."): string {
  const x = e as { data?: { error?: unknown; message?: unknown } | null; message?: string } | null;
  const d = x?.data;
  if (d && typeof d.error === "string") return d.error;
  if (d && typeof d.message === "string") return d.message;
  return x?.message && x.message.length < 140 ? x.message : fallback;
}
