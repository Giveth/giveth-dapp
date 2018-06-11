pragma solidity ^0.4.18;

contract LiquidPledgingACLHelpers {
    function arr(uint64 a, uint64 b, address c, uint d, address e) internal pure returns(uint[] r) {
        r = new uint[](4);
        r[0] = uint(a);
        r[1] = uint(b);
        r[2] = uint(c);
        r[3] = d;
        r[4] = uint(e);
    }

    function arr(bool a) internal pure returns (uint[] r) {
        r = new uint[](1);
        uint _a;
        assembly {
            _a := a // forced casting
        }
        r[0] = _a;
    }
}