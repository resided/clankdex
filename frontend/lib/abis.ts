export const FACTORY_ABI = [
  {
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_symbol', type: 'string' },
      { name: '_imageURI', type: 'string' }
    ],
    name: 'createToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'MINT_FEE',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getTokenCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_user', type: 'address' }],
    name: 'userHasToken',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_user', type: 'address' }],
    name: 'getUserToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'allTokens',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: true, name: 'tokenAddress', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'symbol', type: 'string' },
      { indexed: false, name: 'dna', type: 'uint256' }
    ],
    name: 'TokenCreated',
    type: 'event'
  }
] as const;

export const TOKEN_ABI = [
  {
    inputs: [],
    name: 'creature',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'species', type: 'string' },
      { name: 'dna', type: 'uint256' },
      { name: 'level', type: 'uint8' },
      { name: 'hp', type: 'uint8' },
      { name: 'attack', type: 'uint8' },
      { name: 'defense', type: 'uint8' },
      { name: 'speed', type: 'uint8' },
      { name: 'special', type: 'uint8' },
      { name: 'element', type: 'string' },
      { name: 'imageURI', type: 'string' },
      { name: 'createdAt', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'creator',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCreatureData',
    outputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'species', type: 'string' },
          { name: 'dna', type: 'uint256' },
          { name: 'level', type: 'uint8' },
          { name: 'hp', type: 'uint8' },
          { name: 'attack', type: 'uint8' },
          { name: 'defense', type: 'uint8' },
          { name: 'speed', type: 'uint8' },
          { name: 'special', type: 'uint8' },
          { name: 'element', type: 'string' },
          { name: 'imageURI', type: 'string' },
          { name: 'createdAt', type: 'uint256' }
        ],
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;
