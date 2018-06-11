pragma solidity ^0.4.0;


import "filename" as symbolName;


contract Halo {

    function foo () returns (uint) {
        return 0;
    }
}

import * as symbolName from "filename";

library Foo {
    function bar () returns (uint) {
        return 1;
    }
}

import "nano.sol";