const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  chainWebpack(config) {
    config.optimization.minimize(false);
  }
});
