"use client";
import React from "react";
import { passwordProblem, passwordScore } from "@/utils/onboarding";

const LABELS = ["Too short", "Weak", "Okay", "Strong", "Very strong"];
const COLORS = ["#D0D5DD", "#D92D20", "#DC6803", "#079455", "#067647"];

/** Strength meter mirroring the backend rule (>= 10 chars, a letter and a digit). */
const PasswordStrength = ({ id, password }: { id: string; password: string }) => {
  const score = passwordScore(password);
  const problem = passwordProblem(password);
  const valid = !problem;
  const label = !password ? "" : valid ? LABELS[Math.max(score, 3)] : problem;
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="grid grid-cols-4 gap-[6px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="block h-1 rounded-[4px]"
            style={{ background: i < score ? COLORS[valid ? Math.max(score, 3) : score] : "#D0D5DD" }}
          />
        ))}
      </div>
      <span id={id} className="text-[13px] text-hisa-muted" aria-live="polite">
        {label ? `${label}. ` : ""}At least 10 characters, with a letter and a number.
      </span>
    </div>
  );
};

export default PasswordStrength;
