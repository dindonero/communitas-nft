require('@nomiclabs/hardhat-ethers')
const { hardhatConfig } = require('arb-shared-dependencies')

hardhatConfig.solidity.compilers.push({
    version: "0.8.24",
    settings: {}
})

module.exports = hardhatConfig