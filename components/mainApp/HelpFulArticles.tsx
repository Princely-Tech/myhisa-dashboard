import React from "react";
import { WhiteButton } from "../buttons";
import Image from "next/image";
import { redirectIcon } from "@/utils/images";

const HelpFulArticles = () => {
  return (
    <div>
      <h5 className="text-[#475467] text-[16px] font-light pb-4">
        Helpful Articles
      </h5>
      <div className=" flex justify-between gap-7 border-t border-[#EAECF0] pt-3 w-full overflow-auto">
        {[1, 2, 3].map((value) => (
          <div
            key={value}
            className="bg-royalBlue rounded-2xl p-5 min-w-[300px]"
          >
            <h5 className="text-[#CFD9F7] font-light text-[12px] mb-2">
              Transfers
            </h5>
            <p className="text-[#FFFFFF] text-[16px] font-medium mb-4 text-nowrap">
              Using transfers on Paytegrate
            </p>
            <div className="w-[135px]">
              {" "}
              <WhiteButton>
                <p className="text-royalBlue font-medium text-[14px]">
                  Read Article
                </p>
                <Image src={redirectIcon} alt="Read" />
              </WhiteButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpFulArticles;
