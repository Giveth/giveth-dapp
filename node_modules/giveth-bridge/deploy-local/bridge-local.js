// import rimraf from 'rimraf';
// import path from 'path';
import logger from 'winston';
import { LiquidPledgingState } from 'giveth-liquidpledging';
import deploy from './deploy-local';
import config from '../src/configuration';
import { testBridge } from '../src/bridge';

const runBridge = (bridge, logLevel = 'none') => {
  logger.level = logLevel;

  return bridge.relayer.poll()
    .then(() => bridge.verifyer.verify())
}

const populate = async () => {

  const deployData = await deploy();
  const liquidPledging = deployData.liquidPledging;
  const liquidPledgingState = new LiquidPledgingState(liquidPledging);
  const vault = deployData.vault;
  const foreignBridge = deployData.foreignBridge;
  const homeBridge = deployData.homeBridge;
  const homeWeb3 = deployData.homeWeb3;
  const foreignWeb3 = deployData.foreignWeb3;
  const foreignEth = deployData.foreignEth;

  // RJ: Could you add a few more example transactions here to cover all the events we'd like to monitor?

  const project1Admin = deployData.foreignAccounts[4];
  const giver1 = deployData.homeAccounts[3];
  const giver2 = deployData.homeAccounts[4];
  await liquidPledging.addProject('Project1', '', project1Admin, 0, 0, 0, { from: project1Admin, $extraGas: 100000 });
  const project1 = 1; // admin 1
  const project2 = 2;

  // bridge = testBridge(false);
  const bridge = testBridge(true);

  await liquidPledging.addGiver('Giver1', '', 0, 0, { from: giver1, $extraGas: 100000 }); // admin 2
  await homeBridge.donate(2, project1, { from: giver1, value: 200 });
  await runBridge(bridge);

}

populate();
