/**
 * theme.ts
 * Central CareTag UI/UX design system tokens.
 * Enforces High-Contrast Light theme based on the UI Master Contract.
 */

export const theme = {
  colors: {
    primary: '#0D7A41',        // Forest Green
    background: '#FFFFFF',     // Pure White
    surface: '#F1F5F9',        // Crisp Off-White
    highlight: '#E8F5E9',      // Mint Light
    textPrimary: '#0F172A',    // Deep Slate / Near Black
    textSecondary: '#334155',  // Solid Charcoal
    border: '#CBD5E1',         // Slate Outline
    white: '#FFFFFF',
    danger: '#D32F2F',         // High contrast red
    dangerBg: '#FFEBEE',
  },
  typography: {
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      bold: '700' as const,
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
  borderRadius: {
    button: 9999, // Pill shape
    card: 12,     // Soft rounded
    input: 12,    // Soft rounded
  },
};
