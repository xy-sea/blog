## 前言

阿里四面的时候被问到了这个问题，当时第一时间没有反应过来，觉得这个需求好奇特

面试官给了一些提示，我才明白这道题目的意思，最后回答的也是磕磕绊绊

后来花了一些时间整理了下思路，那么如何设计这样的环境呢？

## 最终实现

实现思路：

1）利用 iframe 创建沙箱，取出其中的原生浏览器全局对象作为沙箱的全局对象

2）设置一个黑名单，若访问黑名单中的变量，则直接报错，实现阻止\隔离的效果

3）在黑名单中添加 document 字段，来实现禁止开发者操作 DOM

4）在黑名单中添加 XMLHttpRequest、fetch、WebSocket 字段，实现禁用原生的方式调用接口

5）若访问当前全局对象中不存在的变量，则直接报错，实现禁用三方库调接口

6）最后还要拦截对 window 对象的访问，防止通过 window.document 来操作 DOM，避免沙箱逃逸

下面聊一聊，为何这样设计，以及中间会遇到什么问题

## 如何禁止开发者操作 DOM ？

在页面中，可以通过 document 对象来获取 HTML 元素，进行增删改查的 DOM 操作

如何禁止开发者操作 DOM，转化为如何阻止开发者获取 document 对象

1）传统思路

简单粗暴点，直接修改 window.document 的值，让开发者无法获取 document

```
// 将document设置为null
window.document = null;

// 设置无效，打印结果还是document
console.log(window.document);

// 删除document
delete window.document

// 删除无效，打印结果还是document
console.log(window.document);
```

好吧，document 修改不了也删除不了 🤔

使用 [Object.getOwnPropertyDescriptor](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor) 查看，会发现 window.document 的 `configurable` 属性为 false（不可配置的）

```
Object.getOwnPropertyDescriptor(window, 'document');
// {get: ƒ, set: undefined, enumerable: true, configurable: false}
```

configurable 决定了是否可以修改属性描述对象，也就是说，configurable 为 false 时，value、writable、enumerable 和 configurable 都不能被修改，以及无法被删除

此路不通，推倒重来

2）有点高大上的思路

既然 document 对象修改不了，那如果环境中原本就没有 document 对象，是不是就可以实现该需求？

说到环境中没有 document 对象，`Web Worker` 直呼内行，我曾在[《一文彻底了解 Web Worker，十万、百万条数据都是弟弟 🔥》](https://juejin.cn/post/7137728629986820126)中聊过如何使用 Web Worker，和对应的特性

并且 Web Worker 更狠，不但没有 document 对象，连 window 对象也没有 😂

在 worker 线程中打印 window

```
onmessage = function (e) {
  console.log(window);
  postMessage();
};
```

浏览器直接报错

![worker.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1114415615eb48478d5213a1d3f70b6d~tplv-k3u1fbpfcp-watermark.image?)

在 Web Worker 线程的运行环境中无法访问 document 对象，这一条符合当前的需求，但是该环境中能获取 XMLHttpRequest  对象，可以发送 ajax 请求，不符合不能调接口的要求

此路还是不通……😓

## 如何禁止开发者调接口 ？

常规调接口方式有：

1）原生方式：XMLHttpRequest、fetch、WebSocket、jsonp、form 表单

2）三方实现：axios、jquery、request 等众多开源库

禁用原生方式调接口的思路：

1）XMLHttpRequest、fetch、WebSocket 这几种情况，可以禁止用户访问这些对象

2）jsonp、form 这两种方式，需要创建 script 或 form 标签，依然可以通过禁止开发者操作 DOM 的方式解决，不需要单独处理

如何禁用三方库调接口呢？

三方库很多，没办法全部列出来，来进行逐一排除

禁止调接口的路好像也被封死了……😰

## 最终方案：沙箱（Sandbox）

通过上面的分析，传统的思路确实解决不了当前的需求

**阻止开发者操作 DOM 和调接口，沙箱说：这个我熟啊，拦截隔离这类的活，我最拿手了 😀**

**沙箱（Sandbox）** 是一种安全机制，为运行中的程序提供隔离环境，通常用于执行未经测试或不受信任的程序或代码，它会为待执行的程序创建一个独立的执行环境，内部程序的执行不会影响到外部程序的运行

前端沙箱的使用场景：

1）Chrome 浏览器打开的每个页面就是一个沙箱，保证彼此独立互不影响

2）执行 jsonp 请求回来的字符串时或引入不知名第三方 JS 库时，可能需要创造一个沙箱来执行这些代码

3）Vue 模板表达式的计算是运行在一个沙箱中，模板字符串中的表达式只能获取部分全局对象，详情见[源码](https://github.com/vuejs/vue/blob/v2.6.10/src/core/instance/proxy.js)

4）微前端框架 [qiankun](https://qiankun.umijs.org/zh/guide) ，为了实现 js 隔离，在多种场景下均使用了沙箱

## 沙箱的多种实现方式

先聊下 [with](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/with) 这个关键字：作用在于改变作用域，可以将某个对象添加到作用域链的顶部

**with 对于沙箱的意义**：可以实现所有变量均来自可靠或自主实现的上下文环境，而不会从全局的执行环境中取值，相当于做了一层拦截，实现隔离的效果

### 简陋的沙箱

**题目要求：** 实现这样一个沙箱，要求程序中访问的所有变量，均来自可靠或自主实现的上下文环境，而不会从全局的执行环境中取值

举个 🌰： `ctx`作为执行上下文对象，待执行程序`code`可以访问到的变量，必须都来自 ctx 对象

```
// ctx 执行上下文对象
const ctx = {
  func: variable => {
    console.log(variable);
  },
  foo: "f1"
};

// 待执行程序
const code = `func(foo)`;
```

沙箱示例：

```
// 定义全局变量foo
var foo = "foo1";

// 执行上下文对象
const ctx = {
  func: variable => {
    console.log(variable);
  },
  foo: "f1"
};

// 非常简陋的沙箱
function veryPoorSandbox(code, ctx) {
  // 使用with，将eval函数执行时的执行上下文指定为ctx
  with (ctx) {
    // eval可以将字符串按js代码执行，如eval('1+2')
    eval(code);
  }
}

// 待执行程序
const code = `func(foo)`;

veryPoorSandbox(code, ctx);
// 打印结果："f1"，不是最外层的全局变量"foo1"
```

这个沙箱有一个明显的问题，若提供的 ctx 上下文对象中，没有找到某个变量时，代码仍会沿着作用域链一层层向上查找

假如上文示例中的 ctx 对象没有设置 foo 属性，打印的结果还是外层作用域的`foo1`

### With + Proxy 实现沙箱

**题目要求：** 希望沙箱中的代码只在手动提供的上下文对象中查找变量，如果上下文对象中不存在该变量，则提示对应的错误

举个 🌰： `ctx`作为执行上下文对象，待执行程序`code`可以访问到的变量，必须都来自 ctx 对象，如果 ctx 对象中不存在该变量，直接报错，不再通过作用域链向上查找

实现步骤：

1）使用  `Proxy.has()`  来拦截  with  代码块中的任意变量的访问

2）设置一个白名单，在白名单内的变量可以正常走作用域链的访问方式，不在白名单内的变量，会继续判断是否存 ctx 对象中，存在则正常访问，不存在则直接报错

3）使用`new Function`替代 eval，使用 new Function() 运行代码比 eval 更为好一些，函数的参数提供了清晰的接口来运行代码

[new Function 与 eval 的区别](https://www.jianshu.com/p/db7ec7b51933)

沙箱示例：

```
var foo = "foo1";

// 执行上下文对象
const ctx = {
  func: variable => {
    console.log(variable);
  }
};

// 构造一个 with 来包裹需要执行的代码，返回 with 代码块的一个函数实例
function withedYourCode(code) {
  code = "with(shadow) {" + code + "}";
  return new Function("shadow", code);
}

// 可访问全局作用域的白名单列表
const access_white_list = ["func"];

// 待执行程序
const code = `func(foo)`;

// 执行上下文对象的代理对象
const ctxProxy = new Proxy(ctx, {
  has: (target, prop) => {
    // has 可以拦截 with 代码块中任意属性的访问
    if (access_white_list.includes(prop)) {
      // 在可访问的白名单内，可继续向上查找
      return target.hasOwnProperty(prop);
    }
    if (!target.hasOwnProperty(prop)) {
      throw new Error(`Not found - ${prop}!`);
    }
    return true;
  }
});

// 没那么简陋的沙箱
function littlePoorSandbox(code, ctx) {
  // 将 this 指向手动构造的全局代理对象
  withedYourCode(code).call(ctx, ctx);
}
littlePoorSandbox(code, ctxProxy);

// 执行func(foo)，报错： Uncaught Error: Not found - foo!
```

执行结果：

![error.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/99938e6545b243d78d928cb7b25f11b5~tplv-k3u1fbpfcp-watermark.image?)

### 天然的优质沙箱（iframe）

iframe  标签可以创造一个独立的浏览器原生级别的运行环境，这个环境由浏览器实现了与主环境的隔离

利用 iframe 来实现一个沙箱是目前最方便、简单、安全的方法，可以把 [iframe.contentWindow](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLIFrameElement/contentWindow) 作为沙箱执行的全局 window 对象

沙箱示例：

```
// 沙箱全局代理对象类
class SandboxGlobalProxy {
  constructor(sharedState) {
    // 创建一个 iframe 标签，取出其中的原生浏览器全局对象作为沙箱的全局对象
    const iframe = document.createElement("iframe", { url: "about:blank" });
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    // sandboxGlobal作为沙箱运行时的全局对象
    const sandboxGlobal = iframe.contentWindow;

    return new Proxy(sandboxGlobal, {
      has: (target, prop) => {
        // has 可以拦截 with 代码块中任意属性的访问
        if (sharedState.includes(prop)) {
          // 如果属性存在于共享的全局状态中，则让其沿着原型链在外层查找
          return false;
        }

        // 如果没有该属性，直接报错
        if (!target.hasOwnProperty(prop)) {
          throw new Error(`Not find: ${prop}!`);
        }

        // 属性存在，返回sandboxGlobal中的值
        return true;
      }
    });
  }
}

// 构造一个 with 来包裹需要执行的代码，返回 with 代码块的一个函数实例
function withedYourCode(code) {
  code = "with(sandbox) {" + code + "}";
  return new Function("sandbox", code);
}
function maybeAvailableSandbox(code, ctx) {
  withedYourCode(code).call(ctx, ctx);
}

// 要执行的代码
const code = `
  console.log(history == window.history) // false
  window.abc = 'sandbox'
  Object.prototype.toString = () => {
      console.log('Traped!')
  }
  console.log(window.abc) // sandbox
`;

// sharedGlobal作为与外部执行环境共享的全局对象
// code中获取的history为最外层作用域的history
const sharedGlobal = ["history"];

const globalProxy = new SandboxGlobalProxy(sharedGlobal);

maybeAvailableSandbox(code, globalProxy);

// 对外层的window对象没有影响
console.log(window.abc); // undefined
Object.prototype.toString(); // 并没有打印 Traped
```

可以看到，沙箱中对 window 的所有操作，都没有影响到外层的 window，实现了隔离的效果 😘

## 需求实现

继续使用上述的 iframe  标签来创建沙箱，代码主要修改点

1）设置 `blacklist` 黑名单，添加 document、XMLHttpRequest、fetch、WebSocket 来禁止开发者操作 DOM 和调接口

2）判断要访问的变量，是否在当前环境的 window 对象中，不在的直接报错，实现禁止通过三方库调接口

```
// 设置黑名单
const blacklist = ['document', 'XMLHttpRequest', 'fetch', 'WebSocket'];

// 黑名单中的变量禁止访问
if (blacklist.includes(prop)) {
  throw new Error(`Can't use: ${prop}!`);
}
```

但有个很严重的漏洞，如果开发者通过 window.document 来获取 document 对象，依然是可以操作 DOM 的 😱

需要在黑名单中加入 window 字段，来解决这个沙箱逃逸的漏洞，虽然把 window 加入了黑名单，但 window 上的方法，如 open、close 等，依然是可以正常获取使用的

最终代码：

```
// 沙箱全局代理对象类
class SandboxGlobalProxy {
  constructor(blacklist) {
    // 创建一个 iframe 标签，取出其中的原生浏览器全局对象作为沙箱的全局对象
    const iframe = document.createElement("iframe", { url: "about:blank" });
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    // 获取当前HTMLIFrameElement的Window对象
    const sandboxGlobal = iframe.contentWindow;

    return new Proxy(sandboxGlobal, {
      // has 可以拦截 with 代码块中任意属性的访问
      has: (target, prop) => {

        // 黑名单中的变量禁止访问
        if (blacklist.includes(prop)) {
          throw new Error(`Can't use: ${prop}!`);
        }
        // sandboxGlobal对象上不存在的属性，直接报错，实现禁用三方库调接口
        if (!target.hasOwnProperty(prop)) {
          throw new Error(`Not find: ${prop}!`);
        }

        // 返回true，获取当前提供上下文对象中的变量；如果返回false，会继续向上层作用域链中查找
        return true;
      }
    });
  }
}

// 使用with关键字，来改变作用域
function withedYourCode(code) {
  code = "with(sandbox) {" + code + "}";
  return new Function("sandbox", code);
}

// 将指定的上下文对象，添加到待执行代码作用域的顶部
function makeSandbox(code, ctx) {
  withedYourCode(code).call(ctx, ctx);
}

// 待执行的代码code，获取document对象
const code = `console.log(document)`;

// 设置黑名单
// 经过小伙伴的指导，新添加Image字段，禁止使用new Image来调接口
const blacklist = ['window', 'document', 'XMLHttpRequest', 'fetch', 'WebSocket', 'Image'];

// 将globalProxy对象，添加到新环境作用域链的顶部
const globalProxy = new SandboxGlobalProxy(blacklist);

makeSandbox(code, globalProxy);
```

打印结果：

![document.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/eb0baee652814546ae89434e036eba9a~tplv-k3u1fbpfcp-watermark.image?)

## 持续优化

经过与评论区小伙伴的交流，可以通过 `new Image()` 调接口，确实是个漏洞

```
// 不需要创建DOM 发送图片请求
let img = new Image();
img.src= "http://www.test.com/img.gif";
```

黑名单中添加'Image'字段，堵上这个漏洞。如果还有其他漏洞，欢迎交流讨论 💕

## 总结

通过解决面试官提出的问题，介绍了沙箱的基本概念、应用场景，以及如何去实现符合要求的沙箱，发现防止沙箱逃逸是一件挺有趣的事情，就像双方在下棋一样，你来我往，有攻有守 😄

关于这个问题，小伙伴们如果有其他可行的方案，或者有要补充、指正的，欢迎交流讨论

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/668e7bee3ab84a4b827f18037d3e06aa~tplv-k3u1fbpfcp-watermark.image?" alt="bug.png" width="30%" />

参考资料：  
[浅析 JavaScript 沙箱机制](https://zhuanlan.zhihu.com/p/428039764)
