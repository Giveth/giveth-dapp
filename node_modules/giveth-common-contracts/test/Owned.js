/* global artifacts */
/* global contract */
/* global assert */

const assertFail = require("./helpers/assertFail.js");

const Owned = artifacts.require("../contracts/Owned.sol");

contract("Owned", (accounts) => {
    let owned;

    const {
        0: owner1,
        1: owner2,
        3: someoneaddr,
    } = accounts;

    beforeEach(async () => {
        owned = await Owned.new();
    });

    it("should have an owner assigned to msg.sender initially", async () => {
        assert.equal((await owned.owner()), owner1);
    });

    it("changes owner after changeOwnership call, and a log is genearated", async () => {
        const result = await owned.changeOwnership(someoneaddr);
        assert.isTrue(await owned.owner() === someoneaddr);

        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[ 0 ].event, "OwnershipTransferred");
        assert.equal(result.logs[ 0 ].args.from, owner1);
        assert.equal(result.logs[ 0 ].args.to, someoneaddr);
    });

    it("should prevent non-owners from transfering ownership", async () => {
        await assertFail(owned.changeOwnership(someoneaddr, { from: someoneaddr }));
    });

    it("should prevent transfering ownership to zero", async () => {
        await assertFail(owned.changeOwnership(0));
    });

    it("changes owner after proposeOwnership & acceptOwnership call, and a log is genearated", async () => {
        let result = await owned.proposeOwnership(owner2);
        assert.equal(await owned.newOwnerCandidate(), owner2);

        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[ 0 ].event, "OwnershipRequested");
        assert.equal(result.logs[ 0 ].args.by, owner1);
        assert.equal(result.logs[ 0 ].args.to, owner2);

        result = await owned.acceptOwnership({ from: owner2 });
        assert.equal(await owned.newOwnerCandidate(), 0);
        assert.equal(await owned.owner(), owner2);

        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[ 0 ].event, "OwnershipTransferred");
        assert.equal(result.logs[ 0 ].args.from, owner1);
        assert.equal(result.logs[ 0 ].args.to, owner2);
    });

    it("non-owners cannot call proposeOwnership", async () => {
        await assertFail(owned.proposeOwnership(someoneaddr, { from: someoneaddr }));
    });

    it("address non proposed for new membership cannot call acceptOwnership", async () => {
        await assertFail(owned.acceptOwnership({ from: owner2 }));
    });

    it("ownership can be removed", async () => {
        const result = await owned.removeOwnership(0xdac);
        assert.equal(await owned.owner(), 0);
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[ 0 ].event, "OwnershipRemoved");
    });

    it("ownership cannot be removed without using 0xdac parameter", async () => {
        await assertFail(owned.removeOwnership(0xdac1));
    });

    it("ownership cannot be removed by non-owner", async () => {
        await assertFail(owned.removeOwnership(0xdac, { from: someoneaddr }));
    });
});
