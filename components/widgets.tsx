

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
const AuthCard = ({
  children,
  title,
  subTitle,
  centerTitle = false,
  showCancel = false,
}: {
  children: React.ReactNode;
  title: string;
  subTitle?: string;
  centerTitle?: boolean;
  showCancel?: boolean;
}) => {
  return (
    <CardWidget>
      
      <div className="mb-[24px]">
        <h2
          className={`text-[30px] font-semibold  ${
            centerTitle && "text-center"
          }`}
        >
          {title}
        </h2>
        {subTitle && (
          <p className="text-[#101828] font-semibold text-[14px]">{subTitle}</p>
        )}
      </div>
      {children}
    </CardWidget>
  );
};
export { CardWidget,AuthCard };
