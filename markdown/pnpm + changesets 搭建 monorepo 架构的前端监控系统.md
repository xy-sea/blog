现在越来越多的前端工程都选择 monorepo 的架构进行开发，比如 Vue、React、Babel 等项目都采用 monorepo 的方式进行管理

**monorepo 的组织结构如下：**

    ├── packages
    |   ├── pkg1
    |   |   ├── package.json
    |   ├── pkg2
    |   |   ├── package.json
    ├── package.json

如 [vuejs](https://github.com/vuejs/core) 所示，所有子项目都在 packages 目录中

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4bf19340207b4402924a9929842916f5~tplv-k3u1fbpfcp-watermark.image?)

本篇作为 [web-see](https://github.com/xy-sea/web-see) 前端监控的架构篇，主要聊聊如何使用 monorepo，以及带来的好处有哪些？

关于前端监控系统的知识点，这里推荐笔者的 [如何从 0 到 1 搭建前端监控平台](https://juejin.cn/post/7172072612430872584)，文中有详细的介绍

下面先聊聊 monorepo 架构的优势以及如何搭建、如何发布

## monorepo 的简单介绍

简单来说，`monorepo`  就是把多个子工程放到一个  `git`  仓库中进行管理，各工程之间共用同一套构建流程、代码规范，各工程可以使用`link`软链接的方式实现相互引用，方便版本的统一管理

**monorepo 架构的优势：**

1、可以将一个大型项目，拆分成多个子项目，更容易维护和管理代码

2、提高代码共享和重用性，这些子项目可以共享代码和库，可以减少代码重复，降低维护成本

3、由于所有代码都在同一个代码库中，可以更容易地对代码进行构建和测试，有利于持续集成和持续交付

4、更方便的进行版本控制和管理，可以结合 changesets 类似的发布工具，跟踪代码的变更历史和版本变更

## pnpm + workspace 搭建 monorepo 项目

`pnpm`  提出了  `workspace`  的概念，内置了对  `monorepo`  的支持，可以用来快速搭建项目

以下 [pnpm-monorepo-changesets](https://github.com/xy-sea/blog/tree/main/pnpm-monorepo-changesets) 示例的仓库地址，感兴趣的小伙伴可以动手试试

1、安装 pnpm

```js
npm install -g pnpm
```

2、初始化项目

```js
pnpm init
```

在根目录下存在  `pnpm-workspace.yaml`  文件，用来指定工作空间的目录

```js
packages: -'packages/*';
```

3、创建 packages 目录

在  `packages`  目录下创建  `pkg1`  和  `pkg2`  两个文件（代表两个子工程），分别执行  `pnpm init`  命令，初始化工程

在 pkg1 和 pkg2 的 src 目录下创建  `index.ts`  文件，作为项目的入口文件

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/71b2919d46584e1fa98186227932e410~tplv-k3u1fbpfcp-watermark.image?)

```js
// pkg1/src/index.ts

export function pk1(): any {
  console.log('I am pk1');
}
```

```js
// pkg2/src/index.ts

import { pk1 } from '@websee/pk1';

function pk2() {
  pk1();
  console.log('I am pk2');
}
export default pk2;
```

4、修改 pkg1 和 pkg2 中 `package.json` 的 `name` 属性

分别将 name 修改为 `@websee/pk1` 、 `@websee/pk2`，这里的 `@websee` 是在 npm 官网上创建的组件名

**注意: 这个组织名一定要提前创建好，否则各工程相互引用时会报错**

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7a2dc72cff9c43069fed792c44f6ccac~tplv-k3u1fbpfcp-watermark.image?)

5、修改 pkg1 和 pkg2 `package.json` 中的 `main` 属性

`main` 属性为该工程的入口文件，默认为 `"main": "index.js"`， 修改为 `"main": "src/index.ts"`，并添加 `publishConfig` 属性

最终 `package.json` 如下

```js
{
  "name": "@websee/pk1",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.ts",
  "publishConfig": {
    "main": "dist/index.js"
  },
  "files": [
    "dist"
  ],
  "type": "module",
  "author": "海阔天空",
  "license": "ISC",
  "dependencies": {}
}
```

5、各工程间相互引用

要在 pk2 中使用 pk1 的代码，传统的写法如下

```js
// pkg2/src/index.ts
import { pk1 } from '../../pk1/src';
```

这种相对路径的写法很繁琐且不易维护，如果当某一工程的目录结构发生变化时，其他所有引用该工程的文件都要修改

pnpm  通过  workspace 的实现，可以通过直接引用子工程的 name 名称，就可以实现各工程的相互引用，代码如下

```js
// pkg2/src/index.ts
import { pk1 } from '@websee/pk1';
```

`pnpm`  提供了  [--filter](https://link.juejin.cn/?target=https%3A%2F%2Fpnpm.io%2Fzh%2Ffiltering 'https://pnpm.io/zh/filtering')  参数，可以用来对特定的 package 进行操作

pkg1 中将 pkg2 作为依赖进行安装，在根目录下执行

```js
pnpm install @websee/pk1 --filter @websee/pk2
```

此时查看 pkg2 的  `package.json`，可以看到  `dependencies`  字段自动添加了 pk1 的引用，证明相互引用添加成功

```js
// pkg2/package.json
"dependencies": {
  "@websee/pk1": "workspace:^1.0.0"
}
```

6、打包验证

这里使用 `rollup` 打包，安装依赖，`pnpm`  提供了  [-w](https://link.juejin.cn/?target=https%3A%2F%2Fpnpm.io%2Fzh%2Fpnpm-cli%23-w---workspace-root 'https://pnpm.io/zh/pnpm-cli#-w---workspace-root')  参数，可以将依赖包安装到工程的根目录下，作为所有 package 的公共依赖

```js
pnpm install rollup@2.78.0 rollup-plugin-typescript2@0.34.1 typescript@4.9.4 -wD
```

创建`rollup.config.js`

```js
import fs from 'fs';
import path from 'path';
import typescript from 'rollup-plugin-typescript2';
const packagesDir = path.resolve(__dirname, 'packages');
const packageFiles = fs.readdirSync(packagesDir);
function output(path) {
  return [
    {
      input: [`./packages/${path}/src/index.ts`],
      output: [
        {
          file: `./packages/${path}/dist/index.js`,
          format: 'umd',
          name: 'web-see',
          sourcemap: true
        }
      ],
      plugins: [
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              module: 'ESNext'
            }
          },
          useTsconfigDeclarationDir: true
        })
      ]
    }
  ];
}

export default [...packageFiles.map((path) => output(path)).flat()];
```

rollup.config.js 会读取 packages 文件中各子目录的名称，并将每一个目录设置成打包的入口文件，并配置对应的出口路径

在根目录 package.json 中配置打包命令

```js
"scripts": {
   "build": "rollup -c"
 }
```

执行 `pnpm run build`，会在 `packages` 各目录下生成对应的 dist 文件

## changesets

changesets 用来进行版本控制和管理

1、安装依赖

```js
pnpm install @changesets/cli -wD
```

2、初始化

```js
pnpm changeset init
```

执行完初始化命令后，会在工程的根目录下生成  `.changeset`  目录

3、在根目录 package.json 中配置对应的命令

```js
"scripts": {
    "build": "rollup -c",
    "changeset": "changeset",
    "packages-version": "changeset version",
    "publish": "changeset publish --registry=https://registry.npmjs.com/"
}
```

下面用两个具体的例子，来演示下 changeset 的发包流程

注意：npm 包一般的版本结构为：`1.0.0`，类似这样的三位数版本号，分别是对应的 changeset version 里面的：`major`、`minor`、`patch`

### npm 包版本 1.0.0 更新为 1.1.0

这里 `@websee/pk1` 和 `@websee/pk2` 的初始版本都为 1.0.0

#### 执行 `pnpm run changeset`

1、选择要发布的包

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/27ace4eb44264250bf2eb4752aca2b10~tplv-k3u1fbpfcp-watermark.image?)

2、发布 minor，选择对应的包

现在是 1.0.0 更新为 1.1.0，这里选择 minor

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/947ad3a8e6c448c8949ac86b6a9f3227~tplv-k3u1fbpfcp-watermark.image?)

3、填写 changelog

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ef2b864916ec403c8612395097ea9e88~tplv-k3u1fbpfcp-watermark.image?)

4、Is this your desired changeset 选择 true

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b321231e6b094b08ac545a2257562a97~tplv-k3u1fbpfcp-watermark.image?)

#### 执行 `pnpm run packages-version`

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/58687e0b549e454f83b42840ed609d72~tplv-k3u1fbpfcp-watermark.image?)

提示 `All files have been updated`

打开 pk1 和 pk2 下的 package.json，发现版本号已修改完成

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ebbb2077ab544035b22053ac5665af45~tplv-k3u1fbpfcp-watermark.image?)

同时各目录下会自动生成 `CHANGELOG.md` 文件，记录版本号的变化

```js
# @websee/pk1

## 1.1.0

### Minor Changes

- 1.1.0

```

#### 执行 `pnpm run publish`

发布 1.1.0 版本

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5ba1b5f4917e49de82a0d190f069ca28~tplv-k3u1fbpfcp-watermark.image?)

在 npm 官网上搜索 `@websee/pk1`，证明发布成功

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b46daf438ef343e1be9e1ab18d8e359f~tplv-k3u1fbpfcp-watermark.image?)

### npm 包 1.1.0 更新为 2.1.0

继续发布 2.1.0 版本，

#### 执行 `pnpm run changeset`

不同点在于选择发布 `major`，剩余的流程和上面的都一样

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a75d15f5bed643789437d34949c4414f~tplv-k3u1fbpfcp-watermark.image?)

## 为何要使用 monorepo 架构搭建前端监控

目前 [web-see](https://github.com/xy-sea/web-see) 前端监控 SDK，主要功能有代码报错、性能检测、页面录屏、记录用户行为、白屏检测等功能

**老版本存在的主要问题有：** [test 分支](https://github.com/xy-sea/web-see/tree/test)

1、这些功能的代码全部耦合在一起，随着 SDK 功能的增多，体积越来越大，打包后的体积为 `147K`

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/49bf45744cb2429f9c10365530957be1~tplv-k3u1fbpfcp-watermark.image?)

2、有些用户用不到某些功能，不希望加载该插件，以减少 SDK 体积

3、用户想要自定义扩展非常不方便

**使用 monorepo 架构改造后的结果：** [main 分支](https://github.com/xy-sea/web-see/tree/test)

1、将 SDK 主要拆分为 3 个项目

- @websee/core 核心模块：包含代码报错、记录用户行为、白屏检测等功能，体积为 `41K`
- @websee/performance 性能检测模块，体积为 `26K`
- @websee/recordscreen 页面录屏模块，体积为 `116K`

2、用户可以根据自己的需求，选择项的安装性能检测与页面录屏模块

3、用户想要自定义扩展其他功能，可以继续在 packages 添加新的模块，并且模块间相互引用更加方便快捷

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9092992909e443e59d1cddb5a1a869ed~tplv-k3u1fbpfcp-watermark.image?)

当前的 packages 目录

    ├── packages
    |   ├── common // 公共变量
    |   |   ├── package.json
    |   ├── core // 核心模块
    |   |   ├── package.json
    |   ├── performance // 性能检测
    |   |   ├── package.json
    |   ├── recordscreen // 页面录屏
    |   |   ├── package.json
    |   |── types // ts类型
    |   |   ├── package.json
    |   |── utils // 公共方法
    |   |   ├── package.json
    ├── package.json

## SDK 架构设计

SDK 为支持插件 `可拓展`、`可插拔`的特点，整体架构是  `内核 + 插件 + 发布订阅模式`  的设计

1、`@websee/core` 核心模块主要是`内核 + 发布订阅模式`

```js
// handlers 存储所有的事件和对应的回调函数
const handlers: { [key in EVENTTYPES]?: ReplaceCallback[] } = {};
// subscribeEvent 设置标识，并将处理的方法放置到handlers中，如{ xhr: [ funtion ] }
export function subscribeEvent(handler: ReplaceHandler): boolean {
  if (!handler || getFlag(handler.type)) return false;
  setFlag(handler.type, true);
  handlers[handler.type] = handlers[handler.type] || [];
  handlers[handler.type]?.push(handler.callback);
  return true;
}
export function notify(type: EVENTTYPES, data?: any): void {
  if (!type || !handlers[type]) return;
  // 获取对应事件的回调函数并执行，回调函数为addReplaceHandler事件中定义的事件
  handlers[type]?.forEach(callback => {
    nativeTryCatch(
      () => {
        callback(data);
      },
      (e: any) => {
        console.error(`web-see 重写事件notify的回调函数发生错误，Type:${type} ${e}`);
      }
    );
  });
}
```

2、`@websee/performance` 和 `@websee/recordscreen` 插件都继承于`BasePlugin`

```js
export abstract class BasePlugin {
  public type: string; // 插件类型
  constructor(type: string) {
    this.type = type;
  }
  abstract bindOptions(options: object): void; // 校验参数
  abstract core(sdkBase: SdkBase): void; // 核心方法
  abstract transform(data: any): void; // 数据转化
}
```

3、通过调用 `@websee/core`的`use`方法来注册插件

```js
function use(plugin: any, option: any) {
  const instance = new plugin(option);
  if (
    !subscribeEvent({
      callback: (data) => {
        instance.transform(data);
      },
      type: instance.type
    })
  )
    return;
  nativeTryCatch(() => {
    // 执行插件的core方法
    instance.core({ transportData, breadcrumb, options, notify });
  });
}
```

## SDK 安装说明

以下为 vue2 的安装说明

```js
import webSee from '@websee/core';
import performance from '@websee/performance';
import recordscreen from '@websee/recordscreen';

Vue.use(webSee, {
  dsn: 'http://test.com/reportData',
  apikey: 'abcd',
  silentWhiteScreen: true, // 开启白屏检测
  skeletonProject: true, // 页面包含骨架屏
  repeatCodeError: true, // 开启错误上报去重，重复的代码错误只上报一次
  userId: '123',
  handleHttpStatus(data) {
    // (自定义 hook) 根据接口返回的 response 判断请求是否正确
    let { url, response } = data;
    let { code } = typeof response === 'string' ? JSON.parse(response) : response;
    if (url.includes('/getErrorList')) {
      return code === 200 ? true : false;
    } else {
      return true;
    }
  }
});

// 注册性能检测插件
webSee.use(performance);
// 注册页面录屏插件
webSee.use(recordscreen);
```

最后通过 changesets 来管理各个模块的版本，统一发布

## 总结

本文通过 [web-see](https://github.com/xy-sea/web-see) 前端监控实际的案例，来讲解采用 monorepo 架构的好处以及它解决的实际问题

有兴趣的小伙伴可以结合 git 仓库的源码和本文一起阅读，帮助加深理解

## 后续

下一篇会继续讨论前端监控，聊一聊前端监控的报警机制

参考文章：  
[pnpm + workspace + changesets 构建你的 monorepo 工程](https://juejin.cn/post/7098609682519949325)  
[腾讯三面：说说前端监控平台/监控 SDK 的架构设计和难点亮点？](https://juejin.cn/post/7108660942686126093)

## 文章系列

文章系列地址：[github.com/xy-sea/blog](https://github.com/xy-sea/blog)

文中如有错误或不严谨的地方，请给予指正，十分感谢。如果喜欢或有所启发，欢迎 star
