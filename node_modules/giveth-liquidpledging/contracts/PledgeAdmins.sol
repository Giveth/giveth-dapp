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
import "./LiquidPledgingPlugins.sol";
import "@aragon/os/contracts/apps/AragonApp.sol";

contract PledgeAdmins is AragonApp, LiquidPledgingPlugins {

    // Limits inserted to prevent large loops that could prevent canceling
    uint constant MAX_SUBPROJECT_LEVEL = 20;
    uint constant MAX_INTERPROJECT_LEVEL = 20;

    // Events
    event GiverAdded(uint64 indexed idGiver, string url);
    event GiverUpdated(uint64 indexed idGiver, string url);
    event DelegateAdded(uint64 indexed idDelegate, string url);
    event DelegateUpdated(uint64 indexed idDelegate, string url);
    event ProjectAdded(uint64 indexed idProject, string url);
    event ProjectUpdated(uint64 indexed idProject, string url);

////////////////////
// Public functions
////////////////////

    /// @notice Creates a Giver Admin with the `msg.sender` as the Admin address
    /// @param name The name used to identify the Giver
    /// @param url The link to the Giver's profile often an IPFS hash
    /// @param commitTime The length of time in seconds the Giver has to
    ///   veto when the Giver's delegates Pledge funds to a project
    /// @param plugin This is Giver's liquid pledge plugin allowing for
    ///  extended functionality
    /// @return idGiver The id number used to reference this Admin
    function addGiver(
        string name,
        string url,
        uint64 commitTime,
        ILiquidPledgingPlugin plugin
    ) external returns (uint64 idGiver)
    {
        return addGiver(
            msg.sender,
            name,
            url,
            commitTime,
            plugin
        );
    }

    // TODO: is there an issue w/ allowing anyone to create a giver on behalf of another addy?
    function addGiver(
        address addr,
        string name,
        string url,
        uint64 commitTime,
        ILiquidPledgingPlugin plugin
    ) public returns (uint64 idGiver)
    {
        require(isValidPlugin(plugin)); // Plugin check

        idGiver = uint64(admins.length);

        // Save the fields
        admins.push(
            PledgeAdmin(
                PledgeAdminType.Giver,
                addr,
                commitTime,
                0,
                false,
                plugin,
                name,
                url)
        );

        GiverAdded(idGiver, url);
    }

    /// @notice Updates a Giver's info to change the address, name, url, or
    ///  commitTime, it cannot be used to change a plugin, and it must be called
    ///  by the current address of the Giver
    /// @param idGiver This is the Admin id number used to specify the Giver
    /// @param newAddr The new address that represents this Giver
    /// @param newName The new name used to identify the Giver
    /// @param newUrl The new link to the Giver's profile often an IPFS hash
    /// @param newCommitTime Sets the length of time in seconds the Giver has to
    ///   veto when the Giver's delegates Pledge funds to a project
    function updateGiver(
        uint64 idGiver,
        address newAddr,
        string newName,
        string newUrl,
        uint64 newCommitTime
    ) external 
    {
        PledgeAdmin storage giver = _findAdmin(idGiver);
        require(msg.sender == giver.addr);
        require(giver.adminType == PledgeAdminType.Giver); // Must be a Giver
        giver.addr = newAddr;
        giver.name = newName;
        giver.url = newUrl;
        giver.commitTime = newCommitTime;

        GiverUpdated(idGiver, newUrl);
    }

    /// @notice Creates a Delegate Admin with the `msg.sender` as the Admin addr
    /// @param name The name used to identify the Delegate
    /// @param url The link to the Delegate's profile often an IPFS hash
    /// @param commitTime Sets the length of time in seconds that this delegate
    ///  can be vetoed. Whenever this delegate is in a delegate chain the time
    ///  allowed to veto any event must be greater than or equal to this time.
    /// @param plugin This is Delegate's liquid pledge plugin allowing for
    ///  extended functionality
    /// @return idxDelegate The id number used to reference this Delegate within
    ///  the PLEDGE_ADMIN array
    function addDelegate(
        string name,
        string url,
        uint64 commitTime,
        ILiquidPledgingPlugin plugin
    ) external returns (uint64 idDelegate) 
    {
        require(isValidPlugin(plugin)); // Plugin check

        idDelegate = uint64(admins.length);

        admins.push(
            PledgeAdmin(
                PledgeAdminType.Delegate,
                msg.sender,
                commitTime,
                0,
                false,
                plugin,
                name,
                url)
        );

        DelegateAdded(idDelegate, url);
    }

    /// @notice Updates a Delegate's info to change the address, name, url, or
    ///  commitTime, it cannot be used to change a plugin, and it must be called
    ///  by the current address of the Delegate
    /// @param idDelegate The Admin id number used to specify the Delegate
    /// @param newAddr The new address that represents this Delegate
    /// @param newName The new name used to identify the Delegate
    /// @param newUrl The new link to the Delegate's profile often an IPFS hash
    /// @param newCommitTime Sets the length of time in seconds that this
    ///  delegate can be vetoed. Whenever this delegate is in a delegate chain
    ///  the time allowed to veto any event must be greater than or equal to
    ///  this time.
    function updateDelegate(
        uint64 idDelegate,
        address newAddr,
        string newName,
        string newUrl,
        uint64 newCommitTime
    ) external 
    {
        PledgeAdmin storage delegate = _findAdmin(idDelegate);
        require(msg.sender == delegate.addr);
        require(delegate.adminType == PledgeAdminType.Delegate);
        delegate.addr = newAddr;
        delegate.name = newName;
        delegate.url = newUrl;
        delegate.commitTime = newCommitTime;

        DelegateUpdated(idDelegate, newUrl);
    }

    /// @notice Creates a Project Admin with the `msg.sender` as the Admin addr
    /// @param name The name used to identify the Project
    /// @param url The link to the Project's profile often an IPFS hash
    /// @param projectAdmin The address for the trusted project manager
    /// @param parentProject The Admin id number for the parent project or 0 if
    ///  there is no parentProject
    /// @param commitTime Sets the length of time in seconds the Project has to
    ///   veto when the Project delegates to another Delegate and they pledge
    ///   those funds to a project
    /// @param plugin This is Project's liquid pledge plugin allowing for
    ///  extended functionality
    /// @return idProject The id number used to reference this Admin
    function addProject(
        string name,
        string url,
        address projectAdmin,
        uint64 parentProject,
        uint64 commitTime,
        ILiquidPledgingPlugin plugin
    ) external returns (uint64 idProject) 
    {
        require(isValidPlugin(plugin));

        if (parentProject != 0) {
            PledgeAdmin storage a = _findAdmin(parentProject);
            // getProjectLevel will check that parentProject has a `Project` adminType
            require(_getProjectLevel(a) < MAX_SUBPROJECT_LEVEL);
        }

        idProject = uint64(admins.length);

        admins.push(
            PledgeAdmin(
                PledgeAdminType.Project,
                projectAdmin,
                commitTime,
                parentProject,
                false,
                plugin,
                name,
                url)
        );

        ProjectAdded(idProject, url);
    }

    /// @notice Updates a Project's info to change the address, name, url, or
    ///  commitTime, it cannot be used to change a plugin or a parentProject,
    ///  and it must be called by the current address of the Project
    /// @param idProject The Admin id number used to specify the Project
    /// @param newAddr The new address that represents this Project
    /// @param newName The new name used to identify the Project
    /// @param newUrl The new link to the Project's profile often an IPFS hash
    /// @param newCommitTime Sets the length of time in seconds the Project has
    ///  to veto when the Project delegates to a Delegate and they pledge those
    ///  funds to a project
    function updateProject(
        uint64 idProject,
        address newAddr,
        string newName,
        string newUrl,
        uint64 newCommitTime
    ) external 
    {
        PledgeAdmin storage project = _findAdmin(idProject);

        require(msg.sender == project.addr);
        require(project.adminType == PledgeAdminType.Project);

        project.addr = newAddr;
        project.name = newName;
        project.url = newUrl;
        project.commitTime = newCommitTime;

        ProjectUpdated(idProject, newUrl);
    }

/////////////////////////////
// Public constant functions
/////////////////////////////

    /// @notice A constant getter used to check how many total Admins exist
    /// @return The total number of admins (Givers, Delegates and Projects) .
    function numberOfPledgeAdmins() external view returns(uint) {
        return admins.length - 1;
    }

    /// @notice A constant getter to check the details of a specified Admin
    /// @return addr Account or contract address for admin
    /// @return name Name of the pledgeAdmin
    /// @return url The link to the Project's profile often an IPFS hash
    /// @return commitTime The length of time in seconds the Admin has to veto
    ///   when the Admin delegates to a Delegate and that Delegate pledges those
    ///   funds to a project
    /// @return parentProject The Admin id number for the parent project or 0
    ///  if there is no parentProject
    /// @return canceled 0 for Delegates & Givers, true if a Project has been
    ///  canceled
    /// @return plugin This is Project's liquidPledging plugin allowing for
    ///  extended functionality
    function getPledgeAdmin(uint64 idAdmin) external view returns (
        PledgeAdminType adminType,
        address addr,
        string name,
        string url,
        uint64 commitTime,
        uint64 parentProject,
        bool canceled,
        address plugin
    ) {
        PledgeAdmin storage a = _findAdmin(idAdmin);
        adminType = a.adminType;
        addr = a.addr;
        name = a.name;
        url = a.url;
        commitTime = a.commitTime;
        parentProject = a.parentProject;
        canceled = a.canceled;
        plugin = address(a.plugin);
    }

    /// @notice A getter to find if a specified Project has been canceled
    /// @param projectId The Admin id number used to specify the Project
    /// @return True if the Project has been canceled
    function isProjectCanceled(uint64 projectId)
        public view returns (bool)
    {
        PledgeAdmin storage a = _findAdmin(projectId);

        if (a.adminType == PledgeAdminType.Giver) {
            return false;
        }

        assert(a.adminType == PledgeAdminType.Project);

        if (a.canceled) {
            return true;
        }
        if (a.parentProject == 0) {
            return false;
        }

        return isProjectCanceled(a.parentProject);
    }

///////////////////
// Internal methods
///////////////////

    /// @notice A getter to look up a Admin's details
    /// @param idAdmin The id for the Admin to lookup
    /// @return The PledgeAdmin struct for the specified Admin
    function _findAdmin(uint64 idAdmin) internal view returns (PledgeAdmin storage) {
        require(idAdmin < admins.length);
        return admins[idAdmin];
    }

    /// @notice Find the level of authority a specific Project has
    ///  using a recursive loop
    /// @param a The project admin being queried
    /// @return The level of authority a specific Project has
    function _getProjectLevel(PledgeAdmin a) internal view returns(uint64) {
        assert(a.adminType == PledgeAdminType.Project);

        if (a.parentProject == 0) {
            return(1);
        }

        PledgeAdmin storage parent = _findAdmin(a.parentProject);
        return _getProjectLevel(parent) + 1;
    }
}