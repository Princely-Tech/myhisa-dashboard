export type CustomBarItem = {
  key: string;
  highestValue?: number;
  totalValue?: number;
  item: {
    className?: string;
    value: number;
  }[];
}[];
const CustomBarChart = ({
  items,
  barClassName = "",
  barColor,
  defaultHighestValue,
}: {
  barClassName?: string;
  barColor?: string;
  items: CustomBarItem;
  defaultHighestValue?: number;
}) => {
  let highestValue = getHighestValue();
  const range = getRange();

  return (
    <div className="relative h-[400px] mt-10 mb-[50px]">
      <div className="h-full relative" style={{ transform: "scaleY(-1)" }}>
        {range.map((item, index) => {
          const itemHeight = (item / highestValue) * 400;
          return (
            <div
              className={`absolute  w-full`}
              key={index}
              style={{ height: itemHeight }}
            >
              <div className="h-full w-full relative ">
                <div className="absolute bottom-0 flex w-full">
                  <p
                    className="mr-2 text-[#667085] font-light text-[14px]"
                    style={{ transform: "scaleY(-1)" }}
                  >
                    {item}k
                  </p>
                  <div
                    style={{ transform: "scaleY(-1)" }}
                    className="flex-1   flex items-center"
                  >
                    <div className="border border-dashed w-full" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className=" absolute bottom-[-10px] w-full pl-10  h-full flex justify-between">
        {items.map((item, index) => {
          const divHeight = (item.totalValue! / highestValue) * 400;
          return (
            <div
              className=" flex flex-col justify-end relative items-center "
              key={index}
            >
              <div
                className={` w-[16px] ${
                  barColor ?? "bg-royalBlue"
                } relative ${barClassName}`}
                style={{ height: divHeight }}
              >
                {item.item.map((value, index) => {
                  const totalValue = item.item.reduce(
                    (acc, curr) => acc + curr.value,
                    0
                  );
                  const heightPercentage =
                    (value.value / totalValue) * 100 + "%";
                  const previousHeight =
                    index === 0
                      ? 0
                      : item.item
                          .slice(0, index)
                          .reduce(
                            (acc, curr) => acc + curr.value / totalValue,
                            0
                          ) *
                          100 +
                        "%";
                  return (
                    <div
                      className={`absolute w-full  ${
                        value.className && value.className
                      }`}
                      key={index}
                      style={{ top: previousHeight, height: heightPercentage }}
                    ></div>
                  );
                })}
              </div>
              <p className=" absolute bottom-[-20px] text-[#667085] font-light text-[14px] ">
                {item.key}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
  function getRange() {
    const range = [];

    for (let count = highestValue; count <= highestValue * 2; count++) {
      let division = count / 4;
      if (isWholeNumber(division)) {
        highestValue = count;
        for (let count = 0; count <= 4; count++) {
          range.push(division * count);
        }
        break;
      }
    }

    return range;
  }
  function isWholeNumber(number: number) {
    return Math.floor(number) == number;
  }
  function getHighestValue() {
    let highestValue = 0;
    for (let index = 0; index < items.length; index++) {
      let value = items[index];
      let valueSum = 0;
      let valueHighestCount = 0;
      for (let index = 0; index < value.item.length; index++) {
        valueSum += value.item[index].value;
        valueHighestCount =
          value.item[index].value > valueHighestCount
            ? value.item[index].value
            : valueHighestCount;
      }
      value.highestValue = valueHighestCount;
      value.totalValue = valueSum;
      highestValue = valueSum > highestValue ? valueSum : highestValue;
    }
    highestValue = defaultHighestValue ?? highestValue;
    return highestValue;
  }
};

export default CustomBarChart;
