"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/app/icon.png";
import routes from "@/utils/routes";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { User } from "@/utils/types";
import { BlueLink } from "@/components";
import { isSandbox } from "@/utils/environment";

const postmanUrl =
  "https://documenter.getpostman.com/view/14135488/2sA3dyiWfZ#d06c4c58-6793-4ee2-8697-8b9d67b0f2b1";

type Resource = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  meta: string;
};

const resources: Resource[] = [
  {
    title: "Postman Collection",
    description:
      "Every endpoint pre-configured and ready to run, straight from your browser.",
    href: postmanUrl,
    external: true,
    meta: "Postman",
  },
  {
    title: "MyHisa API Documentation",
    description:
      "The full partner API reference - airtime, data, endpoints, auth and error codes.",
    href: "/docs/myhisa-api-documentation.pdf",
    meta: "PDF",
  },
  {
    title: "Service Availability API",
    description:
      "Check network/service uptime programmatically before you route a transaction.",
    href: "/docs/service-availability-api.pdf",
    meta: "PDF",
  },
  {
    title: "Bulk Airtime API - Integration Guide",
    description:
      "Batch-credit airtime across many recipients in a single integration.",
    href: "/docs/bulk-airtime-api-integration-guide.pdf",
    meta: "PDF",
  },
];

const registrationChecklist = [
  "Business name and RC (CAC) number",
  "Contact person's name, designation, phone and email",
  "BVN and NIN",
  "Partner type - Bank or Non-Bank",
  // SANDBOX: KYC documents are optional in the sandbox.
  isSandbox
    ? "CAC Certificate (optional in the sandbox)"
    : "CAC Certificate (PDF, JPG or PNG, max 5MB)",
  isSandbox
    ? "Utility Bill (optional in the sandbox)"
    : "Utility Bill (required for non-bank partners)",
];

const gettingStartedSteps = [
  {
    title: "Create your account",
    body: "Register with your business and contact details below.",
  },
  {
    title: "Get approved",
    // SANDBOX: sandbox accounts are auto-approved on email verification.
    body: isSandbox
      ? "Automatic in the sandbox once your email is verified."
      : "Our team reviews new registrations, usually within 24 hours.",
  },
  {
    title: "Verify your email",
    body: "Confirm the OTP we send you to activate your account.",
  },
  {
    title: "Integrate",
    body: "Use your API key with the guides below to start sending requests.",
  },
];

const ResourceCard = ({ resource }: { resource: Resource }) => (
  <a
    href={resource.href}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-royalBlue hover:shadow-md"
  >
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-eigengrau">
          {resource.title}
        </h3>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
          {resource.meta}
        </span>
      </div>
      <p className="mt-2 text-[13px] text-slateGray">{resource.description}</p>
    </div>
    <span className="mt-4 inline-flex items-center text-[13px] font-semibold text-royalBlue">
      {resource.external ? "Open collection" : "View / Download"}
      <span className="ml-1 transition group-hover:translate-x-0.5">
        &rarr;
      </span>
    </span>
  </a>
);

const DocumentationBody = () => (
  <div className="mx-auto w-full max-w-4xl">
    <div className="mb-10">
      <h1 className="text-[28px] font-semibold text-eigengrau">
        Getting Started
      </h1>
      <p className="mt-2 text-[14px] text-slateGray">
        Everything you need to onboard as a MyHisa partner and integrate the
        API.
      </p>
    </div>

    {/* SANDBOX: sandbox base URL + test values (sandbox builds only). */}
    {isSandbox && (
      <div className="mb-10 rounded-lg border border-amber-300 bg-amber-50 p-6">
        <h2 className="text-[16px] font-semibold text-eigengrau">
          Sandbox environment
        </h2>
        <p className="mt-2 text-[13px] text-steelBlue">
          Point your integration at the sandbox base URL below. Everything
          works like live, but no real airtime, bills or money move. Use your
          sandbox API key (sent when you register here), not your live one.
        </p>
        <p className="mt-3 text-[13px] text-steelBlue">
          Base URL:{" "}
          <code className="break-all rounded bg-white px-2 py-1 text-[13px]">
            {apiEndpoints.base || "(NEXT_PUBLIC_API_URL not set)"}
          </code>
        </p>
        <Link
          href={routes.sandboxTestValues}
          className="mt-3 inline-block text-[13px] font-semibold text-royalBlue"
        >
          Test values (outcome table, test BVN/NIN, funding) &rarr;
        </Link>
      </div>
    )}

    <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {gettingStartedSteps.map((step, i) => (
        <div
          key={step.title}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-royalBlue text-[13px] font-semibold text-white">
            {i + 1}
          </span>
          <h3 className="mt-3 text-[14px] font-semibold text-eigengrau">
            {step.title}
          </h3>
          <p className="mt-1 text-[13px] text-slateGray">{step.body}</p>
        </div>
      ))}
    </div>

    <div className="mb-10 rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-[16px] font-semibold text-eigengrau">
        What you&apos;ll need to register
      </h2>
      <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {registrationChecklist.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-[13px] text-steelBlue"
          >
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h2 className="mb-4 text-[16px] font-semibold text-eigengrau">
        API &amp; Integration Docs
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {resources.map((resource) => (
          <ResourceCard key={resource.title} resource={resource} />
        ))}
      </div>
    </div>
  </div>
);

const Documentation: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const userGet = localStorage.getItem(apiEndpoints.userSetUrl);
    if (userGet) {
      try {
        setUser(JSON.parse(userGet) as User);
      } catch {
        setUser(null);
      }
    }
    setChecked(true);
  }, []);

  // Avoid a flash of the standalone (logged-out) chrome for signed-in users
  // while the localStorage check above resolves.
  if (!checked) {
    return <div className="min-h-screen bg-white" />;
  }

  if (user) {
    return (
      <main className="flex-1 border px-4 pt-2 pb-10 flex flex-col min-h-screen overflow-auto">
        <header className="text-[30px] font-medium mt-[10px] mb-[20px]">
          Documentation
        </header>
        <DocumentationBody />
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-screen bg-teal-700">
      <div className="flex items-center justify-between px-6 pt-5 sm:px-10">
        <Link href={routes.login}>
          <Image src={logo} alt="myHisa" />
        </Link>
        <BlueLink
          href={routes.login}
          className="!mx-0 !text-white hover:!opacity-90"
        >
          &larr; Back to login
        </BlueLink>
      </div>
      <div className="flex-1 px-4 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-4xl rounded-xl bg-white/0 p-0">
          <div className="rounded-xl bg-[#F7F9FC] p-5 sm:p-10">
            <DocumentationBody />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
