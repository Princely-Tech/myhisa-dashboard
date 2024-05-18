import { CustomLinkProps } from "@/utils/types";
import Link from "next/link";
import Ripple from "./ripple/ripple";
const CustomLink = ({
  href,
  children,
  className,
  rippleProps = { color: "#1fecf9", duration: 1000 },
}: CustomLinkProps) => {
  return (
        <Link
          href={href}
          className={`hover:opacity-75 relative overflow-hidden  max-h-fit ${className}`}
        >
          {children}
          {rippleProps && <Ripple {...rippleProps} />}
        </Link>
      );
};

const BlueLink = ({ className, ...rest }: CustomLinkProps) => {
  return (
    <CustomLink
      {...rest}
      className={`text-royalBlue mx-1 font-medium  ${className}`}
    />
  );
};

export { BlueLink, CustomLink };
