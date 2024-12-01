const { providers, Wallet } = require('ethers')
const { BigNumber } = require('@ethersproject/bignumber')
const hre = require('hardhat')

const ethers = require('ethers')
const { arbLog, requireEnvVariables } = require('arb-shared-dependencies')
const {
    EthBridger,
    getArbitrumNetwork,
    registerCustomArbitrumNetwork,
    ParentToChildMessageGasEstimator, ParentTransactionReceipt, ParentToChildMessageStatus
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
    await arbLog('Cross-chain NFT Bridge L1 to L2')

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

    const index = await l1NFT.tokenCounter()
    const mintTx = await l1NFT.mint()
    await mintTx.wait()

    /**
     * Let's log the L2 greeting string
     */

    console.log('Bridging NFT from L1 to L2:')

    /**
     * Now we can query the required gas params using the estimateAll method in Arbitrum SDK
     */
    const parentToChildMessageGasEstimator = new ParentToChildMessageGasEstimator(l2Provider)

    /**
     * To be able to estimate the gas related params to our L1-L2 message, we need to know how many bytes of calldata out retryable ticket will require
     * i.e., we need to calculate the calldata for the function being called (setGreeting())
     */
    const ABI = ['function mintFromBridge(address receiver, uint256 tokenId)']
    const iface = new ethers.utils.Interface(ABI)
    const calldata = iface.encodeFunctionData('mintFromBridge', [l1Wallet.address, index])

    /**
     * Users can override the estimated gas params when sending an L1-L2 message
     * Note that this is totally optional
     * Here we include and example for how to provide these overriding values
     */

    const RetryablesGasOverrides = {
        gasLimit: {
            base: undefined, // when undefined, the value will be estimated from rpc
            min: BigNumber.from(10000), // set a minimum gas limit, using 10000 as an example
            percentIncrease: BigNumber.from(30), // how much to increase the base for buffer
        },
        maxSubmissionFee: {
            base: undefined,
            percentIncrease: BigNumber.from(30),
        },
        maxFeePerGas: {
            base: undefined,
            percentIncrease: BigNumber.from(30),
        },
    }

    /**
     * The estimateAll method gives us the following values for sending an L1->L2 message
     * (1) maxSubmissionCost: The maximum cost to be paid for submitting the transaction
     * (2) gasLimit: The L2 gas limit
     * (3) deposit: The total amount to deposit on L1 to cover L2 gas and L2 call value
     */
    const parentToChildMessageGasParams = await parentToChildMessageGasEstimator.estimateAll(
        {
            from: await l1NFT.address,
            to: await l2NFT.address,
            l2CallValue: 0,
            excessFeeRefundAddress: l2Wallet.address,
            callValueRefundAddress: l2Wallet.address,
            data: calldata,
        },
        await getBaseFee(l1Provider),
        l1Provider,
        RetryablesGasOverrides //if provided, it will override the estimated values. Note that providing "RetryablesGasOverrides" is totally optional.
    )
    console.log(
        `Current retryable base submission price is: ${parentToChildMessageGasParams.maxSubmissionCost.toString()}`
    )

    /**
     * For the L2 gas price, we simply query it from the L2 provider, as we would when using L1
     */
    const gasPriceBid = await l2Provider.getGasPrice()
    console.log(`L2 gas price: ${gasPriceBid.toString()}`)

    console.log(
        `Sending greeting to L2 with ${parentToChildMessageGasParams.deposit.toString()} callValue for L2 fees:`
    )
    const bridgeToL1Tx = await l1NFT.bridgeToL2(
        index, // string memory _greeting,
        parentToChildMessageGasParams.maxSubmissionCost,
        parentToChildMessageGasParams.gasLimit,
        gasPriceBid,
        {
            value: parentToChildMessageGasParams.deposit,
        }
    )
    const bridgeToL1Rec = await bridgeToL1Tx.wait()

    console.log(
        `Greeting txn confirmed on L1! 🙌 ${bridgeToL1Rec.transactionHash}`
    )

    const l1TxReceipt = new ParentTransactionReceipt(bridgeToL1Rec)

    /**
     * In principle, a single L1 txn can trigger any number of L1-to-L2 messages (each with its own sequencer number).
     * In this case, we know our txn triggered only one
     * Here, We check if our L1 to L2 message is redeemed on L2
     */
    const messages = await l1TxReceipt.getParentToChildMessages(l2Wallet)
    const message = messages[0]
    console.log('Waiting for the L2 execution of the transaction. This may take up to 10-15 minutes ⏰')
    const messageResult = await message.waitForStatus()
    const status = messageResult.status
    if (status === ParentToChildMessageStatus.REDEEMED) {
        console.log(
            `L2 retryable ticket is executed 🥳 ${messageResult.childTxReceipt.transactionHash}`
        )
    } else {
        console.log(
            `L2 retryable ticket is failed with status ${ParentToChildMessageStatus[status]}`
        )
    }

    /**
     * Note that during L2 execution, a retryable's sender address is transformed to its L2 alias.
     * Thus, when GreeterL2 checks that the message came from the L1, we check that the sender is this L2 Alias.
     * See setGreeting in GreeterL2.sol for this check.
     */

    /**
     * Now when we call greet again, we should see our new string on L2!
     */
    const ownerOnL2 = await l2NFT.ownerOf(index)
    console.log(`Updated L2 NFT ${index}: owner "${ownerOnL2}" 🥳`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })