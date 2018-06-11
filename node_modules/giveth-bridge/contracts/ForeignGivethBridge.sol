pragma solidity ^0.4.21;

/*
    Copyright 2017, RJ Ewing <perissology@protonmail.com>

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

import "giveth-common-contracts/contracts/Escapable.sol";
import "minimetoken/contracts/MiniMeToken.sol";
import "lib/Pausable.sol";

contract ForeignGivethBridge is Escapable, Pausable, TokenController {
    // TODO: what happens when bridge shuts down? how do we transfer token mappings?

    MiniMeTokenFactory public tokenFactory;
    address public liquidPledging;

    mapping(address => address) public tokenMapping;
    mapping(address => address) public inverseTokenMapping;

    event Deposit(address indexed sender, address token, uint amount, bytes32 homeTx, bytes data);
    event Withdraw(address recipient, address token, uint amount);
    event TokenAdded(address mainToken, address sideToken);

    //== constructor

    function ForeignGivethBridge(
        address _escapeHatchCaller,
        address _escapeHatchDestination, 
        address _tokenFactory,
        address _liquidPledging
    ) Escapable(_escapeHatchCaller, _escapeHatchDestination) public 
    {
        require(_tokenFactory != 0);
        require(_liquidPledging != 0);

        tokenFactory = MiniMeTokenFactory(_tokenFactory);
        liquidPledging = _liquidPledging;
    }

    //== public methods

    // TODO: specify withdraw address?
    function withdraw(address sideToken, uint amount) whenNotPaused external {
        address mainToken = inverseTokenMapping[sideToken];
        require(mainToken != 0 || tokenMapping[0] == sideToken);

        MiniMeToken(sideToken).destroyTokens(msg.sender, amount);

        emit Withdraw(msg.sender, mainToken, amount);
    }

    function deposit(address sender, address mainToken, uint amount, bytes32 homeTx, bytes data) onlyOwner external {
        address sideToken = tokenMapping[mainToken];
        require(sideToken != 0);

        MiniMeToken(sideToken).generateTokens(address(this), amount);

        if (MiniMeToken(sideToken).allowance(address(this), liquidPledging) < amount) {
            MiniMeToken(sideToken).approve(liquidPledging, uint(0 - 1));
        }

        require(liquidPledging.call(data));
        emit Deposit(sender, mainToken, amount, homeTx, data);
    }

    function addToken(address mainToken, string tokenName, uint8 decimals, string tokenSymbol) onlyOwner external {
        require(tokenMapping[mainToken] == 0);
        MiniMeToken sideToken = new MiniMeToken(tokenFactory, 0x0, 0, tokenName, decimals, tokenSymbol, true);
        sideToken.approve(liquidPledging, uint(0 - 1));
        tokenMapping[mainToken] = address(sideToken);
        inverseTokenMapping[address(sideToken)] = mainToken;
        emit TokenAdded(mainToken, address(sideToken));
    }

////////////////
// TokenController
////////////////

    /// @notice Called when `_owner` sends ether to the MiniMe Token contract
    /// @param _owner The address that sent the ether to create tokens
    /// @return True if the ether is accepted, false if it throws
    function proxyPayment(address _owner) public payable returns(bool) {
        return false;
    }

    /// @notice Notifies the controller about a token transfer allowing the
    ///  controller to react if desired
    /// @param _from The origin of the transfer
    /// @param _to The destination of the transfer
    /// @param _amount The amount of the transfer
    /// @return False if the controller does not authorize the transfer
    function onTransfer(address _from, address _to, uint _amount) public returns(bool) {
        return true;
    }

    /// @notice Notifies the controller about an approval allowing the
    ///  controller to react if desired
    /// @param _owner The address that calls `approve()`
    /// @param _spender The spender in the `approve()` call
    /// @param _amount The amount in the `approve()` call
    /// @return False if the controller does not authorize the approval
    function onApprove(address _owner, address _spender, uint _amount) public returns(bool) {
        return true;
    }
}