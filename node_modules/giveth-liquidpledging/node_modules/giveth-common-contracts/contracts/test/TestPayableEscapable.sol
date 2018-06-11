pragma solidity ^0.4.15;

import "../Escapable.sol";


contract TestPayableEscapable is Escapable {

    function TestPayableEscapable(address _blackListToken, address _escapeHatchCaller, address _escapeHatchDestination) 
        Escapable(_escapeHatchCaller,_escapeHatchDestination) {
        	blacklistEscapeToken(_blackListToken);
    }

    function () payable {
    }
}