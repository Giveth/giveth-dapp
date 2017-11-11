import Subprovider from 'web3-provider-engine/subproviders/subprovider';


class CleanserSubProvider extends Subprovider {
  handleRequest(payload, next, end){
    var txParams = payload.params[0];

    // remove any undefined txParams
    if (typeof txParams === 'object' && !Array.isArray(txParams)) {
      payload.params[0] = Object.keys(txParams)
        .map(key => ({key, val: txParams[ key ]}))
        .filter(({_, val}) => val !== undefined)
        .reduce((obj, {key, val}) => Object.assign(obj, { [key]: val }), {});
    }

    next();
  }
}

export default CleanserSubProvider;
