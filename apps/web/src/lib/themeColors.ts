// Colors that drive the `theme-color` meta tag — the browser tab / address
// bar and installed-PWA title bar tint (see layout.tsx + hooks/useTheme.ts).
//
// Kept an exact match to `--t-bg` in globals.css — the TopBar itself has no
// background of its own (it's a transparent `<header>`), so what reads as
// "the topbar's color" is actually the page's `bg-truffle-bg`. Matching that
// exactly is what makes the chrome blend seamlessly with the app.
//
// `public/manifest.json`'s `theme_color`/`background_color` mirror `dark`
// too — a static Web App Manifest can't import this module, so keep it in
// sync by hand if this ever changes.
export const THEME_COLORS = {
  dark: '#0e0d0c',
  light: '#faf6f0',
} as const
