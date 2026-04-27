import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { setIsOnboardingDone } from '@/utils/onboarding-storage';

export default function OnboardingScreen() {
  const [isSaving, setIsSaving] = useState(false);

  const goToDashboard = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    await setIsOnboardingDone(true);
    router.replace('/dashboard');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
      <Text style={styles.eyebrow}>Klar Kasse</Text>
      <Text style={styles.title}>Keep receipts and spending in one place.</Text>
      <Text style={styles.body}>Scan receipts, review activity, and stay close to your budget from the dashboard.</Text>
      <Pressable accessibilityRole="button" disabled={isSaving} style={[styles.button, isSaving && styles.disabled]} onPress={goToDashboard}>
        <Text style={styles.buttonText}>Go to dashboard</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 10,
    color: '#111827',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  body: {
    marginTop: 14,
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 28,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
