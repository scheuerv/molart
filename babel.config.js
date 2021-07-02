module.exports = {
  presets: [
    [
      '@babel/preset-env', {
        targets: { node: "current" },
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ],
    '@babel/preset-typescript',
  ],
  env: {
    test: {
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }
  }
};