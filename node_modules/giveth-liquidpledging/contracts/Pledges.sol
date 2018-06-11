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

import "@aragon/os/contracts/apps/AragonApp.sol";
import "./LiquidPledgingStorage.sol";

contract Pledges is AragonApp, LiquidPledgingStorage {

    // Limits inserted to prevent large loops that could prevent canceling
    uint constant MAX_DELEGATES = 10;

    // a constant for when a delegate is requested that is not in the system
    uint64 constant  NOTFOUND = 0xFFFFFFFFFFFFFFFF;

/////////////////////////////
// Public constant functions
////////////////////////////

    /// @notice A constant getter that returns the total number of pledges
    /// @return The total number of Pledges in the system
    function numberOfPledges() external view returns (uint) {
        return pledges.length - 1;
    }

    /// @notice A getter that returns the details of the specified pledge
    /// @param idPledge the id number of the pledge being queried
    /// @return the amount, owner, the number of delegates (but not the actual
    ///  delegates, the intendedProject (if any), the current commit time and
    ///  the previous pledge this pledge was derived from
    function getPledge(uint64 idPledge) external view returns(
        uint amount,
        uint64 owner,
        uint64 nDelegates,
        uint64 intendedProject,
        uint64 commitTime,
        uint64 oldPledge,
        address token,
        PledgeState pledgeState
    ) {
        Pledge memory p = _findPledge(idPledge);
        amount = p.amount;
        owner = p.owner;
        nDelegates = uint64(p.delegationChain.length);
        intendedProject = p.intendedProject;
        commitTime = p.commitTime;
        oldPledge = p.oldPledge;
        token = p.token;
        pledgeState = p.pledgeState;
    }


////////////////////
// Internal methods
////////////////////

    /// @notice This creates a Pledge with an initial amount of 0 if one is not
    ///  created already; otherwise it finds the pledge with the specified
    ///  attributes; all pledges technically exist, if the pledge hasn't been
    ///  created in this system yet it simply isn't in the hash array
    ///  hPledge2idx[] yet
    /// @param owner The owner of the pledge being looked up
    /// @param delegationChain The list of delegates in order of authority
    /// @param intendedProject The project this pledge will Fund after the
    ///  commitTime has passed
    /// @param commitTime The length of time in seconds the Giver has to
    ///   veto when the Giver's delegates Pledge funds to a project
    /// @param oldPledge This value is used to store the pledge the current
    ///  pledge was came from, and in the case a Project is canceled, the Pledge
    ///  will revert back to it's previous state
    /// @param state The pledge state: Pledged, Paying, or state
    /// @return The hPledge2idx index number
    function _findOrCreatePledge(
        uint64 owner,
        uint64[] delegationChain,
        uint64 intendedProject,
        uint64 commitTime,
        uint64 oldPledge,
        address token,
        PledgeState state
    ) internal returns (uint64)
    {
        bytes32 hPledge = keccak256(delegationChain, owner, intendedProject, commitTime, oldPledge, token, state);
        uint64 id = hPledge2idx[hPledge];
        if (id > 0) {
            return id;
        }

        id = uint64(pledges.length);
        hPledge2idx[hPledge] = id;
        pledges.push(
            Pledge(
                0,
                delegationChain,
                owner,
                intendedProject,
                commitTime,
                oldPledge,
                token,
                state
            )
        );
        return id;
    }

    /// @param idPledge the id of the pledge to load from storage
    /// @return The Pledge
    function _findPledge(uint64 idPledge) internal view returns(Pledge storage) {
        require(idPledge < pledges.length);
        return pledges[idPledge];
    }

    /// @notice A getter that searches the delegationChain for the level of
    ///  authority a specific delegate has within a Pledge
    /// @param p The Pledge that will be searched
    /// @param idDelegate The specified delegate that's searched for
    /// @return If the delegate chain contains the delegate with the
    ///  `admins` array index `idDelegate` this returns that delegates
    ///  corresponding index in the delegationChain. Otherwise it returns
    ///  the NOTFOUND constant
    function _getDelegateIdx(Pledge p, uint64 idDelegate) internal pure returns(uint64) {
        for (uint i = 0; i < p.delegationChain.length; i++) {
            if (p.delegationChain[i] == idDelegate) {
                return uint64(i);
            }
        }
        return NOTFOUND;
    }

    /// @notice A getter to find how many old "parent" pledges a specific Pledge
    ///  had using a self-referential loop
    /// @param p The Pledge being queried
    /// @return The number of old "parent" pledges a specific Pledge had
    function _getPledgeLevel(Pledge p) internal view returns(uint) {
        if (p.oldPledge == 0) {
            return 0;
        }
        Pledge storage oldP = _findPledge(p.oldPledge);
        return _getPledgeLevel(oldP) + 1; // a loop lookup
    }
}
