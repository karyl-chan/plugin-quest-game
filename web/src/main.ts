import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
// @karyl-chan/ui tokens first; the plugin's global.css layers its
// green-accent + dark overrides on top.
import "@karyl-chan/ui/tokens.css";
import "@karyl-chan/ui/reset.css";
import "@karyl-chan/ui/use-drawer.css";
import "@karyl-chan/ui/use-popover.css";

createApp(App).use(createPinia()).mount("#app");
