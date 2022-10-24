module.exports = {
  presets: ['@vue/cli-plugin-babel/preset'],
  plugins: [
    [
      require('babel-plugin-await-add-trycatch'),
      {
        exclude: [],
        include: [],
        customLog: 'Error'
      }
    ]
  ]
};
