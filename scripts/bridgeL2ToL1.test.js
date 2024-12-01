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

requireEnvVariables(['PRIVATE_KEY', 'L2RPC', 'L1RPC'])

/**
 * Set up: instantiate L1 / L2 wallets connected to providers
 */
const walletPrivateKey = process.env.PRIVATE_KEY

const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC)
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC)

const l1Wallet = new Wallet(walletPrivateKey, l1Provider)
const l2Wallet = new Wallet(walletPrivateKey, l2Provider)

const main = async () => {
    await arbLog('Cross-chain NFT Bridge L2 to L1')

    const orbitChain = await mapOrbitConfigToOrbitChain(outputInfo)

    /**
     * Add the default local network configuration to the SDK
     * to allow this script to run on a local node
     */
    registerCustomArbitrumNetwork(orbitChain)

    /**
     * Use l2Network to create an Arbitrum SDK EthBridger instance
     * We'll use EthBridger to retrieve the Inbox address
     */

    const l2Network = await getArbitrumNetwork(l2Provider)
    const ethBridger = new EthBridger(l2Network)

    const inboxAddress = ethBridger.childNetwork.ethBridge.inbox

    /**
     * We deploy L1 Greeter to L1, L2 greeter to L2, each with a different "greeting" message.
     * After deploying, save set each contract's counterparty's address to its state so that they can later talk to each other.
     */
    const L1NFT = await (
        await hre.ethers.getContractFactory('CommunitasNFTL1')
    ).connect(l1Wallet) //
    console.log('Deploying L1 NFT 👋')
    const l1NFT = await L1NFT.deploy(
        ethers.constants.AddressZero, // temp l2 addr
        inboxAddress
    )
    await l1NFT.deployed()
    console.log(`deployed to ${l1NFT.address}`)
    const L2NFT = await (
        await hre.ethers.getContractFactory('CommunitasNFTL2')
    ).connect(l2Wallet)

    console.log('Deploying L2 NFT 👋👋')

    const l2NFT = await L2NFT.deploy(
        ethers.constants.AddressZero // temp l1 addr
    )
    await l2NFT.deployed()
    console.log(`deployed to ${l2NFT.address}`)

    const updateL2Tx = await l2NFT.updatel1Target(l1NFT.address)
    await updateL2Tx.wait()

    const updateL1Tx = await l1NFT.updatel2Target(l2NFT.address)
    await updateL1Tx.wait()
    console.log('Counterpart contract addresses set in both greeters 👍')

    const index = await l2NFT.tokenCounter()
    const mintTx = await l2NFT.mint()
    await mintTx.wait()


    /**
     * Let's log the L2 greeting string
     */

    console.log('Bridging NFT from L2 to L1:')

    const tx = await l2NFT.bridgeToL1(index)
    await tx.wait()

    /**
     * First, let's find the Arbitrum txn from the txn hash provided
     */
    const receipt = await l2Provider.getTransactionReceipt(tx.hash)
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

    /**
     * before we try to execute out message, we need to make sure the l2 block it's included in is confirmed! (It can only be confirmed after the dispute period; Arbitrum is an optimistic rollup after-all)
     * waitUntilReadyToExecute() waits until the item outbox entry exists
     */
    const timeToWaitMs = 1000 * 60
    console.log(
        "Waiting for the outbox entry to be created. This only happens when the L2 block is confirmed on L1, ~1 week after it's creation."
    )
    console.log(`Message executable in parent chain at expected block ${await childToParentMsg.getFirstExecutableBlock(l2Provider)}`)
    await childToParentMsg.waitUntilReadyToExecute(l2Provider, timeToWaitMs)
    console.log('Outbox entry exists! Trying to execute now')

    /**
     * Now that its confirmed and not executed, we can execute our message in its outbox entry.
     */
    const res = await childToParentMsg.execute(l2Provider)
    const rec = await res.wait()
    console.log('Done! Your transaction is executed', rec)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })