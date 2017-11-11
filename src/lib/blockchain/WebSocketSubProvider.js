import createPayload from 'web3-provider-engine/util/create-payload';
import Subprovider from 'web3-provider-engine/subproviders/subprovider';


class WebSocketSubProvider extends Subprovider {
  constructor(opts) {
    super();
    this.wsProvider = opts.wsProvider;
  }

  handleRequest(payload, next, end){

    // new payload with random large id,
    // so as not to conflict with other concurrent users
    const newPayload = createPayload(payload);
    // console.log('------------------ network attempt -----------------')
    // console.log(payload)
    // console.log('---------------------------------------------')

    if(!newPayload) {
      console.log('no payload');
      end('no payload', null);
    }

    const handleResponse = (err, res) => {
      if (err || res.error) {
        console.error('RPC Error Response', err, res);
        end(err || res.error);
        return;
      }

      end(null, res.result);
    };
    
    this.wsProvider.send(newPayload, handleResponse);
  }
}

export default WebSocketSubProvider;
