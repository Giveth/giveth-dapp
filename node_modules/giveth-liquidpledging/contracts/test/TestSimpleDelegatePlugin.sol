pragma solidity ^0.4.11;

import "../LiquidPledging.sol";

// simple liquidPledging plugin contract for testing whitelist
contract TestSimpleDelegatePlugin {

    uint64 public idDelegate;
    LiquidPledging liquidPledging;
    bool initPending;

    event BeforeTransfer(uint64 pledgeAdmin, uint64 pledgeFrom, uint64 pledgeTo, uint64 context, uint amount);
    event AfterTransfer(uint64 pledgeAdmin, uint64 pledgeFrom, uint64 pledgeTo, uint64 context, uint amount);

    function TestSimpleDelegatePlugin(LiquidPledging _liquidPledging) public {
        require(msg.sender != tx.origin); // Avoids being created directly by mistake.
        liquidPledging = _liquidPledging;
        initPending = true;
    }

    function init(
        string name,
        string url,
        uint64 commitTime
    ) public {
        require(initPending);
        idDelegate = liquidPledging.addDelegate(name, url, commitTime, ILiquidPledgingPlugin(this));
        initPending = false;
    }

    function beforeTransfer(
        uint64 pledgeAdmin,
        uint64 pledgeFrom,
        uint64 pledgeTo,
        uint64 context,
        uint amount
    ) external returns (uint maxAllowed) {
        require(!initPending);
        BeforeTransfer(pledgeAdmin, pledgeFrom, pledgeTo, context, amount);
    }

    function afterTransfer(
        uint64 pledgeAdmin,
        uint64 pledgeFrom,
        uint64 pledgeTo,
        uint64 context,
        uint amount
    ) external {
        require(!initPending);
        AfterTransfer(pledgeAdmin, pledgeFrom, pledgeTo, context, amount);
    }

}

contract TestSimpleDelegatePluginFactory {

    function TestSimpleDelegatePluginFactory(
        LiquidPledging liquidPledging,
        string name,
        string url,
        uint64 commitTime
    ) public {
        TestSimpleDelegatePlugin d = new TestSimpleDelegatePlugin(liquidPledging);
        d.init(name, url, commitTime);
    }

}
