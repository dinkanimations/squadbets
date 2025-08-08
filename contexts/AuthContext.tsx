
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'admin' | 'player' | null;

interface AuthContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  logout: () => void;
  hasAccess: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<UserRole>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  console.log('AuthProvider initialized with role:', userRole);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const storedRole = await AsyncStorage.getItem('userRole');
      console.log('Loaded user role from storage:', storedRole);
      
      if (storedRole === 'admin' || storedRole === 'player') {
        setUserRoleState(storedRole);
        setIsAuthenticated(true);
      } else {
        setUserRoleState(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRoleState(null);
      setIsAuthenticated(false);
    }
  };

  const setUserRole = async (role: UserRole) => {
    try {
      console.log('Setting user role to:', role);
      
      if (role) {
        await AsyncStorage.setItem('userRole', role);
        setUserRoleState(role);
        setIsAuthenticated(true);
      } else {
        await AsyncStorage.removeItem('userRole');
        setUserRoleState(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error saving user role:', error);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user');
      await AsyncStorage.removeItem('userRole');
      setUserRoleState(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const hasAccess = (requiredRole: UserRole): boolean => {
    if (!requiredRole) return true; // Public access
    if (!isAuthenticated || !userRole) return false;
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Player can only access player-specific content
    if (userRole === 'player' && requiredRole === 'player') return true;
    
    return false;
  };

  const value: AuthContextType = {
    userRole,
    setUserRole,
    isAuthenticated,
    logout,
    hasAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
