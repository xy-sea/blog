function loader (source) {
  console.log("async-loader");
  let cb = this.async()
  setTimeout(() => {
    console.log('ok');
    // 在异步回调中手动调用 cb 返回处理结果
    cb(null, source);
  }, 3000)
}

module.exports = loader
