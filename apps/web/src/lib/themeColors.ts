// Colors that drive the `theme-color` meta tag — the browser tab / address
// bar and installed-PWA title bar tint (see layout.tsx + hooks/useTheme.ts).
//
// `dark` matches `--t-bg` from globals.css exactly (#0e0d0c is already far
// from any browser's default chrome, so an exact match reads as clearly
// "colored"). `light`'s real `--t-bg` (#faf6f0) is only a few RGB units off
// pure white, so tinting the chrome with it is visually indistinguishable
// from an untinted tab next to a light OS/browser theme — we use the
// slightly deeper `--t-card` tone instead so light mode actually shows up.
//
// `public/manifest.json`'s `theme_color`/`background_color` mirror `dark`
// too — a static Web App Manifest can't import this module, so keep it in
// sync by hand if these ever change.
export const THEME_COLORS = {
  dark: '#0e0d0c',
  light: '#e8dfd3',
} as const
