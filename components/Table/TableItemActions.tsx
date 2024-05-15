"use client";
import { horThreeDots } from "@/utils/images";
import { Popconfirm, Popover } from "antd";
import Image from "next/image";
import { CustomButton } from "../buttons";
import { TableData } from "./CustomTable";
interface TableAction {
  body: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}
const TableItemActions = ({
  actions,
  deletePopUpHeader,
}: {
  actions: TableAction[];
  deletePopUpHeader?: string;
}) => {
  // const actions: TableAction[] = ;
  const popContent = (
    <div className="flex flex-col gap-4 w-[200px]  items-start">
      {actions.map((action, index) => {
        if (action.body == "Delete")
          return (
            <Popconfirm
              key={index}
              icon={null}
              title={
                <h2 className="text-[#000000] font-medium text-[24px]">
                  {deletePopUpHeader}
                </h2>
              }
              description={
                <p className="text-[#000000] font-light text-[16px] ">
                  Are you sure you want to delete? <br /> You will be unable to
                  restore once deleted{" "}
                </p>
              }
              onConfirm={deleteHandler}
              okText={<p className="p-1 text-white">Delete</p>}
              cancelText={<p className="p-1 ">Cancel</p>}
              okButtonProps={{
                className: " bg-[#D92D20] h-fit w-fit",
              }}
              cancelButtonProps={{
                className: "h-fit w-fit",
              }}
              okType="text"
            >
              <button className="text-[#D92D20] text-[14px] font-extralight ">
                {action.body}
              </button>
            </Popconfirm>
          );
        return (
          <button
            key={index}
            className="text-[#101828] text-[14px] font-extralight "
            onClick={action.onClick}
          >
            {action.body}
          </button>
        );
      })}
    </div>
  );
  return (
    <TableData>
      <Popover
        trigger="hover"
        content={popContent}
        className="  w-[50px] flex justify-center items-center  h-[20px]"
      >
        <button>
          <Image src={horThreeDots} alt="Action" />
        </button>
      </Popover>
    </TableData>
  );

  function deleteHandler() {}
};
export default TableItemActions;
