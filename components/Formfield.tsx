"use client";
import React, { ReactNode } from "react";
import { Form } from "antd";
import type { FormProps } from "antd/lib/form";

const FormField = ({
  children,
  scrollToFirstError = true,
  autoComplete = "off",
  initialValues = { remember: false },
  ...rest
}: FormProps & { children?: ReactNode }) => {
  return (
    <Form
      scrollToFirstError={scrollToFirstError}
      autoComplete={autoComplete}
      initialValues={initialValues}
      {...rest}
    >
      {children}
    </Form>
  );
};

export default FormField;
