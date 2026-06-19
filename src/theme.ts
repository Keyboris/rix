/**
 * Theme: colour palettes (white / cream / light blue / light pink) and the
 * app-wide font-size scale. The default palette targets WCAG AA (4.5:1) text
 * contrast; High Contrast targets 7:1+.
 */

export type FontSizeKey = 'default' | 'large' | 'xlarge' | 'max';

export const FONT_SIZE_KEYS: FontSizeKey[] = ['default', 'large', 'xlarge', 'max'];

export const FONT_SIZE_LABELS: Record<FontSizeKey, string> = {
  default: 'Default',
  large: 'Large',
  xlarge: 'Extra Large',
  max: 'Maximum',
};

export const FONT_SCALE: Record<FontSizeKey, number> = {
  default: 1,
  large: 1.2,
  xlarge: 1.45,
  max: 1.8,
};

export interface Palette {
  /** App background — cream. */
  background: string;
  /** Cards / sheets / bubbles surface — white. */
  surface: string;
  /** Subtle alternate surface — faint pink. */
  surfaceAlt: string;
  text: string;
  textMuted: string;
  /** Light blue — primary accent fill. */
  primary: string;
  /** Darker blue for text/icons that must read on light surfaces. */
  primaryStrong: string;
  /** Text/icon colour that reads on top of `primary`. */
  onPrimary: string;
  /** Light pink — secondary accent fill. */
  accent: string;
  accentStrong: string;
  onAccent: string;
  border: string;
  /** Strong border for focus / high-contrast outlines. */
  borderStrong: string;
  danger: string;
  onDanger: string;
  success: string;
  bubbleUser: string;
  bubbleUserText: string;
  bubbleAgent: string;
  bubbleAgentText: string;
  overlay: string;
}

export const lightPalette: Palette = {
  background: '#FFFBF5', // cream
  surface: '#FFFFFF',
  surfaceAlt: '#FFF4F8', // faint pink
  text: '#262630',
  textMuted: '#62626E',
  primary: '#BFE0F2', // light blue
  primaryStrong: '#1C6BA0',
  onPrimary: '#0C3A57',
  accent: '#F9D6E3', // light pink
  accentStrong: '#BD4F7C',
  onAccent: '#5A1E38',
  border: '#EBE5DC',
  borderStrong: '#C9C2B8',
  danger: '#B23A2E',
  onDanger: '#FFFFFF',
  success: '#1E7A52',
  bubbleUser: '#BFE0F2',
  bubbleUserText: '#0C3A57',
  bubbleAgent: '#FFFFFF',
  bubbleAgentText: '#262630',
  overlay: 'rgba(38, 38, 48, 0.35)',
};

export const highContrastPalette: Palette = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#FFFFFF',
  text: '#000000',
  textMuted: '#1A1A1A',
  primary: '#0A4C8B',
  primaryStrong: '#003366',
  onPrimary: '#FFFFFF',
  accent: '#9C1A57',
  accentStrong: '#6E0E3D',
  onAccent: '#FFFFFF',
  border: '#000000',
  borderStrong: '#000000',
  danger: '#9B0000',
  onDanger: '#FFFFFF',
  success: '#005C2E',
  bubbleUser: '#0A4C8B',
  bubbleUserText: '#FFFFFF',
  bubbleAgent: '#FFFFFF',
  bubbleAgentText: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export interface Theme {
  colors: Palette;
  highContrast: boolean;
  /** Multiplier from the font-size setting. */
  scale: number;
  /** Scale a base font size by the current setting. */
  fs: (base: number) => number;
}

export function buildTheme(fontSize: FontSizeKey, highContrast: boolean): Theme {
  const scale = FONT_SCALE[fontSize];
  return {
    colors: highContrast ? highContrastPalette : lightPalette,
    highContrast,
    scale,
    fs: (base: number) => Math.round(base * scale),
  };
}

/** Shared spacing / radius scale (not affected by font size). */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};
