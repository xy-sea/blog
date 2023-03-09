接下来，就要逐一阅读各个组件。本着先易后难的原则，吃柿子必须拣软的捏。  
**button**组件第一个安排上，结果发现秀了我一脸，是我大意了没有闪。

## 上源码

Button 按钮组件的源码虽确实不多，但仔细阅读，里边知识点并不少，特别是 button 的样式，**elementUI 对 BEM 的运用确实炉火纯青**，请收下我的膝盖。

### button.vue

打开**packages/button/src/button.vue**

```js
<template>
  <!--封装原生的button-->
  <button
    class="el-button"
    @click="handleClick"
    :disabled="buttonDisabled || loading"
    :autofocus="autofocus"
    :type="nativeType"
    :class="[
      type ? 'el-button--' + type : '',
      buttonSize ? 'el-button--' + buttonSize : '',
      {
        'is-disabled': buttonDisabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle
      }
    ]"
  >
    <i class="el-icon-loading" v-if="loading"></i>
    <i :class="icon" v-if="icon && !loading"></i>
    <!--通过$slots.default 获取所有没有被包含在具名插槽中的节点，这里指el-button标签中所包裹的所有内容-->
    <span v-if="$slots.default"><slot></slot></span>
  </button>
</template>
<script>
  export default {
    name: 'ElButton',
    // 通过inject接收Form表单组件传递的信息，来控制Button按钮的size和disabled状态
    inject: {
      elForm: {
        default: ''
      },
      elFormItem: {
        default: ''
      }
    },
    props: {
      type: { // 类型
        type: String,
        default: 'default'
      },
      size: String, // 尺寸
      icon: { // 图标类名
        type: String,
        default: ''
      },
      nativeType: { // 原生 type 属性
        type: String,
        default: 'button'
      },
      loading: Boolean, // 是否加载中状态
      disabled: Boolean, // 是否禁用状态
      plain: Boolean, // 是否朴素按钮
      autofocus: Boolean, // 是否默认聚焦
      round: Boolean, // 是否圆角按钮
      circle: Boolean // 是否圆形按钮
    },
    computed: {
      // 从inject中接收el-form-item组件传递的size大小，在el-form-item中可以用size属性用于控制该表单域下组件的尺寸
      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize;
      },
      // buttonSize计算属性来确定按钮组件的size,优先级：props自身的size > el-form-item中定义的size > 全局定义的size
      buttonSize() {
        return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size; // this.$ELEMENT为Vue.prototype.$ELEMENT = {size: opts.size || '', zIndex: opts.zIndex || 2000};
      },
      // 获取按钮组件的disabled属性，this.$options.propsData据说是用来测试button组件的？？？ 这块后期搞测试脚本时再研究
      buttonDisabled() {
        return this.$options.propsData.hasOwnProperty('disabled') ? this.disabled : (this.elForm || {}).disabled;
      }
    },
    methods: {
      handleClick(evt) {
        this.$emit('click', evt);
      }
    }
  };
</script>
```

按钮组的代码很简洁，我就不废话了

```js
<template>
  <div class="el-button-group">
    <slot></slot>
  </div>
</template>
<script>
  export default {
    name: 'ElButtonGroup'
  };
</script>
```

### button.scss

打开**packages/theme-chalk/src/button.scss**  
重点来了，**button 的样式确实惊艳到我了（BEM 诚不欺我）**，特别是我这种第一次学习 BEM 思想的小菜狗  
注：该文件定义了按钮和按钮组的样式。因 button.scss 代码较多，删减了一些，只罗列了关键代码

```js
@charset "UTF-8";
@import "common/var"; // 引入定义的样式与色板
// 引入_button.scss,但这里写的是mixins/button（button前面没有_）。官方解释：使用SASS部分文件, sass局部文件的文件名以下划线开头。这样，sass就不会在编译时单独编译这个文件输出css，而只把这个文件用作导入。当你@import一个局部文件时，还可以不写文件的全名，即省略文件名开头的下划线
@import "mixins/button";
@import "mixins/mixins"; // 引入全局的样式
@import "mixins/utils"; // 引入工具样式

// 使用mixins/mixins中定义的@mixin b($block)，编译后为.el-button
@include b(button) {
  display: inline-block;
  line-height: 1; // 行高为1倍，比如字体是12px，则行高为12px
  outline: none;  // 消除默认点击蓝色边框效果
  transition: .1s;
  @include utils-user-select(none); // user-select属性可以控制用户能否选中文本, https://developer.mozilla.org/zh-CN/docs/Web/CSS/user-select

  &:hover, // 定义hover状态的颜色
  &:focus {
    color: $--color-primary;
    border-color: $--color-primary-light-7;
    background-color: $--color-primary-light-9;
  }

  &:active { // 点击时状态，它就会成为active
    color: mix($--color-black, $--color-primary, $--button-active-shade-percent);
    border-color: mix($--color-black, $--color-primary, $--button-active-shade-percent);
    outline: none;
  }

  // 通过属性选择器，选择class类名包含el-icon-（icon图标）且相邻元素为span标签，给span标签加一个margin-left: 5px 的样式
  // 示例： <el-button><i class="el-icon-upload"></i><span>按钮</span></el-button>

  // CSS 属性选择器 ~=, |=, ^=, $=, *= 的区别,https://www.runoob.com/css/css-attribute-selectors.html
  & [class*="el-icon-"] {
    & + span {
      margin-left: 5px;
    }
  }

  // 处理以is-开头的class,比如is-disabled，is-plain等，通过@at-root将该class提升到el-button同样的层级
  @include when(plain) {
    &:hover,
    &:focus {}
    &:active {}
  }

  @include when(loading) {
    position: relative;
    pointer-events: none;

    &:before { // loading时给按钮增加一个遮罩
      pointer-events: none;
      content: '';
      position: absolute;
      left: -1px;
      top: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: inherit;
      background-color: rgba(255,255,255,.35);
    }
  }

  // 使用mixins/mixins中定义@mixin e($element)，处理.el-button--primary样式
  @include m(primary) {
    @include button-variant($--button-primary-font-color, $--button-primary-background-color, $--button-primary-border-color);
  }

  // 设置不同size的尺寸，并设置对应size下的圆形按钮尺寸
  @include m(medium) {
    @include button-size($--button-medium-padding-vertical, $--button-medium-padding-horizontal, $--button-medium-font-size, $--button-medium-border-radius);
    @include when(circle) {
      padding: $--button-medium-padding-vertical;
    }
  }

  // 设置文字按钮的样式，编译为.el-button--text
  @include m(text) {
    &:hover,
    &:focus {}
    &:active {}

    &.is-disabled,
    &.is-disabled:hover,
    &.is-disabled:focus {}
  }
}

// 设置el-button-group按钮组的样式，编译为.el-button-group
@include b(button-group) {
  @include utils-clearfix; // 清除浮动
  display: inline-block;
  vertical-align: middle;

  & > .el-button {
    float: left;
    position: relative;
    & + .el-button {
      margin-left: 0;
    }
    &.is-disabled {
      z-index: 1;
    }
    &:first-child { // 定义按钮组第一个按钮的圆角
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    &:last-child { // 定义按钮组最后一个按钮的圆角
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
    &:first-child:last-child {
      border-top-right-radius: $--button-border-radius;
      border-bottom-right-radius: $--button-border-radius;
      border-top-left-radius: $--button-border-radius;
      border-bottom-left-radius: $--button-border-radius;

      &.is-round {
        border-radius: 20px;
      }

      &.is-circle {
        border-radius: 50%;
      }
    }
    // 设置中间button的样式：无圆角（不是第一个并且也不是最后一个）
    &:not(:first-child):not(:last-child) {
      border-radius: 0;
    }
    // 按钮组中间白色间隙产生的原因
    &:not(:last-child) {
      margin-right: -1px;
    }
  }

  // 通过@each in 遍历各主题色，让按钮组中间产生白色的间隙
  @each $type in (primary, success, warning, danger, info) {
    .el-button--#{$type} {
      &:first-child {
        border-right-color: rgba($--color-white, 0.5);
      }
      &:last-child {
        border-left-color: rgba($--color-white, 0.5);
      }
      &:not(:first-child):not(:last-child) {
        border-left-color: rgba($--color-white, 0.5);
        border-right-color: rgba($--color-white, 0.5);
      }
    }
  }
}
```

### \_button.scss

打开**packages/theme-chalk/src/mixins/\_button.scss**  
这里重点说明下`@mixin button-variant`  
该代码快很好的利用`mix()函数`：`定义一套颜色规则，生成所有主题色对应状态的颜色`。

```js
// 定义一套公共的样式规则，根据传入不同的主题色显示各状态的颜色（这一波操作666）
@mixin button-variant($color, $background-color, $border-color) {
  color: $color;
  background-color: $background-color;
  border-color: $border-color;

  &:hover,
  &:focus { // 定义hover时背景色和边框色的混入规则
    background: mix($--color-white, $background-color, $--button-hover-tint-percent);
    border-color: mix($--color-white, $border-color, $--button-hover-tint-percent);
    color: $color;
  }

  &:active { // 定义点击时背景色和边框色的混入规则
    background: mix($--color-black, $background-color, $--button-active-shade-percent);
    border-color: mix($--color-black, $border-color, $--button-active-shade-percent);
    color: $color;
    outline: none;
  }

  &.is-active { // 定义激活时背景色和边框色的混入规则
    background: mix($--color-black, $background-color, $--button-active-shade-percent);
    border-color: mix($--color-black, $border-color, $--button-active-shade-percent);
    color: $color;
  }

  &.is-disabled { // 定义禁用时背景色和边框色的混入规则
    &,
    &:hover,
    &:focus,
    &:active {
      color: $--color-white;
      background-color: mix($background-color, $--color-white);
      border-color: mix($border-color, $--color-white);
    }
  }

  &.is-plain {
    @include button-plain($background-color); // button-plain同理也是利用mix()函数, 定义朴素按钮各种状态对应的颜色
  }
}
```

### theme-chalk

补充介绍下 theme-chalk 目录内容，方法理解 elementUI 的 css 编码规则  
`theme-chalk/src 目录`

```js
|-- common  // 公共样式
    |-- popup.scss   // 定义弹出组件的样式
    |-- transition.scss  // 定义Element css动画样式
    |-- var.scss  // 定义sass全局变量和色板
|-- fonts // icon 字体
|-- mixins  // 混合样式
    |-- _button.scss   // button组件定义的混入代码块
    |-- config.scss   // 全局配置文件
    |-- function.scss   // 全局的样式函数
    |-- mixins.scss   // 全局的样式混合定义
    |-- utils.scss  // 工具样式
...
... // 各组件的样式
...
|-- index.scss   // element全部的组件样式文件
```

## 到达第三站

到站了，到这里铁子们已掌握了 button 按钮的源码和对应的 css 样式规则  
`那么问题来了：因为el-button文字按钮不支持换色，如何优雅地让文字按钮也支持各种主题颜色和背景呢？`  
下一篇将讲解  `elementUI 源码系列三：Switch组件` ，我们继续发车
