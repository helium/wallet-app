module.exports = {
  assets: ['./src/assets/fonts/'],
  dependencies: {
    // lottie-react-native pins lottie-ios to an exact pod version; autolinking
    // the npm package would add a second, newer lottie-ios pod.
    'lottie-ios': { platforms: { ios: null } },
  },
}
