<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useGameBoard } from "../composables/use-game-board";
import { currentChannelId, currentSessionId, gameApi } from "../api";
import GameActionPanel from "../components/GameActionPanel.vue";
import GameHistory from "../components/GameHistory.vue";
import { FACTION_NAME, ROLE_ABILITY, ROLE_NAME } from "../game-labels";

const { snapshot, status, deniedMessage, connect, act } = useGameBoard();

onMounted(connect);

// The viewer's role-card artwork. Fetched once — the role is fixed
// for the game — as soon as the first snapshot reveals a role.
const roleArt = ref<string | null>(null);
let roleArtRequested = false;
watch(
  () => snapshot.value?.viewer.role,
  async (role) => {
    if (roleArtRequested || !role) return;
    roleArtRequested = true;
    const channel = currentChannelId();
    if (!channel) return;
    try {
      const res = await gameApi<{ url: string | null }>(
        `/api/game/role-art?channel=${encodeURIComponent(channel)}` +
          `&session=${encodeURIComponent(currentSessionId())}`,
      );
      roleArt.value = res.url;
    } catch {
      // Best-effort — the card falls back to a text-only layout.
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="app-wrap">
    <main v-if="status === 'denied'" class="center-msg">
      <h2>無法載入遊戲板</h2>
      <p>{{ deniedMessage }}</p>
    </main>

    <main v-else-if="status === 'gone' || (!snapshot && status !== 'connecting')">
      <div class="center-msg">
        <h2>找不到對局</h2>
        <p>此頻道目前沒有進行中的任務遊戲對局，或保留時間已過。</p>
      </div>
    </main>

    <main v-else-if="!snapshot" class="center-msg">載入中…</main>

    <main v-else class="board">
      <section class="board-main">
        <!-- your role card -->
        <div class="card role-card" :class="snapshot.viewer.faction ? `fac-${snapshot.viewer.faction}` : ''">
          <p class="section-title">你的角色</p>
          <template v-if="snapshot.viewer.isPlayer && snapshot.viewer.role">
            <div class="role-head">
              <img
                v-if="roleArt"
                :src="roleArt"
                class="role-img"
                alt=""
              />
              <div class="role-id">
                <p class="role-name">{{ ROLE_NAME[snapshot.viewer.role] }}</p>
                <p v-if="snapshot.viewer.faction" class="role-faction">
                  {{ FACTION_NAME[snapshot.viewer.faction] }}
                </p>
              </div>
            </div>
            <p class="role-ability">{{ ROLE_ABILITY[snapshot.viewer.role] }}</p>
          </template>
          <p v-else class="role-spectator">
            你正在以旁觀者身分檢視，不會看到任何角色或視野資訊。
          </p>
        </div>

        <!-- progress track + per-stage info + player list + actions -->
        <GameActionPanel
          :snapshot="snapshot"
          :conn-status="status"
          :act="act"
        />
      </section>

      <aside class="board-side card">
        <p class="section-title">階段歷史</p>
        <GameHistory :events="snapshot.events" :players="snapshot.players" />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 0.85rem;
  align-items: start;
}
.board-main {
  min-width: 0;
}
.board-side {
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
}
@media (max-width: 760px) {
  .board {
    grid-template-columns: 1fr;
  }
  .board-side {
    position: static;
    max-height: none;
  }
}

.role-card.fac-arthur {
  border-left: 4px solid var(--faction-arthur);
}
.role-card.fac-mordred {
  border-left: 4px solid var(--faction-mordred);
}
.role-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-top: 0.4rem;
}
.role-img {
  width: 76px;
  height: 76px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg-surface-2);
}
.role-id {
  min-width: 0;
}
.role-name {
  font-size: 1.2rem;
  font-weight: 700;
}
.role-faction {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 0.1rem;
}
.role-ability {
  font-size: 0.86rem;
  color: var(--text-muted);
  margin-top: 0.45rem;
  line-height: 1.5;
}
.role-spectator {
  font-size: 0.86rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
  line-height: 1.5;
}
</style>
