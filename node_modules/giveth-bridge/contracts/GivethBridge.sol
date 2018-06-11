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

import "giveth-common-contracts/contracts/ERC20.sol";
import "./lib/Vault.sol";

// @notice NOTICE: It is not recommened to call this function outside of the giveth dapp (giveth.io)
// this function is bridged to a side chain. If for some reason the sidechain tx fails, the donation
// will end up in the givers control inside LiquidPledging contract. If you do not use the dapp, there
// will be no way of notifying the sender/giver that the giver has to take action (withdraw/donate) in
// the dapp
contract GivethBridge is Vault {

    mapping(address => bool) tokenWhitelist;

    event Donate(uint64 giverId, uint64 receiverId, address token, uint amount);
    event DonateAndCreateGiver(address giver, uint64 receiverId, address token, uint amount);
    event EscapeFundsCalled(address token, uint amount);

    //== constructor

    /// @param _escapeHatchCaller The address of a trusted account or contract to
    ///  call `escapeHatch()` to send the ether in this contract to the
    ///  `escapeHatchDestination` it would be ideal if `escapeHatchCaller` cannot move
    ///  funds out of `escapeHatchDestination`
    /// @param _escapeHatchDestination The address of a safe location (usu a
    ///  Multisig) to send the ether held in this contract in an emergency
    /// @param _absoluteMinTimeLock The minimum number of seconds `timelock` can
    ///  be set to, if set to 0 the `owner` can remove the `timeLock` completely
    /// @param _timeLock Initial number of seconds that payments are delayed
    ///  after they are authorized (a security precaution)
    /// @param _securityGuard Address that will be able to delay the payments
    ///  beyond the initial timelock requirements; can be set to 0x0 to remove
    ///  the `securityGuard` functionality
    /// @param _maxSecurityGuardDelay The maximum number of seconds in total
    ///   that `securityGuard` can delay a payment so that the owner can cancel
    ///   the payment if needed
    function GivethBridge(
        address _escapeHatchCaller,
        address _escapeHatchDestination,
        uint _absoluteMinTimeLock,
        uint _timeLock,
        address _securityGuard,
        uint _maxSecurityGuardDelay
    ) Vault(
        _escapeHatchCaller,
        _escapeHatchDestination,
        _absoluteMinTimeLock,
        _timeLock,
        _securityGuard,
        _maxSecurityGuardDelay
    ) public
    {
        tokenWhitelist[0] = true; // enable eth transfers
    }

    //== public methods

    // @notice NOTICE: It is not recommened to call this function outside of the giveth dapp (giveth.io)
    // this function is bridged to a side chain. If for some reason the sidechain tx fails, the donation
    // will end up in the givers control inside LiquidPledging contract. If you do not use the dapp, there
    // will be no way of notifying the sender/giver that the giver has to take action (withdraw/donate) in
    // the dapp
    function donateAndCreateGiver(address giver, uint64 receiverId) payable external {
        donateAndCreateGiver(giver, receiverId, 0, 0);
    }

    // @notice NOTICE: It is not recommened to call this function outside of the giveth dapp (giveth.io)
    // this function is bridged to a side chain. If for some reason the sidechain tx fails, the donation
    // will end up in the givers control inside LiquidPledging contract. If you do not use the dapp, there
    // will be no way of notifying the sender/giver that the giver has to take action (withdraw/donate) in
    // the dapp
    function donateAndCreateGiver(address giver, uint64 receiverId, address token, uint _amount) whenNotPaused payable public {
        require(giver != 0);
        require(receiverId != 0);
        uint amount = _receiveDonation(token, _amount);
        emit DonateAndCreateGiver(giver, receiverId, token, amount);
    }

    // @notice NOTICE: It is not recommened to call this function outside of the giveth dapp (giveth.io)
    // this function is bridged to a side chain. If for some reason the sidechain tx fails, the donation
    // will end up in the givers control inside LiquidPledging contract. If you do not use the dapp, there
    // will be no way of notifying the sender/giver that the giver has to take action (withdraw/donate) in
    // the dapp
    function donate(uint64 giverId, uint64 receiverId) payable external {
        donate(giverId, receiverId, 0, 0);
    }

    // @notice NOTICE: It is not recommened to call this function outside of the giveth dapp (giveth.io)
    // this function is bridged to a side chain. If for some reason the sidechain tx fails, the donation
    // will end up in the givers control inside LiquidPledging contract. If you do not use the dapp, there
    // will be no way of notifying the sender/giver that the giver has to take action (withdraw/donate) in
    // the dapp
    function donate(uint64 giverId, uint64 receiverId, address token, uint _amount) whenNotPaused payable public {
        require(giverId != 0);
        require(receiverId != 0);
        uint amount = _receiveDonation(token, _amount);
        emit Donate(giverId, receiverId, token, amount);
    }

    function whitelistToken(address token, bool accepted) whenNotPaused onlyOwner external {
        tokenWhitelist[token] = accepted;
    }

    /// Transfer tokens/eth to the escapeHatchDestination.
    /// Used as a safety mechanism to prevent the bridge from holding too much value
    /// before being thoroughly battle-tested.
    /// @param _token to transfer
    /// @param _amount to transfer
    function escapeFunds(address _token, uint _amount) external onlyEscapeHatchCallerOrOwner {
        /// @dev Logic for ether
        if (_token == 0) {
            escapeHatchDestination.transfer(_amount);
            emit EscapeFundsCalled(_token, _amount);
            return;
        }
        /// @dev Logic for tokens
        ERC20 token = ERC20(_token);
        require(token.transfer(escapeHatchDestination, _amount));
        emit EscapeFundsCalled(_token, _amount);
    }

    function _receiveDonation(address token, uint _amount) internal returns(uint amount) {
        require(tokenWhitelist[token]);
        amount = _amount;

        // eth donation
        if (token == 0) {
            amount = msg.value;
        }

        require(amount > 0);

        if (token != 0) {
            require(ERC20(token).transferFrom(msg.sender, this, amount));
        }
    }
}