import type { DiscordActionRow } from "./discord.js";
import { runtime } from "./runtime.js";
import { t } from "../i18n/index.js";

/**
 * Mint a per-user `session` JWT and build the "open game board"
 * link-button row, pinned to this game instance (`?c=` + `?s=`).
 * Returns null when the bot declines to mint a token (e.g. the
 * `auth.session` RPC scope isn't approved).
 *
 * Shared by the `/quest-game webui` + `/quest-game card` commands and the
 * in-board role-card button so they all hand out the same link.
 */
export async function buildWebuiLinkRow(
  userId: string,
  guildId: string,
  channelId: string,
  sessionId: string,
): Promise<DiscordActionRow | null> {
  const res = (await runtime().botRpc("/api/plugin/auth.session", {
    user_id: userId,
    kind: "session",
    guild_id: guildId,
  })) as { allowed?: boolean; token?: string } | null;
  if (res?.allowed !== true || typeof res.token !== "string") return null;
  const url =
    `${runtime().publicBaseUrl()}/?token=${res.token}` +
    `&c=${channelId}&s=${sessionId}`;
  return {
    type: 1,
    components: [
      {
        type: 2,
        style: 5,
        label: `🎲 ${t(undefined, "webui.openButton")}`,
        url,
      },
    ],
  };
}
