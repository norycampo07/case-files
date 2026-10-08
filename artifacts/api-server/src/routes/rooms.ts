import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { CreateRoomBody, JoinRoomBody, StartGameBody, CastInvestigationVoteBody, SendRoomMessageBody, SubmitAccusationBody, UseExtraInterviewBody, GetRoomQueryParams } from "@workspace/api-zod";
import { accuse, castVote, createRoom, extraInterview, GameError, getRoom, joinRoom, sendMessage, startGame } from "../game/rooms";

const router: IRouter = Router();
const session = (req: Request) => req.cookies?.bds_session as string | undefined;
function ensureSession(req: Request, res: Response) {
  let id = session(req);
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = randomUUID();
    res.cookie("bds_session", id, { httpOnly: true, sameSite: "lax", secure: req.secure || req.headers["x-forwarded-proto"] === "https", maxAge: 24 * 60 * 60 * 1000, path: "/api" });
  }
  return id;
}
function handler(action: (req: Request, res: Response) => unknown) {
  return (req: Request, res: Response) => {
    try { action(req, res); }
    catch (error) {
      if (error instanceof GameError) res.status(error.status).json({ error: error.message });
      else if (error instanceof Error && error.name === "ZodError") res.status(400).json({ error: "Check the required fields and try again." });
      else { req.log.error({ err: error }, "Room action failed"); res.status(500).json({ error: "The case desk encountered an error. Please retry." }); }
    }
  };
}
const code = (req: Request) => String(req.params.code).toUpperCase();
router.post("/rooms", handler((req, res) => {
  const input = CreateRoomBody.parse(req.body);
  res.status(201).json(createRoom(input.displayName, ensureSession(req, res)));
}));
router.post("/rooms/:code/players", handler((req, res) => {
  const input = JoinRoomBody.parse(req.body);
  res.json(joinRoom(code(req), input.displayName, ensureSession(req, res)));
}));
router.get("/rooms/:code", handler((req, res) => {
  const input = GetRoomQueryParams.parse(req.query);
  res.json(getRoom(code(req), input.playerId, session(req)));
}));
router.post("/rooms/:code/start", handler((req, res) => {
  const input = StartGameBody.parse(req.body);
  res.json(startGame(code(req), input.playerId, session(req)));
}));
router.post("/rooms/:code/votes", handler((req, res) => {
  const input = CastInvestigationVoteBody.parse(req.body);
  res.json(castVote(code(req), input.playerId, session(req), input.action));
}));
router.post("/rooms/:code/messages", handler((req, res) => {
  const input = SendRoomMessageBody.parse(req.body);
  res.status(201).json(sendMessage(code(req), input.playerId, session(req), input.text));
}));
router.post("/rooms/:code/interview", handler((req, res) => {
  const input = UseExtraInterviewBody.parse(req.body);
  res.json(extraInterview(code(req), input.playerId, session(req)));
}));
router.post("/rooms/:code/accusation", handler((req, res) => {
  const input = SubmitAccusationBody.parse(req.body);
  res.json(accuse(code(req), input.playerId, session(req), input));
}));
export default router;
