export const factoryAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: '_giver', type: 'address' },
      { indexed: true, name: '_receiverId', type: 'uint64' },
      { indexed: false, name: 'fundsForwarder', type: 'address' },
    ],
    name: 'NewFundForwarder',
    type: 'event',
  },
  {
    constant: false,
    inputs: [
      { name: '_giverId', type: 'uint64' },
      { name: '_receiverId', type: 'uint64' },
    ],
    name: 'newFundsForwarder',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export const abi = [
  {
    constant: false,
    inputs: [{ name: '_token', type: 'address' }],
    name: 'forward',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ name: '_tokens', type: 'address[]' }],
    name: 'forwardMultiple',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_molochDao', type: 'address' },
      { name: '_convertWeth', type: 'bool' },
    ],
    name: 'forwardMoloch',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'to', type: 'address' },
      { indexed: false, name: 'token', type: 'address' },
      { indexed: false, name: 'balance', type: 'uint256' },
    ],
    name: 'Forwarded',
    type: 'event',
  },
];

export const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

export default {};
