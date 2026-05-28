/**
 * Simplified Chinese locale. Same key surface as zh-TW.ts; translations
 * track zh-TW's wording closely with Hans script and Mainland-standard
 * terminology where it differs.
 */
import type { LocaleKey } from "./zh-TW.js";

export const zhCN: Record<LocaleKey, string> = {
  "plugin.description":
    "任务游戏桌游机器人 — 通过共用按钮进行游戏，私密信息以暂存消息显示，无需 DM。",
  "command.quest-game.description": "任务游戏桌游机器人",
  "command.quest-game.start.description": "在此频道开始一场新对局",
  "command.quest-game.start.npcOption": "预先加入的 NPC 数量（0–9，可选；用来凑人数）",
  "command.quest-game.start.morganaOption":
    "是否加入莫甘娜（默认开启；关闭则由爪牙替代）",
  "command.quest-game.start.percivalOption":
    "是否加入派西维尔（默认开启；关闭则由忠臣替代）",
  "command.quest-game.start.mordredOption":
    "是否加入莫德雷德（默认开启；7 人以上适用；关闭则由爪牙替代）",
  "command.quest-game.start.oberonOption":
    "是否加入奥伯伦（默认开启；10 人适用；关闭则由爪牙替代）",
  "command.quest-game.start.lakeOption":
    "是否启用湖中女神（默认开启；7 人以上才会生效）",
  "command.quest-game.card.description": "再次查看你的角色卡与视野",
  "command.quest-game.status.description":
    "重新获取当前阶段的游戏板（含按钮），免去往上翻对话记录",
  "command.quest-game.status.publicOption":
    "改以公开消息重发游戏板（限主持人/管理员，默认关闭）",
  "status.refreshed": "已重新发布当前阶段的游戏板。",
  "status.refreshFailed": "⚠ 重发游戏板失败，请稍后再试。",
  "status.publicOnlyHost": "只有发起人或管理员可以公开重发游戏板。",
  "stage.board.viewCard": "🪪 查看角色卡",
  "command.quest-game.stop.description": "强制终止此频道进行中的对局",
  "command.quest-game.manage.description": "获取任务游戏管理 WebUI 的一次性链接",
  "command.quest-game.webui.description":
    "获取此频道对局的专属游戏板链接（含你的角色卡与视野）",
  "webui.title": "任务游戏游戏板",
  "webui.descriptionPlayer":
    "你的专属游戏板：实时对局状态、你的角色卡与视野标记、玩家列表与历史。链接仅限你本人。",
  "webui.descriptionSpectator":
    "旁观者游戏板：可看玩家列表、任务进度与历史；不会显示任何角色或视野信息。",
  "webui.openButton": "打开游戏板",
  "webui.botRejected":
    "Bot 拒绝了登录请求 — 可能 `auth.session` RPC scope 尚未核准。",
  "webui.notAllowed": "Bot 未核发游戏板链接，请稍后再试。",
  "command.quest-game.manual.description": "获取任务游戏规则与角色说明手册",
  "manual.title": "任务游戏说明手册",
  "manual.description": "任务游戏的规则说明与全角色介绍，随时可查。",
  "manual.openButton": "打开说明手册",
  "manual.intro":
    "任务游戏是一场蓝方与红方的隐藏身份对决：蓝方要在不暴露梅林的前提下完成任务，红方则藏身其中破坏任务。下面是规则摘要与全角色介绍。",
  "manual.rule.goal.title": "游戏目标",
  "manual.rule.goal.body":
    "玩家分为蓝方与红方。蓝方要让 3 次任务成功，红方要让 3 次任务失败；即使蓝方完成任务，红方的刺客仍有一次刺杀梅林反败为胜的机会。",
  "manual.rule.flow.title": "回合流程",
  "manual.rule.flow.body":
    "每回合由队长提名一支任务队伍，全体公开投票表决是否通过。通过后，队伍成员各自秘密投出任务的成功或失败票——只要出现失败票（第 4 任务在 7 人以上需 2 张），该次任务即失败。队伍若连续 5 次提名遭否决，红方直接获胜。",
  "manual.rule.win.title": "胜负条件",
  "manual.rule.win.body":
    "任务失败 3 次，红方获胜。任务成功 3 次后，刺客可指认一名玩家为梅林：猜中则红方逆转胜，猜错则蓝方获胜。",
  "manual.rule.lake.title": "湖中女神",
  "manual.rule.lake.body":
    "7 人以上的对局会启用湖中女神。持有者可查验一名玩家的真实阵营，查验后信物传给被查验者。这是少数能确认他人阵营的途径。",
  "manage.title": "任务游戏管理面板",
  "manage.description":
    "查看进行中对局与报名，必要时可强制终止。15 分钟内打开链接；浏览页签之后会自动续约最多 1 天。",
  "manage.openButton": "打开管理 WebUI",
  "manage.notAllowed":
    "你没有任务游戏 WebUI 的访问权限。请管理员授予 `plugin:karyl-quest-game:manage` 给你的角色。",
  "manage.botRejected":
    "Bot 拒绝了登录请求 — 可能 `auth.session` RPC scope 尚未核准。",

  "stage.signup.title": "开始新游戏",
  "stage.signup.content":
    "按 **加入** 报名游戏。\n参加者到齐后，由发起人 {host} 按下 **开始**。\n至少需 5 人才能开始。",
  "stage.signup.join": "加入",
  "stage.signup.leave": "离开",
  "stage.signup.start": "开始",
  "stage.signup.cancel": "取消",
  "stage.signup.fieldCount": "当前人数",
  "stage.signup.fieldRoster": "参加名单",
  "stage.signup.cancelled": "已取消这场对局。",
  "stage.signup.fieldRules": "规则设定",
  "stage.signup.fieldLady": "湖中女神",
  "stage.signup.lakeNote": "（7 人以上生效）",
  "stage.signup.fieldNpcRoster": "NPC 名单",
  "stage.signup.fieldNpcCount": "NPC 人数",
  "stage.signup.npcAdd": "+ NPC",
  "stage.signup.npcRemove": "− NPC",
  "stage.signup.npcLineSuffix": "（NPC）",

  "stage.options.title": "规则设定",
  "stage.options.lady": "启用湖中女神？",
  "stage.options.yes": "启用",
  "stage.options.no": "不启用",

  "stage.deal.title": "身份分派",
  "stage.deal.content":
    "**身份已分发。** 每位玩家请点击下方 **查看身份** 按钮，私下查看你的角色与视野。",
  "stage.deal.reveal": "查看身份",
  "stage.deal.notInGame": "你不在这场对局里。",
  "stage.deal.yourRole": "你的身份：**{role}**",
  "stage.deal.legend": "🔵 蓝方　🔴 红方",
  "stage.deal.legendPercival": "🔵 蓝方　🔴 红方　🟣 梅林或莫甘娜",
  "stage.deal.vision": "你的视野",
  "stage.deal.helpButton": "📖 查看角色说明",
  "stage.deal.helpTitle": "角色说明 — {role}",
  "stage.deal.markerSection": "你的视野标记说明",

  "marker.self": "你自己",
  "marker.merlinRed": "你看到的红方角色",
  "marker.percivalPurple": "梅林或莫甘娜",
  "marker.evilRed": "你的红方伙伴",
  "marker.unknown": "无法判断阵营",

  "role.description.merlin":
    "你是 **梅林**，蓝方的智者。视野里所有红方会被标记为 🔴 — 但莫德雷德对你隐形（标记为 ⬜）。\n\n胜利条件：协助蓝方完成 3 次任务 **且不被刺客找出**。三次任务成功后，刺客有一次机会击杀梅林反败为胜 — 所以暗示信息时要克制，别让刺客锁定你。",
  "role.description.percival":
    "你是 **派西维尔**，蓝方的守护者。视野里梅林与莫甘娜都被标记为 🟣，你**分不清谁是谁** — 一个是真梅林、一个是冒充的莫甘娜。\n\n胜利条件：协助蓝方完成 3 次任务 + 保护真梅林不被刺杀。通过投票风格、推派人选、发言内容判断谁是真梅林、谁是莫甘娜。",
  "role.description.loyal":
    "你是 **亚瑟的忠臣**。没有特殊信息 — 视野里所有人都是 ⬜。\n\n胜利条件：协助蓝方完成 3 次任务。通过观察任务派人、投票模式、失败票数来推测谁是内奸。",
  "role.description.assassin":
    "你是 **刺客**，红方的核心。视野里除了奥伯伦以外的红方伙伴会被标记为 🔴。\n\n胜利条件：\n1) 让任务失败 3 次，或\n2) 三次任务成功后 **由你执行刺杀** — 从蓝方玩家中挑出梅林击杀，红方反败为胜。观察行为找出梅林是你的关键任务。",
  "role.description.morgana":
    "你是 **莫甘娜**，红方一员。视野里除了奥伯伦以外的红方伙伴会被标记为 🔴。\n\n**派西维尔会把你误认为梅林** — 行为要像梅林（积极推派、暗示信息），把派西维尔的判断带偏。\n\n胜利条件：让任务失败 3 次，或刺客成功击杀梅林。",
  "role.description.mordred":
    "你是 **莫德雷德**。视野里除了奥伯伦以外的红方伙伴会被标记为 🔴。\n\n**梅林看不见你** — 你是红方在蓝方视野中的隐形单位。可以放心积极推派、发言，蓝方无法靠视野锁定你。\n\n胜利条件：让任务失败 3 次，或刺客成功击杀梅林。",
  "role.description.oberon":
    "你是 **奥伯伦**，红方独行者。视野里所有人会被标记为 ⬜ — **你看不见红方伙伴、红方伙伴也看不见你**。\n\n独自制造任务失败，但不知道谁是你那边的。\n\n胜利条件：让任务失败 3 次，或刺客成功击杀梅林。",
  "role.description.minion":
    "你是 **莫德雷德的爪牙**，红方一般角色。视野里除了奥伯伦以外的红方伙伴会被标记为 🔴。\n\n胜利条件：让任务失败 3 次，或刺客成功击杀梅林。在任务上投失败票，配合其他红角破坏局势。",

  "stage.board.fieldPlayers": "玩家",
  "stage.board.fieldRoundStatus": "任务状态",
  "stage.board.fieldVoteStatus": "投票次数",
  "stage.board.fieldProgress": "任务进度",

  "stage.appoint.title": "第 {round} 轮：派任务",
  "stage.appoint.content": "由 {leader} 指派 **{num}** 员参与此次任务。",
  "stage.appoint.confirm": "确认",
  "stage.appoint.fieldRoster": "任务名单",
  "stage.appoint.fieldSelected": "当前选择",
  "stage.appoint.selectedNone": "（尚未选择）",

  "stage.publicVote.title": "第 {round} 轮：是否同意此次派遣？",
  "stage.publicVote.content": "由 {leader} 指派以下 **{num}** 员出任务，请全员投票。",
  "stage.publicVote.approve": "✅ 同意",
  "stage.publicVote.reject": "❌ 反对",
  "stage.publicVote.fieldRoster": "任务名单",
  "stage.publicVote.fieldVotes": "投票状况",
  "stage.publicVote.fieldRejections": "连续否决",
  "stage.publicVote.voted": "{n} / {total} 已投",
  "stage.publicVote.fieldResult": "投票结果",
  "stage.publicVote.fieldBallots": "投票明细",
  "stage.publicVote.passed": "通过",
  "stage.publicVote.rejected": "否决",
  "stage.publicVote.tally": "✅ {yes}　❌ {no}",
  "stage.publicVote.rejectionWarn": "连续否决 {n} / 5 — 达到 5 次红方获胜。",

  "stage.privateVote.title": "第 {round} 轮：任务投票",
  "stage.privateVote.content":
    "由 {leader} 指派的 **{num}** 员玩家正在执行任务 …",
  "stage.privateVote.openVote": "前往投票",
  "stage.privateVote.ephemeralPrompt": "请投出你的票",
  "stage.privateVote.success": "🔵 任务成功",
  "stage.privateVote.fail": "🔴 任务失败",
  "stage.privateVote.need2Fail": "本轮 7 人以上需要两张失败票才会失败。",
  "stage.privateVote.fieldVotes": "投票状况",
  "stage.privateVote.fieldRoster": "任务名单",
  "stage.privateVote.voted": "{n} / {total} 已投",
  "stage.privateVote.resultSuccess": "第 {round} 轮任务成功",
  "stage.privateVote.resultFail": "第 {round} 轮任务失败",
  "stage.privateVote.failCount": "本次任务有 {n} 张失败票",
  "stage.privateVote.noFails": "本次任务没有失败票",

  "stage.lake.title": "湖中女神出现",
  "stage.lake.content":
    "由 {holder} 使用第 {n} 次湖中女神，请选择要查验的对象。",
  "stage.lake.checked": "{holder} 用湖中女神查验了 {target}。",
  "stage.lake.resultTitle": "查验结果",
  "stage.lake.result": "{target} 的阵营：**{faction}**",
  "stage.lake.fieldHolder": "当前持有",

  "stage.assassinate.title": "刺杀阶段",
  "stage.assassinate.content":
    "由刺客 {assassin} 选择刺杀对象，若击中梅林，红方反败为胜。",
  "stage.assassinate.result":
    "刺客 {assassin} 刺杀了 {target}\n{target} 的身份：**{role}**",

  "stage.ending.titleArthur": "蓝方胜利",
  "stage.ending.titleMordred": "红方胜利",
  "stage.ending.reasonMissions":
    "三次任务成功 — 但接下来还有刺杀阶段 …",
  "stage.ending.reasonMissionsClean": "三次任务成功，梅林安全。",
  "stage.ending.reasonMerlinKilled": "刺客成功刺杀了梅林。",
  "stage.ending.reasonMerlinSurvived": "刺客刺杀失败。",
  "stage.ending.reasonFailures": "三次任务失败。",
  "stage.ending.reasonRejections": "公开投票连续五次被否决，红方获胜。",
  "stage.ending.fieldRoster": "全员身份",

  "error.notInGuild": "此指令只能在服务器中使用。",
  "error.alreadyRunning": "此频道已有对局正在进行。",
  "error.notRunning": "此频道没有正在进行的对局。",
  "error.notHostCannotStop": "只有发起人或管理员可以强制终止对局。",
  "error.stopped": "已强制终止对局。",
  "error.timeout": "过长时间无人回应，对局已关闭。",

  "role.merlin": "梅林",
  "role.percival": "派西维尔",
  "role.assassin": "刺客",
  "role.morgana": "莫甘娜",
  "role.mordred": "莫德雷德",
  "role.oberon": "奥伯伦",
  "role.loyal": "亚瑟的忠臣",
  "role.minion": "莫德雷德的爪牙",
  "role.flavor.merlin":
    "✨ 你是 **梅林** — 你看得见莫甘娜、刺客、奥伯伦（莫德雷德除外）。别让刺客找出你。",
  "role.flavor.percival":
    "🛡 你是 **派西维尔** — 你看见梅林与莫甘娜，但分不清谁是谁。保护真正的梅林。",
  "role.flavor.assassin":
    "🗡 你是 **刺客** — 三次任务成功后，你有一次机会击杀梅林、反败为胜。",
  "role.flavor.morgana":
    "🎭 你是 **莫甘娜** — 派西维尔会把你误认成梅林。尽量假装蓝方。",
  "role.flavor.mordred": "🌑 你是 **莫德雷德** — 连梅林也看不见你，潜伏吧。",
  "role.flavor.oberon":
    "🦉 你是 **奥伯伦** — 你看不见队友、队友也看不见你。独自破坏任务。",
  "role.flavor.loyal":
    "💙 你是 **亚瑟的忠臣** — 你看不见任何身份。观察行为，跟随梅林的暗示。",
  "role.flavor.minion":
    "🗡 你是 **莫德雷德的爪牙** — 你看得见除奥伯伦外的红方伙伴，与其他红角合作破坏任务。",
  "faction.arthur": "蓝方",
  "faction.mordred": "红方",
};
