<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { AppButton, AppTabs, type TabDef } from "@karyl-chan/ui";
import GamesView from "./GamesView.vue";
import ArtView from "./ArtView.vue";
import AssetsView from "./AssetsView.vue";
import { useGamesPoll } from "../composables/use-games-poll";

type TabKey = "games" | "art" | "assets";

const STORAGE_KEY = "quest-game_admin_active_tab";
const TAB_KEYS: ReadonlyArray<TabKey> = ["games", "art", "assets"];

function loadStoredTab(): TabKey {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return (TAB_KEYS as ReadonlyArray<string>).includes(raw ?? "")
    ? (raw as TabKey)
    : "games";
}

const activeTab = ref<TabKey>(loadStoredTab());

function onTabChange(next: string): void {
  if (!(TAB_KEYS as ReadonlyArray<string>).includes(next)) return;
  activeTab.value = next as TabKey;
  sessionStorage.setItem(STORAGE_KEY, next);
}

const { games, signups, refresh, start } = useGamesPoll();

const gamesTabCount = computed(() => games.value.length + signups.value.length);

// @karyl-chan/ui's TabDef has no count field; fold the live count into
// the label so the visual cue survives. The "art" / "assets" tabs have
// no counter to fold so the labels stay plain.
const tabs = computed<TabDef[]>(() => [
  {
    key: "games",
    label: gamesTabCount.value > 0
      ? `對局與報名 (${gamesTabCount.value})`
      : "對局與報名",
  },
  { key: "art", label: "角色圖像" },
  { key: "assets", label: "遊戲元素" },
]);

onMounted(() => {
  start();
});
</script>

<template>
  <div class="manage-view">
    <div class="tabs-row">
      <AppTabs
        :model-value="activeTab"
        :tabs="tabs"
        @update:model-value="onTabChange"
      />
      <AppButton variant="ghost" size="sm" @click="refresh()">
        重新整理
      </AppButton>
    </div>
    <KeepAlive>
      <GamesView v-if="activeTab === 'games'" />
      <ArtView v-else-if="activeTab === 'art'" />
      <AssetsView v-else />
    </KeepAlive>
  </div>
</template>

<style scoped>
.manage-view {
  display: flex;
  flex-direction: column;
}
.tabs-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}
.tabs-row > :first-child {
  flex: 1;
  min-width: 0;
}
</style>
