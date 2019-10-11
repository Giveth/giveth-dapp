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
    inputs: [{ name: '_giverId', type: 'uint64' }, { name: '_receiverId', type: 'uint64' }],
    name: 'newFundsForwarder',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export default {};
