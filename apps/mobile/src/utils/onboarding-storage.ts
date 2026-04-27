import * as SecureStore from 'expo-secure-store';

const ONBOARDING_DONE_KEY = 'isOnboardingDone';

export async function getIsOnboardingDone() {
  return (await SecureStore.getItemAsync(ONBOARDING_DONE_KEY)) === 'true';
}

export async function setIsOnboardingDone(isDone: boolean) {
  await SecureStore.setItemAsync(ONBOARDING_DONE_KEY, String(isDone));
}
