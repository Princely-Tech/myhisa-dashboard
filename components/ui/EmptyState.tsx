import React from "react";

interface EmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState = ({ title, description, action, icon, className = "" }: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center gap-2 px-[20px] py-8 text-center ${className}`}>
    {icon && (
      <div aria-hidden="true" className="text-2xl text-hisa-muted">
        {icon}
      </div>
    )}
    <p className="m-0 font-heading text-[15px] font-semibold text-hisa-ink">{title}</p>
    {description && <p className="m-0 max-w-[420px] text-sm text-hisa-muted">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
