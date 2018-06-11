/* global artifacts */
/* global contract */
/* global web3 */
/* global assert */

const assertFail = require("./helpers/assertFail.js");

const TestPayableEscapable = artifacts.require("../contracts/test/TestPayableEscapable.sol");
const TestToken = artifacts.require("../contracts/test/TestToken.sol");

contract("Escapable", (accounts) => {
    const ONEWEI = web3.toBigNumber("1");
    const {
        0: owner,
        1: escapeHatchCaller,
        2: escapeHatchDestination,
        3: someoneaddr,
        9: sometoken,
    } = accounts;

    let escapable;

    beforeEach(async () => {
        escapable = await TestPayableEscapable.new(
            sometoken,
            escapeHatchCaller, // _escapeHatchCaller
            escapeHatchDestination, // _escapeHatchDestination
        );
    });

    // / -- construction

    it("internal variables are created in constructor", async () => {
        assert.equal(await escapable.escapeHatchCaller(), escapeHatchCaller);
        assert.equal(await escapable.escapeHatchDestination(), escapeHatchDestination);
    });

    // / --- changeHatchEscapeCaller

    it("prevent non-authorized call to changeHatchEscapeCaller()", async () => {
        await assertFail(escapable.changeHatchEscapeCaller(someoneaddr, { from: someoneaddr }));
    });

    it("changeHatchEscapeCaller() changes the permission", async () => {
        await escapable.changeHatchEscapeCaller(someoneaddr, {
            from: escapeHatchCaller,
        });
        assert.equal(await escapable.escapeHatchCaller(), someoneaddr);
    });

    // / --- escapeHatch

    it("escapeHatchCaller can escapeHatch()", async () => {
        await escapable.escapeHatch(0, {
            from: escapeHatchCaller,
        });
    });

    it("owner can escapeHatch()", async () => {
        await escapable.escapeHatch(0, {
            from: owner,
        });
    });

    it("prevent non-authorized call to escapeHatch()", async () => {
        await assertFail(escapable.escapeHatch(0, { from: someoneaddr }));
    });

    it("escapeHatch(0x0) sends ether amount to the destination", async () => {
        const balance = web3.eth.getBalance(escapeHatchDestination);
        await escapable.send(ONEWEI, { from: someoneaddr });

        const result = await escapable.escapeHatch(0, {
            from: escapeHatchCaller,
        });
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[ 0 ].event, "EscapeHatchCalled");
        assert.equal(result.logs[ 0 ].args.amount, "1");

        assert.isTrue(web3.eth.getBalance(escapeHatchDestination).equals(balance.plus(ONEWEI)));
    });

    it("escapeHatch(_token) sends token amount to the destination", async () => {
        const token = await TestToken.new(owner, 1000);
        await token.transfer(escapable.address, 1000);
        assert.equal(await token.balanceOf(escapable.address), 1000);

        const result = await escapable.escapeHatch(token.address, {
            from: escapeHatchCaller,
        });
        assert.equal(result.logs.length, 1);
        assert.equal(result.logs[ 0 ].event, "EscapeHatchCalled");
        assert.equal(result.logs[ 0 ].args.amount, 1000);
        assert.equal(result.logs[ 0 ].args.token, token.address);

        assert.equal(await token.balanceOf(escapeHatchDestination), 1000);
    });

    it("can blacklist escape of ethers", async () => {
        const nonEtherEscapable = await TestPayableEscapable.new(
            0x0,
            escapeHatchCaller, // _escapeHatchCaller
            escapeHatchDestination, // _escapeHatchDestination
        );
        assert.equal(await nonEtherEscapable.isTokenEscapable(0x0), false);
        assert.equal(await nonEtherEscapable.isTokenEscapable(escapable.address), true);
        await assertFail(nonEtherEscapable.escapeHatch(0, { from: escapeHatchCaller }));
    });

    it("can blacklist escape of tokens", async () => {
        const token = await TestToken.new(owner, 1000);

        const nonTokenEscapable = await TestPayableEscapable.new(
            token.address,
            escapeHatchCaller, // _escapeHatchCaller
            escapeHatchDestination, // _escapeHatchDestination
        );

        assert.equal(await nonTokenEscapable.isTokenEscapable(0x0), true);
        assert.equal(await nonTokenEscapable.isTokenEscapable(token.address), false);

        await assertFail(nonTokenEscapable.escapeHatch(token.address, { from: escapeHatchCaller }));
    });

    it("throws if token transfer function returns false", async () => {
        const token = await TestToken.new(owner, 1000);
        await token.transfer(escapable.address, 1000);
        assert.equal(await token.balanceOf(escapable.address), 1000);

        await token.setFailOnTransfer(true);
        await assertFail(escapable.escapeHatch(token.address, { from: escapeHatchCaller }));
    });
});
