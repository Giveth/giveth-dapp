/* global assert */

module.exports = async (callback) => {
    try {
        await callback;
    } catch (error) {
        if (error.message.search("VM Exception while processing transaction") !== -1) return;
        throw error;
    }
    assert(false, "Transaction should fail");
};
