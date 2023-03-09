elementUI 多套主题下换肤的关键问题：按需引入时是不支持动态换肤的

网上也有相关问题的讨论[# 按需引入 elementui 导致动态换肤主题被默认主题替换](https://github.com/PanJiaChen/vue-element-admin/issues/2607)

## 组件库按需引入的原理

组件库`按需引入`的原理是相似的：最终只引入指定组件和对应的样式

elementUI 需要借助[babel-plugin-component](https://github.com/QingWei-Li/babel-plugin-component)  
ant-design-vue 需要借助[babel-plugin-import](https://github.com/ant-design/babel-plugin-import)

以`babel-plugin-component`为例  
按需引入 elementUI 的 Button 组件：

```js
import { Button } from 'element-ui';

Vue.component(Button.name, Button);
```

编译后的文件（自动引入 button.css）：

```js
import _Button from 'element-ui/lib/button';
import _Button2 from 'element-ui/lib/theme-chalk/button.css';
// base.css是公共的样式，如图标和淡入淡出的动画
import 'element-ui/lib/theme-chalk/base.css';

Vue.component(_Button.name, _Button);
```

通过按需引入来减少组件库的体积大小

## 组件库按需引入的换肤问题

**为什么说组件库按需引入时是不支持动态换肤的？**

**原因 1**：按需引入，最终只会引入指定组件的样式，如上文的 button.css，但`button.css文件中只有一套样式`  
**原因 2**：按需引入，组件的 js 和 css 是在路由懒加载时加载的，会导致动态换肤的主题样式会被按需引入的`默认组件样式给覆盖掉`

![button.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7b4dcd10efa84d1ab9bb424ef802cacc~tplv-k3u1fbpfcp-watermark.image?)

**瓶颈：**  
elementUI 和 ant-design-vue 均提供了多种自定义主题的方式，但无论何种方式，最终生成的 button.css 只有一套样式

## 换肤方案有哪些？

**分为 3 类**

1. css 样式覆盖，一般通过切换`css选择器`来实现
2. 引入多套主题样式，通过  `link`  标签动态加载不同的主题样式
3. 通过 css `var()` 函数，定义颜色变量的方式

**缺点：**

1. 方案一：引入的 css 需要包含多套样式，导致 css 的代码体积变大
2. 方案二：通过`link`  标签加载 css,需要明确的知道 css 文件的路径，否则会引入失败
3. 方案三：兼容性不太好，IE 全系版本都不兼容

![var.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/61c64c9821b244a29fd7d34466296f78~tplv-k3u1fbpfcp-watermark.image?)

## 不兼容 IE，按需引入的换肤方案

**通过方案三：`css var()` 来实现**

**优点：** 没有副作用，性能好，也是腾讯、蚂蚁等主流组件库的通用换肤方案

**步骤：**  
1、创建基础颜色变量`theme.css`文件

![white.css.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/751a9d77deb84eadb953b69521e2f5ca~tplv-k3u1fbpfcp-watermark.image?)

2、修改`packages/theme-chalk/src/common/var.scss`文件  
 将该文件的中定义的 scss 变量，替换成 var()变量

![index.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/48cd2f0156aa41be89100004e944b791~tplv-k3u1fbpfcp-watermark.image?)

3、修改`packages/theme-chalk/gulpfile.js`打包配置

> 根据上文按需引入 elementUI 的 Button 组件为例：  
> 最终会引入**button.css 和 base.css**  
> import \_Button2 from "element-ui/lib/theme-chalk/button.css";  
> import "element-ui/lib/theme-chalk/base.css";

需要将`theme.css`合并到`base.css`中，这样才能保证定义的颜色变量能加载到页面中

```js
'use strict';

const { series, src, dest } = require('gulp');
const sass = require('gulp-dart-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssmin = require('gulp-cssmin');
const concat = require('gulp-concat');

function compile() {
  return src('./src/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['ie > 9', 'last 2 versions'],
        cascade: false
      })
    )
    .pipe(cssmin())
    .pipe(dest('./lib'));
}

// 将 theme.css 和 lib/base.css合并成 最终的 base.css
function compile1() {
  return src(['./src/theme.css', './lib/base.css']).pipe(concat('base.css')).pipe(dest('./lib'));
}

// 将 base.css、 index.css 合并成 最终的 index.css
function compile2() {
  return src(['./lib/base.css', './lib/index.css']).pipe(concat('index.css')).pipe(dest('./lib'));
}

function copyfont() {
  return src('./src/fonts/**').pipe(cssmin()).pipe(dest('./lib/fonts'));
}

exports.build = series(compile, compile1, compile2, copyfont);
```

4、打包后的 button.css

![button.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/329d105ae78245f588f9eb84e3de51dd~tplv-k3u1fbpfcp-watermark.image?)

5、切换主题时，通过给 js 给 body 设置新的颜色变量

```js
changeTheme = () => {
  let styleVar = {
    '--color-white': '#ffffff',
    '--color-black': '#000000',
    '--color-primary': '#f5ba63',
    '--color-success': '#35b55f',
    '--color-warning': '#ffaa0e',
    '--color-danger': '#ee5640',
    '--color-info': '#e6e6e6',
    '--color-main': '#256dff',
    '--color-neutral': '#15181a',
    '--color-tip': '#2b2b2c',
    '--color-special': '#202020'
  };
  for (let i in styleVar) {
    document.body.style.setProperty(i, styleVar[i]);
  }
};
```

## 兼容 IE，按需引入的换肤方案

**通过方案一：css 样式覆盖，通过切换`css选择器`来实现**

**要解决的问题：button.css 文件中需要包含多套主题样式**

**换肤过程：**  
1、给 css 文件扩展命名空间，合并生成的 css 文件中包含多套主题样式  
2、给 body 加上对应的类名，通过改变 body 的类名实现组件换肤

增加扩展命名空间的 button.css 文件

![two.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0e1c252d2c354f6887ef1db30da051c8~tplv-k3u1fbpfcp-watermark.image?)

按需引入的换肤示例：

![demo.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/563c944d20ac4f9f82d3fc47545a9606~tplv-k3u1fbpfcp-watermark.image?)

### 给 css 文件扩展命名空间

[gulp-css-wrap](https://blog.csdn.net/young_Emily/article/details/78596219) 给 css 文件所有选择器添加命名空间

**基本用法：**  
// 安装 gulp 和 gulp-css-wrap  
npm install gulp gulp-css-wrap

```js
const gulp = require('gulp');
const cssWrap = require('gulp-css-wrap');

gulp.task('css-wrap', function () {
  return gulp
    .src(`./src/*.css`) // 选择文件
    .pipe(
      cssWrap({
        selector: '.LightTheme' /* 添加.LightTheme命名空间 */
      })
    )
    .pipe(gulp.dest('./src')); /* 存放的目录 */
});
```

转化前

```js
.el-button + .el-button {
    margin-left: 10px
}
.el-button:focus, .el-button:hover {
    color: #409EFF;
    border-color: #c6e2ff;
    background-color: #ecf5ff
}
```

转化后

```js
.LightTheme .el-button + .el-button {
    margin-left: 10px
}

.LightTheme .el-button:focus, .LightTheme .el-button:hover {
    color: #409EFF;
    border-color: #c6e2ff;
    background-color: #ecf5ff
}
```

### 批量给 elementUI 的 css 文件扩展命名空间

打开 elementUI 源码

### 原始的样式打包流程

package.json 中的 `build:theme` 命令用来打包生成组件库的样式

1、执行`node build/bin/gen-cssfile`在`packages/theme-chalk/src目录下生成index.scss`文件  
2、执行`packages/theme-chalk/gulpfile.js` 将 scss 文件编译成 css 并输出到`packages/theme-chalk/lib 目录`  
3、执行`cp-cli packages/theme-chalk/lib lib/theme-chalk`，将`packages/theme-chalk 拷贝到 lib/theme-chalk目录`

```js
// 构建样式： 生成在index.scss && 通过 gulp 将 scss 文件编译成css并输出到packages/theme-chalk/lib目录 && 将生成的样式copy到lib/theme-chalk
"build:theme": "node build/bin/gen-cssfile && gulp build --gulpfile packages/theme-chalk/gulpfile.js && cp-cli packages/theme-chalk/lib lib/theme-chalk",
```

### 增加扩展命名空间的打包流程

#### 1、创建不同主题的 scss 文件

`packages/theme-chalk/src/common`目录下

创建**浅色**和**红色**两种主题的 scss 文件

![theme.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ac16da3a7fa04e079c4989f805ff8396~tplv-k3u1fbpfcp-watermark.image?)

#### 2、打包命令增加 浅色主题的 变量 `cross-env THEME=Light`

```js
"build:theme": "node build/bin/gen-cssfile && cross-env THEME=Light gulp build --gulpfile packages/theme-chalk/gulpfile.js && cp-cli packages/theme-chalk/lib lib/theme-chalk"
```

#### 3、安装插件 npm install gulp-css-wrap gulp-concat

修改 `packages/theme-chalk/gulpfile.js`

```js
'use strict';

const { series, src, dest } = require('gulp');
const sass = require('gulp-dart-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssmin = require('gulp-cssmin');
const concat = require('gulp-concat');
const cssWrap = require('gulp-css-wrap');
const fs = require('fs');

// 获取当前主题
let theme = process.env.THEME;
// 定义css扩展命名空间
let themeClass = `.${theme}Theme`;

// 删除var.scss, 重新创建var.scss，将LightTheme.scss的内容写入其中
// 用LightTheme.scss 替换 var.scss
function init() {
  fs.unlinkSync('./src/common/var.scss'); // 删除var.scss
  return src(`./src/common/${theme}Theme.scss`)
    .pipe(concat('var.scss')) // 定义生成的文件名
    .pipe(dest('./src/common'));
}

// 将 scss 编译成 css 并压缩，最后输出到对应主题的目录下
function compile1() {
  return src('./src/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['ie > 9', 'last 2 versions'],
        cascade: false
      })
    )
    .pipe(cssmin())
    .pipe(dest(`./${theme}`));
}

// 将Light/Light.css copy 到packages/theme-chalk/lib目录下
// 如果使用者不需要换肤，只需单独引入浅色主题.css即可（在全局引入时会用到）
function copyIndex() {
  return src(`./${theme}/index.css`)
    .pipe(concat(`${theme}.css`)) // 生成新的文件名, 如Light.css
    .pipe(dest('./lib'));
}

// 批量为css文件扩展命名空间 添加.LightTheme前缀
// base.css 和 icon.css 不需要换肤，不用添加前缀
function compile2() {
  // 排除不需要加扩展名base.css 和 icon.css的文件
  return src([`./${theme}/*.css`, `!./${theme}/base.css`, `!./${theme}/icon.css`])
    .pipe(
      cssWrap({
        selector: themeClass /* 添加的命名空间 */
      })
    )
    .pipe(cssmin())
    .pipe(dest(`./${theme}`));
}

exports.build = series(init, compile1, copyIndex, compile2);
```

#### 4、执行 `npm run build:theme`, 生成浅色主题的样式

![Light.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f8a14f157bde42bd99ddafe839ad9f6f~tplv-k3u1fbpfcp-watermark.image?)

展开 Light/button.css, 浅色主题的扩展名已加上
![LightBtn.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/018e3ed2d008432fab39ef95b4873169~tplv-k3u1fbpfcp-watermark.image?)

**注意：**  
打包之前，要删除`packages/theme-chalk/src`目录中内容为空的 scss 文件  
否则会报以下错误

![cssgulp报错.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/917834d763324b9097ce186406da64e7~tplv-k3u1fbpfcp-watermark.image?)

空的 scss 文件有

```js
// 空的scss文件目录
[
  'breadcrumb-item',
  'button-group',
  'checkbox-button',
  'checkbox-group',
  'collapse-item',
  'infiniteScroll',
  'dropdown-item',
  'dropdown-menu',
  'form-item',
  'infinite-scroll',
  'menu-item',
  'menu-item-group',
  'submenu',
  'tab-pane'
];
```

#### 5、一键打包生成多套主题

打包命令增加 红色主题的 配置和变量 `cross-env THEME=Red`

```js
"build:theme": "node build/bin/gen-cssfile && cross-env THEME=Light gulp build --gulpfile packages/theme-chalk/gulpfile.js && cross-env THEME=Red gulp build --gulpfile packages/theme-chalk/gulpfile.js && cp-cli packages/theme-chalk/lib lib/theme-chalk"
```

执行`npm run build:theme`, 一键生成浅色和红色 两种主题样式

生成**Light**和**Red**两个文件夹

展开`Red/button.css`，红色主题的扩展名已加上
![Red.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a8985fe2a18e4e1282d411347c7ef29e~tplv-k3u1fbpfcp-watermark.image?)

#### 6、合并多套主题样式

**合并的规则：将不同主题文件夹中，相同文件名的内容写入到一个 css 文件中**

如 Light/button.css 和 Red/button.css → 写入到最终的 button.css 中

**打包命令增加合并的流程**

```js
"build:theme": "node build/bin/gen-cssfile && cross-env THEME=Light gulp build --gulpfile packages/theme-chalk/gulpfile.js && cross-env THEME=Red gulp build --gulpfile packages/theme-chalk/gulpfile.js && gulp build --gulpfile packages/theme-chalk/gulpfile.js && cp-cli packages/theme-chalk/lib lib/theme-chalk",
```

修改 `packages/theme-chalk/gulpfile.js`，增加合并的流程

```js
'use strict';

const { series, src, dest } = require('gulp');
const sass = require('gulp-dart-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssmin = require('gulp-cssmin');
const concat = require('gulp-concat');
const cssWrap = require('gulp-css-wrap');
const fs = require('fs');

// 获取当前主题
let theme = process.env.THEME;
// 定义css扩展命名空间
let themeClass = `.${theme}Theme`;

// 删除var.scss, 重新创建var.scss，将Theme.scss的内容写入到var.scss
function init() {
  fs.unlinkSync('./src/common/var.scss'); // 删除var.scss
  return src(`./src/common/${theme}Theme.scss`)
    .pipe(concat('var.scss')) // 合并后的文件名
    .pipe(dest('./src/common'));
}

// 将 scss 编译成 css 并压缩，最后输出到对应主题的目录下
function compile1() {
  return src('./src/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['ie > 9', 'last 2 versions'],
        cascade: false
      })
    )
    .pipe(cssmin())
    .pipe(dest(`./${theme}`));
}

// 将Light/Light.css 或 Red/Red.css copy到lib目录下
function copyIndex() {
  return src([`./${theme}/index.css`])
    .pipe(concat(`${theme}.css`)) // 合并后的文件名, 如Light.css
    .pipe(dest('./lib'));
}

// 批量为css文件扩展命名空间 添加.LightTheme前缀
// base.css 和 icon.css 不需要换肤，不用添加前缀
function compile2() {
  // 排除不需要加扩展名的文件
  return src([`./${theme}/*.css`, `!./${theme}/base.css`, `!./${theme}/icon.css`])
    .pipe(
      cssWrap({
        selector: themeClass /* 添加的命名空间 */
      })
    )
    .pipe(cssmin())
    .pipe(dest(`./${theme}`));
}

function compile(path) {
  return src([`./Light/${path}.css`, `./Red/${path}.css`])
    .pipe(concat(`${path}.css`)) // 合并后的文件名
    .pipe(dest('./lib'));
}

let Components = require('../../components.json');
Components = Object.keys(Components);

// 添加index, 将Light/index.css和Red/index.css 合并成最终的index.css
Components.push('index');

let concatList = Components.map((item) => () => {
  return compile(item);
});

// 拷贝 ./src/fonts 到 ./lib/fonts
function copyfont() {
  return src('./src/fonts/**').pipe(cssmin()).pipe(dest('./lib/fonts'));
}

// 拷贝 base.css 和 icon.css 到 ./lib中
function copyBaseAndIcon() {
  return src(['./Light/base.css', './Light/icon.css']).pipe(dest('./lib'));
}

// 有theme属性 走打包流程，否则 走合并流程
let gulpTask = theme
  ? [init, compile1, copyIndex, compile2]
  : [...concatList, copyfont, copyBaseAndIcon];
exports.build = series(...gulpTask);
```

执行`npm run build:theme`

lib/button.css 中包含多套主题，达到最终效果
![compile.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a77a1c127c774b509034996e796e596e~tplv-k3u1fbpfcp-watermark.image?)

按需引入的打包问题已解决，下面说下全局引入的换肤方案

## 全局引入的换肤方案

### 不兼容 IE

和按需引入的流程一样，不再赘述

### 兼容 IE

展开最终生成的`lib/theme-chalk`目录  
其中包含 3 个文件，Light.css 、 Red.css 、 index.css

**Light.css 包含浅色主题的全部样式  
Red.css 包含红色主题的全部样式  
index.css 包含 浅色主题 和 红色主题 的全部样式**

打开 index.css: 上半部分为浅色主题的样式，下半部分为红色主题的样式

![index.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7ac89fde7657456b9c0adacd89729e38~tplv-k3u1fbpfcp-watermark.image?)

**当全局引入 需要换肤时**  
1、import 'element-ui/lib/theme-chalk/index.css';  
2、给 body 加上对应的类名，通过改变 body 的类名实现组件换肤

**当全局引入 不需要换肤时，可单独引入对应主题的样式**  
import 'element-ui/lib/theme-chalk/Light.css';  
or  
import 'element-ui/lib/theme-chalk/Red.css';

## 总结

从按需引入的原理入手，发现该模式不支持换肤的原因

分为兼容 IE 和不兼容 IE 两种模式进行处理

**单个知识点总结：**  
1）学习了`gulp` 基于流的任务化构建工具  
2）`流`：边读边写，减少频繁的 IO 操作，节约内存  
3）掌握 gulp 的部分 api : `series, src, dest`  
4）了解 gulp 的相关插件 `gulp-cssmin`、`gulp-concat`、`gulp-css-wrap`

## 参考链接

[gulp-css-wrap 工具的使用](https://blog.csdn.net/young_Emily/article/details/78596219)
