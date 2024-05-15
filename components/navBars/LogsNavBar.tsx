import React from "react";
import InputField from "../inputs";
import { CheckOutlined } from "@ant-design/icons";
import { CustomButton } from "../buttons";

const LogsNavBar = () => {
  const list = [
    {
      name: "Date",
      active: true,
    },
    {
      name: "Status",
      active: false,
    },
    {
      name: "Succeeded",
      active: false,
    },
    {
      name: "Failed",
      active: false,
    },
    {
      name: "API Endpoint",
      active: true,
    },
  ];
  return (
    <div className="flex gap-2 overflow-auto">
      {" "}
      <InputField
   
        type="search"
        placeholder="Search Resource ID"
        showTitle={false}
        className="h-[44px] min-w-[100px]"
      />
      <div className="flex gap-2">
        {list.map((item) => (
          <CustomButton
            key={item.name}
            className={`h-[44px] ${
              item.active
                ? "text-[#004000] bg-[#A7FAD7]"
                : "bg-[#F2F4F7] text-[#475467]"
            }`}
          >
            {item.active && <CheckOutlined />} {item.name}
          </CustomButton>
        ))}
      </div>
    </div>
  );
};

export default LogsNavBar;
