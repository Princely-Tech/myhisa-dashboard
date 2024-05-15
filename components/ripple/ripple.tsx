"use client";
import React, { useState, useLayoutEffect } from "react";
import { RippleContainer } from "./style";
import PropTypes from "prop-types";
import { RippleProps } from "@/utils/types";

const useDebouncedRippleCleanUp = (
  rippleCount: number,
  duration: number,
  cleanUpFunction: () => void
) => {
  useLayoutEffect(() => {
    let bounce: ReturnType<typeof setTimeout> | null = null;
    if (rippleCount > 0) {
      clearTimeout(bounce!);
      bounce = setTimeout(() => {
        cleanUpFunction();
        clearTimeout(bounce!);
      }, duration * 4);
    }

    return () => clearTimeout(bounce!);
  }, [rippleCount, duration, cleanUpFunction]);
};

const Ripple = (props: RippleProps) => {
  const { duration, color } = props;
  const [rippleArray, setRippleArray] = useState<
    { x: number; y: number; size: any }[]
  >([]);

  useDebouncedRippleCleanUp(rippleArray.length, duration, () => {
    setRippleArray([]);
  });

  const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const rippleContainer = event.currentTarget.getBoundingClientRect();
    const size =
      rippleContainer.width > rippleContainer.height
        ? rippleContainer.width
        : rippleContainer.height;
    const x = event.pageX - rippleContainer.x - size / 2;
    const y = event.pageY - rippleContainer.y - size / 2;
    const newRipple = {
      x,
      y,
      size,
    };

    setRippleArray([...rippleArray, newRipple]);
  };

  return (
    <RippleContainer duration={duration} color={color} onMouseDown={addRipple}>
      {rippleArray.length > 0 &&
        rippleArray.map((ripple, index) => {
          return (
            <span
              key={"span" + index}
              style={{
                top: ripple.y,
                left: ripple.x,
                width: ripple.size,
                height: ripple.size,
              }}
            />
          );
        })}
    </RippleContainer>
  );
};

Ripple.propTypes = {
  duration: PropTypes.number,
  color: PropTypes.string,
};

Ripple.defaultProps = {
  duration: 850,
  color: "#fff",
};

export default Ripple;
