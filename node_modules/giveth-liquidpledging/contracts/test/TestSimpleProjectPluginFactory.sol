pragma solidity ^0.4.11;

import "./TestSimpleProjectPlugin.sol";
import "../LiquidPledging.sol";

// simple factory for deploying TestSimpleProjectPlugin.sol contract
contract TestSimpleProjectPluginFactory {

    function deploy(
        LiquidPledging liquidPledging,
        string name,
        string url,
        uint64 parentProject
    ) {
        TestSimpleProjectPlugin p = new TestSimpleProjectPlugin();
        p.init(liquidPledging, name, url, parentProject);
    }

}
