// "Create my funding account now" is chosen on the identity step and sent
// with POST /me/onboarding/submit (create_funding_account). Kept per user in
// localStorage until then.
const key = (userId: number | undefined) => `hisa:onboarding-funding:${userId ?? "anon"}`;

export function readFundingPreference(userId: number | undefined): boolean {
  try {
    const v = localStorage.getItem(key(userId));
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

export function writeFundingPreference(userId: number | undefined, value: boolean) {
  try {
    localStorage.setItem(key(userId), value ? "1" : "0");
  } catch {
    // storage unavailable - default applies
  }
}

/** sessionStorage key: the submit response's funding_account, shown once on the status page. */
export const FUNDING_RESULT_KEY = "hisa:onboarding-funding-result";
