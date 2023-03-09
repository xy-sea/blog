当着手开始打造一套属于自己的组件样式时，就要先了解**elementUI 的 BEM 实现、Sass 语法、Css 的编码**规范，不然无从下手。  
好吧，我承认了，当第一次看到 elementUI 的 css 实现时，震惊了我的狗头  
**css 这块我一直都是很轻视的，但没想到在我眼中不重要的东西，在 elementUI 这里竟然变的这么精彩**

## element 用到的 Sass 语法

1、`!default`和`!global`  
`!default`用来定义局部变量，`!global`可以把局部变量转全局变量

```js
#main {
  $width: 5em !global;
  width: $width;
}
#sidebar {
  width: $width;
}
//编译后
#main {
  width: 5em;
}
#sidebar {
  width: 5em;
}
```

2、混入：`@mixin`、`@include`  
`@mixin`用来定义代码块、`@include`引入

```js
@mixin color-links {
    color: blue;
    background-color: red;
}
span {
   @include color-links;
}
// 编译后
span {
  color: blue;
  background-color: red;
}
```

3、`@content` 向混合样式中导入内容  
从获取`@include{}`中传递过来的所有内容导入到指定位置

```js
@mixin apply-to-ie6-only {
  * html {
    @content;
  }
}
@include apply-to-ie6-only {
  #logo {
    background-image: url(/logo.gif);
  }
}
// 编译后
* html #logo {
  background-image: url(/logo.gif);
}
```

4、`@at-root` 跳出嵌套  
跳出到和父级相同的层级

```js
.block {
    color: red;
    @at-root #{&}__element {
        color: blue;
    }
    @at-root #{&}--modifier {
        color:orange;
    }
}
// 编译后
.block {
   color: red;
}
.block__element {
   color: blue;
}
.block--modifier {
  color: orange;
}
```

5、`@each in` 遍历列表

```js
@each $animal in puma, sea-slug, egret, salamander {
  .#{$animal}-icon {
    background-image: url('/images/#{$animal}.png');
  }
}
// 编译后
.puma-icon {
  background-image: url('/images/puma.png'); }
.sea-slug-icon {
  background-image: url('/images/sea-slug.png'); }
.egret-icon {
  background-image: url('/images/egret.png'); }
.salamander-icon {
  background-image: url('/images/salamander.png'); }
```

6、`@if @else` 条件判断

```js
p {
  @if 1 + 1 == 2 { border: 1px solid; }
  @if 5 < 3 { border: 2px dotted; }
  @else  { border: 3px double; }
}
// 编译后
p {
  border: 1px solid;
}
```

7、sass 内置函数  
1\) `map-has-key`  
`map-has-key($map,$key)` 函数将返回一个布尔值。当 \$map 中有这个 \$key，则函数返回 true，否则返回 false。 通过`map-get($map,$key)`获取\$key 对应的值

```js
$map: ('xs' : '200px', 'sm': '100px');
$key: 'xs';
@if map-has-key($map, $key) {
  @debug map-get($map, $key) // 200px
}
```

2） `unquote`  
`unquote($string)`：删除字符串中的引号

```js
@debug unquote('Hello Sass!') // Hello Sass!
```

3） `inspect`  
`inspect($value)`函数返回 $value 的字符串表示形式

```js
@debug inspect(null); // "null"
@debug inspect(('width': 200px)); // "('width': 200px)"
```

4） `str-index`  
`inspect($str, $value)`返回字符串的第一个索引位置(索引从 1 开始)，如果字符串不包含该子字符串，则返回 null

```js
@debug str-index("sans-serif", "ans"); // 2
```

5） `str-slice`  
`str-slice($str, $beginIndex, $endIndex)` 截取字符串的指定字符

```js
@debug str-index("(.el-message)", 2, -2); // .el-message
```

`备注：sass中可以使用@debug调试，在控制台打印需要的内容`

## BEM 命名规范

BEM 代表 `块（block）、元素（element）、修饰符（modifier）`，三个部分结合使用，生成一套具有唯一性的 class 命名规范，起到样式隔离，避免 css 样式污染的作用。  
如`el-input , el-input__inner, el-input--mini`  
**打开 packages/theme-chalk/src/button.vue**  
`该文件列举了BEM的基础配置,如样式名前缀、元素、修饰符、状态前缀`

```js
$namespace: 'el'; // 所有的组件以el开头，如el-input
$element-separator: '__'; // 元素以__分割，如el-input__inner
$modifier-separator: '--'; // 修饰符以--分割，如el-input--mini
$state-prefix: 'is-'; // 状态以is-开头，如is-disabled
```

## element 的 BEM 实现

**打开 packages/theme-chalk/src/button.vue**

### 定义 block

作用：给组件添加`el-`前缀，通过`@content`将`include{}`中传递过来的内容导入到指定位置

```js
@mixin b($block) {
  $B: $namespace+'-'+$block !global;  // 使用el-拼接组件名
  .#{$B} {
    @content;
  }
}
```

**组件示例**

```js
@include b(button) {
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
}
// 编译后
.el-button {
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
}
```

### 定义 element

**作用：**  
1、通过`__`连接符将父级选择器和传入的子元素拼接起来  
2、通过 hitAllSpecialNestRule 函数判断父级选择器（$selector: &），是否包含`--` `.is-` `：`这三种字符  
3、如果父级选择器包含这几种字符，输出父级选择器包含子元素的嵌套关系  
4、反之原样输出

```js
@mixin e($element) {
  $E: $element !global;
  $selector: &;
  $currentSelector: "";
  @each $unit in $element { // $element传入的值可以单个，也可以是列表
    $currentSelector: #{$currentSelector + "." + $B + $element-separator + $unit + ","};
  }

  @if hitAllSpecialNestRule($selector) {
    @at-root {
      #{$selector} {
        #{$currentSelector} {
          @content;
        }
      }
    }
  } @else {
    @at-root {
      #{$currentSelector} {
        @content;
      }
    }
  }
}
```

**组件示例一（父级选择器包含这三种字符）**

```js
@include b(message-box) {
    color: blue;
    @include m(center) {
       padding-bottom: 30px;
    @include e(header) {
       padding-top: 30px;
    }
  }
}
//转化为：
.el-message-box {
    color: blue;
}
.el-message-box--center {
    padding-bottom: 30px;
}
.el-message-box--center .el-message-box__header {
    padding-top: 30px;
}
```

**组件示例二（父级选择器不包含这三种字符）**

```js
@include b(message-box) {
    color: blue;
    @include m(header) {
        padding-bottom: 30px;
  }
}
//转化为：
.el-message-box {
    color: blue;
}
.el-message-box--header {
    padding-bottom: 30px;
}
```

### 定义 modifier(修饰符)

作用：通过`--`连接符将父级选择器和传入的修饰符拼接起来

```js
@mixin m($modifier) {
  $selector: &;
  $currentSelector: "";
  @each $unit in $modifier {
    $currentSelector: #{$currentSelector + & + $modifier-separator + $unit + ","};
  }

  @at-root {
    #{$currentSelector} {
      @content;
    }
  }
}
```

**组件示例**

```js
@include b(button) {
  display: inline-block;
  @include m(primary) {
    color:blue;
  }
}
// 编译后
.el-button {
  display: inline-block;
}
.el-button--primary {
  color:blue;
}
```

**通过 element 这套 BEM 规范，使得 css 编码规范具有很强的可读性和可维护性，也极大精简了 css。这一波操作下来，竟然让原来惹人厌的 css 也变得可爱起来了，爱了爱了**

### BEM 辅助函数

**打开 packages/theme-chalk/src/mixins/function.scss**  
补充说明下上文中提到的`hitAllSpecialNestRule`函数  
该函数用来判断父级选择器（$selector: &），是否包含`--` `.is-` `：`这三种字符

```js
/* BEM 辅助函数*/

// 该函数将选择器转化为字符串，并截取指定位置的字符
// 例如(.el-message,) → .el-message
@function selectorToString($selector) {
  $selector: inspect($selector);  // inspect($value)返回$value的字符串表示形式
  $selector: str-slice($selector, 2, -2); // str-slice截取指定字符
  @return $selector;
}

//判断父级选择器是否包含'--'
@function containsModifier($selector) {
  $selector: selectorToString($selector);

  @if str-index($selector, $modifier-separator) { // str-index返回字符串的第一个索引
    @return true;
  } @else {
    @return false;
  }
}

//判断 父级选择器是否包含'.is-'
@function containWhenFlag($selector) {
  $selector: selectorToString($selector);

  @if str-index($selector, '.' + $state-prefix) {
    @return true
  } @else {
    @return false
  }
}

// 判断父级是否包含 ':' （用于判断伪类和伪元素）
@function containPseudoClass($selector) {
  $selector: selectorToString($selector);

  @if str-index($selector, ':') {
    @return true
  } @else {
    @return false
  }
}

// 判断父级选择器（$selector: &），是否包含`--` `.is-`  `：`这三种字符
@function hitAllSpecialNestRule($selector) {
  @return containsModifier($selector) or containWhenFlag($selector) or containPseudoClass($selector);
}
```

## 到达第二站

到这里已基本了解 elementUI 的 Css 编码规范。可以开始打造一套属于自己的组件样式了  
后面，就要深入到具体的组件了，路漫漫其修远  
下一篇将讲解  `elementUI 源码系列三： Button组件` ，我们继续发车

## 参考链接

[sass 官方教程](https://www.sass.hk/docs/)  
[elementUI 中用到哪些 sass 语法](https://www.jianshu.com/p/ef7a5043c54a)  
[从 element-ui 源码来看 BEM 实现](https://cloud.tencent.com/developer/article/1198847)
