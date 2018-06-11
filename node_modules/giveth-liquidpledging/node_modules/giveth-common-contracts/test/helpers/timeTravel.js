/* global web3 */

module.exports = seconds =>
  new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync(
          {
              jsonrpc: "2.0",
              method: "evm_increaseTime",
              params: [ seconds ],
              id: new Date().getTime(),
          },
      (err1) => {
          if (err1) return reject(err1);
          web3.currentProvider.sendAsync(
              {
                  jsonrpc: "2.0",
                  method: "evm_mine",
                  params: [],
                  id: new Date().getTime(),
              },
          (err2) => {
              if (err2) return reject(err2);
              resolve();
          },
        );
      },
    );
  });
