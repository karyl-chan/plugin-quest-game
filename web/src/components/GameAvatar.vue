<script setup lang="ts">
import { computed } from "vue";

/**
 * Circular player avatar — the uploaded image, or an initial / 🤖
 * fallback. Shared by the player list and the history feed; `size`
 * and `ringColor` adapt it to each.
 */
const props = withDefaults(
  defineProps<{
    displayName: string;
    avatarUrl?: string | null;
    isNpc?: boolean;
    size?: number;
    ringColor?: string;
  }>(),
  {
    avatarUrl: null,
    isNpc: false,
    size: 32,
    ringColor: "var(--text-faint)",
  },
);

const initial = computed(
  () => [...props.displayName][0]?.toUpperCase() ?? "?",
);
</script>

<template>
  <span
    class="avatar"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderColor: ringColor,
      fontSize: `${Math.round(size * 0.42)}px`,
    }"
  >
    <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" />
    <span v-else class="fallback">{{ isNpc ? "🤖" : initial }}</span>
  </span>
</template>

<style scoped>
.avatar {
  border-radius: 50%;
  border: 2px solid var(--text-faint);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-2);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.fallback {
  font-weight: 600;
  color: var(--text-muted);
}
</style>
