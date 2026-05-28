import { zhTW, type LocaleKey } from "./zh-TW.js";
import { en } from "./en.js";
import { zhCN } from "./zh-CN.js";

/**
 * Server-side i18n. Three locales (en / zh-TW / zh-CN) matching the
 * bot's supported set. Discord BCP-47 tags (`en-US`, `zh-HK`, `ja-JP`
 * …) are normalised down to one of these three by `resolveLocale`.
 *
 * Discord delivers `interaction.locale` (the clicker's client locale)
 * and `interaction.guildLocale` (the server's preferred locale).
 * Handlers that have a `ctx` should `resolveLocale(ctx)`; in-game flow
 * code that has a `GameState` should use `state.locale` (captured at
 * game-creation time so every player on the table sees one consistent
 * locale instead of each click independently re-resolving).
 *
 * Utility code with neither falls back to the dictionary default of
 * `en` — same fallback the bot uses.
 */
export type Locale = "en" | "zh-TW" | "zh-CN";
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "zh-TW", "zh-CN"];
const DEFAULT_LOCALE: Locale = "en";

const DICTIONARIES: Record<Locale, Record<LocaleKey, string>> = {
  en,
  "zh-TW": zhTW,
  "zh-CN": zhCN,
};

function isSupportedLocale(tag: string): tag is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(tag);
}

/**
 * Map an arbitrary BCP-47 tag (Discord sends `en-US`, `zh-TW`, `ja`,
 * etc.) onto one of our three locales. Script subtags (Hant/Hans) are
 * honoured before region heuristics. Returns null for unknowns so the
 * caller can fall through to the next step in the resolution chain.
 */
function normalizeTag(tag: string | null | undefined): Locale | null {
  if (!tag) return null;
  if (isSupportedLocale(tag)) return tag;
  const n = tag.toLowerCase();
  if (n.startsWith("en")) return "en";
  if (n.startsWith("zh")) {
    if (n.includes("hant") || /-(tw|hk|mo)\b/.test(n)) return "zh-TW";
    if (n.includes("hans") || /-(cn|sg|my)\b/.test(n)) return "zh-CN";
    // Bare "zh" — default to Simplified (more common globally),
    // matching the bot's normaliser.
    return "zh-CN";
  }
  return null;
}

/**
 * Resolve a Discord interaction (or any object exposing `locale` +
 * optional `guildLocale`) to one of our supported locales.
 *
 * Fallback chain mirrors the bot:
 *   1. interaction.locale (clicker's Discord client locale)
 *   2. interaction.guildLocale (server's preferred locale)
 *   3. DEFAULT_LOCALE ("en")
 */
export function resolveLocale(
  interaction:
    | {
        locale?: string | null;
        guildLocale?: string | null;
      }
    | null
    | undefined,
): Locale {
  if (!interaction) return DEFAULT_LOCALE;
  const fromUser = normalizeTag(interaction.locale ?? null);
  if (fromUser) return fromUser;
  const fromGuild = normalizeTag(interaction.guildLocale ?? null);
  if (fromGuild) return fromGuild;
  return DEFAULT_LOCALE;
}

/**
 * Look up a translation key with simple `{var}` interpolation.
 *
 * Fallback strategy:
 *   1. lookup in `locale`'s dictionary
 *   2. on miss, retry in `en` (the canonical fallback)
 *   3. on still-miss, log a warning and return the key itself —
 *      a typo stays loud but doesn't crash gameplay mid-round.
 *
 * `locale === undefined` defaults to `en` (was `zh-TW` pre-i18n bump).
 * Most call sites should thread an explicit locale; the undefined path
 * is reserved for utility helpers with no obvious locale source.
 */
export function t(
  locale: Locale | undefined,
  key: LocaleKey,
  vars: Record<string, string | number> = {},
): string {
  const effective = locale ?? DEFAULT_LOCALE;
  let value: string | undefined = DICTIONARIES[effective][key];
  if (value === undefined && effective !== "en") {
    // Cross-locale fallback: an early-stage zh-CN dict that's missing a
    // key still gets the en string instead of a raw key surfacing.
    value = DICTIONARIES.en[key];
  }
  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[i18n] missing key ${key} for locale ${effective}`);
    return key;
  }
  for (const [k, v] of Object.entries(vars)) {
    value = value.replaceAll(`{${k}}`, String(v));
  }
  return value;
}

/**
 * Build the Discord `description_localizations` map for `key` covering
 * every supported locale, suitable for the camelCase
 * `descriptionLocalizations` field on `ApplicationCommandData` /
 * `ApplicationCommandOptionData` (discord.js v14 converts to
 * snake_case wire-side).
 *
 * Discord's English key is `en-US`, not `en` — we expand on the way
 * out, matching the bot's helper of the same name.
 */
export function localizedDescriptions(
  key: LocaleKey,
  vars: Record<string, string | number> = {},
): Record<string, string> {
  return {
    "en-US": t("en", key, vars),
    "zh-TW": t("zh-TW", key, vars),
    "zh-CN": t("zh-CN", key, vars),
  };
}

export type { LocaleKey };
