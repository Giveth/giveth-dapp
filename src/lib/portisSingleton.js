import Portis from '@portis/web3';

import config from '../configuration';

const PORTIS_DAPP_ID = 'd7f1ea06-0644-464b-b6de-b7a48ad3939b';
const NETWORK_CONFIG = { nodeUrl: config.foreignNodeConnection, nodeId: config.foreignNetworkId };

const portis = new Portis(PORTIS_DAPP_ID, NETWORK_CONFIG);

export default portis;
