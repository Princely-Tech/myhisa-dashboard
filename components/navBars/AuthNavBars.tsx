import { p2 } from "@/utils/images";

import { DownOutlined } from "@ant-design/icons";
import { Steps } from "antd";

import Image from "next/image";

const AuthNavBar = () => {
  return (
    <nav className="flex justify-between items-start h-[60px]   pr-4 relative ">
  
        <Image src={p2} alt="Paytegrate" className="h-[30px] w-[187px]  block relative left-[-40px]" />
   
      <div className="flex justify-between items-center gap-1">
        <Image
          src="/images/country_flags/gb.svg"
          alt="paytegrate"
          width={21}
          height={15}
          className="rounded-[4px]"
        />
        <p className="text-[#08206B] text-[16px] font-medium ">EN</p>
        <DownOutlined className="text-[#08206B]" />
      </div>
    </nav>
  );
};

const KycNavBar = ({ currentIndex }: { currentIndex: number }) => {
  return (
    <Steps
      current={currentIndex}
      className="font-light  max-w-[700px] m-auto mb-5"
      items={[
        { title: "Personal Information" },
        { title: "Upload Proof of Address" },
        { title: "Upload ID" },
      ]}
    />
  );
};

export { KycNavBar, AuthNavBar };
