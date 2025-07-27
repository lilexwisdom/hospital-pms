// Theme configuration for Hospital PMS
export const theme = {
  name: 'Hospital PMS',
  description: 'Hospital Patient Management System',
  
  // Brand colors for medical/healthcare theme
  colors: {
    // Medical Blue
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      DEFAULT: '#3b82f6',
    },
    
    // Healthcare Green
    accent: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      DEFAULT: '#22c55e',
    },
    
    // Status Colors
    success: {
      light: '#86efac',
      DEFAULT: '#22c55e',
      dark: '#16a34a',
    },
    warning: {
      light: '#fde047',
      DEFAULT: '#eab308',
      dark: '#ca8a04',
    },
    danger: {
      light: '#fca5a5',
      DEFAULT: '#ef4444',
      dark: '#dc2626',
    },
    info: {
      light: '#7dd3fc',
      DEFAULT: '#0ea5e9',
      dark: '#0369a1',
    },
    
    // Appointment Status Colors
    appointment: {
      pending: '#eab308',
      confirmed: '#3b82f6',
      completed: '#22c55e',
      cancelled: '#6b7280',
      noShow: '#ef4444',
    },
    
    // Role Colors
    role: {
      admin: '#8b5cf6',
      manager: '#3b82f6',
      bd: '#f59e0b',
      cs: '#10b981',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['Fira Code', 'Consolas', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
  },
  
  // Common breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Layout constants
  layout: {
    sidebarWidth: '260px',
    sidebarCollapsedWidth: '80px',
    headerHeight: '64px',
    contentMaxWidth: '1400px',
    containerPadding: '1.5rem',
    cardPadding: '1.5rem',
    tablePadding: '0.75rem',
  },
  
  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
};