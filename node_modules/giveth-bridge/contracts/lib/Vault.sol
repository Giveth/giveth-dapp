pragma solidity ^0.4.21;

/*
    Copyright 2016, Jordi Baylina, RJ Ewing

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

/// @title Vault Contract
/// @author Jordi Baylina, RJ Ewing
/// @notice This contract holds funds for Campaigns and automates payments. For
///  this iteration the funds will come straight from the Giveth Multisig as a
///  safety precaution, but once fully tested and optimized this contract will
///  be a safe place to store funds equipped with optional variable time delays
///  to allow for an optional escape hatch

import "giveth-common-contracts/contracts/Escapable.sol";
import "./Pausable.sol";

/// @dev `Vault` is a higher level contract built off of the `Escapable`
///  contract that holds funds for Campaigns and automates payments.
contract Vault is Escapable, Pausable {

    /// @dev `Payment` is a public structure that describes the details of
    ///  each payment making it easy to track the movement of funds
    ///  transparently
    struct Payment {
        string name;     // What is the purpose of this payment
        bytes32 reference;  // Reference of the payment.
        address spender;        // Who is sending the funds
        uint earliestPayTime;   // The earliest a payment can be made (Unix Time)
        bool canceled;         // If True then the payment has been canceled
        bool paid;              // If True then the payment has been paid
        address recipient;      // Who is receiving the funds
        address token;          // Token this payment represents
        uint amount;            // The amount of wei sent in the payment
        uint securityGuardDelay;// The miliseconds `securityGuard` can delay payment
    }

    Payment[] public authorizedPayments;

    address public securityGuard;
    uint public absoluteMinTimeLock;
    uint public timeLock;
    uint public maxSecurityGuardDelay;

    /// @dev The white list of approved addresses allowed to set up && receive
    ///  payments from this vault
    mapping (address => bool) public allowedSpenders;

    // @dev Events to make the payment movements easy to find on the blockchain
    event PaymentAuthorized(uint indexed idPayment, address indexed recipient, uint amount, address token, bytes32 reference);
    event PaymentExecuted(uint indexed idPayment, address indexed recipient, uint amount, address token);
    event PaymentCanceled(uint indexed idPayment);
    event SpenderAuthorization(address indexed spender, bool authorized);

    /// @dev The address assigned the role of `securityGuard` is the only
    ///  addresses that can call a function with this modifier
    modifier onlySecurityGuard { 
        require(msg.sender == securityGuard);
        _;
    }

    /// @notice The Constructor creates the Vault on the blockchain
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
    function Vault(
        address _escapeHatchCaller,
        address _escapeHatchDestination,
        uint _absoluteMinTimeLock,
        uint _timeLock,
        address _securityGuard,
        uint _maxSecurityGuardDelay
    ) Escapable(_escapeHatchCaller, _escapeHatchDestination) public
    {
        absoluteMinTimeLock = _absoluteMinTimeLock;
        timeLock = _timeLock;
        securityGuard = _securityGuard;
        maxSecurityGuardDelay = _maxSecurityGuardDelay;
    }

/////////
// Helper functions
/////////

    /// @notice States the total number of authorized payments in this contract
    /// @return The number of payments ever authorized even if they were canceled
    function numberOfAuthorizedPayments() public view returns (uint) {
        return authorizedPayments.length;
    }

////////
// Spender Interface
////////

    /// @notice only `allowedSpenders[]` Creates a new `Payment`
    /// @param _name Brief description of the payment that is authorized
    /// @param _reference External reference of the payment
    /// @param _recipient Destination of the payment
    /// @param _amount Amount to be paid in wei
    /// @param _paymentDelay Number of miliseconds the payment is to be delayed, if
    ///  this value is below `timeLock` then the `timeLock` determines the delay
    /// @return The Payment ID number for the new authorized payment
    function authorizePayment(
        string _name,
        bytes32 _reference,
        address _recipient,
        address _token,
        uint _amount,
        uint _paymentDelay
    ) whenNotPaused external returns(uint) {

        // Fail if you arent on the `allowedSpenders` white list
        require(allowedSpenders[msg.sender]);
        uint idPayment = authorizedPayments.length;       // Unique Payment ID
        authorizedPayments.length++;

        // The following lines fill out the payment struct
        Payment storage p = authorizedPayments[idPayment];
        p.spender = msg.sender;

        // Overflow protection
        require(_paymentDelay <= 10**18);

        // Determines the earliest the recipient can receive payment (Unix time)
        p.earliestPayTime = _paymentDelay >= timeLock ?
                                _getTime() + _paymentDelay :
                                _getTime() + timeLock;
        p.recipient = _recipient;
        p.amount = _amount;
        p.name = _name;
        p.reference = _reference;
        p.token = _token;
        emit PaymentAuthorized(idPayment, p.recipient, p.amount, p.token, p.reference);
        return idPayment;
    }

    /// @notice only `allowedSpenders[]` The recipient of a payment calls this
    ///  function to send themselves the ether after the `earliestPayTime` has
    ///  expired
    /// @param _idPayment The payment ID to be executed
    function collectAuthorizedPayment(uint _idPayment) whenNotPaused external {

        // Check that the `_idPayment` has been added to the payments struct
        require(_idPayment < authorizedPayments.length);

        Payment storage p = authorizedPayments[_idPayment];

        // Checking for reasons not to execute the payment
        require(msg.sender == p.recipient);
        require(allowedSpenders[p.spender]);
        require(_getTime() >= p.earliestPayTime);
        require(!p.canceled);
        require(!p.paid);
        // if (this.balance < p.amount);

        p.paid = true; // Set the payment to being paid

        // Make the payment
        if (p.token == 0) {
            p.recipient.transfer(p.amount);
        } else {
            require(ERC20(p.token).transfer(p.recipient, p.amount));
        }

        emit PaymentExecuted(_idPayment, p.recipient, p.amount, p.token);
    }

/////////
// SecurityGuard Interface
/////////

    /// @notice `onlySecurityGuard` Delays a payment for a set number of miliseconds
    /// @param _idPayment ID of the payment to be delayed
    /// @param _delay The number of miliseconds to delay the payment
    function delayPayment(uint _idPayment, uint _delay) onlySecurityGuard external {
        require(_idPayment < authorizedPayments.length);

        // Overflow test
        require(_delay <= 10**18);

        Payment storage p = authorizedPayments[_idPayment];

        require(p.securityGuardDelay + _delay <= maxSecurityGuardDelay);
        require(!p.paid);
        require(!p.canceled);

        p.securityGuardDelay += _delay;
        p.earliestPayTime += _delay;
    }

////////
// Owner Interface
///////

    /// @notice `onlyOwner` Cancel a payment all together
    /// @param _idPayment ID of the payment to be canceled.
    function cancelPayment(uint _idPayment) onlyOwner external {
        require(_idPayment < authorizedPayments.length);

        Payment storage p = authorizedPayments[_idPayment];


        require(!p.canceled);
        require(!p.paid);

        p.canceled = true;
        emit PaymentCanceled(_idPayment);
    }

    /// @notice `onlyOwner` Adds a spender to the `allowedSpenders[]` white list
    /// @param _spender The address of the contract being authorized/unauthorized
    /// @param _authorize `true` if authorizing and `false` if unauthorizing
    function authorizeSpender(address _spender, bool _authorize) onlyOwner external {
        allowedSpenders[_spender] = _authorize;
        emit SpenderAuthorization(_spender, _authorize);
    }

    /// @notice `onlyOwner` Sets the address of `securityGuard`
    /// @param _newSecurityGuard Address of the new security guard
    function setSecurityGuard(address _newSecurityGuard) onlyOwner external {
        securityGuard = _newSecurityGuard;
    }

    /// @notice `onlyOwner` Changes `timeLock`; the new `timeLock` cannot be
    ///  lower than `absoluteMinTimeLock`
    /// @param _newTimeLock Sets the new minimum default `timeLock` in miliseconds;
    ///  pending payments maintain their `earliestPayTime`
    function setTimelock(uint _newTimeLock) onlyOwner external {
        require(_newTimeLock >= absoluteMinTimeLock);
        timeLock = _newTimeLock;
    }

    /// @notice `onlyOwner` Changes the maximum number of miliseconds
    /// `securityGuard` can delay a payment
    /// @param _maxSecurityGuardDelay The new maximum delay in seconds that
    ///  `securityGuard` can delay the payment's execution in total
    function setMaxSecurityGuardDelay(uint _maxSecurityGuardDelay) onlyOwner external {
        maxSecurityGuardDelay = _maxSecurityGuardDelay;
    }

    // for overidding during testing
    function _getTime() internal view returns (uint) {
        return now;
    }
}