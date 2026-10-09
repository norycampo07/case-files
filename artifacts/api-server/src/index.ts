import app from "./app";
import { logger } from "./lib/logger";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { attachTournamentRealtime, connectTournamentPlayer } from "./game/tournament-rooms";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
const io = new Server(server, { path: "/api/ws", maxHttpBufferSize: 16_384 });
attachTournamentRealtime(io);
io.use((socket, next) => {
  try {
    const { code, playerId } = socket.handshake.auth;
    const sessionId = socket.request.headers.cookie?.split(";").map(c => c.trim()).find(c => c.startsWith("bds_session="))?.slice("bds_session=".length);
    if (typeof code !== "string" || typeof playerId !== "string") throw new Error("Invalid room session");
    socket.data.disconnectPlayer = connectTournamentPlayer(code, playerId, sessionId, socket.id);
    next();
  } catch { next(new Error("This room session is not available. Rejoin the case.")); }
});
io.on("connection", socket => {
  socket.on("disconnect", () => socket.data.disconnectPlayer?.());
});
server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
