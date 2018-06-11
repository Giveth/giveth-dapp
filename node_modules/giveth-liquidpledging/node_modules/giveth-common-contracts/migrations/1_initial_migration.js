var Migrations = artifacts.require("./helpers/Migrations.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
