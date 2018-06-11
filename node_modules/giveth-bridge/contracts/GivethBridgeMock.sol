pragma solidity ^0.4.21;
/*
    Copyright 2017, RJ Ewing

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import "./GivethBridge.sol";

/// @dev `GivethBridgeMock` allows for mocking up
///  a `GivethBridge` contract with the added ability
///  to manipulate the block time for testing purposes.
contract GivethBridgeMock is GivethBridge {

    uint public mock_time;

    function GivethBridgeMock(
        address _escapeHatchCaller,
        address _escapeHatchDestination,
        uint _absoluteMinTimeLock,
        uint _timeLock,
        address _securityGuard,
        uint _maxSecurityGuardDelay
    ) GivethBridge(
        _escapeHatchCaller,
        _escapeHatchDestination,
        _absoluteMinTimeLock,
        _timeLock,
        _securityGuard,
        _maxSecurityGuardDelay
    ) public
    {
    }

    /// @dev `_getTime` is a basic getter function for
    ///  the mock_time parameter
    function _getTime() internal view returns (uint) {
        return mock_time;
    }

    /// @dev `setMockedTime` is a basic setter function for
    ///  the mock_time parameter
    /// @param _t This is the value to which the mocked time
    ///  will be set.
    function setMockedTime(uint _t) public {
        mock_time = _t;
    }
}