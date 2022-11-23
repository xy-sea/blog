// 先安装 npm install express --save

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const sourceMap = require('source-map');

//设置允许跨域访问该服务.
app.all('*', function (res, req, next) {
  req.header('Access-Control-Allow-Origin', '*');
  req.header('Access-Control-Allow-Headers', 'Content-Type');
  req.header('Access-Control-Allow-Methods', '*');
  req.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

// 注意 res req的顺序
app.get('/getmap', (req, res) => {
  let fileName = req.query.fileName;
  let mapFile = path.join(__filename, '..', 'dist/js');
  let mapPath = path.join(mapFile, `${fileName}.map`);
  console.log('path', mapPath);
  fs.readFile(mapPath, function (err, data) {
    if (err) {
      console.error(err);
      return;
    }

    res.send(data);

    // var sourcesPathMap = {};
    // function fixPath(filepath) {
    //   return filepath.replace(/\.[\.\/]+/g, '');
    // }
    // var fileContent = data.toString(),
    //   fileObj = JSON.parse(fileContent),
    //   sources = fileObj.sources;
    // sources.map((item) => {
    //   sourcesPathMap[fixPath(item)] = item;
    // });
    // var consumer = new sourceMap.SourceMapConsumer(fileContent);
    // var lookup = {
    //   line: 1,
    //   column: 3071
    // };
    // var result = consumer.originalPositionFor(lookup);
    // var originSource = sourcesPathMap[result.source],
    //   sourcesContent = fileObj.sourcesContent[sources.indexOf(originSource)];
    // result.sourcesContent = sourcesContent;
    // console.log(result, '还原之后的 code');
    // req.send(result);

    // callback && callback(result);
    // const consumer = new sourceMap.SourceMapConsumer(data);
    // // 通过报错位置查找到对应的源文件名称以及报错行数
    // const lookUpResult = consumer.originalPositionFor({
    //   line: 1,
    //   column: 3071
    // });
    // console.log('lookUpResult', lookUpResult);
    // // 那么就可以通过 sourceContentFor 这个方法找到报错的源代码
    // const code = consumer.sourceContentFor(lookUpResult.source);
  });

  //   // fileObj = JSON.parse(fileContent),
  //   // sources = fileObj.sources;

  //   // sources.map((item) => {
  //   //   sourcesPathMap[fixPath(item)] = item;
  //   // });

  //   // var consumer = new sourceMap.SourceMapConsumer(fileContent);
  //   // var lookup = {
  //   //   line: parseInt(line),
  //   //   column: parseInt(column)
  //   // };
  //   // var result = consumer.originalPositionFor(lookup);

  //   // var originSource = sourcesPathMap[result.source],
  //   //   sourcesContent = fileObj.sourcesContent[sources.indexOf(originSource)];

  //   // result.sourcesContent = sourcesContent;

  //   // callback && callback(result);
  // });
});
app.listen(8083, () => {
  console.log('Server is running at http://localhost:8083');
});
