import { Tag } from "antd";
import TablePaignation from "./TablePaignation";
import Image from "next/image";
import { copyIcon } from "@/utils/images";
import { CustonTableProps } from "@/utils/types";
const tableCellPadding = "p-3";

const CustomTable = ({
  tableHeadItems,
  tableBody,
  showPaignation = true,
  className,
  thClassName,
}: CustonTableProps) => {
  return (
    <div className="w-full ">
      <div
        className={`w-full overflow-auto  border-[2px] border-[#EAECF0] rounded-md mt-6 ${className}`}
      >
        <table className="w-full overflow-auto">
          <thead>
            <tr>
              {tableHeadItems.map((item, index) => (
                <TableTh
                  key={index}
                  className={` ${tableCellPadding} ${thClassName}`}
                >
                  {item}
                </TableTh>
              ))}
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>
      {showPaignation && <TablePaignation />}
    </div>
  );
};
const TableTh = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th className={`text-[#101828] font-medium text-start ${className}`}>
    {children}
  </th>
);

const TableRow = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <tr
      className={`border-t-[2px] border-[#EAECF0] hover:bg-[#EAECF0] ${className}`}
    >
      {children}
    </tr>
  );
};

const TableData = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <td className={` text-[#475467] ${tableCellPadding} ${className}`}>
      {children}
    </td>
  );
};
const TableLinkItem = ({ children }: { children: React.ReactNode }) => {
  return (
    <TableData>
      <div className="flex gap-1 items-center  w-full">
        <Image src={copyIcon} alt="copy" />
        {children}
      </div>
    </TableData>
  );
};
const TableStatusItem = ({ status }: { status: React.ReactNode }) => {
  let textColor = "#027A48";
  let bgColor = "#ECFDF3";
  if (
    status == "Pending" ||
    status == "In Progress" ||
    status == "Disputed" ||
    status == "Early fraud warning"
  ) {
    textColor = "#B54708";
    bgColor = "#FFFAEB";
  } else if (
    status == "Failed" ||
    status == "Outstanding" ||
    status == "Cancelled"
  ) {
    textColor = "#B42318";
    bgColor = "#FEF3F2";
  }
  return (
    <TableData>
      <Tag color={bgColor}>
        <p className={`text-${textColor}`} style={{ color: textColor }}>
          {" "}
          {status}
        </p>
      </Tag>
    </TableData>
  );
};

export {
  TableRow,
  TableData,
  CustomTable,
  TableStatusItem,
  TableLinkItem,
  TableTh,
};
