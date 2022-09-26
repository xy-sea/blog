// 文件里是一个立即执行函数
(function(modules) {
  function require(id) {
    const [fn, mapping] = modules[id];
    function localRequire(name) {
      // ⬅️ 第四步 跳转到这里 此时mapping[name] = 1，继续执行require(1)
      // ⬅️ 第六步 又跳转到这里 此时mapping[name] = 2，继续执行require(2)
      return require(mapping[name]);
    }
    // 创建module对象
    const module = { exports: {} };
    // ⬅️ 第二步 执行fn
    fn(localRequire, module, module.exports);

    return module.exports;
  }
  // ⬅️ 第一步 执行require(0)
  require(0);
})({
  // 立即执行函数的参数是一个对象，该对象有3个属性
  // 0 代表entry.js;
  // 1 代表message.js
  // 2 代表name.js
  0: [
    function(require, module, exports) {
      'use strict';
      // ⬅️ 第三步 跳转到这里 继续执行require('./message.js')
      var _message = require('./message.js');
      // ⬅️ 第九步 跳到这里 此时_message为 {default: 'hello Webpack!'}
      var _message2 = _interopRequireDefault(_message);

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      var p = document.createElement('p');
      // ⬅️ 最后一步 将_message2.default: 'hello Webpack!'写到p标签中
      p.innerHTML = _message2.default;
      document.body.appendChild(p);
    },
    { './message.js': 1 }
  ],
  1: [
    function(require, module, exports) {
      'use strict';

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      // ⬅️ 第五步 跳转到这里 继续执行require('./name.js')
      var _name = require('./name.js');
      // ⬅️ 第八步 跳到这里 此时_name为{name: 'Webpack'}, 在exports对象上设置default属性，值为'hello Webpack!'
      exports.default = 'hello ' + _name.name + '!';
    },
    { './name.js': 2 }
  ],
  2: [
    function(require, module, exports) {
      'use strict';

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      // ⬅️ 第七步 跳到这里 在传入的exports对象上添加name属性，值为'Webpack'
      var name = (exports.name = 'Webpack');
    },
    {}
  ]
});
