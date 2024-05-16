"use client";
import { setDate } from "@/utils/helperfunctions";
import React, { useState, useEffect } from "react";
const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update the clock every second
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatedDate = setDate(time);
  return (
    <div className="iq-card iq-card-stretch iq-card-height h-full flex flex-col items-center justify-center ">
      <p className="text-[20px] font-medium">{formatedDate.readableDateStr}</p>
      <p className="text-[30px] font-bold">{formatedDate.localTimeStr} </p>
    </div>
  );
};

export default Clock;
