import { plusIcon } from "@/utils/images";
import routes from "@/utils/routes";
import { CustomLinkProps } from "@/utils/types";
import Image from "next/image";
import Link, { LinkProps } from "next/link";
import { Ripple } from "@/components";
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

const BlueButtonLink = ({ children, className, ...rest }: CustomLinkProps) => {
  return (
    <CustomLink
      className={`bg-royalBlue flex  justify-center  px-3 items-center  rounded-md min-h-[30px] ${className}  `}
      {...rest}
    >
      <p className="font-light text-[14px] text-nowrap overflow-hidden text-white gap-2  items-center flex h-full">
        {children}
      </p>
    </CustomLink>
  );
};
const AddProductLink = ({ showAddIcon = true }: { showAddIcon?: boolean }) => {
  return (
    <BlueButtonLink href={routes.newProduct}>
      {showAddIcon && <Image src={plusIcon} alt="Add" />}
      <p className="font-medium text-[16px]">Add Product</p>
    </BlueButtonLink>
  );
};
export { BlueLink, BlueButtonLink, AddProductLink, CustomLink };
