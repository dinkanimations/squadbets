
import { View, StyleSheet, StyleProp, ViewStyle, TextStyle, StyleSheet as RNStyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: StyleProp<ViewStyle | TextStyle>;
  color?: string;
}

export default function Icon({ name, size = 40, style, color }: IconProps) {
  const flat = RNStyleSheet.flatten(style as any) || {};
  const iconColor = color || (flat as any)?.color || 'white';

  return (
    <View style={[styles.iconContainer, style]}>
      <Ionicons name={name} size={size} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
