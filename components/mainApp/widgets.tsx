import { moneySend } from "@/utils/images";
import { CustomLinkProps, ImgIcon } from "@/utils/types";
import Image from "next/image";
import { BlueButtonLink, BlueLink } from "../links";

const NoDataDisplay = ({
  icon,
  text,
  btnProps,
}: {
  icon: ImgIcon;
  text: React.ReactNode;
  btnProps: CustomLinkProps;
}) => {
  return (
    <div className="h-full flex flex-1 flex-col items-center justify-center">
      <Image src={icon.src} alt="" className="filter grayscale " />
      <p className="text-[#98A2B3] text-[16px] font-light text-center my-3">
        {text}
      </p>
      <BlueButtonLink href={btnProps.href}>{btnProps.children}</BlueButtonLink>
    </div>
  );
};

export { NoDataDisplay };
