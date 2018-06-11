pragma solidity ^0.4.18;

/*
    Copyright 2017, Jordi Baylina
    Contributors: Adrià Massanet <adria@codecontext.io>, RJ Ewing, Griff
    Green, Arthur Lunn

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

import "./LiquidPledgingStorage.sol";
import "./PledgeAdmins.sol";
import "./Pledges.sol";
import "./EscapableApp.sol";

/// @dev `LiquidPledgingBase` is the base level contract used to carry out
///  liquidPledging's most basic functions, mostly handling and searching the
///  data structures
contract LiquidPledgingBase is EscapableApp, LiquidPledgingStorage, PledgeAdmins, Pledges {

    event Transfer(uint indexed from, uint indexed to, uint amount);
    event CancelProject(uint indexed idProject);

/////////////
// Modifiers
/////////////

    /// @dev The `vault`is the only addresses that can call a function with this
    ///  modifier
    modifier onlyVault() {
        require(msg.sender == address(vault));
        _;
    }

///////////////
// Constructor
///////////////

    function initialize(address _escapeHatchDestination) onlyInit public {
        require(false); // overload the EscapableApp
        _escapeHatchDestination;
    }

    /// @param _vault The vault where the ETH backing the pledges is stored
    /// @param _escapeHatchDestination The address of a safe location (usu a
    ///  Multisig) to send the ether held in this contract; if a neutral address
    ///  is required, the WHG Multisig is an option:
    ///  0x8Ff920020c8AD673661c8117f2855C384758C572 
    function initialize(address _vault, address _escapeHatchDestination) onlyInit public {
        super.initialize(_escapeHatchDestination);
        require(_vault != 0x0);

        vault = ILPVault(_vault);

        admins.length = 1; // we reserve the 0 admin
        pledges.length = 1; // we reserve the 0 pledge
    }


/////////////////////////////
// Public constant functions
/////////////////////////////

    /// @notice Getter to find Delegate w/ the Pledge ID & the Delegate index
    /// @param idPledge The id number representing the pledge being queried
    /// @param idxDelegate The index number for the delegate in this Pledge 
    function getPledgeDelegate(uint64 idPledge, uint64 idxDelegate) external view returns(
        uint64 idDelegate,
        address addr,
        string name
    ) {
        Pledge storage p = _findPledge(idPledge);
        idDelegate = p.delegationChain[idxDelegate - 1];
        PledgeAdmin storage delegate = _findAdmin(idDelegate);
        addr = delegate.addr;
        name = delegate.name;
    }

///////////////////
// Public functions
///////////////////

    /// @notice Only affects pledges with the Pledged PledgeState for 2 things:
    ///   #1: Checks if the pledge should be committed. This means that
    ///       if the pledge has an intendedProject and it is past the
    ///       commitTime, it changes the owner to be the proposed project
    ///       (The UI will have to read the commit time and manually do what
    ///       this function does to the pledge for the end user
    ///       at the expiration of the commitTime)
    ///
    ///   #2: Checks to make sure that if there has been a cancellation in the
    ///       chain of projects, the pledge's owner has been changed
    ///       appropriately.
    ///
    /// This function can be called by anybody at anytime on any pledge.
    ///  In general it can be called to force the calls of the affected 
    ///  plugins, which also need to be predicted by the UI
    /// @param idPledge This is the id of the pledge that will be normalized
    /// @return The normalized Pledge!
    function normalizePledge(uint64 idPledge) public returns(uint64) {
        Pledge storage p = _findPledge(idPledge);

        // Check to make sure this pledge hasn't already been used 
        // or is in the process of being used
        if (p.pledgeState != PledgeState.Pledged) {
            return idPledge;
        }

        // First send to a project if it's proposed and committed
        if ((p.intendedProject > 0) && ( _getTime() > p.commitTime)) {
            uint64 oldPledge = _findOrCreatePledge(
                p.owner,
                p.delegationChain,
                0,
                0,
                p.oldPledge,
                p.token,
                PledgeState.Pledged
            );
            uint64 toPledge = _findOrCreatePledge(
                p.intendedProject,
                new uint64[](0),
                0,
                0,
                oldPledge,
                p.token,
                PledgeState.Pledged
            );
            _doTransfer(idPledge, toPledge, p.amount);
            idPledge = toPledge;
            p = _findPledge(idPledge);
        }

        toPledge = _getOldestPledgeNotCanceled(idPledge);
        if (toPledge != idPledge) {
            _doTransfer(idPledge, toPledge, p.amount);
        }

        return toPledge;
    }

////////////////////
// Internal methods
////////////////////

    /// @notice A check to see if the msg.sender is the owner or the
    ///  plugin contract for a specific Admin
    /// @param idAdmin The id of the admin being checked
    function _checkAdminOwner(uint64 idAdmin) internal view {
        PledgeAdmin storage a = _findAdmin(idAdmin);
        require(msg.sender == address(a.plugin) || msg.sender == a.addr);
    }

    function _transfer( 
        uint64 idSender,
        uint64 idPledge,
        uint amount,
        uint64 idReceiver
    ) internal
    {
        require(idReceiver > 0); // prevent burning value
        idPledge = normalizePledge(idPledge);

        Pledge storage p = _findPledge(idPledge);
        PledgeAdmin storage receiver = _findAdmin(idReceiver);

        require(p.pledgeState == PledgeState.Pledged);

        // If the sender is the owner of the Pledge
        if (p.owner == idSender) {

            if (receiver.adminType == PledgeAdminType.Giver) {
                _transferOwnershipToGiver(idPledge, amount, idReceiver);
                return;
            } else if (receiver.adminType == PledgeAdminType.Project) {
                _transferOwnershipToProject(idPledge, amount, idReceiver);
                return;
            } else if (receiver.adminType == PledgeAdminType.Delegate) {

                uint recieverDIdx = _getDelegateIdx(p, idReceiver);
                if (p.intendedProject > 0 && recieverDIdx != NOTFOUND) {
                    // if there is an intendedProject and the receiver is in the delegationChain,
                    // then we want to preserve the delegationChain as this is a veto of the
                    // intendedProject by the owner

                    if (recieverDIdx == p.delegationChain.length - 1) {
                        uint64 toPledge = _findOrCreatePledge(
                            p.owner,
                            p.delegationChain,
                            0,
                            0,
                            p.oldPledge,
                            p.token,
                            PledgeState.Pledged);
                        _doTransfer(idPledge, toPledge, amount);
                        return;
                    }

                    _undelegate(idPledge, amount, p.delegationChain.length - receiverDIdx - 1);
                    return;
                }
                // owner is not vetoing an intendedProject and is transferring the pledge to a delegate,
                // so we want to reset the delegationChain
                idPledge = _undelegate(
                    idPledge,
                    amount,
                    p.delegationChain.length
                );
                _appendDelegate(idPledge, amount, idReceiver);
                return;
            }

            // This should never be reached as the receiver.adminType
            // should always be either a Giver, Project, or Delegate
            assert(false);
        }

        // If the sender is a Delegate
        uint senderDIdx = _getDelegateIdx(p, idSender);
        if (senderDIdx != NOTFOUND) {

            // And the receiver is another Giver
            if (receiver.adminType == PledgeAdminType.Giver) {
                // Only transfer to the Giver who owns the pledge
                assert(p.owner == idReceiver);
                _undelegate(idPledge, amount, p.delegationChain.length);
                return;
            }

            // And the receiver is another Delegate
            if (receiver.adminType == PledgeAdminType.Delegate) {
                uint receiverDIdx = _getDelegateIdx(p, idReceiver);

                // And not in the delegationChain
                if (receiverDIdx == NOTFOUND) {
                    idPledge = _undelegate(
                        idPledge,
                        amount,
                        p.delegationChain.length - senderDIdx - 1
                    );
                    _appendDelegate(idPledge, amount, idReceiver);
                    return;

                // And part of the delegationChain and is after the sender, then
                //  all of the other delegates after the sender are removed and
                //  the receiver is appended at the end of the delegationChain
                } else if (receiverDIdx > senderDIdx) {
                    idPledge = _undelegate(
                        idPledge,
                        amount,
                        p.delegationChain.length - senderDIdx - 1
                    );
                    _appendDelegate(idPledge, amount, idReceiver);
                    return;
                }

                // And is already part of the delegate chain but is before the
                //  sender, then the sender and all of the other delegates after
                //  the RECEIVER are removed from the delegationChain
                //TODO Check for Game Theory issues (from Arthur) this allows the sender to sort of go komakosi and remove himself and the delegates between himself and the receiver... should this authority be allowed?
                _undelegate(
                    idPledge,
                    amount,
                    p.delegationChain.length - receiverDIdx - 1
                );
                return;
            }

            // And the receiver is a Project, all the delegates after the sender
            //  are removed and the amount is pre-committed to the project
            if (receiver.adminType == PledgeAdminType.Project) {
                idPledge = _undelegate(
                    idPledge,
                    amount,
                    p.delegationChain.length - senderDIdx - 1
                );
                _proposeAssignProject(idPledge, amount, idReceiver);
                return;
            }
        }
        assert(false);  // When the sender is not an owner or a delegate
    }

    /// @notice `transferOwnershipToProject` allows for the transfer of
    ///  ownership to the project, but it can also be called by a project
    ///  to un-delegate everyone by setting one's own id for the idReceiver
    /// @param idPledge the id of the pledge to be transfered.
    /// @param amount Quantity of value that's being transfered
    /// @param idReceiver The new owner of the project (or self to un-delegate)
    function _transferOwnershipToProject(
        uint64 idPledge,
        uint amount,
        uint64 idReceiver
    ) internal 
    {
        Pledge storage p = _findPledge(idPledge);

        // Ensure that the pledge is not already at max pledge depth
        // and the project has not been canceled
        require(_getPledgeLevel(p) < MAX_INTERPROJECT_LEVEL);
        require(!isProjectCanceled(idReceiver));

        uint64 oldPledge = _findOrCreatePledge(
            p.owner,
            p.delegationChain,
            0,
            0,
            p.oldPledge,
            p.token,
            PledgeState.Pledged
        );
        uint64 toPledge = _findOrCreatePledge(
            idReceiver,                     // Set the new owner
            new uint64[](0),                // clear the delegation chain
            0,
            0,
            oldPledge,
            p.token,
            PledgeState.Pledged
        );
        _doTransfer(idPledge, toPledge, amount);
    }   


    /// @notice `transferOwnershipToGiver` allows for the transfer of
    ///  value back to the Giver, value is placed in a pledged state
    ///  without being attached to a project, delegation chain, or time line.
    /// @param idPledge the id of the pledge to be transferred.
    /// @param amount Quantity of value that's being transferred
    /// @param idReceiver The new owner of the pledge
    function _transferOwnershipToGiver(
        uint64 idPledge,
        uint amount,
        uint64 idReceiver
    ) internal 
    {
        Pledge storage p = _findPledge(idPledge);

        uint64 toPledge = _findOrCreatePledge(
            idReceiver,
            new uint64[](0),
            0,
            0,
            0,
            p.token,
            PledgeState.Pledged
        );
        _doTransfer(idPledge, toPledge, amount);
    }

    /// @notice `appendDelegate` allows for a delegate to be added onto the
    ///  end of the delegate chain for a given Pledge.
    /// @param idPledge the id of the pledge thats delegate chain will be modified.
    /// @param amount Quantity of value that's being chained.
    /// @param idReceiver The delegate to be added at the end of the chain
    function _appendDelegate(
        uint64 idPledge,
        uint amount,
        uint64 idReceiver
    ) internal 
    {
        Pledge storage p = _findPledge(idPledge);

        require(p.delegationChain.length < MAX_DELEGATES);
        uint64[] memory newDelegationChain = new uint64[](
            p.delegationChain.length + 1
        );
        for (uint i = 0; i < p.delegationChain.length; i++) {
            newDelegationChain[i] = p.delegationChain[i];
        }

        // Make the last item in the array the idReceiver
        newDelegationChain[p.delegationChain.length] = idReceiver;

        uint64 toPledge = _findOrCreatePledge(
            p.owner,
            newDelegationChain,
            0,
            0,
            p.oldPledge,
            p.token,
            PledgeState.Pledged
        );
        _doTransfer(idPledge, toPledge, amount);
    }

    /// @notice `appendDelegate` allows for a delegate to be added onto the
    ///  end of the delegate chain for a given Pledge.
    /// @param idPledge the id of the pledge thats delegate chain will be modified.
    /// @param amount Quantity of value that's shifted from delegates.
    /// @param q Number (or depth) of delegates to remove
    /// @return toPledge The id for the pledge being adjusted or created
    function _undelegate(
        uint64 idPledge,
        uint amount,
        uint q
    ) internal returns (uint64 toPledge)
    {
        Pledge storage p = _findPledge(idPledge);
        uint64[] memory newDelegationChain = new uint64[](
            p.delegationChain.length - q
        );

        for (uint i = 0; i < p.delegationChain.length - q; i++) {
            newDelegationChain[i] = p.delegationChain[i];
        }
        toPledge = _findOrCreatePledge(
            p.owner,
            newDelegationChain,
            0,
            0,
            p.oldPledge,
            p.token,
            PledgeState.Pledged
        );
        _doTransfer(idPledge, toPledge, amount);
    }

    /// @notice `proposeAssignProject` proposes the assignment of a pledge
    ///  to a specific project.
    /// @dev This function should potentially be named more specifically.
    /// @param idPledge the id of the pledge that will be assigned.
    /// @param amount Quantity of value this pledge leader would be assigned.
    /// @param idReceiver The project this pledge will potentially 
    ///  be assigned to.
    function _proposeAssignProject(
        uint64 idPledge,
        uint amount,
        uint64 idReceiver
    ) internal 
    {
        Pledge storage p = _findPledge(idPledge);

        require(_getPledgeLevel(p) < MAX_INTERPROJECT_LEVEL);
        require(!isProjectCanceled(idReceiver));

        uint64 toPledge = _findOrCreatePledge(
            p.owner,
            p.delegationChain,
            idReceiver,
            uint64(_getTime() + _maxCommitTime(p)),
            p.oldPledge,
            p.token,
            PledgeState.Pledged
        );
        _doTransfer(idPledge, toPledge, amount);
    }

    /// @notice `doTransfer` is designed to allow for pledge amounts to be 
    ///  shifted around internally.
    /// @param from This is the id of the pledge from which value will be transferred.
    /// @param to This is the id of the pledge that value will be transferred to.
    /// @param _amount The amount of value that will be transferred.
    function _doTransfer(uint64 from, uint64 to, uint _amount) internal {
        uint amount = _callPlugins(true, from, to, _amount);
        if (from == to) {
            return;
        }
        if (amount == 0) {
            return;
        }

        Pledge storage pFrom = _findPledge(from);
        Pledge storage pTo = _findPledge(to);

        require(pFrom.amount >= amount);
        pFrom.amount -= amount;
        pTo.amount += amount;

        Transfer(from, to, amount);
        _callPlugins(false, from, to, amount);
    }

    /// @notice A getter to find the longest commitTime out of the owner and all
    ///  the delegates for a specified pledge
    /// @param p The Pledge being queried
    /// @return The maximum commitTime out of the owner and all the delegates
    function _maxCommitTime(Pledge p) internal view returns(uint64 commitTime) {
        PledgeAdmin storage a = _findAdmin(p.owner);
        commitTime = a.commitTime; // start with the owner's commitTime

        for (uint i = 0; i < p.delegationChain.length; i++) {
            a = _findAdmin(p.delegationChain[i]);

            // If a delegate's commitTime is longer, make it the new commitTime
            if (a.commitTime > commitTime) {
                commitTime = a.commitTime;
            }
        }
    }

    /// @notice A getter to find the oldest pledge that hasn't been canceled
    /// @param idPledge The starting place to lookup the pledges
    /// @return The oldest idPledge that hasn't been canceled (DUH!)
    function _getOldestPledgeNotCanceled(
        uint64 idPledge
    ) internal view returns(uint64)
    {
        if (idPledge == 0) {
            return 0;
        }

        Pledge storage p = _findPledge(idPledge);
        PledgeAdmin storage admin = _findAdmin(p.owner);
        
        if (admin.adminType == PledgeAdminType.Giver) {
            return idPledge;
        }

        assert(admin.adminType == PledgeAdminType.Project);
        if (!isProjectCanceled(p.owner)) {
            return idPledge;
        }

        return _getOldestPledgeNotCanceled(p.oldPledge);
    }

    /// @notice `callPlugin` is used to trigger the general functions in the
    ///  plugin for any actions needed before and after a transfer happens.
    ///  Specifically what this does in relation to the plugin is something
    ///  that largely depends on the functions of that plugin. This function
    ///  is generally called in pairs, once before, and once after a transfer.
    /// @param before This toggle determines whether the plugin call is occurring
    ///  before or after a transfer.
    /// @param adminId This should be the Id of the *trusted* individual
    ///  who has control over this plugin.
    /// @param fromPledge This is the Id from which value is being transfered.
    /// @param toPledge This is the Id that value is being transfered to.
    /// @param context The situation that is triggering the plugin. See plugin
    ///  for a full description of contexts.
    /// @param amount The amount of value that is being transfered.
    function _callPlugin(
        bool before,
        uint64 adminId,
        uint64 fromPledge,
        uint64 toPledge,
        uint64 context,
        address token,
        uint amount
    ) internal returns (uint allowedAmount) 
    {
        uint newAmount;
        allowedAmount = amount;
        PledgeAdmin storage admin = _findAdmin(adminId);

        // Checks admin has a plugin assigned and a non-zero amount is requested
        if (address(admin.plugin) != 0 && allowedAmount > 0) {
            // There are two separate functions called in the plugin.
            // One is called before the transfer and one after
            if (before) {
                newAmount = admin.plugin.beforeTransfer(
                    adminId,
                    fromPledge,
                    toPledge,
                    context,
                    token,
                    amount
                );
                require(newAmount <= allowedAmount);
                allowedAmount = newAmount;
            } else {
                admin.plugin.afterTransfer(
                    adminId,
                    fromPledge,
                    toPledge,
                    context,
                    token,
                    amount
                );
            }
        }
    }

    /// @notice `callPluginsPledge` is used to apply plugin calls to
    ///  the delegate chain and the intended project if there is one.
    ///  It does so in either a transferring or receiving context based
    ///  on the `p` and  `fromPledge` parameters.
    /// @param before This toggle determines whether the plugin call is occuring
    ///  before or after a transfer.
    /// @param idPledge This is the id of the pledge on which this plugin
    ///  is being called.
    /// @param fromPledge This is the Id from which value is being transfered.
    /// @param toPledge This is the Id that value is being transfered to.
    /// @param amount The amount of value that is being transfered.
    function _callPluginsPledge(
        bool before,
        uint64 idPledge,
        uint64 fromPledge,
        uint64 toPledge,
        uint amount
    ) internal returns (uint allowedAmount) 
    {
        // Determine if callPlugin is being applied in a receiving
        // or transferring context
        uint64 offset = idPledge == fromPledge ? 0 : 256;
        allowedAmount = amount;
        Pledge storage p = _findPledge(idPledge);

        // Always call the plugin on the owner
        allowedAmount = _callPlugin(
            before,
            p.owner,
            fromPledge,
            toPledge,
            offset,
            p.token,
            allowedAmount
        );

        // Apply call plugin to all delegates
        for (uint64 i = 0; i < p.delegationChain.length; i++) {
            allowedAmount = _callPlugin(
                before,
                p.delegationChain[i],
                fromPledge,
                toPledge,
                offset + i + 1,
                p.token,
                allowedAmount
            );
        }

        // If there is an intended project also call the plugin in
        // either a transferring or receiving context based on offset
        // on the intended project
        if (p.intendedProject > 0) {
            allowedAmount = _callPlugin(
                before,
                p.intendedProject,
                fromPledge,
                toPledge,
                offset + 255,
                p.token,
                allowedAmount
            );
        }
    }

    /// @notice `callPlugins` calls `callPluginsPledge` once for the transfer
    ///  context and once for the receiving context. The aggregated 
    ///  allowed amount is then returned.
    /// @param before This toggle determines whether the plugin call is occurring
    ///  before or after a transfer.
    /// @param fromPledge This is the Id from which value is being transferred.
    /// @param toPledge This is the Id that value is being transferred to.
    /// @param amount The amount of value that is being transferred.
    function _callPlugins(
        bool before,
        uint64 fromPledge,
        uint64 toPledge,
        uint amount
    ) internal returns (uint allowedAmount) 
    {
        allowedAmount = amount;

        // Call the plugins in the transfer context
        allowedAmount = _callPluginsPledge(
            before,
            fromPledge,
            fromPledge,
            toPledge,
            allowedAmount
        );

        // Call the plugins in the receive context
        allowedAmount = _callPluginsPledge(
            before,
            toPledge,
            fromPledge,
            toPledge,
            allowedAmount
        );
    }

/////////////
// Test functions
/////////////

    /// @notice Basic helper function to return the current time
    function _getTime() internal view returns (uint) {
        return now;
    }
}
