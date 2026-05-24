<script setup lang="ts">
import { computed, ref } from "vue";
import type { GameSnapshotView } from "../game-types";
import GamePlayerList from "./GamePlayerList.vue";
import {
  CURRENT_STAGE_LABEL,
  END_REASON_LABEL,
  FACTION_NAME,
  STAGE_LABEL,
} from "../game-labels";

const props = defineProps<{
  snapshot: GameSnapshotView;
  /** Live-connection state — drives the corner pill. */
  connStatus: string;
  act: (action: string, extra?: { seat?: number; vote?: string }) => void;
}>();

const stage = computed(() => props.snapshot.currentStage);
const viewer = computed(() => props.snapshot.viewer);

/** The viewer's own player row, if they're seated. */
const me = computed(
  () =>
    props.snapshot.players.find((p) => p.seat === viewer.value.seat) ?? null,
);

const isLeader = computed(
  () =>
    stage.value === "appoint" &&
    viewer.value.seat === props.snapshot.leaderSeat,
);
const isHolder = computed(
  () =>
    stage.value === "lake" &&
    viewer.value.seat === props.snapshot.ladyHolderSeat,
);
const isAssassin = computed(
  () => stage.value === "assassinate" && viewer.value.role === "assassin",
);
const canPublicVote = computed(
  () =>
    stage.value === "publicVote" &&
    viewer.value.isPlayer &&
    !viewer.value.hasActed,
);
const canPrivateVote = computed(
  () =>
    stage.value === "privateVote" &&
    (me.value?.onMission ?? false) &&
    !viewer.value.hasActed,
);

/** Seats the viewer can tap this stage (appoint / lake / assassinate). */
const pickableSeats = computed<number[] | undefined>(() => {
  const players = props.snapshot.players;
  let seats: number[] | undefined;
  if (isLeader.value) seats = players.map((p) => p.seat);
  else if (isHolder.value)
    seats = players.filter((p) => p.lakeTargetable).map((p) => p.seat);
  else if (isAssassin.value)
    seats = players
      .filter((p) => p.seat !== viewer.value.seat)
      .map((p) => p.seat);
  else return undefined;
  // It IS a pick stage; while an action is in flight, freeze the picks.
  return pending.value ? [] : seats;
});

const missionSize = computed(
  () => props.snapshot.missionSizes[props.snapshot.round - 1] ?? 0,
);
const selectedCount = computed(
  () => props.snapshot.players.filter((p) => p.onMission).length,
);
const confirmReady = computed(
  () => isLeader.value && selectedCount.value === missionSize.value,
);

const votedCount = computed(
  () => props.snapshot.players.filter((p) => p.hasVoted).length,
);
const voteTotal = computed(() => {
  if (stage.value === "publicVote") return props.snapshot.players.length;
  if (stage.value === "privateVote")
    return props.snapshot.players.filter((p) => p.onMission).length;
  return 0;
});
/** 7+ player tables need two fail ballots to bust round 4. */
const needsTwoFails = computed(
  () => props.snapshot.round === 4 && props.snapshot.players.length >= 7,
);

function seatName(seat: number | null): string {
  if (seat === null) return "";
  return (
    props.snapshot.players.find((p) => p.seat === seat)?.displayName ??
    `#${seat + 1}`
  );
}

/** Phase banner — "第 N 回合 · 隊伍投票中" / the end verdict. */
const phase = computed(() => {
  const s = props.snapshot;
  if (s.stage === "ended") {
    const who = s.winner ? FACTION_NAME[s.winner] : "";
    const reason = s.endReason ? (END_REASON_LABEL[s.endReason] ?? "") : "";
    return `遊戲結束 · ${who}勝利${reason ? ` · ${reason}` : ""}`;
  }
  if (s.currentStage) {
    return `第 ${s.round} 回合 · ${CURRENT_STAGE_LABEL[s.currentStage] ?? s.currentStage}`;
  }
  return STAGE_LABEL[s.stage] ?? s.stage;
});

/** Five mission cells — size + outcome + current-round flag. */
const missions = computed(() =>
  props.snapshot.missionResults.map((result, i) => ({
    round: i + 1,
    size: props.snapshot.missionSizes[i] ?? 0,
    result,
    current:
      props.snapshot.stage !== "ended" &&
      result === null &&
      i + 1 === props.snapshot.round,
  })),
);

const statusPill = computed(() => {
  switch (props.connStatus) {
    case "connecting":
      return { text: "連線中…", cls: "pill--idle" };
    case "live":
      return { text: "● 即時更新", cls: "pill--live" };
    case "polling":
      return { text: "輪詢更新中", cls: "pill--idle" };
    default:
      return null;
  }
});

/** Below-the-track line: what's happening now and whose turn it is. */
const status = computed(() => {
  const s = props.snapshot;
  if (s.stage === "ended") return "";
  switch (stage.value) {
    case "appoint":
      return isLeader.value
        ? `輪到你提名隊伍 —— 點玩家加入（${selectedCount.value}/${missionSize.value}）`
        : `${seatName(s.leaderSeat)} 正在提名隊伍 · 需 ${missionSize.value} 人`;
    case "publicVote": {
      const base = canPublicVote.value
        ? "對這支隊伍投票"
        : viewer.value.hasActed
          ? "你已投票"
          : "隊伍投票進行中";
      return `${base} · 已投 ${votedCount.value}/${voteTotal.value}`;
    }
    case "privateVote": {
      const base = canPrivateVote.value
        ? "出任務票"
        : viewer.value.hasActed
          ? "你已出票"
          : "任務進行中";
      const two = needsTwoFails.value ? " · 需 2 張失敗票" : "";
      return `${base} · 已出票 ${votedCount.value}/${voteTotal.value}${two}`;
    }
    case "lake":
      return isHolder.value
        ? "輪到你使用湖中女神 —— 點一名玩家查驗"
        : `${seatName(s.ladyHolderSeat)} 正在使用湖中女神`;
    case "assassinate":
      return isAssassin.value
        ? "輪到你刺殺 —— 點一名玩家"
        : "刺客正在抉擇刺殺對象";
    default:
      return "";
  }
});

/** Key of the action currently in flight — drives loading + disabled. */
const pending = ref<string | null>(null);

/** Run an action with a loading guard; ignores clicks while one runs. */
async function doAct(
  key: string,
  action: string,
  extra?: { seat?: number; vote?: string },
): Promise<void> {
  if (pending.value) return;
  pending.value = key;
  try {
    await props.act(action, extra);
  } finally {
    pending.value = null;
  }
}

function onPick(seat: number): void {
  if (isLeader.value) void doAct("pick", "appoint-toggle", { seat });
  else if (isHolder.value) void doAct("pick", "lake", { seat });
  else if (isAssassin.value) void doAct("pick", "assassinate", { seat });
}
</script>

<template>
  <div class="card">
    <div class="phase-row">
      <p class="phase">{{ phase }}</p>
      <span v-if="statusPill" class="pill" :class="statusPill.cls">
        {{ statusPill.text }}
      </span>
    </div>

    <ol class="track">
      <li
        v-for="m in missions"
        :key="m.round"
        class="mission"
        :class="{
          'mission--success': m.result === 'success',
          'mission--fail': m.result === 'fail',
          'mission--current': m.current,
        }"
      >
        <span class="m-round">第 {{ m.round }} 關</span>
        <span class="m-icon">
          {{
            m.result === "success"
              ? "🔵"
              : m.result === "fail"
                ? "🔴"
                : "○"
          }}
        </span>
        <span class="m-size">{{ m.size }} 人</span>
      </li>
    </ol>

    <!-- current-stage info, below the progress track -->
    <div class="stage-info">
      <p
        v-if="snapshot.stage !== 'ended' && snapshot.consecutiveRejections > 0"
        class="rejections"
      >
        ⚠ 連續否決 {{ snapshot.consecutiveRejections }} / 5
      </p>
      <p v-if="status" class="status">{{ status }}</p>
    </div>

    <div v-if="canPublicVote" class="vote-bar">
      <button
        class="vote"
        :disabled="pending !== null"
        @click="doAct('pub-y', 'public-vote', { vote: 'yes' })"
      >
        <span v-if="pending === 'pub-y'" class="spinner" />✅ 同意
      </button>
      <button
        class="vote"
        :disabled="pending !== null"
        @click="doAct('pub-n', 'public-vote', { vote: 'no' })"
      >
        <span v-if="pending === 'pub-n'" class="spinner" />❌ 反對
      </button>
    </div>
    <div v-else-if="canPrivateVote" class="vote-bar">
      <button
        class="vote"
        :disabled="pending !== null"
        @click="doAct('mis-s', 'private-vote', { vote: 'success' })"
      >
        <span v-if="pending === 'mis-s'" class="spinner" />🔵 任務成功
      </button>
      <button
        class="vote"
        :disabled="pending !== null || viewer.faction !== 'mordred'"
        :title="viewer.faction !== 'mordred' ? '只有紅方能讓任務失敗' : undefined"
        @click="doAct('mis-f', 'private-vote', { vote: 'fail' })"
      >
        <span v-if="pending === 'mis-f'" class="spinner" />🔴 任務失敗
      </button>
    </div>

    <p class="section-title players-title">
      玩家（{{ snapshot.players.length }}）
    </p>
    <GamePlayerList
      :players="snapshot.players"
      :viewer-seat="snapshot.viewer.seat"
      :pickable-seats="pickableSeats"
      @pick="onPick"
    />

    <button
      v-if="isLeader"
      class="confirm"
      :disabled="!confirmReady || pending !== null"
      @click="doAct('confirm', 'appoint-confirm')"
    >
      <span v-if="pending === 'confirm'" class="spinner" />
      確認隊伍（{{ selectedCount }} / {{ missionSize }}）
    </button>
  </div>
</template>

<style scoped>
.phase-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.phase {
  font-size: 1.05rem;
  font-weight: 650;
}
.pill {
  font-size: 0.74rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.18rem 0.6rem;
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.pill--live {
  color: var(--success);
  border-color: color-mix(in srgb, var(--success) 45%, transparent);
  background: var(--success-bg);
}
.pill--idle {
  color: var(--text-muted);
  background: var(--bg-surface-2);
}

.track {
  list-style: none;
  display: flex;
  gap: 0.4rem;
  margin-top: 0.7rem;
}
.mission {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.5rem 0.2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-surface-2);
}
.mission--success {
  border-color: var(--faction-arthur);
  background: color-mix(in srgb, var(--faction-arthur) 14%, transparent);
}
.mission--fail {
  border-color: var(--faction-mordred);
  background: color-mix(in srgb, var(--faction-mordred) 14%, transparent);
}
.mission--current {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-bg);
}
.m-round {
  font-size: 0.72rem;
  color: var(--text-muted);
}
.m-icon {
  font-size: 1.1rem;
}
.m-size {
  font-size: 0.72rem;
  color: var(--text-faint);
}

.stage-info {
  margin-top: 0.7rem;
}
.rejections {
  font-size: 0.82rem;
  color: var(--danger);
  margin-bottom: 0.2rem;
}
.status {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.vote-bar {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.7rem;
}
.vote {
  flex: 1;
  padding: 0.55rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-surface-2);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.vote:not(:disabled):hover {
  filter: brightness(1.05);
}
.vote:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Inline button spinner — shown on the action that's in flight. */
.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 0.35rem;
  vertical-align: -1px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: action-spin 0.7s linear infinite;
}
@keyframes action-spin {
  to {
    transform: rotate(360deg);
  }
}

.players-title {
  margin-top: 0.85rem;
  margin-bottom: 0.5rem;
}

.confirm {
  width: 100%;
  margin-top: 0.7rem;
  padding: 0.55rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--text-on-accent);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
