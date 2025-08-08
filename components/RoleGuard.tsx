
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { colors } from '../styles/commonStyles';
import Button from './Button';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackMessage?: string;
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  fallbackMessage,
  redirectTo = '/',
}) => {
  const { hasAccess, userRole, isAuthenticated } = useAuth();

  console.log('RoleGuard check:', { requiredRole, userRole, isAuthenticated, hasAccess: hasAccess(requiredRole) });

  if (!hasAccess(requiredRole)) {
    const message = fallbackMessage || 
      (!isAuthenticated 
        ? 'Please select your role to access this page.' 
        : `Access denied. This page requires ${requiredRole} privileges.`);

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Access Restricted</Text>
          <Text style={styles.message}>{message}</Text>
          
          {!isAuthenticated && (
            <View style={styles.buttonContainer}>
              <Button
                text="Go to Role Selection"
                onPress={() => {
                  console.log('Redirecting to role selection');
                  router.push('/');
                }}
                variant="primary"
              />
            </View>
          )}
          
          {isAuthenticated && (
            <View style={styles.buttonContainer}>
              <Button
                text="Go Back"
                onPress={() => {
                  console.log('Going back to:', redirectTo);
                  router.push(redirectTo as any);
                }}
                variant="secondary"
              />
            </View>
          )}
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
  },
});
