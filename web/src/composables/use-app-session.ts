import { ref } from "vue";
import {
  bootstrapPluginSession,
  type SessionHandle,
} from "@karyl-chan/plugin-sdk/web";
import { setApi, setGameSession } from "../api";

/**
 * App-level routing between the QuestGame WebUI surfaces:
 *
 *  - `manage` — admin panel: reached from the bot admin plugin page's
 *    "Manage" link at `<base>/manage`. A capability-bearing bot JWT,
 *    exchanged by the SDK for a plugin-issued access/refresh pair.
 *  - `game`   — per-player board (`/quest-game webui`): a
 *    capability-less session JWT plus `?c=<channelId>` + `?s=<sessionId>`.
 *  - `manual` — public reference content; pure path-based, no JWT.
 *
 * Mode is decided by PATH, not token caps: `/manage` → exchange flow,
 * `/manual` → public, anything else → game-board session bearer. Path is
 * stable across tab reloads, so the manage SPA resumes its refresh pair
 * without re-inspecting any token.
 */
export type AppMode = "loading" | "denied" | "manage" | "game" | "manual";

const PLUGIN_KEY = "karyl-quest-game";

const mode = ref<AppMode>("loading");
const deniedMessage = ref<string | null>(null);

let sessionHandle: SessionHandle | null = null;

function deny(message: string): void {
  deniedMessage.value = message;
  mode.value = "denied";
}

export async function bootstrapApp(): Promise<void> {
  // The /manual route is public reference content — no token, no
  // session; the SPA routes to it purely on the path.
  if (window.location.pathname.replace(/\/+$/, "").endsWith("/manual")) {
    mode.value = "manual";
    return;
  }

  // Mode is decided by PATH, not token caps: the bot admin UI links to
  // `<base>/manage` (exchange → refreshable access/refresh pair); game
  // links to `/?token=…&c=…&s=…` (direct session bearer). Path is stable
  // across tab reloads, so the manage SPA resumes without re-inspecting
  // any token.
  const wantsExchange = window.location.pathname
    .replace(/\/+$/, "")
    .endsWith("/manage");

  const handle = await bootstrapPluginSession({
    pluginKey: PLUGIN_KEY,
    exchangeJwt: wantsExchange,
    extraUrlParams: ["c", "s"],
    onAccessDenied: (msg) =>
      deny(msg || "存取遭拒，請重新取得連結。"),
  });
  sessionHandle = handle;
  setApi(handle.api);

  if (handle.denied) {
    if (mode.value !== "denied") {
      deny(handle.deniedReason ?? "存取遭拒，請重新取得連結。");
    }
    return;
  }

  if (!handle.isAuthenticated) {
    deny("請在 Discord 內透過 /quest-game webui 取得遊戲板連結，或從機器人管理頁開啟管理面板。");
    return;
  }

  // Tab reload — SDK restored the auth state from sessionStorage but
  // has no decoded claims for us. Manage tier resumes cleanly (the
  // pair survived); game tier needs `?c=` / `?s=` which were stripped,
  // so re-prompt the user.
  if (!handle.claims) {
    if (handle.hasRefreshPair) {
      mode.value = "manage";
      return;
    }
    deny("瀏覽器重新整理遺失頻道資訊，請重新執行 /quest-game webui。");
    return;
  }

  // Fresh load — branch on the same path signal used to pick the SDK
  // flow above so the routing decision matches what the SDK actually did.
  if (wantsExchange) {
    mode.value = "manage";
    return;
  }

  // Game-board tier — needs `?c=<channelId>` from the link.
  const channelId = handle.urlParams["c"];
  if (!channelId) {
    deny("遊戲板連結缺少頻道資訊，請重新執行 /quest-game webui。");
    return;
  }
  setGameSession({
    channelId,
    sessionId: handle.urlParams["s"] ?? "",
  });
  mode.value = "game";
}

export function useAppSession() {
  return {
    mode,
    deniedMessage,
    bootstrap: bootstrapApp,
    /** Underlying SDK handle for advanced consumers. */
    handle: (): SessionHandle | null => sessionHandle,
  };
}
