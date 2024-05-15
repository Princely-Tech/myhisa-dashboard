import { Spin } from "antd";

const Preloader = () => {
  return (
    <div className="bg-green-200 fixed  z-30 flex top-0 left-0 right-0 bottom-0 justify-center items-center ">
      <Spin />
    </div>
  );
};

export { Preloader };
