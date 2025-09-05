import type { HookResult } from "@nuxt/schema"

declare module '#app' {
  interface RuntimeNuxtHooks {
    'cli:start': () => HookResult
  }
  interface NuxtHooks {
    'cli:start': () => HookResult
  }
}

declare module '@nuxt/schema' {
  interface HookKeys {
    'cli:start': string
  }
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'cli:start': () => void;
  }
}
