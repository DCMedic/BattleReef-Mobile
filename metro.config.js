const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required by expo-sqlite's web worker. Native builds are unaffected.
config.resolver.assetExts.push('wasm');

module.exports = config;
