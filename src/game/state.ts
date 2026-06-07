import { randomBytes } from "crypto";
import {
  DEFAULT_ROLE_TOGGLES,
  ROLES,
  missionSize,
  round4Needs2Fail,
  rolesForPlayerCount,
  type Faction,
  type Position,
  type RoleToggles,
} from "./roles.js";
import type { GameEvent } from "./events.js";
import type { Locale } from "../i18n/index.js";

/**
 * Per-channel game state. One channel hosts at most one in-flight
 * QuestGame session at a time; the keyed map of these lives in plugin.ts.
 *
 * Everything is in-memory only — process restart drops the game, just
 * like the original Python bot. If we ever want resume-across-restart
 * the persistence boundary is `serialize()` / `restore()` on this
 * type, but that's out of scope for v0.1.
 */

export interface Player {
  /** Discord user id. */
  userId: string;
  /** Display name captured at sign-up time so we don't re-fetch. */
  displayName: string;
  /**
   * Guild avatar URL — resolved once at deal time via the bot's
   * `members.get` RPC (see `flow/profiles.ts`). null for NPC seats
   * and for humans whose lookup failed; the WebUI falls back to a
   * generated placeholder.
   */
  avatarUrl: string | null;
  /** Seat number 1..N — stable after `deal()` shuffles. */
  index: number;
  position: Position;
  /** Most recent lake-of-the-lady check this player ran (target's userId). */
  lakeTarget: string | null;
}

export type Stage = "lobby" | "playing" | "assassinate" | "ended";
export type MissionResult = "success" | "fail";

/**
 * Per-stage transient state. One channel runs one stage at a time, so a
 * discriminated union keyed by `kind` is cleaner than parallel maps.
 * Each variant carries the message id of the public board it owns
 * (so the handler can edit-in-place on every click) plus the
 * stage-specific tallies. Cleared when the stage advances.
 */
export type RuntimeStage =
  | {
      kind: "appoint";
      messageId: string;
      /** Seat indexes the leader has tapped so far. */
      selected: number[];
    }
  | {
      kind: "publicVote";
      messageId: string;
      /** Mission roster (seat indexes) chosen during appoint. */
      missionMembers: number[];
      /** userId → vote. */
      votes: Record<string, "yes" | "no">;
    }
  | {
      kind: "privateVote";
      /** The mission roster announcement message. */
      messageId: string;
      missionMembers: number[];
      /** userId → vote. */
      votes: Record<string, "success" | "fail">;
    }
  | {
      kind: "lake";
      messageId: string;
      /** Seat index of the current Lady holder (= state.ladyHolderIndex when stage opens). */
      holderIndex: number;
    }
  | {
      kind: "assassinate";
      messageId: string;
    };

export interface GameState {
  /** Discord guild id. */
  guildId: string;
  /** Discord channel id this game runs in. */
  channelId: string;
  /** Whoever ran `/quest-game start`. Only they (or admin) can `/quest-game stop`. */
  hostUserId: string;
  /**
   * Locale every in-game render uses (boards, NPC repaints, ending
   * embed). Captured once at game-creation time from the host's
   * `/quest-game start` interaction so every player on the table sees
   * a single consistent locale, rather than each click independently
   * re-resolving against the clicker's own client locale.
   */
  locale: Locale;
  stage: Stage;
  /**
   * Transient stage runtime. Set by the stage opener, mutated by its
   * click handlers, cleared (or replaced) when the stage advances.
   * Distinct from `stage` (lobby/playing/assassinate/ended) which is
   * the high-level lifecycle marker; multiple `current.kind`s fit
   * inside `stage="playing"`.
   */
  current: RuntimeStage | null;
  /** Per-seat player roster. Order is finalised by `deal()`. */
  players: Player[];
  /** Round 1..5 (or 6 once ended). */
  round: number;
  /** Consecutive public-vote rejections this round; 5 in a row = evil wins. */
  consecutiveRejections: number;
  /** Whose turn it is to appoint mission members (seat index). */
  leaderIndex: number;
  /** Per-round outcome, populated as missions resolve. */
  missionResults: Array<MissionResult | null>;
  ladyEnabled: boolean;
  /**
   * Optional special roles in play, fixed at `/quest-game start` time.
   * `deal()` feeds this to `rolesForPlayerCount` so a toggled-off role
   * is replaced by a powerless stand-in.
   */
  roleToggles: RoleToggles;
  /** Seat index holding the Lady of the Lake right now (or null when disabled). */
  ladyHolderIndex: number | null;
  /** Times the lady has been used this game. */
  ladyUseCount: number;
  /** Set once the assassin has picked their target (seat index). */
  assassinTargetIndex: number | null;
  /** Final outcome when stage === 'ended'. */
  winner: Faction | null;
  /**
   * Process-unique session id. Surfaced to the WebUI so the admin
   * "force-stop" action can target a specific instance even if a new
   * session is started in the same channel right after.
   */
  sessionId: string;
  startedAt: number;
  /**
   * Per-player tallies used at end-of-game to pick the MVP (the
   * "decisive figure" whose card face is featured on the ending
   * embed). Mutated by the public/private-vote handlers + the
   * appoint confirmation site; consumed only by `computeMvp`.
   * Missing entries default to 0.
   */
  mvpStats: MvpStats;
  /**
   * Public history timeline — appended by `recordEvent` as stages
   * resolve, consumed by the WebUI sidebar. Holds only public-safe
   * facts (see `events.ts`). `eventSeq` is the monotonic id source
   * and doubles as the SSE change cursor.
   */
  events: GameEvent[];
  eventSeq: number;
}

export interface MvpStats {
  /**
   * Times this player cast a `fail` ballot on a mission. This is the
   * ONE MVP signal that can't be reconstructed from the public event
   * timeline — `mission-result` only records the aggregate fail count,
   * never who cast a fail ballot — so it's tracked here server-side.
   * Every other MVP signal (rejections, proposals, mission membership,
   * approve-good/bad) is derived from `state.events` at scoring time
   * by `computeMvp`; see `aggregateMvpSignals`.
   */
  failVotes: Record<string, number>;
}

export function newGameState(opts: {
  guildId: string;
  channelId: string;
  hostUserId: string;
  /** Locale captured from the host's `/quest-game start` interaction. */
  locale: Locale;
  signups: Array<{ userId: string; displayName: string }>;
  ladyEnabled: boolean;
  /** Optional special roles; defaults to all enabled. */
  roleToggles?: RoleToggles;
}): GameState {
  if (opts.signups.length < 4 || opts.signups.length > 10) {
    throw new Error(`player count out of range: ${opts.signups.length}`);
  }
  const players: Player[] = opts.signups.map((s, i) => ({
    userId: s.userId,
    displayName: s.displayName,
    avatarUrl: null,
    index: i,
    position: "loyal",
    lakeTarget: null,
  }));
  return {
    guildId: opts.guildId,
    channelId: opts.channelId,
    hostUserId: opts.hostUserId,
    locale: opts.locale,
    stage: "lobby",
    current: null,
    players,
    round: 1,
    consecutiveRejections: 0,
    leaderIndex: 0,
    missionResults: [null, null, null, null, null],
    ladyEnabled: opts.ladyEnabled,
    roleToggles: opts.roleToggles ?? DEFAULT_ROLE_TOGGLES,
    ladyHolderIndex: null,
    ladyUseCount: 0,
    assassinTargetIndex: null,
    winner: null,
    sessionId: randomBytes(8).toString("hex"),
    startedAt: Date.now(),
    mvpStats: {
      failVotes: {},
    },
    events: [],
    eventSeq: 0,
  };
}

/** Fisher–Yates in-place shuffle. */
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Assign roles + seats and pick the first leader / Lady holder.
 * Must be called exactly once, right after `newGameState`. Idempotency
 * isn't a goal — the caller is in `withChannelLock`.
 */
export function deal(state: GameState): void {
  const n = state.players.length;
  const deck = rolesForPlayerCount(n, state.roleToggles);
  shuffle(deck);
  shuffle(state.players);
  state.players.forEach((p, i) => {
    p.index = i;
    p.position = deck[i];
  });
  // First leader: random seat. Lady of the Lake (if enabled) starts in
  // the seat right *before* the first leader, per the QuestGame rulebook.
  state.leaderIndex = Math.floor(Math.random() * n);
  state.ladyHolderIndex = state.ladyEnabled
    ? (state.leaderIndex + n - 1) % n
    : null;
  state.stage = "playing";
}

/** Round size for this game's current round. */
export function currentMissionSize(state: GameState): number {
  return missionSize(state.players.length, state.round);
}

/** 7+ player rule: round 4 requires 2 fail votes. */
export function currentRoundNeeds2Fail(state: GameState): boolean {
  return state.round === 4 && round4Needs2Fail(state.players.length);
}

export function playerByUserId(state: GameState, userId: string): Player | null {
  return state.players.find((p) => p.userId === userId) ?? null;
}

export function playerByIndex(state: GameState, index: number): Player | null {
  return state.players[index] ?? null;
}

export function leader(state: GameState): Player {
  const p = state.players[state.leaderIndex];
  if (!p) throw new Error("leader seat out of range");
  return p;
}

/**
 * After a mission resolves (or a public vote is rejected enough times),
 * roll the leader forward by one seat. Wraps; never assigns to the
 * Lady holder specifically — that's a separate clockwise rotation
 * triggered when the lady is used.
 */
export function rotateLeader(state: GameState): void {
  state.leaderIndex = (state.leaderIndex + 1) % state.players.length;
}

/** Drop a mission result and reset the per-round vote counters. */
export function recordMissionResult(
  state: GameState,
  result: MissionResult,
): void {
  state.missionResults[state.round - 1] = result;
  state.consecutiveRejections = 0;
  state.round++;
}

/** Compute the running tally without scanning the array twice. */
export function missionTally(state: GameState): {
  success: number;
  fail: number;
} {
  let success = 0;
  let fail = 0;
  for (const r of state.missionResults) {
    if (r === "success") success++;
    else if (r === "fail") fail++;
  }
  return { success, fail };
}

/**
 * Decide whether the game is over and, if so, why. Called after every
 * mission resolution + after the public-vote rejection counter ticks.
 */
export interface Verdict {
  ended: boolean;
  winner?: Faction;
  reason?:
    | "missions-clean"
    | "missions-then-assassinate"
    | "missions-failed"
    | "rejections"
    | "merlin-killed"
    | "merlin-survived";
}

export function evaluateVerdict(state: GameState): Verdict {
  const tally = missionTally(state);
  if (tally.fail >= 3) {
    return { ended: true, winner: "mordred", reason: "missions-failed" };
  }
  if (state.consecutiveRejections >= 5) {
    return { ended: true, winner: "mordred", reason: "rejections" };
  }
  // Three successful missions WITHOUT 4-player table (where there's
  // no assassin) ends instantly for Arthur. Otherwise Arthur "leads"
  // 3-2 but evil gets one assassinate attempt.
  if (tally.success >= 3) {
    if (state.players.length < 5) {
      return { ended: true, winner: "arthur", reason: "missions-clean" };
    }
    return { ended: false, reason: "missions-then-assassinate" };
  }
  return { ended: false };
}

/**
 * Apply the assassin's pick + decide the post-assassinate verdict.
 * Caller must already have set `state.assassinTargetIndex`.
 */
export function settleAssassinate(state: GameState): Verdict {
  if (state.assassinTargetIndex === null) {
    throw new Error("assassinate target not set");
  }
  const target = state.players[state.assassinTargetIndex];
  if (target.position === "merlin") {
    return { ended: true, winner: "mordred", reason: "merlin-killed" };
  }
  return { ended: true, winner: "arthur", reason: "merlin-survived" };
}

/** Faction for a player's role. */
export function factionOf(player: Player): Faction {
  return ROLES[player.position].faction;
}

/**
 * Synthetic NPC users carry an `npc:<n>` userId. They occupy real seats
 * with real Player records but never own a Discord interaction token —
 * the NPC driver mutates their `votes` / `selected` / etc. directly
 * instead of routing through the click handlers.
 */
export const NPC_USERID_PREFIX = "npc:";
export function isNpcUserId(userId: string): boolean {
  return userId.startsWith(NPC_USERID_PREFIX);
}
export function isNpc(player: Player): boolean {
  return isNpcUserId(player.userId);
}

// ── MVP scoring ──────────────────────────────────────────────────

/**
 * Count every `fail` ballot cast on a private mission vote. Called
 * once per mission resolution, before state.current is cleared. Fail
 * ballots are private (the board only reveals the aggregate count) so
 * — unlike every other MVP signal — they can't be replayed from the
 * public event timeline and must be tallied here. See `MvpStats`.
 */
export function recordMvpFails(
  state: GameState,
  votes: Record<string, "success" | "fail">,
): void {
  for (const [userId, ballot] of Object.entries(votes)) {
    if (ballot === "fail") {
      state.mvpStats.failVotes[userId] =
        (state.mvpStats.failVotes[userId] ?? 0) + 1;
    }
  }
}

/**
 * Per-seat MVP signals reconstructed from the public event timeline.
 * Every field is a seat-indexed array (length === players.length).
 * Built by `aggregateMvpSignals`; consumed by `computeMvp`.
 */
interface MvpSignals {
  /** Voted `no` on a proposal whose roster held ≥1 red player. */
  rejectedRedTeam: number[];
  /** Voted `no` on an all-blue proposal (drives the rejection-stall MVP). */
  rejectedCleanTeam: number[];
  /** Voted `yes` on an approved roster whose mission then SUCCEEDED. */
  approvedGoodTeam: number[];
  /** Voted `yes` on an approved roster whose mission then FAILED. */
  approvedFailedTeam: number[];
  /** As leader, locked a roster holding ≥1 red player. */
  proposedRedTeam: number[];
  /** Member of an approved mission that SUCCEEDED. */
  successMember: number[];
  /** Member of any resolved (approved) mission — red-side infiltration. */
  missionMember: number[];
  /** As leader, locked an approved roster whose mission then SUCCEEDED. */
  cleanLeadSuccess: number[];
}

/**
 * Replay the public event timeline into per-seat MVP signals. The
 * timeline (`team-proposed` → `public-vote` → `mission-result`) carries
 * every fact we need except who cast a fail ballot (private; see
 * `recordMvpFails`). Single source of truth — both the human and NPC
 * flows funnel through the same `recordEvent` convergence points, so
 * this sees a complete, deduplicated record.
 */
function aggregateMvpSignals(state: GameState): MvpSignals {
  const n = state.players.length;
  const zeros = (): number[] => new Array<number>(n).fill(0);
  const sig: MvpSignals = {
    rejectedRedTeam: zeros(),
    rejectedCleanTeam: zeros(),
    approvedGoodTeam: zeros(),
    approvedFailedTeam: zeros(),
    proposedRedTeam: zeros(),
    successMember: zeros(),
    missionMember: zeros(),
    cleanLeadSuccess: zeros(),
  };
  const isRedSeat = (seat: number): boolean => {
    const p = state.players[seat];
    return !!p && factionOf(p) === "mordred";
  };
  const rosterHasRed = (seats: number[]): boolean => seats.some(isRedSeat);

  // The roster currently "in flight" — set by team-proposed, scored by
  // the public-vote and mission-result that follow it. A rejected
  // proposal is superseded by the next team-proposed; only an approved
  // one is ever followed by a mission-result.
  let cur: {
    leaderSeat: number;
    memberSeats: number[];
    ballots: Array<{ seat: number; vote: "yes" | "no" }>;
  } | null = null;

  for (const ev of [...state.events].sort((a, b) => a.seq - b.seq)) {
    if (ev.kind === "team-proposed") {
      cur = { leaderSeat: ev.leaderSeat, memberSeats: ev.memberSeats, ballots: [] };
      if (rosterHasRed(ev.memberSeats)) sig.proposedRedTeam[ev.leaderSeat]++;
    } else if (ev.kind === "public-vote" && cur) {
      cur.ballots = ev.ballots;
      const hasRed = rosterHasRed(cur.memberSeats);
      for (const b of ev.ballots) {
        if (b.vote !== "no") continue;
        if (hasRed) sig.rejectedRedTeam[b.seat]++;
        else sig.rejectedCleanTeam[b.seat]++;
      }
    } else if (ev.kind === "mission-result" && cur) {
      const success = ev.result === "success";
      for (const seat of cur.memberSeats) {
        sig.missionMember[seat]++;
        if (success) sig.successMember[seat]++;
      }
      if (success) sig.cleanLeadSuccess[cur.leaderSeat]++;
      for (const b of cur.ballots) {
        if (b.vote !== "yes") continue;
        if (success) sig.approvedGoodTeam[b.seat]++;
        else sig.approvedFailedTeam[b.seat]++;
      }
      cur = null;
    }
  }
  return sig;
}

/**
 * Pick the most-valuable player for the just-ended game — the "decisive
 * figure" featured on the ending board.
 *
 * The MVP is always drawn from the WINNING faction: a blue victory
 * celebrates a blue hero, a red victory a red one. Within that pool the
 * score blends active contribution with gentle role priors, so genuine
 * decisive play can outshine a role bonus:
 *
 *  • merlin-killed → the assassin (the comeback shot trumps all stats).
 *  • Mordred via failures → 3×fail-ballots + infiltration (missions
 *    joined); tie breaks Morgana > Assassin > random.
 *  • Mordred via 5 rejections → most all-blue teams rejected (the
 *    staller who burned the clock); tie breaks Morgana > random.
 *  • Arthur → discernment (rejected red, backed winning teams),
 *    reliable field work (successful missions, clean leadership) minus
 *    misplays (proposed/approved teams that carried or became failures),
 *    plus a Merlin survival prior and a Percival-decoy bonus when the
 *    assassin's shot missed Merlin. Tie breaks Merlin > Percival > random.
 *
 * Returns null when no winning-faction player scored above zero — e.g.
 * a rejection loss where no red player rejected a clean team.
 */
export function computeMvp(state: GameState, verdict: Verdict): Player | null {
  if (!verdict.ended || !verdict.winner) return null;
  if (verdict.reason === "merlin-killed") {
    return state.players.find((p) => p.position === "assassin") ?? null;
  }
  const sig = aggregateMvpSignals(state);

  if (verdict.winner === "mordred") {
    if (verdict.reason === "rejections") {
      return mvpPick(
        state,
        "mordred",
        (p) => sig.rejectedCleanTeam[p.index] ?? 0,
        ["morgana"],
      );
    }
    return mvpPick(
      state,
      "mordred",
      (p) =>
        3 * (state.mvpStats.failVotes[p.userId] ?? 0) +
        (sig.missionMember[p.index] ?? 0),
      ["morgana", "assassin"],
    );
  }

  // Arthur win (missions-clean on 4p, or merlin-survived after a miss).
  const lastShot = [...state.events]
    .reverse()
    .find((e) => e.kind === "assassinate");
  const assassinMissedMerlin =
    lastShot?.kind === "assassinate" && lastShot.targetRole !== "merlin";
  const decoyTargetSeat =
    lastShot?.kind === "assassinate" ? lastShot.targetSeat : null;

  return mvpPick(
    state,
    "arthur",
    (p) => {
      let s =
        2 * (sig.rejectedRedTeam[p.index] ?? 0) +
        (sig.approvedGoodTeam[p.index] ?? 0) +
        (sig.successMember[p.index] ?? 0) +
        (sig.cleanLeadSuccess[p.index] ?? 0) -
        2 * (sig.proposedRedTeam[p.index] ?? 0) -
        (sig.approvedFailedTeam[p.index] ?? 0);
      // Merlin steered the side blind and lived to tell it.
      if (p.position === "merlin") s += 2;
      // Percival drew the assassin off Merlin — bigger if he took the shot.
      if (p.position === "percival" && assassinMissedMerlin) {
        s += decoyTargetSeat === p.index ? 4 : 2;
      }
      return s;
    },
    ["merlin", "percival"],
  );
}

/**
 * Choose the top-scoring player within `faction`. Ties break by the
 * `preferred` position list (first match wins), then random. Returns
 * null when the best score is ≤ 0 — nobody in the winning faction made
 * a positive contribution.
 */
function mvpPick(
  state: GameState,
  faction: Faction,
  scoreFn: (p: Player) => number,
  preferred: Position[],
): Player | null {
  const pool = state.players.filter((p) => factionOf(p) === faction);
  let max = -Infinity;
  for (const p of pool) {
    const s = scoreFn(p);
    if (s > max) max = s;
  }
  if (max <= 0) return null;
  const tied = pool.filter((p) => scoreFn(p) === max);
  if (tied.length === 0) return null;
  for (const pos of preferred) {
    const hit = tied.find((p) => p.position === pos);
    if (hit) return hit;
  }
  return tied[Math.floor(Math.random() * tied.length)] ?? null;
}
