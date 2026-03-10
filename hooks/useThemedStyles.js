import { useMemo } from 'react';
import { colors } from '../constants/colors';
import { useTheme } from './ThemeProvider';

export function useThemedStyles(createStyles) {
  const { themeId } = useTheme();

  return useMemo(() => createStyles(colors), [createStyles, themeId]);
}
