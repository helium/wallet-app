// react-native-svg-transformer 0.14 sends every file through the old
// metro-react-native-babel-transformer, which ignores Expo's
// `enableBabelRuntime: false` for polyfill scripts. Under `expo export:embed`
// that puts @babel/runtime requires into expo/virtual/streams.js, which runs
// before `require` exists, and Hermes throws at start-up. Only SVGs go to the
// SVG transformer; everything else goes to Expo's own Babel transformer.
const expoTransformer = require('@expo/metro-config/babel-transformer')
const svgTransformer = require('react-native-svg-transformer')

module.exports.transform = (props) =>
  props.filename.endsWith('.svg')
    ? svgTransformer.transform(props)
    : expoTransformer.transform(props)
