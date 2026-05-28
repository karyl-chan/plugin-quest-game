import { t } from "../i18n/index.js";
import {
  computeMvp,
  factionOf,
  type GameState,
  type Player,
  type Verdict,
} from "../game/state.js";
import { ROLES } from "../game/roles.js";
import { recordEvent } from "../game/events.js";
import { retainEndedGame } from "../game/store.js";
import { runtime } from "./runtime.js";
import { findArt, findVariantArt, isVariantPosition } from "../art.js";
import {
  artAttachment,
  sendMessage,
  type DiscordAttachment,
  type DiscordEmbed,
} from "./discord.js";
import { FACTION_COLOR, missionProgressLine } from "./presentation.js";
import { clearNpcTimer } from "../npc/driver.js";

/**
 * End-of-game board. Reveals every seat's role with a faction
 * marker, names the reason the verdict landed where it did, and
 * subtly highlights the MVP — the "decisive figure" — by using
 * their card art as the embed's main image. No explicit "MVP: X"
 * field; the card itself is the hint, leaving the read as a
 * conversation prompt rather than an announcement.
 *
 * After posting, moves the state into timed retention (out of the
 * active map, so a fresh `/quest-game start` can run in this channel)
 * so `/quest-game webui` can still show the finished game for a while.
 */
export async function endGame(state: GameState, verdict: Verdict): Promise<void> {
  state.stage = "ended";
  state.winner = verdict.winner ?? null;
  state.current = null;
  const rosterLines = state.players.map((p) => {
    const role = t(state.locale, ROLES[p.position].nameKey);
    return `\`${p.index + 1}\` ${factionMarker(p)} ${p.displayName} — **${role}**`;
  });
  const arthurWin = verdict.winner === "arthur";

  const mvp = computeMvp(state, verdict);
  const mvpCard = mvp ? await resolveMvpCard(state, mvp) : undefined;

  // Timeline: final verdict + the MVP (seat + role-card art URL) so
  // the WebUI history can feature the MVP's card.
  if (verdict.winner) {
    recordEvent(state, {
      kind: "game-end",
      winner: verdict.winner,
      reason: verdict.reason ?? "",
      mvpArtUrl: mvpCard
        ? `${runtime().publicBaseUrl()}/art/${mvpCard.attachment.name}`
        : null,
    });
  }

  const embed: DiscordEmbed = {
    title: arthurWin
      ? `🏆 ${t(state.locale, "stage.ending.titleArthur")}`
      : `🗡 ${t(state.locale, "stage.ending.titleMordred")}`,
    description: reasonText(state, verdict),
    color: arthurWin ? FACTION_COLOR.arthur : FACTION_COLOR.mordred,
    fields: [
      {
        name: t(state.locale, "stage.board.fieldProgress"),
        value: missionProgressLine(state),
        inline: false,
      },
      {
        name: t(state.locale, "stage.ending.fieldRoster"),
        value: rosterLines.join("\n"),
        inline: false,
      },
    ],
    ...(mvpCard ? { image: mvpCard.image } : {}),
  };
  await sendMessage({
    channelId: state.channelId,
    embeds: [embed],
    ...(mvpCard ? { attachments: [mvpCard.attachment] } : {}),
  });
  // The session is over. Retention drops it from the active map
  // (future `/quest-game start` re-creates fresh state) but keeps it
  // readable by the WebUI for a short window. The per-channel
  // sign-up map is separate (see signup.ts) so it isn't entangled.
  clearNpcTimer(state.channelId);
  retainEndedGame(state);
}

function factionMarker(p: Player): string {
  return factionOf(p) === "arthur" ? "🔵" : "🔴";
}

function reasonText(state: GameState, verdict: Verdict): string {
  switch (verdict.reason) {
    case "missions-clean":
      return t(state.locale, "stage.ending.reasonMissionsClean");
    case "missions-failed":
      return t(state.locale, "stage.ending.reasonFailures");
    case "rejections":
      return t(state.locale, "stage.ending.reasonRejections");
    case "merlin-killed":
      return t(state.locale, "stage.ending.reasonMerlinKilled");
    case "merlin-survived":
      return t(state.locale, "stage.ending.reasonMerlinSurvived");
    case "missions-then-assassinate":
      // Shouldn't surface — that verdict means the game continues into
      // assassinate, not ends. Fall through to a generic line.
      return t(state.locale, "stage.ending.reasonMissions");
    default:
      return "";
  }
}

/**
 * Resolve the MVP's card art into an `{ image, attachment }` pair.
 * Uses the same art store as the deal-reveal ephemeral: variant
 * positions (loyal / minion) pick the variant indexed by the MVP's
 * seat-rank among same-role players; single-image positions go
 * through `findArt`. The art ships as a real attachment so it
 * renders without a Discord-reachable public URL. Returns undefined
 * when no art is uploaded for the MVP's slot.
 */
async function resolveMvpCard(
  state: GameState,
  mvp: Player,
): Promise<{ image: { url: string }; attachment: DiscordAttachment } | undefined> {
  let art: { filename: string; etag: string } | null;
  if (isVariantPosition(mvp.position)) {
    // Inline seat-rank-among-same-role so we don't reach into
    // stages.ts and create a circular import via stages-publicvote
    // → stages-ending → stages → ...
    const sameRole = state.players
      .filter((p) => p.position === mvp.position)
      .sort((a, b) => a.index - b.index);
    const rankIdx = sameRole.findIndex((p) => p.userId === mvp.userId);
    const rank = rankIdx === -1 ? 0 : rankIdx + 1;
    if (rank === 0) return undefined;
    art = await findVariantArt(mvp.position, rank).catch(() => null);
  } else {
    art = await findArt(mvp.position).catch(() => null);
  }
  if (!art) return undefined;
  return artAttachment(art.filename);
}
