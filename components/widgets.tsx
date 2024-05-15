const CardWidget = ({
  children,
  className = "sm:w-[555px] w-[90%]",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`m-auto  max-w-[555px] shadow-xl shadow-[#2F477B]/10 pt-[32px] sm:px-[64px] px-[30px] pb-[76px]  relative  bg-white rounded-md border border-gray-50   ${className}`}
    >
      {children}
    </div>
  );
};

export { CardWidget };
