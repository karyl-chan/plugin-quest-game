import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeMvp,
  recordMvpFails,
  type GameState,
  type Verdict,
} from "../game/state.js";
import { recordEvent } from "../game/events.js";
import type { Position } from "../game/roles.js";
import { buildGame, resetWorldState } from "./_harness.js";

beforeEach(() => resetWorldState());
afterEach(() => {
  resetWorldState();
  vi.restoreAllMocks();
});

function p(state: GameState, seat: number) {
  return state.players[seat];
}

// ── event-timeline builders ──────────────────────────────────────
// computeMvp reconstructs every public MVP signal from state.events,
// so these helpers stage the same team-proposed → public-vote →
// mission-result sequence the real flow records.

/** Stage a proposal + its public vote. Unlisted seats vote `yes`. */
function proposeAndVote(
  state: GameState,
  leaderSeat: number,
  memberSeats: number[],
  noVoters: number[] = [],
): void {
  recordEvent(state, {
    kind: "team-proposed",
    round: state.round,
    leaderSeat,
    memberSeats,
  });
  const noSet = new Set(noVoters);
  const ballots = state.players.map((pl) => ({
    seat: pl.index,
    vote: noSet.has(pl.index) ? ("no" as const) : ("yes" as const),
  }));
  const yes = ballots.filter((b) => b.vote === "yes").length;
  const no = ballots.length - yes;
  recordEvent(state, {
    kind: "public-vote",
    round: state.round,
    approved: yes > no,
    yes,
    no,
    ballots,
  });
}

/** A full mission: proposal, vote, and resolution. */
function runMission(
  state: GameState,
  leaderSeat: number,
  memberSeats: number[],
  result: "success" | "fail",
  noVoters: number[] = [],
): void {
  proposeAndVote(state, leaderSeat, memberSeats, noVoters);
  recordEvent(state, {
    kind: "mission-result",
    round: state.round,
    result,
    failCount: result === "fail" ? 1 : 0,
  });
}

function shootArrow(
  state: GameState,
  assassinSeat: number,
  targetSeat: number,
): void {
  recordEvent(state, {
    kind: "assassinate",
    assassinSeat,
    targetSeat,
    targetRole: state.players[targetSeat].position as Position,
  });
}

const FIVE: Position[] = ["merlin", "assassin", "morgana", "loyal", "loyal"];

describe("computeMvp: merlin-killed shortcut", () => {
  it("returns the assassin regardless of any accumulated signal", () => {
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-1" });
    runMission(state, 0, [0, 3], "success");
    const verdict: Verdict = {
      ended: true,
      winner: "mordred",
      reason: "merlin-killed",
    };
    expect(computeMvp(state, verdict)).toBe(p(state, 1)); // assassin
  });
});

describe("computeMvp: Arthur win is drawn from the BLUE faction", () => {
  it("never crowns a red player who farmed red-team rejections", () => {
    // The original bug: a Mordred-faction player who reject-voted red
    // teams (cover play) topped the faction-blind score and was shown
    // as the blue win's 'decisive figure'. Now red is excluded.
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-2" });
    // Morgana (seat 2, RED) rejects three red teams — the highest raw
    // rejection count on the table.
    proposeAndVote(state, 0, [1, 4], [2, 3]); // morgana + loyal3 reject
    proposeAndVote(state, 0, [1, 4], [2]); // morgana rejects
    proposeAndVote(state, 0, [1, 4], [2]); // morgana rejects
    const verdict: Verdict = {
      ended: true,
      winner: "arthur",
      reason: "merlin-survived",
    };
    const mvp = computeMvp(state, verdict);
    expect(mvp).not.toBeNull();
    expect(mvp).not.toBe(p(state, 2)); // not Morgana, despite topping rejections
    expect(mvp!.position).not.toBe("morgana");
    // MVP is the loyal who reject-voted the red team (Merlin here led the
    // red rosters, so the proposed-red-team penalty sinks his score).
    expect(mvp).toBe(p(state, 3)); // loyal3, a blue player
  });

  it("lets an active loyal outscore the Merlin survival prior", () => {
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-3" });
    // Loyal seat 3: rejects two red teams (+4) and rides a clean
    // mission (+approvedGood +success).
    proposeAndVote(state, 0, [1, 4], [3]);
    proposeAndVote(state, 0, [1, 4], [3]);
    runMission(state, 4, [3, 4], "success");
    const verdict: Verdict = {
      ended: true,
      winner: "arthur",
      reason: "merlin-survived",
    };
    expect(computeMvp(state, verdict)).toBe(p(state, 3)); // loyal3
  });

  it("penalises approving a team that went on to fail", () => {
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-4" });
    // Loyal3 rejects the doomed red team; loyal4 approves it and it
    // fails. loyal3's discernment must beat loyal4's misjudgment.
    runMission(state, 0, [1, 4], "fail", [3]); // seat3 no, seat4 yes (member)
    proposeAndVote(state, 0, [1, 3], [3]); // seat3 rejects another red team
    const verdict: Verdict = {
      ended: true,
      winner: "arthur",
      reason: "merlin-survived",
    };
    const mvp = computeMvp(state, verdict);
    expect(mvp).toBe(p(state, 3)); // loyal3, not loyal4
  });

  it("falls back to the Merlin prior on a clean sweep with no standouts", () => {
    // 4-player table: missions-clean Arthur win, no assassinate phase.
    const state = buildGame({
      positions: ["merlin", "percival", "assassin", "morgana"],
      channelId: "c-mvp-5",
    });
    const verdict: Verdict = {
      ended: true,
      winner: "arthur",
      reason: "missions-clean",
    };
    expect(computeMvp(state, verdict)).toBe(p(state, 0)); // merlin
  });
});

describe("computeMvp: Percival decoy bonus", () => {
  it("crowns Percival when the assassin's shot lands on him", () => {
    const state = buildGame({
      positions: ["merlin", "percival", "assassin", "morgana", "loyal"],
      channelId: "c-mvp-6",
    });
    shootArrow(state, 2, 1); // assassin (seat2) shoots Percival (seat1)
    const verdict: Verdict = {
      ended: true,
      winner: "arthur",
      reason: "merlin-survived",
    };
    expect(computeMvp(state, verdict)).toBe(p(state, 1)); // percival (+4)
  });
});

describe("computeMvp: Mordred wins via mission failures", () => {
  it("blends fail ballots with infiltration (missions joined)", () => {
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-7" });
    // Assassin (1) and Morgana (2) each cast one fail ballot, but the
    // assassin infiltrated two missions to Morgana's one.
    runMission(state, 0, [1, 2], "fail"); // both on it
    runMission(state, 0, [1, 3], "success"); // assassin on a second
    recordMvpFails(state, { [p(state, 1).userId]: "fail" });
    recordMvpFails(state, { [p(state, 2).userId]: "fail" });
    const verdict: Verdict = {
      ended: true,
      winner: "mordred",
      reason: "missions-failed",
    };
    // assassin: 3 + 2 missions = 5; morgana: 3 + 1 = 4.
    expect(computeMvp(state, verdict)).toBe(p(state, 1)); // assassin
  });

  it("breaks an exact tie by preferring Morgana over the Assassin", () => {
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-8" });
    runMission(state, 0, [1, 2], "fail"); // both infiltrate the same mission
    recordMvpFails(state, { [p(state, 1).userId]: "fail" });
    recordMvpFails(state, { [p(state, 2).userId]: "fail" });
    const verdict: Verdict = {
      ended: true,
      winner: "mordred",
      reason: "missions-failed",
    };
    expect(computeMvp(state, verdict)).toBe(p(state, 2)); // morgana
  });

  it("excludes blue players even if one carries a stray fail tally", () => {
    // Defensive: the engine bars Arthur fail ballots, but the picker
    // must not crown a blue player on a red win regardless.
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-9" });
    runMission(state, 0, [1, 3], "fail");
    recordMvpFails(state, {
      [p(state, 1).userId]: "fail",
      [p(state, 3).userId]: "fail", // loyal — should never happen, but guard
    });
    const verdict: Verdict = {
      ended: true,
      winner: "mordred",
      reason: "missions-failed",
    };
    const mvp = computeMvp(state, verdict);
    expect(mvp!.position).not.toBe("loyal");
    expect(mvp).toBe(p(state, 1)); // assassin
  });
});

describe("computeMvp: Mordred wins via 5 rejections", () => {
  it("names the staller who rejected the most clean teams", () => {
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-10" });
    // All-blue rosters that red kept reject-voting to burn the clock.
    proposeAndVote(state, 0, [0, 3], [1, 2]); // assassin + morgana reject
    proposeAndVote(state, 0, [3, 4], [2]); // morgana rejects again
    const verdict: Verdict = {
      ended: true,
      winner: "mordred",
      reason: "rejections",
    };
    expect(computeMvp(state, verdict)).toBe(p(state, 2)); // morgana (2 stalls)
  });

  it("returns null when no red player stalled a clean team", () => {
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-11" });
    const verdict: Verdict = {
      ended: true,
      winner: "mordred",
      reason: "rejections",
    };
    expect(computeMvp(state, verdict)).toBeNull();
  });
});

describe("recordMvpFails", () => {
  it("tallies only fail ballots, accumulating across missions", () => {
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-12" });
    recordMvpFails(state, {
      [p(state, 1).userId]: "fail",
      [p(state, 2).userId]: "success",
    });
    recordMvpFails(state, { [p(state, 1).userId]: "fail" });
    expect(state.mvpStats.failVotes[p(state, 1).userId]).toBe(2);
    expect(state.mvpStats.failVotes[p(state, 2).userId]).toBeUndefined();
  });
});

describe("computeMvp: no verdict", () => {
  it("returns null for an unfinished game", () => {
    const state = buildGame({ positions: FIVE, channelId: "c-mvp-13" });
    expect(computeMvp(state, { ended: false })).toBeNull();
  });
});
