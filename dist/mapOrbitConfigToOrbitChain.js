"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var RollupAdminLogic__factory_1 = require("@arbitrum/sdk/dist/lib/abi/factories/RollupAdminLogic__factory");
var providers_1 = require("@ethersproject/providers");
var mapOrbitConfigToOrbitChain = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var rollup, confirmPeriodBlocks;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                rollup = RollupAdminLogic__factory_1.RollupAdminLogic__factory.connect(data.coreContracts.rollup, new providers_1.StaticJsonRpcProvider((_a = process.env.L1RPC) !== null && _a !== void 0 ? _a : "https://sepolia-rollup.arbitrum.io/rpc", data.chainInfo.parentChainId));
                return [4 /*yield*/, rollup.confirmPeriodBlocks()];
            case 1:
                confirmPeriodBlocks = (_b = (_c.sent()).toNumber()) !== null && _b !== void 0 ? _b : 150;
                return [2 /*return*/, {
                        chainId: data.chainInfo.chainId,
                        confirmPeriodBlocks: confirmPeriodBlocks,
                        ethBridge: {
                            bridge: data.coreContracts.bridge,
                            inbox: data.coreContracts.inbox,
                            outbox: data.coreContracts.outbox,
                            rollup: data.coreContracts.rollup,
                            sequencerInbox: data.coreContracts.sequencerInbox
                        },
                        isCustom: true,
                        isTestnet: false,
                        name: data.chainInfo.chainName,
                        parentChainId: data.chainInfo.parentChainId,
                        nativeToken: data.chainInfo.nativeToken,
                        tokenBridge: {
                            parentCustomGateway: data.tokenBridgeContracts.l2Contracts.customGateway,
                            parentErc20Gateway: data.tokenBridgeContracts.l2Contracts.standardGateway,
                            parentGatewayRouter: data.tokenBridgeContracts.l2Contracts.router,
                            parentMultiCall: data.tokenBridgeContracts.l2Contracts.multicall,
                            parentProxyAdmin: data.tokenBridgeContracts.l2Contracts.proxyAdmin,
                            parentWeth: data.tokenBridgeContracts.l2Contracts.weth,
                            parentWethGateway: data.tokenBridgeContracts.l2Contracts.wethGateway,
                            childCustomGateway: data.tokenBridgeContracts.l3Contracts.customGateway,
                            childErc20Gateway: data.tokenBridgeContracts.l3Contracts.standardGateway,
                            childGatewayRouter: data.tokenBridgeContracts.l3Contracts.router,
                            childMultiCall: data.tokenBridgeContracts.l3Contracts.multicall,
                            childProxyAdmin: data.tokenBridgeContracts.l3Contracts.proxyAdmin,
                            childWeth: data.tokenBridgeContracts.l3Contracts.weth,
                            childWethGateway: data.tokenBridgeContracts.l3Contracts.wethGateway
                        }
                    }];
        }
    });
}); };
exports.default = mapOrbitConfigToOrbitChain;
