import createPayload from 'web3-provider-engine/util/create-payload';
import Subprovider from 'web3-provider-engine/subproviders/subprovider';


class WebSocketSubProvider extends Subprovider {
  constructor(opts) {
    super();
    this.wsProvider = opts.wsProvider;
  }

  handleRequest(payload, next, end) {
    // new payload with random large id,
    // so as not to conflict with other concurrent users
    const newPayload = createPayload(payload);
    // console.log('------------------ network attempt -----------------')
    // console.log(payload)
    // console.log('---------------------------------------------')

    if (!newPayload) {
      console.log('no payload'); // eslint-disable-line no-console
      end('no payload', null);
    }

    this.wsProvider.send(newPayload, (err, res) => end(err, res.result));
  }
}

export default WebSocketSubProvider;
