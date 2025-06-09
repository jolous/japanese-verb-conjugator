// config-overrides.js
module.exports = function override(config, env) {
  // Add fallback for the Node "path" module using path-browserify
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve("path-browserify"),
  };
  return config;
};


