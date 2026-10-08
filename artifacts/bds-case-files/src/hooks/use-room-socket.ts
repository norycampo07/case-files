import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { getGetRoomQueryKey, type RoomView } from "@workspace/api-client-react";

export type ConnState = "connecting" | "live" | "offline";

export function useRoomSocket(code: string | undefined, playerId: string | undefined) {
  const qc = useQueryClient();
  const [state, setState] = useState<ConnState>("connecting");
  const qcRef = useRef(qc);
  qcRef.current = qc;

  useEffect(() => {
    if (!code || !playerId) return;
    const key = getGetRoomQueryKey(code, { playerId });
    const socket = io({ path: "/api/ws", auth: { code, playerId }, transports: ["websocket", "polling"] });
    socket.on("connect", () => { setState("live"); qcRef.current.invalidateQueries({ queryKey: key }); });
    socket.on("disconnect", () => setState("offline"));
    socket.on("connect_error", () => setState("offline"));
    socket.io.on("reconnect_attempt", () => setState("connecting"));
    socket.on("room:update", (view: RoomView) => { qcRef.current.setQueryData(key, view); });
    return () => { socket.disconnect(); };
  }, [code, playerId]);

  return state;
}
