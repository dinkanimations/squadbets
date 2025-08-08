
import { StyleSheet, ViewStyle, TextStyle, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const colors = {
  // Main theme colors matching the image
  primary: '#00ff88',        // Bright green accent from image
  secondary: '#1a1a1a',      // Dark background from image
  accent: '#00ff88',         // Bright green for highlights
  background: '#0f0f0f',     // Very dark background
  backgroundAlt: '#1a1a1a',  // Card background
  surface: '#242424',        // Elevated surface color
  text: '#d0d0d0',           // Off-white text (matching home screen)
  textSecondary: '#b0b0b0',  // Gray text
  textMuted: '#808080',      // Muted text
  border: '#333333',         // Border color
  card: '#1a1a1a',          // Card background
  cardElevated: '#242424',   // Elevated card
  success: '#00ff88',        // Success green
  warning: '#ffa500',        // Warning orange
  error: '#ff4444',          // Error red
  gold: '#ffd700',           // Gold for winners
  silver: '#c0c0c0',         // Silver
  bronze: '#cd7f32',         // Bronze
  // Added to avoid invalid color concatenations in several screens
  grey: '#999999',
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.25)',
    elevation: 6,
  },
  backButton: {
    backgroundColor: colors.surface,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    maxWidth: 800,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
  },
  homeHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  homeButtonContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: Math.min(36, screenWidth * 0.09),
    fontWeight: '700',
    textAlign: 'center',
    color: '#d0d0d0',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  brandTitle: {
    fontSize: Math.min(32, screenWidth * 0.08),
    fontWeight: '600',
    textAlign: 'center',
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  seasonText: {
    fontSize: Math.min(18, screenWidth * 0.045),
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: Math.min(16, screenWidth * 0.04),
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
    color: '#d0d0d0',
    marginBottom: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  textSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  textMuted: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textMuted,
    lineHeight: 18,
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 8,
    width: '100%',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)',
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardElevated: {
    backgroundColor: colors.cardElevated,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 8,
    width: '100%',
    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.5)',
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d0d0d0',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 4,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  rowSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 8,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: colors.primary,
  },
  iconLarge: {
    width: 32,
    height: 32,
    tintColor: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginVertical: 16,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#d0d0d0',
    width: '100%',
    marginVertical: 8,
  },
  inputFocused: {
    borderColor: colors.primary,
    boxShadow: '0px 0px 0px 2px rgba(0, 255, 136, 0.2)',
  },
});
