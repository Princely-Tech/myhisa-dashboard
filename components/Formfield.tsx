"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { Form } from "antd";
import type { FormProps } from "antd/lib/form";
import { Store } from "antd/es/form/interface";

const FormField = ({
  children,
  scrollToFirstError = true,
  autoComplete = "off",
  ...rest
}: FormProps & { children?: ReactNode }) => {
 
  return (
    <Form
      scrollToFirstError={scrollToFirstError}
      autoComplete={autoComplete}
      {...rest}
    >
      {children}
    </Form>
  );
};

export default FormField;
