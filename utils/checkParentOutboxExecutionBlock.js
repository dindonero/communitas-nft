const { providers, Wallet } = require('ethers')
const { BigNumber } = require('@ethersproject/bignumber')
const hre = require('hardhat')

const ethers = require('ethers')
const { arbLog, requireEnvVariables } = require('arb-shared-dependencies')
const {
    EthBridger,
    getArbitrumNetwork,
    registerCustomArbitrumNetwork, ChildTransactionReceipt, ChildToParentMessageStatus,
} = require('@arbitrum/sdk')
const { getBaseFee } = require('@arbitrum/sdk/dist/lib/utils/lib')
const {mapOrbitConfigToOrbitChain} = require("../utils/dist/mapOrbitConfigToOrbitChain")
const outputInfo = require('../utils/outputInfo.json');

const txHash = "0x37f3f2412cfeb66c3cd57ee64bd83cc1ca8b3c7c8a4131633ab437799ea51f69"

const main = async () => {
    /**
     * Set up: instantiate L1 / L2 wallets connected to providers
     */
    const walletPrivateKey = process.env.PRIVATE_KEY

    const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC)
    const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC)

    const l1Wallet = new Wallet(walletPrivateKey, l1Provider)
    const l2Wallet = new Wallet(walletPrivateKey, l2Provider)

    const orbitChain = await mapOrbitConfigToOrbitChain(outputInfo)

    /**
     * Add the default local network configuration to the SDK
     * to allow this script to run on a local node
     */
    registerCustomArbitrumNetwork(orbitChain)

    console.log(orbitChain)

    /**
     * First, let's find the Arbitrum txn from the txn hash provided
     */
    const receipt = await l2Provider.getTransactionReceipt(txHash)
    const l2Receipt = new ChildTransactionReceipt(receipt)

    /**
     * Note that in principle, a single transaction could trigger any number of outgoing messages; the common case will be there's only one.
     * For the sake of this script, we assume there's only one / just grad the first one.
     */
    const messages = await l2Receipt.getChildToParentMessages(l1Wallet)
    const childToParentMsg = messages[0]

    /**
     * Check if already executed
     */
    if ((await childToParentMsg.status(l2Provider)) === ChildToParentMessageStatus.EXECUTED) {
        console.log(`Message already executed! Nothing else to do here`)
        process.exit(1)
    }

    console.log(`Message executable in parent chain at expected block ${await childToParentMsg.getFirstExecutableBlock(l2Provider)}`)
    console.log(`Current block: ${l1Provider.blockNumber}`)

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })