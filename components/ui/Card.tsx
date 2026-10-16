"use client";
import React, { useId } from "react";

interface CardProps {
  title?: React.ReactNode;
  /** Right side of the header row (e.g. a "View all" link). */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Remove body padding (for edge-to-edge tables). */
  flush?: boolean;
  /** Accessible name when there is no visible title. */
  ariaLabel?: string;
}

const Card = ({ title, actions, children, className = "", flush = false, ariaLabel }: CardProps) => {
  const headingId = useId();
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      aria-label={!title ? ariaLabel : undefined}
      className={`flex min-w-0 flex-col gap-3 rounded-2xl border-[1px] border-solid border-hisa-border bg-white ${
        flush ? "pb-2 pt-[20px]" : "p-[20px]"
      } ${className}`}
    >
      {(title || actions) && (
        <div className={`flex items-center justify-between gap-3 ${flush ? "px-[20px]" : ""}`}>
          {title && (
            <h2 id={headingId} className="m-0 font-heading text-[17px] font-bold text-hisa-ink">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
};

export default Card;
