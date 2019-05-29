import { utils } from 'web3';
import Donation from './Donation';

// Test User model
describe('Donation Model', () => {
  const attributes = [
    'amount',
    'commitTime',
    'confirmations',
    'createdAt',
    'delegateId',
    'delegateEntity',
    'delegateTypeId',
    'giver',
    'giverAddress',
    'intendedProjectId',
    'ownerId',
    'ownerEntity',
    'ownerTypeId',
    'ownerType',
    'pledgeId',
    'requiredConfirmations',
    'status',
    'txHash',
    'updatedAt',
  ];

  const TestDonationData = {
    _id: 'LI8DRcQUIR8DPzPF',
    amount: '1000000000000000000',
    commitTime: '2018-05-07T14:44:04.000Z',
    confirmations: 6,
    createdAt: '2018-05-07T14:44:04.000Z',
    delegateId: 22,
    delegateEntity: {},
    delegateTypeId: '5hkSCaKZ0vetWytd',
    giver: {},
    giverAddress: '0x812ea1c4C193Ffa12a3789405E3050a066FCbE25',
    intendedProjectId: '0',
    ownerId: '1',
    ownerEntity: {},
    ownerTypeId: '0x812ea1c4C193Ffa12a3789405E3050a066FCbE25',
    ownerType: 'giver',
    pledgeId: '9',
    requiredConfirmations: 6,
    status: 'waiting',
    txHash: '0x8e2604b0672a17972885ab4696001da11836d949c07911e9df4d906b9f8fbe1b',
    updatedAt: '2018-05-07T14:45:39.885Z',
  };

  const TestDonationData2 = {
    _id: '85gP0S0tnAxxKXZi',
    amount: '1000000000000000000',
    confirmations: 6,
    createdAt: '2018-05-18T07:48:35.000Z',
    giver: {},
    giverAddress: '0x53516256736bEbf6b5ACd3aBA9994A064247cF9D',
    ownerId: '19',
    ownerEntity: {},
    ownerTypeId: '0x53516256736bEbf6b5ACd3aBA9994A064247cF9D',
    ownerType: 'giver',
    pledgeId: '14',
    requiredConfirmations: 6,
    status: 'waiting',
    txHash: '0x3cfffcc005fc27c8ad9158d195684d611baa616446de620ea05601e38198b0f6',
  };

  const TestDonationData3 = {
    amount: '500000000000000000',
    confirmations: 6,
    createdAt: '2018-05-18T13:44:05.000Z',
    giverAddress: '0x53516256736bEbf6b5ACd3aBA9994A064247cF9D',
    ownerId: '19',
    ownerEntity: {
      address: '0x53516256736bEbf6b5ACd3aBA9994A064247cF9D',
      avatar:
        'https://feathers.develop.giveth.io/uploads/6ceac1fdd83eab5ce3399a1e9e3cb89f9f5999a86e50139a838864aedae6559e.jpeg',
      commitTime: '259200',
      createdAt: '2018-05-03T13:44:22.219Z',
      email: 'vojtech@giveth.io',
      giverId: '19',
      name: 'Vojtech Simetka',
      updatedAt: '2018-05-12T15:10:15.323Z',
      _id: '0HatccsLMhOIWZXZ',
    },
    ownerTypeId: '0x53516256736bEbf6b5ACd3aBA9994A064247cF9D',
    ownerType: 'giver',
    pledgeId: '14',
    requiredConfirmations: 6,
    status: 'waiting',
    txHash: '0x32e428b17b97133aa0b465d105eabf256a080aa8c5e970374d9c203050a0f229',
    _id: '61HvBYgvkGvOyoYT',
  };

  const TestDonation = new Donation(TestDonationData);

  it('should have correct id', () => {
    expect(TestDonation.id).toBe(TestDonationData._id); // eslint-disable-line
  });

  attributes.forEach(a => {
    it(`should have correct ${a}`, () => {
      if (a === 'amount') TestDonation[a] = utils.toWei(TestDonation[a].toFixed(), 'ether'); // convert bigNumber object to wei string
      expect(TestDonation[a]).toBe(TestDonationData[a]);
    });
  });

  const TestDonation2 = new Donation(TestDonationData2);

  it('should have correct id', () => {
    expect(TestDonation2.id).toBe(TestDonationData2._id); // eslint-disable-line
  });
  attributes.forEach(a => {
    it(`should have correct ${a}`, () => {
      if (a === 'amount') TestDonation2[a] = utils.toWei(TestDonation2[a].toFixed(), 'ether'); // convert bigNumber object to wei string
      expect(TestDonation2[a]).toBe(TestDonationData2[a]);
    });
  });

  const TestDonation3 = new Donation(TestDonationData3);

  it('should have correct id', () => {
    expect(TestDonation3.id).toBe(TestDonationData3._id); // eslint-disable-line
  });
  attributes.forEach(a => {
    it(`should have correct ${a}`, () => {
      if (a === 'amount') TestDonation3[a] = utils.toWei(TestDonation3[a].toFixed(), 'ether'); // convert bigNumber object to wei string
      expect(TestDonation3[a]).toBe(TestDonationData3[a]);
    });
  });
  //
  // it('should have correct commitTime', () => {
  //   expect(TestUser.commitTime).toBe(TestUserData.commitTime);
  // });
  //
  // it('should have correct email', () => {
  //   expect(TestUser.email).toBe(TestUserData.email);
  // });
  //
  // it('should have correct giverId', () => {
  //   expect(TestUser.giverId).toBe(TestUserData.giverId);
  // });
  //
  // it('should have correct linkedin', () => {
  //   expect(TestUser.linkedin).toBe(TestUserData.linkedin);
  // });
  //
  // it('should have correct name', () => {
  //   expect(TestUser.name).toBe(TestUserData.name);
  // });
  //
  // it('should have correct address after reassigning', () => {
  //   TestUser.address = TestUserData2.address;
  //   expect(TestUser.address).toBe(TestUserData2.address);
  // });
  //
  // it('should have correct avatar after reassigning', () => {
  //   TestUser.avatar = TestUserData2.avatar;
  //   expect(TestUser.avatar).toBe(TestUserData2.avatar);
  // });
  //
  // it('should have correct commitTime after reassigning', () => {
  //   TestUser.commitTime = TestUserData2.commitTime;
  //   expect(TestUser.commitTime).toBe(TestUserData2.commitTime);
  // });
  //
  // it('should have correct email after reassigning', () => {
  //   TestUser.email = TestUserData2.email;
  //   expect(TestUser.email).toBe(TestUserData2.email);
  // });
  //
  // it('should have correct giverId after reassigning', () => {
  //   TestUser.giverId = TestUserData2.giverId;
  //   expect(TestUser.giverId).toBe(TestUserData2.giverId);
  // });
  //
  // it('should have correct linkedin after reassigning', () => {
  //   TestUser.linkedin = TestUserData2.linkedin;
  //   expect(TestUser.linkedin).toBe(TestUserData2.linkedin);
  // });
  //
  // it('should have correct name after reassigning', () => {
  //   TestUser.name = TestUserData2.name;
  //   expect(TestUser.name).toBe(TestUserData2.name);
  // });
  //
  // it('should throw TypeError on wrong address type', () => {
  //   expect(() => {
  //     TestUser.address = TestUserDataWrong.address;
  //   }).toThrow(TypeError);
  // });
  //
  // it('should throw TypeError on wrong avatar type', () => {
  //   expect(() => {
  //     TestUser.avatar = TestUserDataWrong.avatar;
  //   }).toThrow(TypeError);
  // });
  //
  // it('should throw TypeError on wrong commitTime type', () => {
  //   expect(() => {
  //     TestUser.commitTime = TestUserDataWrong.commitTime;
  //   }).toThrow(TypeError);
  // });
  //
  // it('should throw TypeError on wrong email type', () => {
  //   expect(() => {
  //     TestUser.email = TestUserDataWrong.email;
  //   }).toThrow(TypeError);
  // });
  //
  // it('should throw TypeError on wrong giverId type', () => {
  //   expect(() => {
  //     TestUser.giverId = TestUserDataWrong.giverId;
  //   }).toThrow(TypeError);
  // });
  //
  // it('should throw TypeError on wrong linkedin type', () => {
  //   expect(() => {
  //     TestUser.linkedin = TestUserDataWrong.linkedin;
  //   }).toThrow(TypeError);
  // });
  //
  // it('should throw TypeError on wrong name type', () => {
  //   expect(() => {
  //     TestUser.name = TestUserDataWrong.name;
  //   }).toThrow(TypeError);
  // });
});
