"use client";
// /onboarding: sends the partner to the right place for their status.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import { firstIncompleteStep } from "@/utils/onboarding";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { Spinner } from "@/components/onboarding/ui";

export default function OnboardingIndex() {
  const { view } = useOnboarding();
  const router = useRouter();

  useEffect(() => {
    if (!view) return;
    switch (view.status) {
      case "profile_incomplete":
        router.replace(firstIncompleteStep(view));
        break;
      case "email_unverified":
        router.replace(routes.verifyEmail);
        break;
      case "approved":
      case "suspended":
        router.replace(routes.dashboard);
        break;
      default:
        // submitted, in_review, queried (fixed from the status page), rejected
        router.replace(routes.onboardingStatus);
    }
  }, [view, router]);

  return (
    <div className="flex justify-center p-[48px]">
      <Spinner label="Opening your application…" />
    </div>
  );
}
