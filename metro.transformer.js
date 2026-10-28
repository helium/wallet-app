// react-native-svg-transformer 0.14 sends every file through the old
// metro-react-native-babel-transformer, which ignores Expo's
// `enableBabelRuntime: false` for polyfill scripts. Under `expo export:embed`
// that puts @babel/runtime requires into expo/virtual/streams.js, which runs
// before `require` exists, and Hermes throws at start-up. Only SVGs go to the
// SVG transformer; everything else goes to Expo's own Babel transformer.
const path = require('path')
const expoTransformer = require('@expo/metro-config/babel-transformer')
const svgTransformer = require('react-native-svg-transformer')

// Expo names the Babel config relative to projectRoot. The old transformer
// uses it as Babel `extends`, which Expo's transform worker cannot resolve
// from a bare name, so give it the absolute path.
const svgTransform = ({ options, ...props }) =>
  svgTransformer.transform({
    ...props,
    options: {
      ...options,
      extendsBabelConfigPath:
        options.extendsBabelConfigPath &&
        path.resolve(options.projectRoot, options.extendsBabelConfigPath),
    },
  })

module.exports.transform = (props) =>
  props.filename.endsWith('.svg')
    ? svgTransform(props)
    : expoTransformer.transform(props)
