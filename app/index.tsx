
import { Text, View, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import { colors } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import ErrorBoundary from '../components/ErrorBoundary';

const { width } = Dimensions.get('window');
const USE_STACKED_HOME_DEFAULT = true; // Flip to false to revert quickly

export default function MainScreen() {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [useStacked, setUseStacked] = useState<boolean>(USE_STACKED_HOME_DEFAULT);
  const { userRole, isAuthenticated, logout } = useAuth();

  console.log('MainScreen rendered with userRole:', userRole, 'isAuthenticated:', isAuthenticated, 'useStacked:', useStacked);

  useEffect(() => {
    loadData();
    loadLayoutChoice();
  }, []);

  const loadData = async () => {
    try {
      const storedWeek = await AsyncStorage.getItem('currentWeek');
      if (storedWeek) setCurrentWeek(parseInt(storedWeek));
      console.log('Home screen data loaded');
    } catch (error) {
      console.error('Error loading home screen data:', error);
    }
  };

  const loadLayoutChoice = async () => {
    try {
      const saved = await AsyncStorage.getItem('homeLayoutVersion');
      if (saved === 'grid') {
        setUseStacked(false);
      } else if (saved === 'stacked') {
        setUseStacked(true);
      } else {
        setUseStacked(USE_STACKED_HOME_DEFAULT);
      }
      console.log('Loaded layout choice:', saved);
    } catch (e) {
      console.warn('Failed to load layout choice, defaulting');
      setUseStacked(USE_STACKED_HOME_DEFAULT);
    }
  };

  const setLayoutChoice = useCallback(async (layout: 'stacked' | 'grid') => {
    try {
      await AsyncStorage.setItem('homeLayoutVersion', layout);
      setUseStacked(layout === 'stacked');
      console.log('Saved layout choice:', layout);
    } catch (e) {
      console.error('Failed to save layout choice:', e);
      setUseStacked(layout === 'stacked');
    }
  }, []);

  const handleStackedError = useCallback(() => {
    console.error('Stacked home layout crashed. Falling back to classic grid layout.');
    setLayoutChoice('grid');
  }, [setLayoutChoice]);

  // If not authenticated, show role selection
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContent}>
          <View style={styles.homeHeader}>
            <Image
              source={require('../assets/images/f89c2f3e-9ef9-4bab-a13a-8eebf9d4ce7e.png')}
              style={styles.logo}
            />
            <Text style={styles.seasonText}>2025/26</Text>
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Bet. Win. Brag.</Text>
            <Text style={styles.welcomeSubtitle}>Please select your role to continue</Text>
          </View>

          <View style={styles.roleButtonsContainer}>
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => {
                console.log('Navigating to role selection');
                router.push('/role-selection');
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, '#00cc6a']}
                style={styles.roleButtonGradient}
              >
                <Icon name="person-outline" size={24} style={{ color: colors.background }} />
                <Text style={styles.roleButtonText}>Select Role</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Tiles (classic grid layout)
  const baseTiles = [
    { key: 'picks', label: 'Player Picks', icon: 'clipboard-outline' as const, route: '/player-picks' },
    { key: 'weekly', label: 'Leaderboard', icon: 'stats-chart-outline' as const, route: '/leaderboard' },
    { key: 'season', label: 'Season Leaderboard', icon: 'trophy-outline' as const, route: '/season-leaderboard' },
    { key: 'players', label: 'Stats', icon: 'people-outline' as const, route: '/stats' },
  ];
  // Show Deploy only to admins to avoid clutter for players
  const tiles = userRole === 'admin'
    ? [...baseTiles, { key: 'deploy', label: 'Deploy', icon: 'cloud-upload-outline' as const, route: '/deploy' }]
    : baseTiles;

  const renderGridTiles = () => (
    <View style={styles.tilesContainer}>
      {tiles.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={styles.tileWrapper}
          onPress={() => {
            console.log(`Navigating to ${t.route}`);
            router.push(t.route as any);
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#0f0f0f', '#1a1a1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tile}
          >
            <View style={styles.tileIconWrap}>
              <Icon name={t.icon} size={28} style={{ color: colors.primary }} />
            </View>
            <Text style={styles.tileText}>{t.label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStackedButtons = () => (
    <View style={styles.stackedButtons}>
      <Button text="Player Picks" onPress={() => router.push('/player-picks' as any)} variant="primary" style={styles.stackedButton} />
      <Button text="Leaderboard" onPress={() => router.push('/leaderboard' as any)} variant="primary" style={styles.stackedButton} />
      <Button text="Season Leaderboard" onPress={() => router.push('/season-leaderboard' as any)} variant="primary" style={styles.stackedButton} />
      <Button text="Stats" onPress={() => router.push('/stats' as any)} variant="primary" style={styles.stackedButton} />
      {userRole === 'admin' && (
        <>
          <Button
            text="Admin Panel"
            onPress={() => router.push('/admin' as any)}
            variant="outline"
            style={styles.adminButtonOutlined}
            textStyle={styles.adminOutlinedText}
          />
          <Button
            text="Deploy"
            onPress={() => router.push('/deploy' as any)}
            variant="outline"
            style={styles.adminButtonOutlined}
            textStyle={styles.adminOutlinedText}
          />
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.contentCenter}>
        <View style={styles.homeHeader}>
          <Image
            source={require('../assets/images/f89c2f3e-9ef9-4bab-a13a-8eebf9d4ce7e.png')}
            style={styles.logo}
          />
          <Text style={styles.seasonText}>2025/26</Text>

          <View style={styles.userInfo}>
            <Text style={styles.roleText}>
              Logged in as: <Text style={styles.roleHighlight}>{userRole}</Text>
            </Text>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Switch Role</Text>
            </TouchableOpacity>
          </View>
        </View>

        {useStacked ? (
          <ErrorBoundary
            onError={handleStackedError}
            fallback={
              <View style={styles.fallbackNotice}>
                <Text style={styles.fallbackText}>We hit a snag loading the new home layout. Falling back to the classic layout…</Text>
              </View>
            }
          >
            {renderStackedButtons()}
          </ErrorBoundary>
        ) : (
          <>
            {renderGridTiles()}
            {userRole === 'admin' && (
              <View style={styles.adminButtons}>
                <Button
                  text="Admin Panel"
                  onPress={() => {
                    console.log('Navigating to Admin');
                    router.push('/admin' as any);
                  }}
                  variant="outline"
                  style={styles.adminButtonOutlined}
                  textStyle={styles.adminOutlinedText}
                />
                <Button
                  text="Deploy"
                  onPress={() => router.push('/deploy' as any)}
                  variant="outline"
                  style={styles.adminButtonOutlined}
                  textStyle={styles.adminOutlinedText}
                />
              </View>
            )}
          </>
        )}

        {/* Layout toggle for quick revert */}
        <View style={styles.layoutToggleContainer}>
          {useStacked ? (
            <Button
              text="Switch to Classic Home"
              variant="outline"
              onPress={() => setLayoutChoice('grid')}
              style={styles.layoutToggle}
            />
          ) : (
            <Button
              text="Try New Home (Stacked)"
              variant="outline"
              onPress={() => setLayoutChoice('stacked')}
              style={styles.layoutToggle}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const TILE_GAP = 12;
const TILE_WIDTH = (width - 40 - TILE_GAP) / 2; // 20 padding left + 20 padding right + gap

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  // Auth gating screen centering (slightly lower)
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24, // slightly lower on the screen
  },
  // Main content centering for authenticated users (slightly lower)
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24, // slight downward offset for better phone fit
    paddingBottom: 16,
    width: '100%',
  },
  homeHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
    marginBottom: -10,
  },
  seasonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7dd87d',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 20,
    opacity: 0.7,
    textShadowColor: 'rgba(125, 216, 125, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  roleText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  roleHighlight: {
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  roleButtonsContainer: {
    paddingHorizontal: 20,
    width: '100%',
  },
  roleButton: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 8px 24px rgba(0, 255, 136, 0.25)',
    elevation: 8,
  },
  roleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
  },

  // Tiles - classic
  tilesContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  tileWrapper: {
    width: TILE_WIDTH,
    marginBottom: TILE_GAP,
  },
  tile: {
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: colors.primary + '55',
    boxShadow: '0px 0px 18px rgba(0, 255, 136, 0.25)',
    elevation: 8,
  },
  tileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileText: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Stacked buttons - new layout
  stackedButtons: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  stackedButton: {
    width: '100%',
    marginVertical: 6,
  },
  adminButtonOutlined: {
    width: '100%',
    marginVertical: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    boxShadow: '0px 0px 12px rgba(0, 255, 136, 0.45)',
    elevation: 8,
  },
  adminOutlinedText: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Admin buttons area (below tiles, classic layout)
  adminButtons: {
    marginTop: 8,
    width: '100%',
  },

  // Fallback notice
  fallbackNotice: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  fallbackText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Layout toggle
  layoutToggleContainer: {
    width: '100%',
    marginTop: 8,
  },
  layoutToggle: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
