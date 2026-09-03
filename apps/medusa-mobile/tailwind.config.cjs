module.exports = {
  content: ['./src/**/*.{html,ts,scss}', './src-default/**/*.{html,ts,scss}'],
  safelist: [
    'bg-app-dark',
    'bg-yellow-400',
    'bg-goiaba-primary',
    'bg-goiaba-secondary',
    'text-white',
    'text-neutral-900',
  ],
  theme: {
    extend: {
      colors: {
        goiaba: {
          primary: '#FF6B35',
          secondary: '#F7931E',
          accent: '#FFD23F',
          50: '#FFF7F3',
          100: '#FFEDE6',
          200: '#FFD4C2',
          300: '#FFBB9E',
          400: '#FF8956',
          500: '#FF6B35',
          600: '#E55A2B',
          700: '#CC4A21',
          800: '#B23A17',
          900: '#992A0D',
          950: '#7A1F08',
        },
        // Keep flat keys for backward compatibility
        'goiaba-primary': '#FF6B35',
        'goiaba-secondary': '#F7931E',
        'goiaba-accent': '#FFD23F',
        'app-dark': '#121212',
        'goiaba-50': '#FFF7F3',
        'goiaba-100': '#FFEDE6',
        'goiaba-200': '#FFD4C2',
        'goiaba-300': '#FFBB9E',
        'goiaba-400': '#FF8956',
        'goiaba-500': '#FF6B35',
        'goiaba-600': '#E55A2B',
        'goiaba-700': '#CC4A21',
        'goiaba-800': '#B23A17',
        'goiaba-900': '#992A0D',
        'goiaba-950': '#7A1F08',
        primary: {
          50: '#FFF7F3',
          100: '#FFEDE6',
          200: '#FFD4C2',
          300: '#FFBB9E',
          400: '#FF8956',
          500: '#FF6B35',
          600: '#E55A2B',
          700: '#CC4A21',
          800: '#B23A17',
          900: '#992A0D',
          950: '#7A1F08',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: [
      {
        goiaba: {
          // Primary brand colors
          "primary": "#FF6B35",      // Goiaba primary orange
          "secondary": "#F7931E",     // Goiaba secondary orange
          "accent": "#FFD23F",       // Goiaba accent yellow

          // Neutral colors
          "neutral": "#525252",      // neutral-600
          "base-100": "#FFFFFF",     // White background
          "base-200": "#FAFAFA",     // neutral-50 - subtle background
          "base-300": "#F5F5F5",     // neutral-100 - elevated surfaces

          // Semantic colors
          "info": "#3B82F6",         // info-500 - blue
          "success": "#22C55E",      // success-500 - green
          "warning": "#F59E0B",      // warning-500 - amber
          "error": "#EF4444",        // error-500 - red

          // Border radius (following daisyUI theme generator pattern)
          "rounded-box": "1rem",     // Card, modal, alert border radius
          "rounded-btn": "0.5rem",   // Button, input, select, tab border radius
          "rounded-badge": "1.9rem", // Checkbox, toggle, badge border radius

          // Animation settings
          "animation-btn": "0.25s",  // Button animation duration
          "animation-input": "0.2s", // Input animation duration
          "btn-focus-scale": "0.95",  // Button focus scale

          // Border width
          "border-btn": "1px",       // Button border width
          "tab-border": "1px",       // Tab border width
          "tab-radius": "0.5rem",    // Tab border radius
        },
      },
      {
        cmyk: {
          "color-scheme": "light",
          "primary": "oklch(71.772% 0.133 239.443)",
          "primary-content": "oklch(14.354% 0.026 239.443)",
          "secondary": "oklch(64.476% 0.202 359.339)",
          "secondary-content": "oklch(12.895% 0.04 359.339)",
          "accent": "oklch(94.228% 0.189 105.306)",
          "accent-content": "oklch(18.845% 0.037 105.306)",
          "neutral": "oklch(21.778% 0 0)",
          "neutral-content": "oklch(84.355% 0 0)",
          "base-100": "oklch(100% 0 0)",
          "base-200": "oklch(95% 0 0)",
          "base-300": "oklch(90% 0 0)",
          "base-content": "oklch(20% 0 0)",
          "info": "oklch(68.475% 0.094 217.284)",
          "info-content": "oklch(13.695% 0.018 217.284)",
          "success": "oklch(46.949% 0.162 321.406)",
          "success-content": "oklch(89.389% 0.032 321.406)",
          "warning": "oklch(71.236% 0.159 52.023)",
          "warning-content": "oklch(14.247% 0.031 52.023)",
          "error": "oklch(62.013% 0.208 28.717)",
          "error-content": "oklch(12.402% 0.041 28.717)",
        },
      },
      "light",  // Keep light theme as fallback
      "dark",   // Keep dark theme as fallback
    ],
    base: false,       // Disable base styles to avoid conflicts with Ionic (Ionic provides its own base styles)
    styled: true,      // Include component styles
    utils: true,       // Include utility classes
    prefix: "",        // No prefix (use standard daisyUI classes)
    logs: true,        // Show daisyUI logs in console
    themeRoot: ":root", // Root element for theme variables
  },
};
