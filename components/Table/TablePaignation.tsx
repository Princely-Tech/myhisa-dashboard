import {
  ArrowLeftOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Dropdown, MenuProps } from "antd";
import React from "react";

const TablePaignation = () => {
  const items: MenuProps["items"] = [];
  //   for(let index = 0; index <= 20; index++){
  //     items.push({
  //         key:index,
  //         children:index.toString(),
  //     })
  //   }
  return (
    <div className="flex justify-between items-center gap-5 mt-5">
      <div className="flex items-center sm:gap-3 gap-1">
        <p className="text-[#98A2B3] font-extralight text-[12px] sm:text-[14px] ">
          Show Records
        </p>
        <Dropdown
          menu={{ items }}
          trigger={["click", "hover"]}
          className="cursor-pointer"
        >
          <div className="border border-[#EAECF0] sm:h-[28px] sm:w-[57px] rounded-lg flex gap-1 items-center px-2 py-[2px]  justify-center">
            <p className="text-[#667085] font-extralight ">20</p>
            <DownOutlined className="w-[8px] h-[4px] text-royalBlue" />
          </div>
        </Dropdown>
      </div>
      <div className="flex sm:gap-2 gap-1">
        <p className="text-[#98A2B3] font-extralight text-[12px] sm:text-[14px]">Showing 1 - 20 of 50</p>
        <LeftOutlined className="text-[#D0D5DD]" />
        <RightOutlined className="text-[#101828]" />
      </div>
    </div>
  );
};

export default TablePaignation;
