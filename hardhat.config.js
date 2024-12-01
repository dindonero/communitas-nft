require('@nomiclabs/hardhat-ethers')
const { hardhatConfig } = require('arb-shared-dependencies')
require("@nomicfoundation/hardhat-verify");

hardhatConfig.solidity.compilers.push({
    version: "0.8.24",
    settings: {}
})

hardhatConfig.networks.arbitrumSepolia = {
    url: hardhatConfig.networks.l1.url
}

hardhatConfig.etherscan = {
    apiKey: {
        arbitrumSepolia: process.env.ETHERSCAN_KEY
    }
}

module.exports = hardhatConfig