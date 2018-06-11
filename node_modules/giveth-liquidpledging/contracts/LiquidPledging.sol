pragma solidity ^0.4.18;

/*
    Copyright 2017, Jordi Baylina, RJ Ewing
    Contributors: Adrià Massanet <adria@codecontext.io>, Griff Green,
    Arthur Lunn

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

import "./LiquidPledgingBase.sol";

/// @dev `LiquidPledging` allows for liquid pledging through the use of
///  internal id structures and delegate chaining. All basic operations for
///  handling liquid pledging are supplied as well as plugin features
///  to allow for expanded functionality.
contract LiquidPledging is LiquidPledgingBase {

    function LiquidPledging(address _escapeHatchDestination) EscapableApp(_escapeHatchDestination) public {
    }

    function addGiverAndDonate(uint64 idReceiver, address token, uint amount)
        public
    {
        addGiverAndDonate(idReceiver, msg.sender, token, amount);
    }

    function addGiverAndDonate(uint64 idReceiver, address donorAddress, address token, uint amount)
        public
    {
        require(donorAddress != 0);
        // default to a 3 day (259200 seconds) commitTime
        uint64 idGiver = addGiver(donorAddress, "", "", 259200, ILiquidPledgingPlugin(0));
        donate(idGiver, idReceiver, token, amount);
    }

    /// @notice This is how value enters the system and how pledges are created;
    ///  the ether is sent to the vault, an pledge for the Giver is created (or
    ///  found), the amount of ETH donated in wei is added to the `amount` in
    ///  the Giver's Pledge, and an LP transfer is done to the idReceiver for
    ///  the full amount
    /// @param idGiver The id of the Giver donating
    /// @param idReceiver The Admin receiving the donation; can be any Admin:
    ///  the Giver themselves, another Giver, a Delegate or a Project
    function donate(uint64 idGiver, uint64 idReceiver, address token, uint amount)
        public
    {
        require(idGiver > 0); // prevent burning donations. idReceiver is checked in _transfer
        require(amount > 0);
        require(token != 0x0);

        PledgeAdmin storage sender = _findAdmin(idGiver);
        require(sender.adminType == PledgeAdminType.Giver);

        // TODO should this be done at the end of this function?
        // what re-entrancy issues are there if this is done here?
        // if done at the end of the function, will that affect plugins?
        require(ERC20(token).transferFrom(msg.sender, address(vault), amount)); // transfer the token to the `vault`

        uint64 idPledge = _findOrCreatePledge(
            idGiver,
            new uint64[](0), // Creates empty array for delegationChain
            0,
            0,
            0,
            token,
            PledgeState.Pledged
        );

        Pledge storage pTo = _findPledge(idPledge);
        pTo.amount += amount;

        Transfer(0, idPledge, amount);

        _transfer(idGiver, idPledge, amount, idReceiver);
    }

    /// @notice Transfers amounts between pledges for internal accounting
    /// @param idSender Id of the Admin that is transferring the amount from
    ///  Pledge to Pledge; this admin must have permissions to move the value
    /// @param idPledge Id of the pledge that's moving the value
    /// @param amount Quantity of ETH (in wei) that this pledge is transferring 
    ///  the authority to withdraw from the vault
    /// @param idReceiver Destination of the `amount`, can be a Giver/Project sending
    ///  to a Giver, a Delegate or a Project; a Delegate sending to another
    ///  Delegate, or a Delegate pre-commiting it to a Project 
    function transfer( 
        uint64 idSender,
        uint64 idPledge,
        uint amount,
        uint64 idReceiver
    ) public
    {
        _checkAdminOwner(idSender);
        _transfer(idSender, idPledge, amount, idReceiver);
    }

    /// @notice Authorizes a payment be made from the `vault` can be used by the
    ///  Giver to veto a pre-committed donation from a Delegate to an
    ///  intendedProject
    /// @param idPledge Id of the pledge that is to be redeemed into ether
    /// @param amount Quantity of ether (in wei) to be authorized
    function withdraw(uint64 idPledge, uint amount) public {
        idPledge = normalizePledge(idPledge); // Updates pledge info 

        Pledge storage p = _findPledge(idPledge);
        require(p.pledgeState == PledgeState.Pledged);
        _checkAdminOwner(p.owner);

        uint64 idNewPledge = _findOrCreatePledge(
            p.owner,
            p.delegationChain,
            0,
            0,
            p.oldPledge,
            p.token,
            PledgeState.Paying
        );

        _doTransfer(idPledge, idNewPledge, amount);

        PledgeAdmin storage owner = _findAdmin(p.owner);
        vault.authorizePayment(bytes32(idNewPledge), owner.addr, p.token, amount);
    }

    /// @notice `onlyVault` Confirms a withdraw request changing the PledgeState
    ///  from Paying to Paid
    /// @param idPledge Id of the pledge that is to be withdrawn
    /// @param amount Quantity of ether (in wei) to be withdrawn
    function confirmPayment(uint64 idPledge, uint amount) public onlyVault {
        Pledge storage p = _findPledge(idPledge);

        require(p.pledgeState == PledgeState.Paying);

        uint64 idNewPledge = _findOrCreatePledge(
            p.owner,
            p.delegationChain,
            0,
            0,
            p.oldPledge,
            p.token,
            PledgeState.Paid
        );

        _doTransfer(idPledge, idNewPledge, amount);
    }

    /// @notice `onlyVault` Cancels a withdraw request, changing the PledgeState
    ///  from Paying back to Pledged
    /// @param idPledge Id of the pledge that's withdraw is to be canceled
    /// @param amount Quantity of ether (in wei) to be canceled
    function cancelPayment(uint64 idPledge, uint amount) public onlyVault {
        Pledge storage p = _findPledge(idPledge);

        require(p.pledgeState == PledgeState.Paying);

        // When a payment is canceled, never is assigned to a project.
        uint64 idOldPledge = _findOrCreatePledge(
            p.owner,
            p.delegationChain,
            0,
            0,
            p.oldPledge,
            p.token,
            PledgeState.Pledged
        );

        idOldPledge = normalizePledge(idOldPledge);

        _doTransfer(idPledge, idOldPledge, amount);
    }

    /// @notice Changes the `project.canceled` flag to `true`; cannot be undone
    /// @param idProject Id of the project that is to be canceled
    function cancelProject(uint64 idProject) public {
        PledgeAdmin storage project = _findAdmin(idProject);
        _checkAdminOwner(idProject);
        project.canceled = true;

        CancelProject(idProject);
    }

    /// @notice Transfers `amount` in `idPledge` back to the `oldPledge` that
    ///  that sent it there in the first place, a Ctrl-z 
    /// @param idPledge Id of the pledge that is to be canceled
    /// @param amount Quantity of ether (in wei) to be transfered to the 
    ///  `oldPledge`
    function cancelPledge(uint64 idPledge, uint amount) public {
        idPledge = normalizePledge(idPledge);

        Pledge storage p = _findPledge(idPledge);
        require(p.oldPledge != 0);
        require(p.pledgeState == PledgeState.Pledged);
        _checkAdminOwner(p.owner);

        uint64 oldPledge = _getOldestPledgeNotCanceled(p.oldPledge);
        _doTransfer(idPledge, oldPledge, amount);
    }


////////
// Multi pledge methods
////////

    // @dev This set of functions makes moving a lot of pledges around much more
    // efficient (saves gas) than calling these functions in series
    
    
    /// @dev Bitmask used for dividing pledge amounts in Multi pledge methods
    uint constant D64 = 0x10000000000000000;

    /// @notice Transfers multiple amounts within multiple Pledges in an
    ///  efficient single call 
    /// @param idSender Id of the Admin that is transferring the amounts from
    ///  all the Pledges; this admin must have permissions to move the value
    /// @param pledgesAmounts An array of Pledge amounts and the idPledges with 
    ///  which the amounts are associated; these are extrapolated using the D64
    ///  bitmask
    /// @param idReceiver Destination of the `pledesAmounts`, can be a Giver or 
    ///  Project sending to a Giver, a Delegate or a Project; a Delegate sending
    ///  to another Delegate, or a Delegate pre-commiting it to a Project 
    function mTransfer(
        uint64 idSender,
        uint[] pledgesAmounts,
        uint64 idReceiver
    ) public 
    {
        for (uint i = 0; i < pledgesAmounts.length; i++ ) {
            uint64 idPledge = uint64(pledgesAmounts[i] & (D64-1));
            uint amount = pledgesAmounts[i] / D64;

            transfer(idSender, idPledge, amount, idReceiver);
        }
    }

    /// @notice Authorizes multiple amounts within multiple Pledges to be
    ///  withdrawn from the `vault` in an efficient single call 
    /// @param pledgesAmounts An array of Pledge amounts and the idPledges with 
    ///  which the amounts are associated; these are extrapolated using the D64
    ///  bitmask
    function mWithdraw(uint[] pledgesAmounts) public {
        for (uint i = 0; i < pledgesAmounts.length; i++ ) {
            uint64 idPledge = uint64(pledgesAmounts[i] & (D64-1));
            uint amount = pledgesAmounts[i] / D64;

            withdraw(idPledge, amount);
        }
    }

    /// @notice `mConfirmPayment` allows for multiple pledges to be confirmed
    ///  efficiently
    /// @param pledgesAmounts An array of pledge amounts and IDs which are extrapolated
    ///  using the D64 bitmask
    function mConfirmPayment(uint[] pledgesAmounts) public {
        for (uint i = 0; i < pledgesAmounts.length; i++ ) {
            uint64 idPledge = uint64(pledgesAmounts[i] & (D64-1));
            uint amount = pledgesAmounts[i] / D64;

            confirmPayment(idPledge, amount);
        }
    }

    /// @notice `mCancelPayment` allows for multiple pledges to be canceled
    ///  efficiently
    /// @param pledgesAmounts An array of pledge amounts and IDs which are extrapolated
    ///  using the D64 bitmask
    function mCancelPayment(uint[] pledgesAmounts) public {
        for (uint i = 0; i < pledgesAmounts.length; i++ ) {
            uint64 idPledge = uint64(pledgesAmounts[i] & (D64-1));
            uint amount = pledgesAmounts[i] / D64;

            cancelPayment(idPledge, amount);
        }
    }

    /// @notice `mNormalizePledge` allows for multiple pledges to be
    ///  normalized efficiently
    /// @param pledges An array of pledge IDs
    function mNormalizePledge(uint64[] pledges) public {
        for (uint i = 0; i < pledges.length; i++ ) {
            normalizePledge(pledges[i]);
        }
    }
}
