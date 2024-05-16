const TransactionStats = () => {
  return (
    <div>
      <h3 className="">TransactionStats</h3>
      <div className="flex flex-wrap gap-6 justify-between">
        {[
          {
            title: "Total Transaction",
            value: 500,
          },
          {
            title: "Failed",
            value: 500,
          },
          {
            title: "Successful",
            value: 500,
          },
          {
            title: "Pending",
            value: 500,
          },
        ].map((item, index) => (
          <div key={index} className="iq-card iq-card-block iq-card-stretch  m-0 ">
            <div className="iq-card-body">
              <div className="icon iq-icon-box iq-bg-primary rounded">
                <i className="ri-drag-move-2-fill"></i>
              </div>
              <div className="mt-4">
                <h2>{item.value}</h2>
                <p>{item.title}</p>
              </div>
              <div id="ethernet-chart-01"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const WalletBalances = () => {
  return (
    <div className="iq-card  iq-card-stretch iq-card-height m-0 ">
      <div className="iq-card-body">
        <h4 className="text-uppercase text-black mb-0">Total</h4>
        <div className="d-flex justify-content-between align-items-center">
          <div className="font-size-80 text-black">12</div>
          <div className="text-left">
            {[
              {
                title: "Main",
                value: 1500,
              },
              {
                title: "Commision",
                value: 1500,
              },
              {
                title: "Bonus",
                value: 1500,
              },
            ].map((item, index) => (
              <div key={index}>
                {" "}
                <p className="m-0 text-uppercase font-size-12">{item.title}</p>
                <div className="mb-1 text-black">
                  {item.value}
                  <span className="text-danger">
                    <i className="ri-arrow-down-s-fill"></i>3.25%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div id="wave-chart-7"></div>
      </div>
    </div>
  );
};

export { WalletBalances, TransactionStats };
