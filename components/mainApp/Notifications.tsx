import React from "react";
import { CustomButton } from "../buttons";
import { ImgIcon, NotificationType } from "@/utils/types";
import Image from "next/image";
import {
  alertBlue,
  alertRed,
  checkIconGreenHollow,
  reciept2,
  recieveGreen,
  swappedIcon,
  transferRed,
} from "@/utils/images";

const Notifications = () => {
  return (
    <div>
      <div className="flex justify-between mb-4 items-center">
        <h3 className="text-[#000000] font-medium text-[16px]">
          Notifications
        </h3>
        <CustomButton type="default">Mark all as read</CustomButton>
      </div>

      <div>
        <NotificationCard type={NotificationType.Sent} isRead={false}>
          $40.00 to <span className="text-royalBlue">Ayomide Olumide</span>
        </NotificationCard>
        <NotificationCard type={NotificationType.Recieved} isRead={false}>
          $40.00 to <span className="text-royalBlue">Ayomide Olumide</span>
        </NotificationCard>
        <NotificationCard type={NotificationType.Successful} isRead={true}>
          This account was a success
        </NotificationCard>{" "}
        <NotificationCard type={NotificationType.Error} isRead={true}>
          This account was not executed
        </NotificationCard>{" "}
        <NotificationCard type={NotificationType.Update} isRead={true}>
          This account requires an update
        </NotificationCard>{" "}
        <NotificationCard type={NotificationType.Swapped} isRead={true}>
          $40.00 Dollars for N40,000 Naira
        </NotificationCard>{" "}
      </div>
    </div>
  );
};

export default Notifications;
const NotificationCard = ({
  type,
  children,
  isRead,
}: {
  type: NotificationType;
  children: React.ReactNode;
  isRead: boolean;
}) => {
  const { title, img } = setProp();

  return (
    <div
      className={`flex gap-5 justify-between  px-2 py-3 border-t bprder-b border-[#667085] ${
        !isRead && "bg-[#E7ECFB]"
      }`}
    >
      <div className="flex gap-3">
        <Image src={img} alt={title} className="h-[28px] w-[28px] "/>
        <div>
          <h3 className="text-[#000000] font-medium text-[16px] ">{title} </h3>
          <p className="text-[#344054] font-medium text-[14px]"> {children}</p>
        </div>
      </div>
      <p className="text-[#667085] font-light text-[14px]">10 min ago</p>
    </div>
  );
  function setProp() {
    switch (type) {
      case NotificationType.Recieved:
        return {
          title: "Received",
          img: recieveGreen,
        };
      case NotificationType.Successful:
        return {
          title: "Successful",
          img: checkIconGreenHollow,
        };
      case NotificationType.Error:
        return {
          title: "Error",
          img: alertRed,
        };
      case NotificationType.Update:
        return {
          title: "Update",
          img: alertBlue,
        };
      case NotificationType.Swapped:
        return {
          title: "Swapped",
          img: swappedIcon,
        };
      default:
        return {
          title: "Sent",
          img: transferRed,
        };
    }
  }
};
