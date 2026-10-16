import React from "react";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, subtitle, actions, className = "" }: PageHeaderProps) => (
  <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
    <div className="flex min-w-0 flex-col gap-1">
      <h1 className="m-0 font-heading text-[22px] font-bold leading-tight tracking-[-0.01em] text-hisa-ink sm:text-[26px]">
        {title}
      </h1>
      {subtitle && <p className="m-0 text-sm text-hisa-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-[10px]">{actions}</div>}
  </div>
);

export default PageHeader;
