const monthsAbbr = [
  "January",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const weekDaysAbbr = ["Sun", "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat"];

const toggleSidebar = () => {
  const sidebar = document.querySelector("#sidebar");
  sidebar?.classList.toggle("hidden");
};
function stripSearchParams(route: string) {
  const queryStringIndex = route.indexOf("?");
  if (queryStringIndex !== -1) {
    route = route.substring(0, queryStringIndex);
  }
  return route;
}
function setDate(date: Date) {
  // const date = new Date(dateStr);
  const monthAbbr = monthsAbbr[date.getMonth()];
  const localDateStr = date.toLocaleDateString();
  const localTimeStr = date.toLocaleTimeString();
  let readableDateStr = setReadableDateStr();
  return {
    date,
    monthAbbr,
    localDateStr,
    readableDateStr,
    localTimeStr,
  };
  function setReadableDateStr() {
    let readableDateStr = `${
      weekDaysAbbr[date.getDay()]
    }, ${monthAbbr} ${date.getDate()} ${date.getFullYear()}`;
    return readableDateStr;
  }
}
function formatDateSideBySide(dateTimeString: string) {
  const date = new Date(dateTimeString);
  const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  return formattedDate;
}

// Example usage:
const dateTimeString = "2023-10-19T11:31:48.355+01:00";
console.log(formatDateSideBySide(dateTimeString)); // Output: 10/19/2023 11:31:48 AM

export { toggleSidebar, stripSearchParams, formatDateSideBySide, setDate };
