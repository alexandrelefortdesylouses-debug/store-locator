// Tracks whether the first-run guided tour (OnboardingTour.jsx) has already
// been shown on this device — per-device localStorage, same model as the
// rest of the app. Shown once automatically after login when unset;
// re-openable any time from Paramètres > Aide & FAQ without clearing this
// flag (App.jsx just opens the tour directly in that case).
const ONBOARDING_SEEN_KEY = "storeLocator_onboarding_seen";

export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingSeen() {
  localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
}
