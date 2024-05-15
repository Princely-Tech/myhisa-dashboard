import { arrowDownRed, arrowUpGreen } from "@/utils/images";
import Image from "next/image";

type StatisticsRowProps = {
  list: {
    title: string;
    value: string;
    footer?: string;
    increased?: boolean;
  }[];
};
const StatisticsRow = ({ list }: StatisticsRowProps) => {
  return (
    <div className="flex gap-3 overflow-auto">
      {list.map((item, index) => (
        <div
          key={index}
          className="bg-[#CFD9F7] flex-1 p-[20px]  pr-[60px] rounded-lg flex flex-col gap-2 "
        >
          <h3 className="text-[#667085] text-nowrap"> {item.title} </h3>
          <h1 className="font-medium text-[30px] text-nowrap">
            {" "}
            {item.value}{" "}
          </h1>
          {item.footer && (
            <div className="flex gap-2">
              {item.increased != undefined && (
                <Image
                  src={item.increased ? arrowUpGreen : arrowDownRed}
                  alt={item.increased ? "Increased" : "Decreased"}
                />
              )}
              <p className="text-[12px] text-nowrap">{item.footer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatisticsRow;
