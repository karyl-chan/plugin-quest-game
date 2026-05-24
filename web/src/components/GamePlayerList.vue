<script setup lang="ts">
import { computed } from "vue";
import type { PlayerView } from "../game-types";
import { FACTION_NAME, MARKER_LABEL, ROLE_NAME, markerColor } from "../game-labels";
import GameAvatar from "./GameAvatar.vue";

const props = defineProps<{
  players: PlayerView[];
  viewerSeat: number | null;
  /** Seats the viewer may tap to act on this stage; others are inert. */
  pickableSeats?: number[];
}>();

const emit = defineEmits<{ pick: [seat: number] }>();

const ordered = computed(() =>
  [...props.players].sort((a, b) => a.seat - b.seat),
);

const pickable = computed(() => new Set(props.pickableSeats ?? []));

function onPick(p: PlayerView): void {
  if (pickable.value.has(p.seat)) emit("pick", p.seat);
}
</script>

<template>
  <ul class="players">
    <li
      v-for="p in ordered"
      :key="p.userId"
      class="player"
      :class="{
        'player--self': p.seat === viewerSeat,
        'player--mission': p.onMission,
        'player--pickable': pickable.has(p.seat),
        'player--disabled':
          pickableSeats !== undefined && !pickable.has(p.seat),
      }"
      :style="{ '--marker': markerColor(p) }"
      :role="pickable.has(p.seat) ? 'button' : undefined"
      :tabindex="pickable.has(p.seat) ? 0 : undefined"
      @click="onPick(p)"
      @keydown.enter="onPick(p)"
    >
      <GameAvatar
        :display-name="p.displayName"
        :avatar-url="p.avatarUrl"
        :is-npc="p.isNpc"
        :size="38"
        ring-color="var(--marker)"
      />

      <div class="who">
        <div class="name-row">
          <span class="seat">{{ p.seat + 1 }}</span>
          <span class="name">{{ p.displayName }}</span>
          <span v-if="p.isNpc" class="tag tag--npc">NPC</span>
        </div>
        <div class="badge-row">
          <span v-if="p.isLeader" class="tag" title="本回合隊長">👑 隊長</span>
          <span v-if="p.isLadyHolder" class="tag" title="持有湖中女神">
            🔮 湖中女神
          </span>
          <span v-if="p.onMission" class="tag tag--mission" title="在本次任務隊伍中">
            ⚔️ 在隊
          </span>
          <span v-if="p.hasVoted" class="tag tag--voted" title="已投票">
            🗳️ 已投
          </span>
        </div>
      </div>

      <div class="vision">
        <span
          v-if="p.role"
          class="role-chip"
          :title="FACTION_NAME[p.faction ?? 'arthur']"
        >
          {{ ROLE_NAME[p.role] }}
        </span>
        <span v-else class="marker">
          <span class="dot" />
          {{ MARKER_LABEL[p.marker] }}
        </span>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.players {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.player {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
}
/* The viewer's own row is tinted with their faction colour
   (--marker, set per-row from markerColor()). */
.player--self {
  border-color: var(--marker);
  background: color-mix(in srgb, var(--marker) 12%, transparent);
}
.player--mission {
  box-shadow: inset 3px 0 0 var(--faction-arthur);
}
/* A seat the viewer can tap to act on (appoint / lake / assassinate). */
.player--pickable {
  cursor: pointer;
}
.player--pickable:hover {
  box-shadow: 0 0 0 2px var(--accent);
}
/* During a pick stage, a seat the viewer can't choose. */
.player--disabled {
  opacity: 0.45;
}
.who {
  flex: 1;
  min-width: 0;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.seat {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-on-accent);
  background: var(--text-faint);
  border-radius: 4px;
  padding: 0.05rem 0.32rem;
  flex-shrink: 0;
}
.name {
  font-weight: 600;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.2rem;
}
.tag {
  font-size: 0.68rem;
  color: var(--text-muted);
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.05rem 0.32rem;
  white-space: nowrap;
}
.tag--npc {
  color: var(--text-faint);
}
.tag--mission {
  color: var(--faction-arthur);
  border-color: color-mix(in srgb, var(--faction-arthur) 40%, transparent);
}
.tag--voted {
  color: var(--accent-text);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}
.vision {
  flex-shrink: 0;
}
.marker {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  background: var(--marker);
}
.role-chip {
  font-size: 0.75rem;
  font-weight: 650;
  color: #fff;
  background: var(--marker);
  border-radius: 999px;
  padding: 0.16rem 0.55rem;
  white-space: nowrap;
}
</style>
