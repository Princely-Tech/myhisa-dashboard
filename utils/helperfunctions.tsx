import { saveAs } from "file-saver";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import papaparse from "papaparse";

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
function formatDateTimeYYYYMMDD(date: Date) {
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
function koboToNaira(kobo: number) {
  const naira = plainKoboNairaConvert(kobo);
  return naira.toLocaleString();
}
export function plainKoboNairaConvert(kobo: number) {
  return kobo / 100;
}
export function handleDownloadCSV(arr: any, fileName: string) {
  const csvOptions = {
    header: true,
    quotes: true,
    delimiter: ",",
    newline: "\r\n",
    encoding: "utf-8",
    skipEmptyLines: true,
    dynamicTyping: false,
  };
  const csvData = papaparse.unparse(arr, csvOptions);
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, fileName);
}
const updateSearchParams = ({
  values,
  searchParams,
  pathname,
  router,
}: {
  values: { key: string; value: string | null }[];
  searchParams: URLSearchParams;
  pathname: string;
  router?: AppRouterInstance;
}) => {
  const params = new URLSearchParams(searchParams.toString());
  values.forEach((item) => {
    if (item.value) {
      params.set(item.key, item.value);
    } else {
      params.delete(item.key);
    }
  });
  const newPathname = pathname + "?" + params.toString();
  if (router) {
    router.push(newPathname);
  }
  return {
    pathname: newPathname,
    params,
  };
};

const newSearchParams = ({
  values,
  pathname,
  router,
}: {
  values: { key: string; value: string | null }[];
  pathname: string;
  router?: AppRouterInstance;
}) => {
  const params = new URLSearchParams();
  values.forEach((item) => {
    if (item.value) {
      params.set(item.key, item.value);
    } else {
      params.delete(item.key);
    }
  });
  const newPathname = pathname + "?" + params.toString();
  if (router) {
    router.push(newPathname);
  }
  return {
    pathname: newPathname,
    params,
  };
};

export {
  newSearchParams,
  updateSearchParams,
  toggleSidebar,
  koboToNaira,
  stripSearchParams,
  formatDateSideBySide,
  setDate,
  formatDateTimeYYYYMMDD,
};
