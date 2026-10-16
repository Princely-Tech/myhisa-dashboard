// Shared Tailwind class strings for the redesign. Bootstrap 4 is also loaded
// globally, so avoid Tailwind utilities whose names collide with Bootstrap's
// (`border`, `rounded`, p/m-3..5, `table`, `container`, `card`): use
// arbitrary values (`border-[1px]`, `p-[20px]`) instead.
//
// css/typography.css forces `outline: none !important` on a/button/input, so
// focus is shown with a ring (box-shadow) rather than an outline.
export const focusRing =
  "focus-visible:ring-2 focus-visible:ring-hisa-primary focus-visible:ring-offset-2";

export const btnPrimary = `inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border-0 bg-hisa-primary px-[16px] text-sm font-semibold text-white no-underline transition-colors hover:bg-hisa-primary-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const btnSecondary = `inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border-[1px] border-solid border-[#D0D5DD] bg-white px-[12px] text-sm text-hisa-body no-underline transition-colors hover:bg-[#F9FAFB] hover:text-hisa-ink disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const btnDanger = `inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border-[1px] border-solid border-[#FDA29B] bg-white px-[12px] text-sm font-semibold text-[#B42318] no-underline transition-colors hover:bg-[#FEF3F2] hover:text-[#912018] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const textLink = `font-semibold text-hisa-primary no-underline hover:text-hisa-primary-hover hover:underline rounded-[2px] ${focusRing}`;
