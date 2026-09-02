import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Layout } from '@/constants/theme';

export function FormScreen({ children, intro }: PropsWithChildren<{ intro: string }>) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.introWrap}>
            <View style={styles.rule} />
            <Text style={styles.intro}>{intro}</Text>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Brand.background },
  content: { width: '100%', maxWidth: Layout.maxContentWidth, alignSelf: 'center', padding: 20, paddingBottom: 48, gap: 20 },
  introWrap: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  rule: { width: 3, borderRadius: 2, backgroundColor: Brand.cyan },
  intro: { flex: 1, color: Brand.textMuted, fontSize: 14, lineHeight: 20 },
});
