/**
 * English locale. Same key surface as zh-TW.ts; used as the fallback
 * dictionary when a target locale is missing a key. Game terminology
 * follows the commonly-accepted English Avalon names (Merlin / Percival
 * / Morgana / Mordred / Oberon / Lady of the Lake / Minion of Mordred /
 * Loyal Servant of Arthur).
 */
import type { LocaleKey } from "./zh-TW.js";

export const en: Record<LocaleKey, string> = {
  "plugin.description":
    "Quest-game board-game bot — play through shared buttons with private info shown via ephemeral messages; no DMs required.",
  "command.quest-game.description": "Quest-game board-game bot",
  "command.quest-game.start.description": "Start a new game in this channel",
  "command.quest-game.start.npcOption":
    "Number of NPCs to pre-seat (0–9, optional; pads the roster)",
  "command.quest-game.start.morganaOption":
    "Include Morgana? (default on; off → replaced by a Minion)",
  "command.quest-game.start.percivalOption":
    "Include Percival? (default on; off → replaced by a Loyal Servant)",
  "command.quest-game.start.mordredOption":
    "Include Mordred? (default on; only for 7+ players; off → replaced by a Minion)",
  "command.quest-game.start.oberonOption":
    "Include Oberon? (default on; only for 10 players; off → replaced by a Minion)",
  "command.quest-game.start.lakeOption":
    "Enable Lady of the Lake? (default on; only takes effect at 7+ players)",
  "command.quest-game.card.description": "Re-show your role card and vision",
  "command.quest-game.status.description":
    "Re-post the current stage's game board (with buttons) so you don't have to scroll the chat history",
  "command.quest-game.status.publicOption":
    "Re-post the board as a public message instead (host/admin only, default off)",
  "status.refreshed": "Re-posted the current stage's game board.",
  "status.refreshFailed":
    "⚠ Failed to re-post the game board. Please try again later.",
  "status.publicOnlyHost":
    "Only the host or an admin can re-post the board publicly.",
  "stage.board.viewCard": "🪪 View role card",
  "command.quest-game.stop.description":
    "Force-stop the game currently running in this channel",
  "command.quest-game.manage.description":
    "Get a one-time link to the Quest-game admin WebUI",
  "command.quest-game.webui.description":
    "Get the dedicated game-board link for this channel's session (includes your role card and vision)",
  "webui.title": "Quest-game board",
  "webui.descriptionPlayer":
    "Your personal game board: live game state, your role card and vision markers, player list, and history. Link is for you only.",
  "webui.descriptionSpectator":
    "Spectator game board: shows the player list, mission progress, and history; no role or vision info is exposed.",
  "webui.openButton": "Open game board",
  "webui.botRejected":
    "Bot rejected the sign-in request — the `auth.session` RPC scope may not be approved.",
  "webui.notAllowed":
    "Bot did not issue a game-board link. Please try again later.",
  "command.quest-game.manual.description":
    "Get the Quest-game rules and role manual",
  "manual.title": "Quest-game manual",
  "manual.description":
    "Quest-game rule explanations and a full role guide, ready whenever you need it.",
  "manual.openButton": "Open manual",
  "manual.intro":
    "Quest-game is a hidden-identity showdown between Blue and Red: Blue has to complete the missions without exposing Merlin, while Red hides among them and tries to sabotage. Below is a rules summary and a full role guide.",
  "manual.rule.goal.title": "Goal",
  "manual.rule.goal.body":
    "Players are split into Blue and Red. Blue needs 3 successful missions; Red needs 3 failed missions. Even if Blue completes the missions, Red's Assassin still gets one chance to kill Merlin and steal the win.",
  "manual.rule.flow.title": "Round flow",
  "manual.rule.flow.body":
    "Each round, the leader proposes a mission team and everyone publicly votes whether to approve it. Once approved, the team members each secretly cast a Success or Fail vote — any Fail vote (or 2 Fails on round 4 with 7+ players) causes the mission to fail. If 5 team proposals in a row are rejected, Red wins outright.",
  "manual.rule.win.title": "Win conditions",
  "manual.rule.win.body":
    "3 failed missions → Red wins. After 3 successful missions, the Assassin picks one player to be Merlin: guess right and Red flips the win, guess wrong and Blue wins.",
  "manual.rule.lake.title": "Lady of the Lake",
  "manual.rule.lake.body":
    "Tables of 7+ players enable the Lady of the Lake. The holder may inspect one player's true faction; the token then passes to the inspected player. It's one of the few ways to confirm another player's faction.",
  "manage.title": "Quest-game admin panel",
  "manage.description":
    "View active games and sign-ups; force-stop when needed. The link is valid for 15 minutes; switching tabs after opening it auto-renews it for up to a day.",
  "manage.openButton": "Open admin WebUI",
  "manage.notAllowed":
    "You do not have access to the Quest-game WebUI. Ask an admin to grant `plugin:karyl-quest-game:manage` to your role.",
  "manage.botRejected":
    "Bot rejected the sign-in request — the `auth.session` RPC scope may not be approved.",

  "stage.signup.title": "Start a new game",
  "stage.signup.content":
    "Press **Join** to sign up.\nOnce everyone has joined, the host {host} presses **Start**.\nNeeds at least 5 players to start.",
  "stage.signup.join": "Join",
  "stage.signup.leave": "Leave",
  "stage.signup.start": "Start",
  "stage.signup.cancel": "Cancel",
  "stage.signup.fieldCount": "Player count",
  "stage.signup.fieldRoster": "Roster",
  "stage.signup.cancelled": "This game has been cancelled.",
  "stage.signup.fieldRules": "Rule settings",
  "stage.signup.fieldLady": "Lady of the Lake",
  "stage.signup.lakeNote": " (only takes effect with 7+ players)",
  "stage.signup.fieldNpcRoster": "NPC roster",
  "stage.signup.fieldNpcCount": "NPC count",
  "stage.signup.npcAdd": "+ NPC",
  "stage.signup.npcRemove": "− NPC",
  "stage.signup.npcLineSuffix": " (NPC)",

  "stage.options.title": "Rule settings",
  "stage.options.lady": "Enable Lady of the Lake?",
  "stage.options.yes": "Enable",
  "stage.options.no": "Disable",

  "stage.deal.title": "Roles dealt",
  "stage.deal.content":
    "**Roles have been dealt.** Each player please tap **View identity** below to privately view your role and vision.",
  "stage.deal.reveal": "View identity",
  "stage.deal.notInGame": "You are not in this game.",
  "stage.deal.yourRole": "Your role: **{role}**",
  "stage.deal.legend": "🔵 Blue　🔴 Red",
  "stage.deal.legendPercival": "🔵 Blue　🔴 Red　🟣 Merlin or Morgana",
  "stage.deal.vision": "Your vision",
  "stage.deal.helpButton": "📖 View role guide",
  "stage.deal.helpTitle": "Role guide — {role}",
  "stage.deal.markerSection": "Your vision marker legend",

  "marker.self": "Yourself",
  "marker.merlinRed": "Red players you can see",
  "marker.percivalPurple": "Merlin or Morgana",
  "marker.evilRed": "Your Red teammates",
  "marker.unknown": "Faction unknown",

  "role.description.merlin":
    "You are **Merlin**, Blue's sage. Every Red player in your vision is marked 🔴 — except Mordred, who is invisible to you (marked ⬜).\n\nWin condition: help Blue complete 3 missions **without being identified by the Assassin**. After 3 mission successes the Assassin gets one shot at Merlin to flip the win — so be subtle when sharing info; don't let the Assassin pin you down.",
  "role.description.percival":
    "You are **Percival**, Blue's guardian. Both Merlin and Morgana are marked 🟣 in your vision and you **can't tell them apart** — one is the real Merlin, the other is Morgana impersonating Merlin.\n\nWin condition: help Blue complete 3 missions and protect the real Merlin from assassination. Use voting patterns, team picks, and table talk to figure out which is which.",
  "role.description.loyal":
    "You are a **Loyal Servant of Arthur**. No special info — everyone in your vision is ⬜.\n\nWin condition: help Blue complete 3 missions. Watch the team picks, voting patterns, and fail-vote counts to guess who's a traitor.",
  "role.description.assassin":
    "You are the **Assassin**, Red's core. All Red teammates except Oberon are marked 🔴 in your vision.\n\nWin condition:\n1) Cause 3 mission failures, or\n2) After 3 mission successes, **you cast the assassinate** — pick Merlin from the Blue players to kill, and Red flips the win. Watching behaviour to find Merlin is your key job.",
  "role.description.morgana":
    "You are **Morgana**, one of Red. All Red teammates except Oberon are marked 🔴 in your vision.\n\n**Percival will mistake you for Merlin** — act like Merlin (push picks, drop hints) to throw Percival off.\n\nWin condition: cause 3 mission failures, or the Assassin successfully kills Merlin.",
  "role.description.mordred":
    "You are **Mordred**. All Red teammates except Oberon are marked 🔴 in your vision.\n\n**Merlin cannot see you** — you are Red's invisible piece in Blue's vision. You can push picks and speak up freely; Blue can't pin you down through vision.\n\nWin condition: cause 3 mission failures, or the Assassin successfully kills Merlin.",
  "role.description.oberon":
    "You are **Oberon**, Red's lone wolf. Everyone in your vision is marked ⬜ — **you can't see your Red teammates, and they can't see you either**.\n\nSabotage missions on your own without knowing who's on your side.\n\nWin condition: cause 3 mission failures, or the Assassin successfully kills Merlin.",
  "role.description.minion":
    "You are a **Minion of Mordred**, a standard Red role. All Red teammates except Oberon are marked 🔴 in your vision.\n\nWin condition: cause 3 mission failures, or the Assassin successfully kills Merlin. Cast Fail votes on missions and coordinate with the other Red roles to break the table.",

  "stage.board.fieldPlayers": "Players",
  "stage.board.fieldRoundStatus": "Mission status",
  "stage.board.fieldVoteStatus": "Vote count",
  "stage.board.fieldProgress": "Mission progress",

  "stage.appoint.title": "Round {round}: Assemble the team",
  "stage.appoint.content":
    "{leader} picks **{num}** member(s) for this mission.",
  "stage.appoint.confirm": "Confirm",
  "stage.appoint.fieldRoster": "Mission roster",
  "stage.appoint.fieldSelected": "Current selection",
  "stage.appoint.selectedNone": "(none selected yet)",

  "stage.publicVote.title": "Round {round}: Approve this team?",
  "stage.publicVote.content":
    "{leader} has picked these **{num}** member(s) for the mission; everyone please vote.",
  "stage.publicVote.approve": "✅ Approve",
  "stage.publicVote.reject": "❌ Reject",
  "stage.publicVote.fieldRoster": "Mission roster",
  "stage.publicVote.fieldVotes": "Vote progress",
  "stage.publicVote.fieldRejections": "Consecutive rejections",
  "stage.publicVote.voted": "{n} / {total} voted",
  "stage.publicVote.fieldResult": "Vote result",
  "stage.publicVote.fieldBallots": "Ballots",
  "stage.publicVote.passed": "Approved",
  "stage.publicVote.rejected": "Rejected",
  "stage.publicVote.tally": "✅ {yes}　❌ {no}",
  "stage.publicVote.rejectionWarn":
    "Consecutive rejections {n} / 5 — at 5, Red wins.",

  "stage.privateVote.title": "Round {round}: Mission vote",
  "stage.privateVote.content":
    "The **{num}** member(s) {leader} picked are now running the mission …",
  "stage.privateVote.openVote": "Go to vote",
  "stage.privateVote.ephemeralPrompt": "Cast your ballot",
  "stage.privateVote.success": "🔵 Mission success",
  "stage.privateVote.fail": "🔴 Mission fail",
  "stage.privateVote.need2Fail":
    "This round needs 2 fail votes to fail (7+ player rule).",
  "stage.privateVote.fieldVotes": "Vote progress",
  "stage.privateVote.fieldRoster": "Mission roster",
  "stage.privateVote.voted": "{n} / {total} voted",
  "stage.privateVote.resultSuccess": "Round {round} mission succeeded",
  "stage.privateVote.resultFail": "Round {round} mission failed",
  "stage.privateVote.failCount": "This mission had {n} fail vote(s)",
  "stage.privateVote.noFails": "No fail votes on this mission",

  "stage.lake.title": "Lady of the Lake appears",
  "stage.lake.content":
    "{holder} is using the Lady of the Lake (use #{n}); pick a player to inspect.",
  "stage.lake.checked":
    "{holder} used the Lady of the Lake to inspect {target}.",
  "stage.lake.resultTitle": "Inspection result",
  "stage.lake.result": "{target}'s faction: **{faction}**",
  "stage.lake.fieldHolder": "Current holder",

  "stage.assassinate.title": "Assassination phase",
  "stage.assassinate.content":
    "Assassin {assassin}, choose your target. Hit Merlin and Red flips the win.",
  "stage.assassinate.result":
    "Assassin {assassin} killed {target}\n{target}'s role: **{role}**",

  "stage.ending.titleArthur": "Blue wins",
  "stage.ending.titleMordred": "Red wins",
  "stage.ending.reasonMissions":
    "Three missions succeeded — but the assassination phase is still ahead …",
  "stage.ending.reasonMissionsClean":
    "Three missions succeeded and Merlin is safe.",
  "stage.ending.reasonMerlinKilled": "The Assassin successfully killed Merlin.",
  "stage.ending.reasonMerlinSurvived": "The Assassin missed Merlin.",
  "stage.ending.reasonFailures": "Three missions failed.",
  "stage.ending.reasonRejections":
    "Five public votes were rejected in a row — Red wins.",
  "stage.ending.fieldRoster": "Final roles",

  "error.notInGuild": "This command can only be used inside a server.",
  "error.alreadyRunning": "A game is already running in this channel.",
  "error.notRunning": "There is no game running in this channel.",
  "error.notHostCannotStop":
    "Only the host or an admin can force-stop the game.",
  "error.stopped": "Game force-stopped.",
  "error.timeout": "Too long with no response — the game has been closed.",

  "role.merlin": "Merlin",
  "role.percival": "Percival",
  "role.assassin": "Assassin",
  "role.morgana": "Morgana",
  "role.mordred": "Mordred",
  "role.oberon": "Oberon",
  "role.loyal": "Loyal Servant of Arthur",
  "role.minion": "Minion of Mordred",
  "role.flavor.merlin":
    "✨ You are **Merlin** — you can see Morgana, the Assassin, and Oberon (but not Mordred). Don't let the Assassin find you.",
  "role.flavor.percival":
    "🛡 You are **Percival** — you see Merlin and Morgana but can't tell them apart. Protect the real Merlin.",
  "role.flavor.assassin":
    "🗡 You are the **Assassin** — after 3 mission successes, you get one shot to kill Merlin and flip the win.",
  "role.flavor.morgana":
    "🎭 You are **Morgana** — Percival will mistake you for Merlin. Play it like you're Blue.",
  "role.flavor.mordred":
    "🌑 You are **Mordred** — even Merlin can't see you. Lay low.",
  "role.flavor.oberon":
    "🦉 You are **Oberon** — you can't see your teammates and they can't see you. Sabotage missions on your own.",
  "role.flavor.loyal":
    "💙 You are a **Loyal Servant of Arthur** — you have no special info. Watch the table and follow Merlin's hints.",
  "role.flavor.minion":
    "🗡 You are a **Minion of Mordred** — you see your Red teammates (except Oberon). Coordinate with them to break missions.",
  "faction.arthur": "Blue",
  "faction.mordred": "Red",
};
