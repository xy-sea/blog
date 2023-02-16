// 先安装 npm install express --save

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const serveStatic = require('serve-static');
const rootPath = path.join(__dirname, 'dist');
app.use(serveStatic(rootPath));

//设置允许跨域访问该服务.
app.all('*', function (res, req, next) {
  req.header('Access-Control-Allow-Origin', '*');
  req.header('Access-Control-Allow-Headers', 'Content-Type');
  req.header('Access-Control-Allow-Methods', '*');
  req.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

// 获取js.map源码文件
app.get('/getmap', (req, res) => {
  // req.query 获取接口参数
  let fileName = req.query.fileName;
  let mapFile = path.join(__filename, '..', 'dist/js');
  // 拿到dist目录下对应map文件的路径
  let mapPath = path.join(mapFile, `${fileName}.map`);
  console.log('path', mapPath);
  fs.readFile(mapPath, function (err, data) {
    if (err) {
      return;
    }
    res.send(data);
  });
});
app.listen(8083, () => {
  console.log('Server is running at http://localhost:8083');
});
