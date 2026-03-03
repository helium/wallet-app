"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimingRewardsModal = void 0;
var AnimatedBox_1 = require("@components/AnimatedBox");
var FadeInOut_1 = require("@components/FadeInOut");
var portal_1 = require("@gorhom/portal");
var react_1 = require("react");
var Text_1 = require("@components/Text");
var SafeAreaBox_1 = require("@components/SafeAreaBox");
var Box_1 = require("@components/Box");
var AccountIcon_1 = require("@components/AccountIcon");
var react_i18next_1 = require("react-i18next");
var AccountStorageProvider_1 = require("@storage/AccountStorageProvider");
var react_native_1 = require("react-native");
var ClaimingRewardsModal = function () {
    var t = (0, react_i18next_1.useTranslation)().t;
    var currentAccount = (0, AccountStorageProvider_1.useAccountStorage)().currentAccount;
    var edges = (0, react_1.useMemo)(function () { return ['bottom']; }, []);
    return (<portal_1.Portal hostName="GovernancePortalHost">
      {/* This is because Android sucks and does not support expo blur and the experimental feature is trash :) */}
      {react_native_1.Platform.OS === 'android' && (<Box_1.default position="absolute" zIndex={0} left={0} top={0} height="100%" width="100%" backgroundColor="black"/>)}
      <AnimatedBox_1.ReAnimatedBlurBox entering={FadeInOut_1.FadeInFast} position="absolute" height="100%" width="100%" tint="dark" intensity={80}>
        <SafeAreaBox_1.default edges={edges} backgroundColor="transparent" flex={1} padding="m" marginHorizontal="s" marginVertical="xs">
          <Box_1.default flexGrow={1} justifyContent="center" alignItems="center">
            <Box_1.default shadowColor="black" shadowOpacity={0.4} shadowOffset={{ width: 0, height: 10 }} shadowRadius={10} elevation={12}>
              <AccountIcon_1.default address={currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.solanaAddress} size={76}/>
            </Box_1.default>
            <Text_1.default textAlign="left" variant="subtitle2" adjustsFontSizeToFit marginTop="m" marginBottom="ms">
              {t('gov.claiming.title')}
            </Text_1.default>
            <Box_1.default paddingHorizontal="l" marginBottom="m">
              <Text_1.default variant="subtitle4" color="secondaryText" marginBottom="s" textAlign="center">
                {t('gov.claiming.body')}
              </Text_1.default>
              <Text_1.default variant="subtitle4" color="flamenco" textAlign="center">
                {t('gov.claiming.multiple')}
              </Text_1.default>
            </Box_1.default>
          </Box_1.default>
        </SafeAreaBox_1.default>
      </AnimatedBox_1.ReAnimatedBlurBox>
    </portal_1.Portal>);
};
exports.ClaimingRewardsModal = ClaimingRewardsModal;
