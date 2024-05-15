const TransactionStats = () => {
  return (
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
        <div key={index} class="iq-card iq-card-block iq-card-stretch ">
          <div class="iq-card-body">
            <div class="icon iq-icon-box iq-bg-primary rounded">
              <i class="ri-drag-move-2-fill"></i>
            </div>
            <div class="mt-4">
              <h2>{item.value}</h2>
              <p>{item.title}</p>
            </div>
            <div id="ethernet-chart-01"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
const WalletBalances = () => {
  return (
    <div>
      <h3 className="">Wallet Balances</h3>
      <div class="iq-card  iq-card-stretch iq-card-height ">
        <div class="iq-card-body">
          <h4 class="text-uppercase text-black mb-0">Total</h4>
          <div class="d-flex justify-content-between align-items-center">
            <div class="font-size-80 text-black">12</div>
            <div class="text-left">
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
                  <p class="m-0 text-uppercase font-size-12">{item.title}</p>
                  <div class="mb-1 text-black">
                    {item.value}
                    <span class="text-danger">
                      <i class="ri-arrow-down-s-fill"></i>3.25%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div id="wave-chart-7"></div>
        </div>
      </div>
    </div>
  );
};

export { WalletBalances, TransactionStats };
