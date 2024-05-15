import { Divider } from "antd";
import { CardWidget } from "../widgets";
import routes from "@/utils/routes";

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
    <CardWidget >
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


export { AuthCard };
