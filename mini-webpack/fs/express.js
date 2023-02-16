const express = require("express")
const app = express()
const fs = require("fs")
const babylon = require("babylon")
const code = "const a = 1"
const express = babylon.parse(code)
var readline = require('readline'); // 逐行读取文件，保证读取的内容原样输出


app.get("/express", function(req, res) {
  res.send(express)
})
app.get("/readFileSync", function(req, res) {
  let content = fs.readFileSync('../example/entry.js', 'utf-8');
  res.send(content)
})

// 逐行读取文件
app.get('/readline', function (req,res) {
  var fRead = fs.createReadStream('package.json');
  var objReadline = readline.createInterface({
    input:fRead
  });
  var arr = new Array();
  objReadline.on('line',function (line) {
    arr.push(`<br>${line}`);
  });
  objReadline.on('close',function () {
    res.send(arr.toString().replace(/,,/g, ',').replace(/{,/g, '{').replace(/},/g, '}'))
  });
})


app.get('/rmdir', function (req,res,next) {
  fs.rmdir('css', err => {
    if (err) {
      console.log(err)
      res.send(err)
    } else {
      res.send('目录删除成功')
    }
  })
})
// fs.writeFile 写入文件
app.get('/writeFile', function (req,res,next) {
  fs.writeFile('fs/index.js', '写入内容', err => { // 如果要写入的文件(index.js)不存在, 系统会自动创建一个index.js文件，并将内容写入文件，注意: 该函数不能连续写入，只能写入一次，不能连续写入
    if (err) {
      console.log(err)
      res.send(err)
    } else {
      res.send('写入成功')
    }
  })
})
// fs.writeFile 连续写入文件
app.get('/appendFile', function (req,res,next) {
  fs.appendFile('fs/fs.js', `\n追加内容写入的内容`, err => { // 如果要写入的文件(index.js)不存在, 系统会自动创建一个index.js文件，并将内容连续写入文件
    if (err) {
      console.log(err)
      res.send(err)
    } else {
      res.send('追加成功')
    }
  })
})


app.listen(8088)
