"use client";
import { DownOutlined, MailOutlined, SearchOutlined } from "@ant-design/icons";

import {
  DatePicker,
  DropDownProps,
  Form,
  Input,
  InputProps,
  Select,
  SelectProps,
  FormItemProps,
  Tooltip,
  Dropdown,
  Checkbox,
  UploadProps,
  ConfigProvider,
  DatePickerProps,
  TimeRangePickerProps,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import constants from "@/utils/constants";

interface InputFieldProps extends InputProps {
  footerText?: string;
  selectProps?: SelectProps<any>;
  datePickerProps?: DatePickerProps;
  formItemProps?: FormItemProps;
  showTitle?: boolean;
  dropDownProps?: DropDownProps;
  uploadProps?: UploadProps;
  className?: string;
  titleClassName?: string;
  inputClassName?: string;
  dateRangePickerProps?: TimeRangePickerProps;
}
const InputField: React.FC<InputFieldProps> = ({
  placeholder,
  uploadProps,
  datePickerProps,
  dateRangePickerProps,
  title,
  titleClassName = "",
  footerText,
  type,
  selectProps,
  formItemProps,
  showTitle = true,
  prefix,
  suffix,
  inputClassName = "h-full px-[14px] py-[10px] w-full",
  className = "",
  required = false,
  ...rest
}) => {
  const { colorInputText, colorTextPlaceholder } = constants.antdGlobalConfig;
  return (
    <div className={`w-full ${className}`}>
      {(placeholder || title) && showTitle && (
        <h2
          className={`text-[#344054] font-medium mb-1 text-[14px] ${titleClassName}`}
        >
          {title ?? placeholder}
        </h2>
      )}
      <ConfigProvider
        theme={{
          components: {
            Input: {
              colorText: colorInputText,
              colorTextPlaceholder: colorTextPlaceholder,
            },
          },
        }}
      >
        <InputFieldChild />
      </ConfigProvider>

      {footerText && (
        <p className="text-[#667085] font-extralight text-[12px] pt-1">
          {footerText}
        </p>
      )}
    </div>
  );
  function InputFieldChild() {
    if (type == "textArea") {
      return <TextArea placeholder={placeholder} rows={5} />;
    }
    if (type == "select") {
      return (
        <Select
          style={{ width: "100%" }}
          placeholder={placeholder}
          {...selectProps}
        />
      );
    }
    // if (type == "fileUpload") {
    //   return <CustomFileUploadDragger {...uploadProps} />;
    // }

    if (type == "tel")
      return (
        <Form.Item label="" {...formItemProps}>
          <PhoneInput
            defaultCountry="NG"
            placeholder="Enter phone number"
            onChange={(input) => {}}
            disabled={rest.disabled}
            international
            limitMaxLength
            className={`input-phone-number border px-[14px] py-[10px] rounded-md focus-within:border-blue-500 hover:border-blue-500 ${
              rest.status == "error" &&
              "focus-within:border-red-500 border-red-500 hover:border-red-500"
            }`}
          />
        </Form.Item>
      );
    if (type == "date")
      return (
        <Form.Item label="" {...formItemProps}>
          {" "}
          <DatePicker
            className="w-full"
            placeholder={placeholder ?? "DD/MM/YYYY"}
            required={required}
            {...datePickerProps}
          />
        </Form.Item>
      );
    if (type == "date-range")
      return (
        <Form.Item label="" {...formItemProps}>
          <DatePicker.RangePicker
            className={`${inputClassName}`}
            // placeholder={placeholder ?? "DD/MM/YYYY"}
            required={required}
            {...dateRangePickerProps}
          />
        </Form.Item>
      );

    if (type == "password")
      return (
        <Form.Item label="" {...formItemProps}>
          <Input.Password
            className="h-full  px-[14px] py-[10px]"
            placeholder={placeholder}
            prefix={prefix}
            suffix={suffix}
            required={required}
            {...rest}
          />
        </Form.Item>
      );
    if (type == "dropdown")
      return (
        <Form.Item label="" {...formItemProps}>
          <Dropdown {...rest.dropDownProps}>
            <Input
              placeholder={placeholder}
              prefix={prefix}
              type={type}
              suffix={
                <DownOutlined className="w-[10px] h-[5px] text-[#667085]" />
              }
              {...rest}
            />
          </Dropdown>
        </Form.Item>
      );
    if (type == "email") {
      prefix = <MailOutlined className="text-[#667085] mr-[8px] " />;
    }

    if (type == "search") {
      suffix = <SearchOutlined className="text-[#000000]" />;
    }

    return (
      <Form.Item label="" {...formItemProps}>
        <Input
          placeholder={placeholder}
          prefix={prefix}
          suffix={suffix}
          className={`${inputClassName}`}
          required={required}
          type={type}
          {...rest}
        />
      </Form.Item>
    );
  }
};

export default InputField;

export const CustomCheckbox = ({ children }: { children: React.ReactNode }) => {
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const childrenArray = React.Children.toArray(children);

  const addChildClass = (child: React.ReactElement<any>) => {
    return React.cloneElement(child, {
      className: `${child.props.className}  hover:text-royalBlue`,
    });
  };

  return (
    <div
      className="flex gap-3 items-start cursor-pointer"
      onClick={() => setIsChecked((prevValue) => !prevValue)}
    >
      <Checkbox checked={isChecked}>{children}</Checkbox>

      {/* <div>
        {" "}
        {childrenArray.map((child, index) => (
          <div key={index}>
            {typeof child === "string" || typeof child === "number"
              ? child
              : addChildClass(child as React.ReactElement)}
          </div>
        ))}
      </div> */}
    </div>
  );
};
