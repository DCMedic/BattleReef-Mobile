import Ionicons from '@expo/vector-icons/Ionicons';
import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type TextInputProps, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, disabled && styles.disabled, pressed && styles.pressed]}>
      {icon ? <Ionicons color={Brand.navy} name={icon} size={18} /> : null}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Ionicons color={Brand.cyan} name={icon} size={23} />
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={Brand.textFaint}
        selectionColor={Brand.cyan}
        style={styles.input}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons color={Brand.cyan} name={icon} size={28} />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>{body}</Text>
        {action}
      </View>
    </Card>
  );
}

export function LoadingState() {
  return (
    <View accessibilityLabel="Loading BattleReef data" accessibilityRole="progressbar" style={styles.loading}>
      <ActivityIndicator color={Brand.cyan} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: Brand.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: { color: Brand.navy, fontWeight: '900', fontSize: 15 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  fieldWrap: { gap: 7 },
  label: { color: Brand.text, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 50,
    color: Brand.text,
    fontSize: 16,
    backgroundColor: Brand.surfaceRaised,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  hint: { color: Brand.textMuted, fontSize: 12, lineHeight: 17 },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 14 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: Brand.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: Brand.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: Brand.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 360, marginBottom: 6 },
  loading: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
});
