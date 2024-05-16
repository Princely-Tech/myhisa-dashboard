import { faker } from "@faker-js/faker";
const statusArray = ["Pending", "Successful", "Failed"];
const typeArray = ["Airtime", "Data", "Bill Payment"];
const networkArray = ["Airtel", "MTN", "Glo", "9mobile"];
const generateRandomTransaction = () => {
  const transaction_id = faker.string.uuid();
  const amount = faker.number.int({ min: 50, max: 500 });
  const network = faker.helpers.arrayElement(networkArray);
  const msisdn = faker.phone.number();
  const type = faker.helpers.arrayElement(typeArray);
  const external_ref = faker.string.alphanumeric(5);
  const status = faker.helpers.arrayElement(statusArray);
  const created_at = faker.date.past().toISOString();
  return {
    transaction_id,
    amount,
    network,
    msisdn,
    type,
    external_ref,
    status,
    created_at,
  };
};
const tableJson = () => {
  return Array.from({ length: 20 }, () => generateRandomTransaction());
};
export default tableJson;
export { statusArray, typeArray, networkArray };
