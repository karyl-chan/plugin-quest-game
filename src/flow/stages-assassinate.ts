import {
  componentCustomId,
  type ComponentContext,
  type ComponentReply,
} from "@karyl-chan/plugin-sdk";
import { EMBED_COLOR, PLUGIN_KEY } from "../constants.js";
import { t } from "../i18n/index.js";
import {
  playerByIndex,
  playerByUserId,
  settleAssassinate,
  type GameState,
} from "../game/state.js";
import { getGame } from "../game/store.js";
import { recordEvent } from "../game/events.js";
import { ROLES } from "../game/roles.js";
import {
  editMessage,
  sendMessage,
  type DiscordActionRow,
  type DiscordButton,
  type DiscordEmbed,
} from "./discord.js";
import { truncate, viewCardButtonRow } from "./presentation.js";
import { runtime } from "./runtime.js";
import { endGame } from "./stages-ending.js";
import { scheduleNpcStep } from "../npc/driver.js";

/**
 * Assassinate stage:
 *  - Posts a public board with one button per *non-evil* player so the
 *    assassin can't waste their shot on a teammate. Only the
 *    `assassin` role can click; others get an ephemeral nudge.
 *  - On confirmation the target is revealed (everyone sees who got
 *    shot and what their real role was), then `settleAssassinate`
 *    decides whether evil flips the win or Arthur takes it.
 */
/**
 * Build the assassinate stage's public board payload. Single source
 * of truth for the board — `openAssassinate` posts it, `/quest-game
 * status` re-renders it. Returns null only if the deck has no
 * assassin (impossible on a legal table).
 */
export function assassinateBoardPayload(state: GameState): {
  embeds: DiscordEmbed[];
  components: DiscordActionRow[];
} | null {
  const assassin = state.players.find((p) => p.position === "assassin");
  if (!assassin) return null;
  return {
    embeds: [renderAssassinateEmbed(state, assassin.displayName)],
    components: assassinateComponents(state),
  };
}

export async function openAssassinate(state: GameState): Promise<void> {
  state.stage = "assassinate";
  const payload = assassinateBoardPayload(state);
  if (!payload) {
    runtime().log.error("quest-game: no assassin in deck on assassinate stage", {
      channelId: state.channelId,
      stage: "assassinate",
    });
    return;
  }
  const sent = await sendMessage({
    channelId: state.channelId,
    ...payload,
  });
  if (!sent) {
    runtime().log.error("quest-game: failed to open assassinate stage", {
      channelId: state.channelId,
      round: state.round,
      stage: "assassinate",
    });
    return;
  }
  state.current = {
    kind: "assassinate",
    messageId: sent.id,
  };
  scheduleNpcStep(state);
}

export async function handleAssassinateClick(
  ctx: ComponentContext,
  tail: string,
): Promise<ComponentReply> {
  const game = getGame(ctx.channelId!);
  if (!game) return null;
  await applyAssassinate(game, ctx.userId, Number(tail));
  return null;
}

/**
 * Apply the assassin's kill pick — the game-state core shared by the
 * Discord board and the WebUI. No-op unless the caller is the
 * assassin and the target is another seat. Reveals the result on the
 * board and ends the game.
 */
export async function applyAssassinate(
  game: GameState,
  userId: string,
  seat: number,
): Promise<void> {
  if (game.current?.kind !== "assassinate") return;
  const me = playerByUserId(game, userId);
  if (!me || me.position !== "assassin") return;
  const target = playerByIndex(game, seat);
  if (!target || target.userId === me.userId) return;

  game.assassinTargetIndex = seat;
  // Timeline: the assassinate result is fully public — the in-game
  // board reveals the target's true role to everyone.
  recordEvent(game, {
    kind: "assassinate",
    assassinSeat: me.index,
    targetSeat: target.index,
    targetRole: target.position,
  });
  const verdict = settleAssassinate(game);
  await editMessage({
    channelId: game.channelId,
    messageId: game.current.messageId,
    embeds: [
      {
        color: EMBED_COLOR,
        title: t(game.locale, "stage.assassinate.title"),
        description: t(game.locale, "stage.assassinate.result", {
          assassin: `**${me.displayName}**`,
          target: `**${target.displayName}**`,
          role: t(game.locale, ROLES[target.position].nameKey),
        }),
      },
    ],
    components: [],
  });
  game.current = null;
  await endGame(game, verdict);
}

// ── rendering ──────────────────────────────────────────────────────────

function renderAssassinateEmbed(state: GameState, assassinName: string) {
  return {
    title: t(state.locale, "stage.assassinate.title"),
    description: t(state.locale, "stage.assassinate.content", {
      assassin: `**${assassinName}**`,
    }),
    color: EMBED_COLOR,
  };
}

function assassinateComponents(state: GameState): DiscordActionRow[] {
  // Show every non-assassin seat. We deliberately don't pre-filter
  // out the assassin's own faction here — doing so would leak Oberon
  // (who's evil but invisible to other evil) to the assassin.
  const rows: DiscordActionRow[] = [];
  const buttons: DiscordButton[] = state.players
    .filter((p) => p.position !== "assassin")
    .map((p) => ({
      type: 2,
      style: 1,
      custom_id: componentCustomId(PLUGIN_KEY, "asn", `${p.index}`),
      label: `${p.index + 1}. ${truncate(p.displayName, 18)}`,
    }));
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ type: 1, components: buttons.slice(i, i + 5) });
  }
  rows.push(viewCardButtonRow(state.locale));
  return rows;
}
