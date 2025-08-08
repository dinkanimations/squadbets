
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../styles/commonStyles';
import Icon from '../components/Icon';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function RoleSelectionScreen() {
  const { setUserRole } = useAuth();

  console.log('RoleSelectionScreen rendered');

  const selectRole = async (role: 'admin' | 'player') => {
    console.log('Role selected:', role);
    await setUserRole(role);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/images/f89c2f3e-9ef9-4bab-a13a-8eebf9d4ce7e.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Choose how you want to access the app</Text>
      </View>

      <View style={styles.rolesContainer}>
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => selectRole('player')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.card, colors.surface]}
            style={styles.roleCardGradient}
          >
            <View style={styles.roleIconContainer}>
              <Icon name="person-outline" size={24} style={{ color: colors.primary }} />
            </View>
            <Text style={styles.roleTitle}>Player</Text>
            <Text style={styles.roleDescription}>
              Submit weekly picks, view stats, and track your performance
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={styles.featureText}>• Submit weekly picks</Text>
              <Text style={styles.featureText}>• View leaderboards</Text>
              <Text style={styles.featureText}>• Track personal stats</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => selectRole('admin')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.card, colors.surface]}
            style={styles.roleCardGradient}
          >
            <View style={styles.roleIconContainer}>
              <Icon name="settings-outline" size={24} style={{ color: colors.warning }} />
            </View>
            <Text style={styles.roleTitle}>Administrator</Text>
            <Text style={styles.roleDescription}>
              Manage odds, results, and season settings
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={styles.featureText}>• Set odds and results</Text>
              <Text style={styles.featureText}>• Manage season settings</Text>
              <Text style={styles.featureText}>• Full app access</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You can change your role anytime from the settings
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: Math.max(20, screenHeight * 0.05),
  },
  logo: {
    width: Math.min(160, screenWidth * 0.4),
    height: Math.min(160, screenWidth * 0.4),
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  rolesContainer: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  roleCard: {
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0px 6px 18px rgba(0, 0, 0, 0.3)',
    elevation: 6,
  },
  roleCardGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    minHeight: Math.min(180, screenHeight * 0.22),
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  roleFeatures: {
    alignItems: 'flex-start',
    width: '100%',
  },
  featureText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
    lineHeight: 16,
  },
  footer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
