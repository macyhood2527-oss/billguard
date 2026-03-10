import { defaultTheme, getThemePreset } from './themes';

let activeTheme = getThemePreset(defaultTheme);

function buildColors(theme) {
  return {
    background: theme.colors.background,
    surface: theme.colors.cardGlass,
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    glowPrimary: theme.glow.primary,
    glowSecondary: theme.glow.secondary,
    success: theme.colors.paid,
    danger: theme.colors.overdue,
    warning: theme.colors.dueSoon,
    textPrimary: theme.colors.text,
    textSecondary: theme.colors.muted,
    border: theme.colors.borderGlass,
    glass: theme.colors.cardGlass,
    glassBorder: theme.colors.borderGlass,
    shadow: theme.colors.blackSoft,
  };
}

export const colors = buildColors(activeTheme);

export function getActiveTheme() {
  return activeTheme;
}

export function applyTheme(themeId) {
  activeTheme = getThemePreset(themeId);
  Object.assign(colors, buildColors(activeTheme));
  return activeTheme;
}
