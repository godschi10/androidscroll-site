/* THEME_COLORS — single source of truth for the status-bar / browser-chrome
   colors (v0.6.7 duality fix). Head.astro injects these into the inline
   bootstrap AND the static media-pair metas; Header.astro's module script
   imports this for every theme change. Manifest keeps theme_color = light
   (Chrome does not support media/dark values in the manifest — see
   statusbar-PROGRESS.md Phase 1). Do NOT re-declare these hexes elsewhere. */
export const THEME_COLORS = {
  light: '#EDF6F3', // site green (matches --band)
  dark: '#071512',  // dark canvas ink (also the PWA manifest theme_color since v2.2A — status bar claims it at install)
} as const;

export type ThemeEffect = keyof typeof THEME_COLORS;
