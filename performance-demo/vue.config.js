const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
// const CompressionPlugin = require('compression-webpack-plugin');
const HappyPack = require('happypack');
const os = require('os');
// 开辟一个线程池，拿到系统CPU的核数，happypack 将编译工作利用所有线程
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });

module.exports = {
  transpileDependencies: true,
  productionSourceMap: false,
  devServer: {
    proxy: {
      '/logstorage': {
        target: 'ttp://10.106.0.138:8083',
        changeOrigin: true, //  target是域名的话，需要这个参数，
        secure: false //  设置支持https协议的代理,
      }
    }
  },
  configureWebpack: {
    externals: {
      vue: 'Vue',
      'vue-router': 'VueRouter',
      axios: 'axios',
      echarts: 'echarts'
    },
    plugins: [
      new MomentLocalesPlugin({
        localesToKeep: ['zh-cn']
      }),
      // new CompressionPlugin({
      //   test: /\.(js|css)(\?.*)?$/i, //需要压缩的文件正则
      //   threshold: 1024, //文件大小大于这个值时启用压缩
      //   deleteOriginalAssets: false //压缩后保留原文件
      // }),
      new HappyPack({
        id: 'happybabel',
        loaders: ['babel-loader'],
        threadPool: happyThreadPool
      })
    ]
  }
};
