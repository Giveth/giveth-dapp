// The minimum ABI to handle any ERC20 Token balance, decimals and allowance approval
const ERC20ABI = [
  // read balanceOf
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  // read decimals
  // {
  //   constant: true,
  //   inputs: [],
  //   name: 'decimals',
  //   outputs: [{ name: '', type: 'uint8' }],
  //   type: 'function',
  // },
  // set allowance approval
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  // read allowance of a specific address
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function',
  },
];

let tokens;

export default ({ web3, tokenWhitelist }) => {
  if (tokens) return tokens;

  tokens = {};
  if (tokenWhitelist) {
    tokenWhitelist
      .filter(token => web3.utils.isAddress(token.address))
      .forEach(token => {
        tokens[token.address] = new web3.eth.Contract(ERC20ABI, token.address);
      });
  }

  return tokens;
};
