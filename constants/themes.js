export const themePresets = {
  rose: {
    id: 'rose',
    label: 'Rose',
    colors: {
      background: '#111114',
      cardGlass: 'rgba(255,255,255,0.07)',
      borderGlass: 'rgba(255,255,255,0.12)',
      primary: '#E11D48',
      secondary: '#FB7185',
      text: '#F5F5F5',
      muted: '#A1A1AA',
      paid: '#22C55E',
      dueSoon: '#F59E0B',
      overdue: '#EF4444',
      blackSoft: 'rgba(17,17,20,0.55)',
    },
    glow: {
      primary: 'rgba(225,29,72,0.35)',
      secondary: 'rgba(251,113,133,0.24)',
    },
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean',
    colors: {
      background: '#0B1320',
      cardGlass: 'rgba(125,211,252,0.09)',
      borderGlass: 'rgba(125,211,252,0.16)',
      primary: '#0EA5E9',
      secondary: '#67E8F9',
      text: '#E0F2FE',
      muted: '#94A3B8',
      paid: '#22C55E',
      dueSoon: '#F59E0B',
      overdue: '#F97316',
      blackSoft: 'rgba(11,19,32,0.6)',
    },
    glow: {
      primary: 'rgba(14,165,233,0.35)',
      secondary: 'rgba(103,232,249,0.24)',
    },
  },
  forest: {
    id: 'forest',
    label: 'Forest',
    colors: {
      background: '#0D1512',
      cardGlass: 'rgba(110,231,183,0.08)',
      borderGlass: 'rgba(110,231,183,0.14)',
      primary: '#10B981',
      secondary: '#6EE7B7',
      text: '#ECFDF5',
      muted: '#94A3B8',
      paid: '#22C55E',
      dueSoon: '#FBBF24',
      overdue: '#EF4444',
      blackSoft: 'rgba(13,21,18,0.58)',
    },
    glow: {
      primary: 'rgba(16,185,129,0.35)',
      secondary: 'rgba(110,231,183,0.22)',
    },
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    colors: {
      background: '#1A140A',
      cardGlass: 'rgba(251,191,36,0.08)',
      borderGlass: 'rgba(251,191,36,0.14)',
      primary: '#F59E0B',
      secondary: '#FCD34D',
      text: '#FFFBEB',
      muted: '#D6D3D1',
      paid: '#22C55E',
      dueSoon: '#F97316',
      overdue: '#EF4444',
      blackSoft: 'rgba(26,20,10,0.58)',
    },
    glow: {
      primary: 'rgba(245,158,11,0.35)',
      secondary: 'rgba(252,211,77,0.24)',
    },
  },
};

export const supportedThemes = Object.keys(themePresets);
export const defaultTheme = 'rose';

const baseRadius = {
  card: 16,
  input: 12,
  pill: 999,
};

export function getThemePreset(themeId = defaultTheme) {
  const preset = themePresets[themeId] ?? themePresets[defaultTheme];
  return {
    ...preset,
    radius: baseRadius,
  };
}
