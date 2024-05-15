const toggleSidebar = () => {
  const sidebar = document.querySelector("#sidebar");
  sidebar?.classList.toggle("hidden");
};
function stripSearchParams(route:string) {
  const queryStringIndex = route.indexOf("?");
  if (queryStringIndex !== -1) {
    route = route.substring(0, queryStringIndex);
  }
  return route;
}
function formatDateSideBySide(dateTimeString:string) {
  const date = new Date(dateTimeString);
  const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  return formattedDate;
}

// Example usage:
const dateTimeString = "2023-10-19T11:31:48.355+01:00";
console.log(formatDateSideBySide(dateTimeString)); // Output: 10/19/2023 11:31:48 AM

export { toggleSidebar,stripSearchParams,formatDateSideBySide };
