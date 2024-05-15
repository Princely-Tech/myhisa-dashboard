"use client";
import Image from "next/image";

import fileIcon from "@/public/images/file-icon.svg";
import checkIcon from "@/public/images/check-icon-green.svg";

import { Card } from "antd";
import { useState } from "react";
import { UploadChangeParam, UploadFile } from "antd/es/upload";
import { CustomFileUploadDragger } from "../widgets";

const FileUpload = () => {
  const [file, setFile] = useState<UploadChangeParam<UploadFile<any>>>();
  return !file ? (
    <CustomFileUploadDragger
      onChange={(input) => {
        setFile(input);
      }}
    />
  ) : (
    <Card>
      <div className="flex justify-between">
        <div className="flex gap-3">
          <Image src={fileIcon} alt="File" />
          <div>
            <p className="font-medium text-[14px] text-[#344054]">
              {file.file.name}
            </p>
            <p className="font-extralight text-[12px] text-[#667085]">
              {" "}
              File Upload Successful
            </p>
          </div>
        </div>
        <Image src={checkIcon} alt="check" width={32} height={32} />
      </div>
    </Card>
  );
};
export default FileUpload;
