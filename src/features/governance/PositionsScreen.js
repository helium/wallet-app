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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
exports.PositionsScreen = void 0;
var BlurActionSheet_1 = require("@components/BlurActionSheet");
var Box_1 = require("@components/Box");
var ButtonPressable_1 = require("@components/ButtonPressable");
var Dot_1 = require("@components/Dot");
var ListItem_1 = require("@components/ListItem");
var Text_1 = require("@components/Text");
var helium_react_hooks_1 = require("@helium/helium-react-hooks");
var spl_utils_1 = require("@helium/spl-utils");
var spl_token_1 = require("@solana/spl-token");
var voter_stake_registry_hooks_1 = require("@helium/voter-stake-registry-hooks");
var useCurrentWallet_1 = require("@hooks/useCurrentWallet");
var useGovernanceMutations_1 = require("@hooks/useGovernanceMutations");
var useMetaplexMetadata_1 = require("@hooks/useMetaplexMetadata");
var native_1 = require("@react-navigation/native");
var GovernanceProvider_1 = require("@storage/GovernanceProvider");
var constants_1 = require("@utils/constants");
var dateTools_1 = require("@utils/dateTools");
var bn_js_1 = require("bn.js");
var react_1 = require("react");
var react_i18next_1 = require("react-i18next");
var ClaimingRewardsModal_1 = require("./ClaimingRewardsModal");
var DelegateTokensModal_1 = require("./DelegateTokensModal");
var GovernanceWrapper_1 = require("./GovernanceWrapper");
var LockTokensModal_1 = require("./LockTokensModal");
var PositionsList_1 = require("./PositionsList");
var VotingPowerCard_1 = require("./VotingPowerCard");
var PositionsScreen = function () {
    var _a, _b;
    var t = (0, react_i18next_1.useTranslation)().t;
    var wallet = (0, useCurrentWallet_1.useCurrentWallet)();
    var _c = (0, react_1.useState)(false), isLockModalOpen = _c[0], setIsLockModalOpen = _c[1];
    var _d = (0, react_1.useState)(true), automationEnabled = _d[0], setAutomationEnabled = _d[1];
    var _e = (0, GovernanceProvider_1.useGovernance)(), mint = _e.mint, registrar = _e.registrar, loading = _e.loading, refetchState = _e.refetch, positions = _e.positions;
    var symbol = (0, useMetaplexMetadata_1.useMetaplexMetadata)(mint).symbol;
    var _f = (0, helium_react_hooks_1.useOwnedAmount)(wallet, mint), ownedAmount = _f.amount, decimals = _f.decimals;
    var solBalance = (0, helium_react_hooks_1.useOwnedAmount)(wallet, spl_token_1.NATIVE_MINT).amount;
    var createPositionMutation = (0, useGovernanceMutations_1.useCreatePositionMutation)();
    var claimRewardsMutation = (0, useGovernanceMutations_1.useClaimRewardsMutation)();
    var delegateAllMutation = (0, useGovernanceMutations_1.useDelegatePositionMutation)();
    var positionsWithRewards = (0, react_1.useMemo)(function () { return positions === null || positions === void 0 ? void 0 : positions.filter(function (p) { return p.hasRewards; }); }, [positions]);
    var transactionError = (0, react_1.useMemo)(function () {
        if (createPositionMutation.error) {
            return createPositionMutation.error.message || t('gov.errors.lockTokens');
        }
        if (claimRewardsMutation.error) {
            return claimRewardsMutation.error.message || t('gov.errors.claimRewards');
        }
        return undefined;
    }, [createPositionMutation.error, claimRewardsMutation.error, t]);
    var showError = (0, react_1.useMemo)(function () {
        if (transactionError)
            return transactionError;
    }, [transactionError]);
    var isInsufficientSol = (0, react_1.useCallback)(function (fee) {
        if (!fee || typeof solBalance === 'undefined')
            return false;
        return BigInt(fee.amount) > solBalance;
    }, [solBalance]);
    var maxLockupAmount = ownedAmount && decimals
        ? (0, spl_utils_1.toNumber)(new bn_js_1.default(ownedAmount.toString()), decimals)
        : 0;
    var handleCalcLockupMultiplier = (0, react_1.useCallback)(function (lockupPeriodInDays) {
        return (registrar &&
            (0, voter_stake_registry_hooks_1.calcLockupMultiplier)({
                lockupSecs: (0, dateTools_1.daysToSecs)(lockupPeriodInDays),
                registrar: registrar,
                mint: mint,
            })) ||
            0;
    }, [mint, registrar]);
    var handlePrepareCreatePosition = (0, react_1.useCallback)(function (values) {
        if (!decimals)
            return;
        var amountToLock = (0, spl_utils_1.toBN)(values.amount, decimals);
        var subDaoMint = values.subDao
            ? values.subDao.pubkey.equals(constants_1.IOT_SUB_DAO_KEY)
                ? constants_1.Mints.IOT
                : constants_1.Mints.MOBILE
            : undefined;
        createPositionMutation
            .prepare({
            amount: amountToLock.toString(),
            lockupKind: values.lockupKind.value,
            lockupPeriodsInDays: values.lockupPeriodInDays,
            mint: mint.toBase58(),
            subDaoMint: subDaoMint,
            automationEnabled: automationEnabled,
        })
            .catch(function (e) { return console.warn('Fee estimate failed:', e); });
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createPositionMutation.prepare, automationEnabled, decimals, mint]);
    var handleLockTokens = (0, react_1.useCallback)(function (values) { return __awaiter(void 0, void 0, void 0, function () {
        var amount, lockupPeriodInDays, lockupKind, subDao, amountToLock, subDaoMint;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    amount = values.amount, lockupPeriodInDays = values.lockupPeriodInDays, lockupKind = values.lockupKind, subDao = values.subDao;
                    if (!(decimals && symbol)) return [3 /*break*/, 2];
                    amountToLock = (0, spl_utils_1.toBN)(amount, decimals);
                    subDaoMint = subDao
                        ? subDao.pubkey.equals(constants_1.IOT_SUB_DAO_KEY)
                            ? constants_1.Mints.IOT
                            : constants_1.Mints.MOBILE
                        : undefined;
                    return [4 /*yield*/, createPositionMutation.submit({
                            amount: amountToLock.toString(),
                            lockupKind: lockupKind.value,
                            lockupPeriodsInDays: lockupPeriodInDays,
                            mint: mint.toBase58(),
                            subDaoMint: subDaoMint,
                            automationEnabled: automationEnabled,
                        }, {
                            header: t('gov.transactions.lockTokens'),
                            message: t('gov.votingPower.lockYourTokens', {
                                amount: (0, spl_utils_1.humanReadable)(amountToLock, decimals),
                                symbol: symbol,
                                duration: (0, dateTools_1.getFormattedStringFromDays)(lockupPeriodInDays),
                            }),
                        })];
                case 1:
                    _a.sent();
                    refetchState();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); }, [
        createPositionMutation,
        automationEnabled,
        decimals,
        mint,
        refetchState,
        symbol,
        t,
    ]);
    var handleClaimRewards = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var positionMints;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(positionsWithRewards === null || positionsWithRewards === void 0 ? void 0 : positionsWithRewards.length)) return [3 /*break*/, 2];
                    positionMints = positionsWithRewards.map(function (p) { return p.mint.toBase58(); });
                    return [4 /*yield*/, claimRewardsMutation.submit({ positionMints: positionMints }, {
                            header: t('gov.transactions.claimRewards'),
                            message: 'Approve this transaction to claim your rewards',
                        })];
                case 1:
                    _a.sent();
                    refetchState();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); }, [claimRewardsMutation, positionsWithRewards, refetchState, t]);
    var _g = (0, react_1.useState)(false), isDelegateAllModalOpen = _g[0], setIsDelegateAllModalOpen = _g[1];
    var _h = (0, react_1.useState)(null), delegateAllSubDao = _h[0], setDelegateAllSubDao = _h[1];
    var _j = (0, react_1.useState)(true), delegateAllAutomationEnabled = _j[0], setDelegateAllAutomationEnabled = _j[1];
    var now = (0, helium_react_hooks_1.useSolanaUnixNow)();
    var subDaos = (0, voter_stake_registry_hooks_1.useSubDaos)().result;
    var delegatedPositions = (0, react_1.useMemo)(function () {
        return positions === null || positions === void 0 ? void 0 : positions.filter(function (p) { return p.isDelegated && p.delegatedSubDao; });
    }, [positions]);
    var unexpiredPositions = (0, react_1.useMemo)(function () {
        return positions === null || positions === void 0 ? void 0 : positions.filter(function (p) {
            return (p.lockup.kind.constant ||
                p.lockup.endTs.gt(new bn_js_1.default((now === null || now === void 0 ? void 0 : now.toString()) || '0'))) &&
                !p.isProxiedToMe;
        });
    }, [positions, now]);
    (0, react_1.useEffect)(function () {
        if (!subDaos || !delegatedPositions)
            return;
        var mobileSubDao = subDaos.find(function (sd) {
            return sd.pubkey.equals(constants_1.MOBILE_SUB_DAO_KEY);
        });
        var iotSubDao = subDaos.find(function (sd) { return sd.pubkey.equals(constants_1.IOT_SUB_DAO_KEY); });
        if (!mobileSubDao)
            return;
        var mobileDelegations = 0;
        var iotDelegations = 0;
        var totalDelegated = 0;
        delegatedPositions === null || delegatedPositions === void 0 ? void 0 : delegatedPositions.forEach(function (position) {
            if (position.isDelegated && position.delegatedSubDao) {
                totalDelegated += 1;
                if (position.delegatedSubDao.equals(constants_1.MOBILE_SUB_DAO_KEY)) {
                    mobileDelegations += 1;
                }
                else if (position.delegatedSubDao.equals(constants_1.IOT_SUB_DAO_KEY)) {
                    iotDelegations += 1;
                }
            }
        });
        if (totalDelegated === 0) {
            setDelegateAllSubDao(mobileSubDao);
        }
        else if (mobileDelegations === totalDelegated) {
            setDelegateAllSubDao(mobileSubDao);
        }
        else if (iotDelegations === totalDelegated && iotSubDao) {
            setDelegateAllSubDao(iotSubDao);
        }
        else if (mobileDelegations >= iotDelegations) {
            setDelegateAllSubDao(mobileSubDao);
        }
        else if (iotDelegations > mobileDelegations && iotSubDao) {
            setDelegateAllSubDao(iotSubDao);
        }
        else {
            setDelegateAllSubDao(mobileSubDao);
        }
    }, [subDaos, delegatedPositions]);
    (0, react_1.useEffect)(function () {
        if (isDelegateAllModalOpen &&
            delegateAllSubDao &&
            (unexpiredPositions === null || unexpiredPositions === void 0 ? void 0 : unexpiredPositions.length)) {
            var positionMints = unexpiredPositions.map(function (p) { return p.mint.toBase58(); });
            var subDaoMint = delegateAllSubDao.pubkey.equals(constants_1.IOT_SUB_DAO_KEY)
                ? constants_1.Mints.IOT
                : constants_1.Mints.MOBILE;
            delegateAllMutation
                .prepare({
                positionMints: positionMints,
                subDaoMint: subDaoMint,
                automationEnabled: delegateAllAutomationEnabled,
            })
                .catch(function (e) { return console.warn('Fee estimate failed:', e); });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDelegateAllModalOpen, delegateAllSubDao, delegateAllAutomationEnabled]);
    var handleDelegateAll = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var positionMints, subDaoMint;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(unexpiredPositions === null || unexpiredPositions === void 0 ? void 0 : unexpiredPositions.length) || !delegateAllSubDao)
                        return [2 /*return*/];
                    positionMints = unexpiredPositions.map(function (p) { return p.mint.toBase58(); });
                    subDaoMint = delegateAllSubDao.pubkey.equals(constants_1.IOT_SUB_DAO_KEY)
                        ? constants_1.Mints.IOT
                        : constants_1.Mints.MOBILE;
                    return [4 /*yield*/, delegateAllMutation.submit({
                            positionMints: positionMints,
                            subDaoMint: subDaoMint,
                            automationEnabled: delegateAllAutomationEnabled,
                        }, {
                            header: t('gov.transactions.delegatePosition'),
                            message: t('gov.positions.delegateAllMessage', {
                                subdao: delegateAllSubDao.dntMetadata.name,
                            }),
                        })];
                case 1:
                    _a.sent();
                    setIsDelegateAllModalOpen(false);
                    refetchState();
                    return [2 /*return*/];
            }
        });
    }); }, [
        delegateAllMutation,
        delegateAllSubDao,
        delegateAllAutomationEnabled,
        unexpiredPositions,
        refetchState,
        t,
    ]);
    var _k = (0, react_1.useState)(false), isManageSheetOpen = _k[0], setIsManageSheetOpen = _k[1];
    var navigation = (0, native_1.useNavigation)();
    // Prepare action sheet data for ListItem
    var manageActions = [
        {
            label: t('gov.transactions.lockTokens'),
            value: 'lock',
            onPress: function () {
                setIsManageSheetOpen(false);
                setIsLockModalOpen(true);
            },
            disabled: claimRewardsMutation.isPending || loading,
        },
        {
            label: t('gov.positions.delegateAll'),
            value: 'delegate',
            onPress: function () {
                setIsManageSheetOpen(false);
                setIsDelegateAllModalOpen(true);
            },
            disabled: loading || delegateAllMutation.isPending,
        },
        {
            label: t('gov.positions.proxyAll'),
            value: 'proxyAll',
            onPress: function () {
                setIsManageSheetOpen(false);
                navigation.navigate('AssignProxyScreen', {
                    mint: mint.toBase58(),
                    includeProxied: true,
                });
            },
            disabled: (positions === null || positions === void 0 ? void 0 : positions.length) === 0,
        },
        {
            label: t('gov.transactions.claimRewards'),
            value: 'claim',
            onPress: function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setIsManageSheetOpen(false);
                            return [4 /*yield*/, handleClaimRewards()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
            disabled: !(positionsWithRewards === null || positionsWithRewards === void 0 ? void 0 : positionsWithRewards.length) ||
                claimRewardsMutation.isPending ||
                loading,
            SecondaryIcon: (positionsWithRewards === null || positionsWithRewards === void 0 ? void 0 : positionsWithRewards.length) ? (<Dot_1.default filled color="green500" size={8}/>) : undefined,
        },
    ];
    return (<GovernanceWrapper_1.default selectedTab="positions">
      <Box_1.default flexDirection="column" flex={1}>
        <Box_1.default flex={1}>
          <PositionsList_1.PositionsList header={<VotingPowerCard_1.VotingPowerCard marginBottom="l"/>}/>
        </Box_1.default>
        {showError && (<Box_1.default flexDirection="row" justifyContent="center" alignItems="center" paddingTop="ms">
            <Text_1.default variant="body3Medium" color="red500">
              {showError}
            </Text_1.default>
          </Box_1.default>)}
        <Box_1.default flexDirection="row" paddingTop="m">
          {spl_utils_1.HNT_MINT.equals(mint) && (<Box_1.default flex={1} alignItems="center" flexDirection="row">
              {(positions === null || positions === void 0 ? void 0 : positions.length) === 0 ? (<ButtonPressable_1.default height={44} fontSize={12} borderRadius="round" borderWidth={2} borderColor="white" backgroundColorOpacityPressed={0.7} title={t('gov.transactions.lockTokens')} titleColor="white" onPress={function () { return setIsLockModalOpen(true); }} flexDirection="row" justifyContent="center" alignItems="center" innerContainerProps={{ justifyContent: 'center' }}/>) : (<>
                  <ButtonPressable_1.default height={44} fontSize={12} borderRadius="round" borderWidth={2} borderColor="white" backgroundColorOpacityPressed={0.7} title={t('gov.manage')} titleColor="white" onPress={function () { return setIsManageSheetOpen(true); }} flexDirection="row" justifyContent="center" alignItems="center" innerContainerProps={{ justifyContent: 'center' }} Icon={(positionsWithRewards === null || positionsWithRewards === void 0 ? void 0 : positionsWithRewards.length)
                    ? function () { return <Dot_1.default filled color="green500" size={8}/>; }
                    : undefined}/>
                  <BlurActionSheet_1.default title={t('gov.manage')} open={isManageSheetOpen} onClose={function () { return setIsManageSheetOpen(false); }}>
                    <Box_1.default>
                      {manageActions.map(function (action) { return (<ListItem_1.default key={action.value} title={action.label} onPress={action.onPress} disabled={action.disabled} SecondaryIcon={action.SecondaryIcon} hasDivider/>); })}
                    </Box_1.default>
                  </BlurActionSheet_1.default>
                </>)}
            </Box_1.default>)}
        </Box_1.default>
        {claimRewardsMutation.isPending && <ClaimingRewardsModal_1.ClaimingRewardsModal />}
        {isLockModalOpen && (<LockTokensModal_1.default insufficientBalance={isInsufficientSol(createPositionMutation.estimatedSolFee)} mint={mint} maxLockupAmount={maxLockupAmount} calcMultiplierFn={handleCalcLockupMultiplier} onClose={function () { return setIsLockModalOpen(false); }} onSubmit={handleLockTokens} onPrepare={handlePrepareCreatePosition} automationEnabled={automationEnabled} onSetAutomationEnabled={setAutomationEnabled} estimatedSolFee={(_a = createPositionMutation.estimatedSolFee) === null || _a === void 0 ? void 0 : _a.uiAmountString}/>)}
        {isDelegateAllModalOpen && (<DelegateTokensModal_1.DelegateTokensModal onClose={function () { return setIsDelegateAllModalOpen(false); }} onSubmit={handleDelegateAll} onSetAutomationEnabled={setDelegateAllAutomationEnabled} automationEnabled={delegateAllAutomationEnabled} estimatedSolFee={(_b = delegateAllMutation.estimatedSolFee) === null || _b === void 0 ? void 0 : _b.uiAmountString} insufficientBalance={isInsufficientSol(delegateAllMutation.estimatedSolFee)} subDao={delegateAllSubDao} setSubDao={setDelegateAllSubDao}/>)}
        {delegateAllMutation.error && (<Box_1.default flexDirection="row" justifyContent="center" alignItems="center" paddingTop="ms">
            <Text_1.default variant="body3Medium" color="red500">
              {delegateAllMutation.error.message}
            </Text_1.default>
          </Box_1.default>)}
      </Box_1.default>
    </GovernanceWrapper_1.default>);
};
exports.PositionsScreen = PositionsScreen;
exports.default = exports.PositionsScreen;
