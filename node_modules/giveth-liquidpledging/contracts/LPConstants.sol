pragma solidity ^0.4.18;

import "@aragon/os/contracts/kernel/KernelStorage.sol";

contract LPConstants is KernelConstants {
    bytes32 constant public VAULT_APP_ID = keccak256("vault");
    bytes32 constant public LP_APP_ID = keccak256("liquidPledging");
}