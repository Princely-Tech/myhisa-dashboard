import { Spin } from "antd";
import React from "react";

const Loading = () => {
  return (
    <Spin spinning={true} fullscreen={true} size="large">
    </Spin>
  );
};

export default Loading;
