// Gantz Design System
// Based on the original HTML template design

export const colors = {
  // Primary Colors
  background: '#000000',        // Main app background
  cardBackground: '#1a1a1a',    // Card backgrounds
  headerBackground: '#111111',  // Header background
  
  // Accent Colors
  primary: '#ff6b6b',           // Primary red (buttons, active states)
  primaryHover: '#ff5252',      // Primary red hover state
  primaryLight: 'rgba(255, 107, 107, 0.1)', // Primary red with opacity
  
  // Border Colors
  border: '#333333',            // Default borders
  borderLight: '#444444',       // Hover borders
  
  // Text Colors
  textPrimary: '#ffffff',       // Primary text
  textSecondary: '#cccccc',     // Secondary text
  textMuted: '#888888',         // Muted/disabled text
  
  // Status Colors
  statusActive: '#4ade80',      // Green for active status
  statusUpcoming: '#fbbf24',    // Yellow for upcoming status
  statusCompleted: '#9ca3af',   // Gray for completed status
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  
  // Heading Sizes
  h1: {
    fontSize: '36px',
    marginBottom: '10px',
    fontWeight: 'normal'
  },
  h2: {
    fontSize: '28px',
    marginBottom: '20px',
    color: colors.textPrimary
  },
  h3: {
    fontSize: '20px',
    marginBottom: '10px'
  },
  
  // Body Text
  body: {
    color: colors.textSecondary,
    lineHeight: '1.6'
  },
  
  // Small Text
  small: {
    fontSize: '14px',
    color: colors.textMuted
  }
};

export const spacing = {
  // Container Spacing
  containerPadding: '40px 20px',
  containerMaxWidth: '1200px',
  
  // Card Spacing
  cardPadding: '24px',
  cardMarginBottom: '20px',
  cardBorderRadius: '12px',
  
  // Grid Spacing
  gridGap: '20px',
  gridMinWidth: '300px',
  
  // Element Spacing
  elementGap: '20px',
  smallGap: '10px',
  largeGap: '30px'
};

export const components = {
  // Card Styles
  card: {
    background: colors.cardBackground,
    border: `1px solid ${colors.border}`,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    marginBottom: spacing.cardMarginBottom,
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  
  cardHover: {
    borderColor: colors.primary,
    transform: 'translateY(-2px)'
  },
  
  // Button Styles
  button: {
    background: colors.primary,
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '16px',
    transition: 'background 0.3s'
  },
  
  buttonHover: {
    background: colors.primaryHover
  },
  
  // Header Styles
  header: {
    background: colors.headerBackground,
    borderBottom: `2px solid ${colors.border}`,
    padding: '20px'
  },
  
  // Navigation Styles
  navLink: {
    color: colors.textSecondary,
    textDecoration: 'none',
    fontWeight: '500',
    padding: '8px 16px',
    border: '2px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s'
  },
  
  navLinkActive: {
    color: colors.primary,
    borderColor: colors.primary,
    background: colors.primaryLight
  },
  
  navLinkHover: {
    color: colors.textPrimary,
    borderColor: colors.borderLight
  },
  
  // Grid Layout
  grid: {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${spacing.gridMinWidth}, 1fr))`,
    gap: spacing.gridGap,
    marginTop: spacing.gridGap
  },
  
  // Container Layout
  container: {
    maxWidth: spacing.containerMaxWidth,
    margin: '0 auto',
    padding: spacing.containerPadding
  },
  
  // App Layout
  app: {
    fontFamily: typography.fontFamily,
    background: colors.background,
    color: colors.textPrimary,
    margin: 0,
    padding: 0,
    minHeight: '100vh'
  }
};

// Helper Functions
export const getCardStyle = (isHovered = false) => ({
  ...components.card,
  ...(isHovered ? components.cardHover : {})
});

export const getButtonStyle = (isHovered = false) => ({
  ...components.button,
  ...(isHovered ? components.buttonHover : {})
});

export const getNavLinkStyle = (isActive = false, isHovered = false) => ({
  ...components.navLink,
  ...(isActive ? components.navLinkActive : {}),
  ...(isHovered && !isActive ? components.navLinkHover : {})
});

// Status Badge Styles
export const getStatusStyle = (status) => {
  const statusColors = {
    active: colors.statusActive,
    upcoming: colors.statusUpcoming,
    completed: colors.statusCompleted
  };
  
  return {
    color: statusColors[status?.toLowerCase()] || colors.statusActive,
    fontSize: '14px',
    marginBottom: '10px',
    fontWeight: '500'
  };
};

// Profile Stats Styles
export const profileStats = {
  container: {
    display: 'flex',
    gap: '40px',
    marginTop: '20px'
  },
  
  stat: {
    textAlign: 'center'
  },
  
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: colors.primary
  },
  
  statLabel: {
    color: colors.textMuted,
    fontSize: '14px',
    marginTop: '5px'
  }
};

// Avatar Styles
export const avatar = {
  width: '100px',
  height: '100px',
  background: colors.primary,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '36px',
  fontWeight: 'bold',
  color: 'white'
};

export default {
  colors,
  typography,
  spacing,
  components,
  getCardStyle,
  getButtonStyle,
  getNavLinkStyle,
  getStatusStyle,
  profileStats,
  avatar
};