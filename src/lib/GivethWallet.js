import lightwallet from 'eth-lightwallet';

class GivethWallet {
  constructor(keystore) {
    if (keystore) {
      this.keystore = keystore;
    }
  }

  getSeed(password) {
    return new Promise((resolve, reject) => {

      if (!this.keystore) reject("No keystore available");

      this.keystore.keyFromPassword(password, (err, pwDerivedKey) => {
        if (err) reject(err);

        if (!this.keystore.isDerivedKeyCorrect) reject("Error: Invalid Password");

        resolve(this.keystore.getSeed(pwDerivedKey));
      });

    });
  }

  getAddresses() {
    if (!this.keystore) return [];

    return this.keystore.getAddresses().map(addr => GivethWallet.fixAddress(addr))
  }

  static fixAddress(addr) {
    return (addr.startsWith('0x')) ? addr : `0x${addr}`;
  }

  static createWallet(password, seed) {
    return new Promise((resolve, reject) => {

      const opts = {
        password,
      };

      if (seed) {
        opts.seedPhrase = seed;
      }

      lightwallet.keystore.createVault(opts, (err, ks) => {
        if (err) reject(err);

        ks.keyFromPassword(password, (err, pwDerivedKey) => {
          if (err) reject(err);

          ks.generateNewAddress(pwDerivedKey);

          resolve(new GivethWallet(ks));
        })

      });
    });
  }

  static loadWallet(serializedKeystore, password) {
    return new Promise((resolve, reject) => {

      const ks = lightwallet.keystore.deserialize(serializedKeystore);

      ks.keyFromPassword(password, (err, pwDerivedKey) => {
        if (err) reject(err);

        if (!ks.isDerivedKeyCorrect(pwDerivedKey)) reject("Error: Invalid Password");

        resolve(new GivethWallet(ks));
      })

    });
  }
}

export default GivethWallet;