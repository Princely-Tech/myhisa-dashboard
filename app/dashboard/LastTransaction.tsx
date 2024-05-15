import tableJson from "@/data/tableJson";
import { formatDateSideBySide } from "@/utils/helperfunctions";
const LastTransaction = () => {
  return (
    <div>
      <h1 className="">Last 20 Transactions</h1>
      <div class="table-responsive h-[400px]  max-w-full">
        <table id="datatable" class="table table-striped table-bordered ">
          <thead>
            <tr>
              <th>sm</th>
              <th>id</th>
              <th>amount</th>
              <th>network</th>
              <th>msisdn</th>
              <th>type</th>
              <th>external_ref</th>
              <th>status</th>
              <th>created_at</th>
            </tr>
          </thead>
          <tbody>
            {tableJson().map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.transaction_id}</td>
                <td>{item.amount}</td>
                <td>{item.network}</td>
                <td>{item.msisdn}</td>
                <td>{item.type}</td>
                <td>{item.external_ref}</td>
                <td>{item.status}</td>
                <td>{formatDateSideBySide(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LastTransaction;
