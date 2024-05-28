"use client";
import { Button, ButtonProps, ConfigProvider, ConfigProviderProps } from "antd";
import { Ripple } from "@/components";
import { CustomButtonProps } from "@/utils/types";

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  className = "",
  tokenConfig,
  componentConfig,
  rippleProps = { color: "#1fecf9", duration: 1000 },
  onClick,
  ...rest
}) => {
  return (
    <ConfigProvider
      theme={{
        token: tokenConfig,
        components: componentConfig,
      }}
    >
      <Button
        className={`flex justify-center items-center  overflow-hidden h-fit  gap-2  ${className}`}
        //  className={`flex justify-center items-center py-2 px-[14px]  overflow-hidden  gap-2 h-[36px]  ${className}`}
        {...rest}
        onClick={onClickHandler}
      >
        {children}
        {rippleProps && !rest.loading && <Ripple {...rippleProps} />}
      </Button>
    </ConfigProvider>
  );
  function onClickHandler(event: React.MouseEvent<HTMLElement, MouseEvent>) {
    const delay = setTimeout(
      () => {
        if (onClick) onClick(event);
        clearTimeout(delay!);
      },
      rippleProps ? rippleProps.duration : 0
    );
  }
};

const RedButton: React.FC<CustomButtonProps> = ({ className, ...rest }) => {
  return (
    <CustomButton
      className={`bg-[#D92D20] ${className}`}
      type="primary"
      {...rest}
    />
  );
};
const BlueButton: React.FC<CustomButtonProps> = ({
  className = "",
  tokenConfig = {
    colorPrimary: "#103FD5",
    borderRadius: 8,
    colorText: "white",
  },
  ...rest
}) => {
  return (
    <CustomButton
      tokenConfig={tokenConfig}
      className={` ${className} `}
      type="primary"
      {...rest}
    />
  );
};

export { BlueButton, CustomButton, RedButton };
