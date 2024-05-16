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
function formatDateTimeYYYYMMDD(date:Date) {
  // const date = new Date(); // Create a new date object with the current date and time
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  return formattedDate;
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
function koboToNaira(kobo:number){
  return kobo / 100;
}

export { toggleSidebar, koboToNaira,stripSearchParams, formatDateSideBySide, setDate,formatDateTimeYYYYMMDD };
