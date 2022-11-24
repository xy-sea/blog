import Vue from 'vue';
import App from './App.vue';
import router from './router';
import ErrorStackParser from 'error-stack-parser';
import sourceMap from 'source-map-js';

Vue.config.productionTip = false;

// 资源加载错误
function resourceTransform(target) {
  return {
    action_type: 'RESOURCE_ERROR',
    happen_time: new Date().getTime(),
    source_url: `资源加载失败： ${target.src.slice(0, 100) || target.href.slice(0, 100)} `,
    element_type: target.localName
  };
}

window.addEventListener(
  'error',
  (err) => {
    console.log('err', err);

    // 资源加载错误 提取有用数据
    if (err.target.localName) {
      const data = resourceTransform(err.target);
      // 上报错误
      console.log('data', data);
      return;
    }
    // code error
    let stackFrame = ErrorStackParser.parse(err.error)[0];
    console.log('stackFrame', stackFrame);
    let { fileName, columnNumber, lineNumber } = stackFrame;
    findCodeBySourceMap({
      fileName,
      line: lineNumber,
      column: columnNumber
    });
  },
  true // true必须加（冒泡阶段捕获），不加捕获不到资源加载异常
);

window.addEventListener('unhandledrejection', (err) => {
  console.log('err', err);
  // code error
  let stackFrame = ErrorStackParser.parse(err.reason)[0];
  console.log('unhandledrejection', stackFrame);
  let { fileName, columnNumber, lineNumber } = stackFrame;
  findCodeBySourceMap({
    fileName,
    line: lineNumber,
    column: columnNumber
  });
});

Vue.config.errorHandler = async (err) => {
  console.log(err);
  const stackFrame = ErrorStackParser.parse(err)[0];
  console.log(stackFrame, '错误堆栈');
  findCodeBySourceMap({
    fileName: stackFrame.fileName,
    line: stackFrame.lineNumber,
    column: stackFrame.columnNumber
  });
  // findCodeBySourceMap({
  //   fileName: 'http://localhost:3000/js/app.de87f606.js',
  //   line: 1,
  //   column: 895
  // });
};

// 找到以.js结尾的fileName
function matchStr(str) {
  if (str.endsWith('.js')) return str.substring(str.lastIndexOf('/') + 1);
}

// 将所有的空格转化为实体字符
function repalceAll(str) {
  return str.replace(new RegExp(' ', 'gm'), '&nbsp;');
}

function loadSourceMap(fileName) {
  let file = matchStr(fileName);
  if (!file) return;
  return new Promise((resolve) => {
    fetch(`${window.location.origin}/getmap?fileName=${file}`).then((response) => {
      resolve(response.json());
    });
  });
}

const findCodeBySourceMap = async ({ fileName, line, column }) => {
  let sourceData = await loadSourceMap(fileName);
  if (!sourceData) return;
  let { sourcesContent, sources } = sourceData;
  console.log('sourceData', sourceData);
  let consumer = await new sourceMap.SourceMapConsumer(sourceData);
  let result = consumer.originalPositionFor({
    line: Number(line),
    column: Number(column)
  });
  // result结果
  // {
  //   "source": "webpack://myapp/src/views/HomeView.vue",
  //   "line": 24,  // 具体的报错行数
  //   "column": 0, // 具体的报错列数
  //   "name": null
  // }

  let code = sourcesContent[sources.indexOf(result.source)];
  console.log('代码', code);
  let codeList = code.split('\n');
  var row = result.line,
    len = codeList.length - 1;
  var start = row - 5 >= 0 ? row - 5 : 0, // 将报错代码显示在中间位置
    end = start + 9 >= len ? len : start + 9; // 最多展示10行
  let newLines = [];
  let j = 0;
  for (var i = start; i <= end; i++) {
    j++;
    newLines.push(`<div class="code-line ${i + 1 == row ? 'heightlight' : ''}" title="${i + 1 == row ? result.source : ''}">${j}. ${repalceAll(codeList[i])}</div>`);
  }

  let target = document.querySelector('#text');
  target.innerHTML = `<div class="errdetail"><div class="errheader">${result.source} at line ${result.column}:${row}</div><div class="errdetail">${newLines.join('')}</div></div>`;
};

new Vue({
  router,
  render: (h) => h(App)
}).$mount('#app');
