"use client";
// Split layout for the unshelled auth screens (mockup Main.dc.html): navy
// brand panel + form column. Stacks on narrow screens (brand panel first,
// condensed).
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/app/icon.png";
import routes from "@/utils/routes";
import { isSandbox } from "@/utils/environment";
import { CheckIcon } from "./ui";

const STEPS = ["Account", "Business", "Identity", "Review", "Go live"];

interface AuthSplitLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Show the 5-step onboarding bar with "Account" active. */
  showProgress?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const AuthSplitLayout = ({ title, subtitle, showProgress, children, footer }: AuthSplitLayoutProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${isSandbox ? "[SANDBOX] " : ""}${title} · MyHisa`;
  }, [title]);

  return (
    <div className="flex min-h-screen flex-wrap bg-hisa-ground font-body text-hisa-ink">
      <section
        aria-label="About MyHisa"
        className="box-border flex min-w-0 flex-[1_1_420px] flex-col justify-between gap-6 bg-hisa-navy px-[24px] py-[28px] text-white sm:gap-10 sm:px-[56px] sm:py-[48px]"
      >
        <Link href={routes.login} className="inline-flex self-start rounded-[10px] bg-white px-2 py-1 focus-visible:ring-2 focus-visible:ring-white">
          <Image src={logo} alt="MyHisa home" className="h-8 w-auto sm:h-10" priority />
        </Link>
        <div className="flex max-w-[460px] flex-col gap-5">
          <p className="m-0 font-heading text-[26px] font-extrabold leading-[1.12] tracking-[-0.02em] sm:text-[40px]">
            Airtime, data and bill payments for your business, through one API.
          </p>
          <p className="m-0 hidden text-[17px] leading-[1.55] text-[#C9D3F2] sm:block">
            Open an account in minutes. Start testing in the sandbox straight away while we review your business.
          </p>
          <ul className="m-0 mt-2 hidden list-none flex-col gap-[14px] p-0 text-[15px] text-[#E6EBFA] sm:flex">
            {[
              "MTN, Airtel, Glo and 9mobile, plus every electricity DisCo and cable TV biller",
              "Free sandbox with test numbers for every outcome",
              "Commission on every sale, paid to your wallet",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-[2px] text-[#5FC4F6]">
                  <CheckIcon size={18} />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="m-0 hidden text-[13px] text-[#9FB0E0] sm:block">
          Your progress is saved at every step. Close the tab and pick up where you left off.
        </p>
      </section>

      <main className="box-border flex min-w-0 flex-[999_1_560px] justify-center px-[16px] py-[32px] sm:px-[24px] sm:py-[48px]">
        <div className="flex w-full max-w-[480px] flex-col gap-7">
          {showProgress && (
            <nav aria-label="Onboarding progress">
              <ol className="m-0 grid list-none grid-cols-5 gap-2 p-0">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex flex-col gap-2" aria-current={i === 0 ? "step" : undefined}>
                    <span className={`block h-1 rounded-[4px] ${i === 0 ? "bg-hisa-primary" : "bg-[#D0D5DD]"}`} />
                    <span className={`text-[12px] ${i === 0 ? "font-semibold text-hisa-primary" : "text-[#5B6474]"}`}>{s}</span>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <header className="flex flex-col gap-2">
            <h1 ref={headingRef} tabIndex={-1} className="m-0 font-heading text-[26px] font-bold tracking-[-0.01em] outline-none sm:text-[28px]">
              {title}
            </h1>
            {subtitle && <p className="m-0 text-[15px] text-hisa-muted">{subtitle}</p>}
          </header>
          {children}
          {footer && <div className="flex flex-col gap-[10px] text-sm text-hisa-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
};

export default AuthSplitLayout;
