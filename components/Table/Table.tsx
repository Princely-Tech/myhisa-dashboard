import { copyIcon, horThreeDots } from "@/utils/images";
import { Table, Tag } from "antd";
import { TableProps } from "antd/es/table";
import Image from "next/image";
import { TableData } from "./CustomTable";

interface TableComponentProps extends TableProps {
  showPaignation?: boolean;
}

const TableComponent: React.FC<TableComponentProps> = ({
  showPaignation = true,
  pagination,
  ...rest
}) => {
  if (!showPaignation) {
    pagination = false;
  }
  return (
    <div className=" w-full overflow-auto ">
      <Table pagination={pagination} {...rest} />
    </div>
  );
};

export default TableComponent;
export const TableItem = ({
  item,
  classNames = "",
}: {
  item: any;
  classNames?: string;
}) => {
  return <p className={`text-[#475467]  ${classNames}`}>{item}</p>;
};
export const TableItemLink = ({ item }: { item: any }) => {
  return (
    <div className="flex gap-1 items-center">
      <Image src={copyIcon} alt="copy" />
      {<TableItem item={item} />}
    </div>
  );
};

export const TableItemStatus = ({ status }: { status: string }) => {
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
  } else if (status == "Failed" || status == "Outstanding") {
    textColor = "#B42318";
    bgColor = "#FEF3F2";
  }
  return (
    <TableData>
      {" "}
      <Tag color={bgColor} key={status}>
        <p className={`text-${textColor}`} style={{ color: textColor }}>
          {" "}
          {status}
        </p>
      </Tag>
    </TableData>
  );
};