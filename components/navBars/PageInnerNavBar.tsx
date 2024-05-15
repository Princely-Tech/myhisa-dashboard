"use client";
import React from "react";
import InputField from "../inputs";
import { BlueButton, CustomButton } from "../buttons";
import { cancelIcon, downloadIcon, moneySend, prefIcon } from "@/utils/images";
import Image from "next/image";
import { Divider } from "antd";
import { FormSubmitNavBarProps, ImgIcon } from "@/utils/types";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";

const PageInnerNavBar = ({
  children,
  searchBarPlaceholder,
  showPrefIconButton = true,
}: {
  children: React.ReactNode;
  searchBarPlaceholder?: string;
  showPrefIconButton?: boolean;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between  gap-5 ">
      <div className="flex justify-between items-center gap-3">
        {" "}
        <InputField
          type="search"
          placeholder={searchBarPlaceholder}
          showTitle={false}
        />
        {showPrefIconButton && (
          <CustomButton type="default">
            <Image src={prefIcon} alt="setting" />
          </CustomButton>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between  gap-3">
        {children}
      </div>
    </div>
  );
};
export default PageInnerNavBar;
export function FormSubmitNavBar({
  title,
  rightHandPreffix,
  submitButtonProps = {},
  cancelButtonProp = {},
}: FormSubmitNavBarProps) {
  const router = useRouter();
  const { buttonText, buttonImg } = submitButtonProps;
  const {
    onClick = () => {
      router.back();
    },
    children,
    ...rest
  } = cancelButtonProp;
  return (
    <div className=" py-5 px-3 border-b mb-5">
      <div className="flex justify-between items-center ">
        <CustomButton type="text" onClick={onClick} {...rest}>
          <div className="flex justify-between items-center gap-2">
            <Image src={cancelIcon} alt="Cancel" className="w-[12px] h-auto" />
            <p className="text-[#101828]  text-[20px] font-medium">{title}</p>
          </div>
        </CustomButton>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {rightHandPreffix}
          {buttonText && (
            <BlueButton htmlType="submit" {...submitButtonProps}>
              {buttonImg && (
                <Image
                  src={buttonImg!.src}
                  alt={buttonImg!.alt}
                  className="filter grayscale brightness-0 invert h-[24px] w-auto"
                />
              )}
              <p className="text-[16px] font-medium"> {buttonText} </p>
            </BlueButton>
          )}
        </div>
      </div>
    </div>
  );
}
