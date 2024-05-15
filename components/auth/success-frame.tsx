"use client";
import Image from "next/image";
import { AuthCard } from "./widgets";
import { BlueButton } from "../buttons";
import { CustomButtonProps } from "@/utils/types";

const AuthSuccessFrame = ({
  title,
  bodyText,
  buttonProps,
}: {
  title: string;
  bodyText: string;
  buttonProps: CustomButtonProps;
}) => {
  return (
    <AuthCard title={title} centerTitle={true}>
      <div>
        <Image
          src="/images/check-icon-green.svg"
          width={101}
          height={101}
          alt="success"
          className="m-auto my-4"
        />
        <p className="my-4 text-[#101828] font-medium  text-center ">
          {bodyText}
        </p>
        <BlueButton block {...buttonProps} />
      </div>
    </AuthCard>
  );
};
export default AuthSuccessFrame;
