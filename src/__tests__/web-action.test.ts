/**
 * Integration test for `POST /api/game/action` — the WebUI board's
 * single mutation endpoint.
 *
 * Unlike the `flow-*` tests (which drive the engine directly), this
 * one stands up a real Fastify instance with the production routes,
 * mints a genuine plugin-session JWT, and exercises the endpoint over
 * `app.inject`. It covers the happy path, the auth boundaries, and —
 * the reason this file exists — the freeze-forever regression: a
 * wedged Discord RPC must not strand the HTTP response.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { generateKeyPairSync, sign } from "node:crypto";
import { buildGame, installFakeRuntime, resetWorldState } from "./_harness.js";
import { openPublicVote } from "../flow/stages-publicvote.js";
import { BOT_RPC_TIMEOUT_MS, wireRuntime } from "../flow/runtime.js";
import {
  registerWebRoutes,
  setQuestGameSessionVerifyKey,
} from "../web-routes.js";

// One Ed25519 keypair stands in for the bot's plugin-session signer:
// the test mints tokens with the private half, the routes verify with
// the public half — the same bot↔plugin split as production.
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const verifyKeyPem = publicKey.export({
  type: "spki",
  format: "pem",
}) as string;

const FIVE_P = [
  "merlin",
  "assassin",
  "morgana",
  "loyal",
  "loyal",
] as const;

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Mint a plugin-session JWT the way the bot does — see verify-plugin-session. */
function mintToken(opts: { userId: string; guildId: string | null }): string {
  const header = b64url(JSON.stringify({ alg: "EdDSA", typ: "JWT" }));
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      purpose: "plugin-session",
      userId: opts.userId,
      guildId: opts.guildId,
      capabilities: [],
      iat: nowSec,
      exp: nowSec + 86_400,
    }),
  );
  const data = `${header}.${payload}`;
  return `${data}.${b64url(sign(null, Buffer.from(data), privateKey))}`;
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  await registerWebRoutes(app, () => "http://test.local");
  await app.ready();
  return app;
}

/** POST /api/game/action with an optional Bearer token + JSON body. */
function postAction(
  app: FastifyInstance,
  opts: { token?: string; body: Record<string, unknown> },
) {
  return app.inject({
    method: "POST",
    url: "/api/game/action",
    headers: {
      "content-type": "application/json",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    payload: JSON.stringify(opts.body),
  });
}

describe("web-action: POST /api/game/action", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    resetWorldState();
    installFakeRuntime();
    setQuestGameSessionVerifyKey(() => verifyKeyPem);
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
    resetWorldState();
    vi.useRealTimers();
  });

  it("records a public vote and returns the actor's snapshot", async () => {
    const game = buildGame({ positions: [...FIVE_P], channelId: "c-act-ok" });
    await openPublicVote(game, [0, 1]);

    const res = await postAction(app, {
      token: mintToken({ userId: "u0", guildId: "g" }),
      body: { channel: "c-act-ok", action: "public-vote", vote: "yes" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().viewer.hasActed).toBe(true);
    expect((game.current as { votes: Record<string, string> }).votes.u0).toBe(
      "yes",
    );
  });

  it("rejects a request with no token (401)", async () => {
    const res = await postAction(app, {
      body: { channel: "c-act-401", action: "public-vote", vote: "yes" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects an unknown action (400)", async () => {
    const res = await postAction(app, {
      token: mintToken({ userId: "u0", guildId: "g" }),
      body: { channel: "c-act-400", action: "teleport" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a token whose guild doesn't match the game (403)", async () => {
    const game = buildGame({ positions: [...FIVE_P], channelId: "c-act-403" });
    await openPublicVote(game, [0, 1]);

    const res = await postAction(app, {
      token: mintToken({ userId: "u0", guildId: "other-guild" }),
      body: { channel: "c-act-403", action: "public-vote", vote: "yes" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("404s an action against a channel with no game", async () => {
    const res = await postAction(app, {
      token: mintToken({ userId: "u0", guildId: "g" }),
      body: { channel: "c-no-game", action: "public-vote", vote: "yes" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("still answers within the RPC ceiling when Discord hangs", async () => {
    // Regression guard for the freeze-forever bug: the engine awaits a
    // Discord RPC inline (applyPublicVote → editMessage), so a wedged
    // bot hop must not strand the HTTP response. With botRpc hung, the
    // response must still come back once BOT_RPC_TIMEOUT_MS elapses —
    // the vote itself is recorded synchronously, before the stalled
    // editMessage, so the returned snapshot still reflects it.
    const game = buildGame({ positions: [...FIVE_P], channelId: "c-act-hang" });
    await openPublicVote(game, [0, 1]);

    // Swap in a runtime whose every RPC hangs forever.
    wireRuntime({
      botRpc: () => new Promise<never>(() => {}),
      log: { info() {}, warn() {}, error() {} },
      publicBaseUrl: () => "http://test.local",
    });

    vi.useFakeTimers();
    const pending = postAction(app, {
      token: mintToken({ userId: "u0", guildId: "g" }),
      body: { channel: "c-act-hang", action: "public-vote", vote: "yes" },
    });
    // Advance well past one ceiling so the per-RPC timeout fires.
    await vi.advanceTimersByTimeAsync(BOT_RPC_TIMEOUT_MS * 3);
    const res = await pending;

    expect(res.statusCode).toBe(200);
    expect(res.json().viewer.hasActed).toBe(true);
  });
});
