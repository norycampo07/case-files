import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  CreateTournamentBody, JoinTournamentBody, GetTournamentQueryParams,
  SetTournamentSettingsBody, StartTournamentBody, AdvanceTournamentScreenBody,
  RequestTournamentClueBody, BeginTournamentVoteBody, CastTournamentBallotBody,
  NextTournamentRoundBody, ResetTournamentBody, GetTournamentResponse,
} from "@workspace/api-zod";
import {
  TournamentError, createTournament, joinTournament, getTournament,
  getTournamentLobby, setTournamentSettings, startTournament, advanceTournamentScreen,
  requestTournamentClue, beginTournamentVote, castTournamentBallot,
  nextTournamentRound, resetTournament,
} from "../game/tournament-rooms";

const router: IRouter = Router();
const session = (req: Request) => req.cookies?.bds_session as string | undefined;
const code = (req: Request) => String(req.params.code).toUpperCase();
function ensureSession(req: Request, res: Response) {
  let id = session(req);
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = randomUUID();
    res.cookie("bds_session", id, {
      httpOnly: true, sameSite: "lax",
      secure: req.secure || req.headers["x-forwarded-proto"] === "https", path: "/api",
    });
  }
  return id;
}
function handler(action: (req: Request, res: Response) => unknown) {
  return (req: Request, res: Response) => {
    try { action(req, res); }
    catch (error) {
      if (error instanceof TournamentError) res.status(error.status).json({ error: error.message });
      else if (error instanceof Error && error.name === "ZodError") res.status(400).json({ error: "Check the required fields and try again." });
      else {
        req.log.error({ err: error }, "Tournament action failed");
        res.status(500).json({ error: "Could not update the tournament. Please retry." });
      }
    }
  };
}
const send = (res: Response, result: unknown) => res.json(GetTournamentResponse.parse(result));
router.post("/tournaments", handler((req, res) => {
  const input = CreateTournamentBody.parse(req.body);
  res.status(201);
  send(res, createTournament(input.displayName, ensureSession(req, res)));
}));
router.get("/tournaments/:code/lobby", handler((req, res) => {
  res.json(getTournamentLobby(code(req)));
}));
router.get("/tournaments/:code", handler((req, res) => {
  const input = GetTournamentQueryParams.parse(req.query);
  send(res, getTournament(code(req), input.playerId, session(req)));
}));
router.post("/tournaments/:code/players", handler((req, res) => {
  const input = JoinTournamentBody.parse(req.body);
  send(res, joinTournament(code(req), input.displayName, input.teamId, ensureSession(req, res)));
}));
router.patch("/tournaments/:code/settings", handler((req, res) => {
  const input = SetTournamentSettingsBody.parse(req.body);
  send(res, setTournamentSettings(code(req), input.playerId, session(req), input));
}));
router.post("/tournaments/:code/start", handler((req, res) => {
  const input = StartTournamentBody.parse(req.body);
  send(res, startTournament(code(req), input.playerId, session(req)));
}));
router.post("/tournaments/:code/advance", handler((req, res) => {
  const input = AdvanceTournamentScreenBody.parse(req.body);
  send(res, advanceTournamentScreen(code(req), input.playerId, session(req)));
}));
router.post("/tournaments/:code/clues", handler((req, res) => {
  const input = RequestTournamentClueBody.parse(req.body);
  send(res, requestTournamentClue(code(req), input.playerId, session(req)));
}));
router.post("/tournaments/:code/voting", handler((req, res) => {
  const input = BeginTournamentVoteBody.parse(req.body);
  send(res, beginTournamentVote(code(req), input.playerId, session(req)));
}));
router.post("/tournaments/:code/ballots", handler((req, res) => {
  const input = CastTournamentBallotBody.parse(req.body);
  send(res, castTournamentBallot(code(req), input.playerId, session(req), input.suspect));
}));
router.post("/tournaments/:code/next", handler((req, res) => {
  const input = NextTournamentRoundBody.parse(req.body);
  send(res, nextTournamentRound(code(req), input.playerId, session(req)));
}));
router.post("/tournaments/:code/reset", handler((req, res) => {
  const input = ResetTournamentBody.parse(req.body);
  send(res, resetTournament(code(req), input.playerId, session(req)));
}));
export default router;
