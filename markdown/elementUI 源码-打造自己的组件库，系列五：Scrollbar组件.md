来吧继续阅读组件源码，Scrollbar 滚动条组件安排上  
不知道 elementUI 官方文档上为何没有这个组件，一起来看看这个被雪藏的组件吧

**先说感受**：对不起，是我肤浅了，滚动条组件又秀到我了！  
**前期说明**  
1、该组件不是简单的修改原生滚动条样式，而是自己实现了一个虚拟滚动条  
2、既然是虚拟的，原生的滚动条该如何处理，如何隐藏？  
3、既然是虚拟的，滑动滚动条时对应的视图该如何变化，两者的对照关系是怎么样的？  
4、既然是虚拟的，当页面尺寸发生变化或元素尺寸发生变化时又该如何处理呢？

## 带着问题出发

**一、为什么要实现虚拟滚动条来替换原生的？**  
1、先说明下，chrome 和 safari 两个浏览器原生的滚动条样式相差非常大，我是搞了三四年前端开发才知道的（请原谅我，我是个穷逼，一直没用过 mac）。  
下图是两者的对比，并且 safari 浏览器鼠标放到滑块上后，滑块的宽度还会变大，有一个明显的交互效果变化

![Safari.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/82d394d932bd4ec59c93befd7998a8e8~tplv-k3u1fbpfcp-watermark.image?)  
2、因为不同浏览器的滚动条外观是不一样的。虽然也可以直接修改 CSS3 中的 `::-webkit-scrollbar` 相关属性来达到修改原生滚动条样式，但这个属性部分浏览器上没有能够完美兼容，而且也难做到动画等交互效果的统一。需要做风格统一时，所以 elementUI 就自己实现了虚拟滚动条  
**补充说明下：如何修改原生滚动条样式**

```js
/**
* 滚动条整体部分
* width 表示垂直方向滑轨的宽度
* height表示水平方向滑轨的高度
*/
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  transition: .3s all;
}
/*滚动条的滑轨*/
::-webkit-scrollbar-track {
  background-color: transparent;
  /*滑轨hover效果*/
  &:hover {
    background-color: rgba(20, 20, 20, 0.04);
  }
}
/*滚动条里面的滑块，能向上向下移动*/
::-webkit-scrollbar-thumb {
  background-color: rgba(20, 20, 20, .5);
  border-radius: 4px;
  transition: .3s all;
  /*滑块hover效果*/
  &:hover {
    background-color: rgba(59, 59, 59, .5);
  }
  /*滑块按下效果*/
  &:active {
    background-color: rgba(23, 23, 28, .5);
  }
}
```

**二、原生的滚动条该如何处理，如何隐藏？**  
1、选中滚动条的元素（如下图）一直很奇怪，这里的`margin-bottom:-17px;margin-right:-17px;`是什么鬼？怎么会出现负的外边距

![margin.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d677a544359f4468a0d939814ac15a48~tplv-k3u1fbpfcp-watermark.image?)

2、当手动把 maigin-right 改为 0 后，`margin-right:0;`，发现原生的滚动条又出现了，原来是通过负边距来隐藏原生滚动条的  
**下图说明**：图中灰色的为原生滚动条，蓝色的为虚拟滚动条（为了对比明显，把虚拟滚动条的背景改成了蓝色）

![origin.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4fb6e1062c3c4b74a09e8e0403c93303~tplv-k3u1fbpfcp-watermark.image?)
3、还有一个问题：-17px 是怎么来的？ 这块放到下面的源码介绍中说明

**三、滑动滚动条时对应的视图该如何变化，两者的对照关系是怎么样的？**  
**敲重点**：这块的逻辑是最核心也是最复杂的，先说结论，等看过源码后就彻底理解了。  
1、看图说话  
**滚动视图 clientHeight 与 scrollHeight 的比例 = 虚拟滚动条 thumb 与滑轨 bar 的比例**
![图2.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/45b4f591baf943908ff2af48b4ab08ee~tplv-k3u1fbpfcp-watermark.image?)
2、这样假如虚拟滚动条 thumb 向下滚动了 10%，对应的视图也应该向下滚动 10%；虚拟滚动条滚动到底，对应的视图也应该滚动到底。
![图3.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cc28d2ce17474f77b0b6060fe3ce908d~tplv-k3u1fbpfcp-watermark.image?)
知道了整体的流程后，就容易理解源码了

## 基本用法

el-scrollbar 滚动条组件用于优化页内滚动条的 UI 效果，使用时必须指定高度！

```js
<el-scrollbar style="height: 100px;">
  <p v-for="item in 10">{{ item }}</p>
</el-scrollbar>
```

隐藏原生横向滚动条

```js
/deep/ .el-scrollbar__wrap {
  overflow-x: hidden;
}
```

## el-scrollbar 容器结构

`scrollbar`  组件中嵌套  `wrap`和`view`  两层元素。`wrap`为滚动层，`view`为视图容器层。同时生成两种虚拟滚动条  `horizontal`  和  `vertical`

![132.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/06353d81291241be94b9d94876a66dc5~tplv-k3u1fbpfcp-watermark.image?)

### 生成 el-scrollbar html

1、打开项目的入口文件**packages/scrollbar/src/main.js**

```js
export default {
  name: 'ElScrollbar',
  components: { Bar },
  props: {
    native: Boolean, // 是否使用原生滚动条，即不生成自定义虚拟滚动条
    wrapStyle: {}, // wrap的内联样式,支持数组和字符串两种格式, 如[{"background": "red"}, {"color": "red"}] 转化为 {background: "red", color: "red"}
    wrapClass: {}, // 自定义wrap的类名
    viewClass: {}, // 自定义view的类名
    viewStyle: {}, // 自定义view的行内样式
    noresize: Boolean, // 如果container容器尺寸不会发生变化，最好设置它可以优化性能
    tag: { // 组件最外层的包裹标签，默认为 div
      type: String,
      default: 'div'
    }
  },
  data() {
    return {
      sizeWidth: '0', // 水平滚动条的宽度
      sizeHeight: '0', // 垂直滚动条的高度
      moveX: 0, // 水平滚动条的移动比例
      moveY: 0 // 垂直滚动条的移动比例
    };
  },
  computed: {
    wrap() {
      return this.$refs.wrap;
    }
  },
  render(h) {
    // 获取原生滚动条的宽度
    let gutter = scrollbarWidth();
    // 获取wrap的内联样式
    let style = this.wrapStyle;
    // 如果滚动条的宽度存在，设置偏移量，用来隐藏原生的滚动条
    if (gutter) {
      const gutterWith = `-${gutter}px`;
      const gutterStyle = `margin-bottom: ${gutterWith}; margin-right: ${gutterWith};`;

      /**
       * 如是wrapStyle为数组 Array<Object> [{"background": "red"}, {"color": "red"}]
       * 则会被转为对象  {background: "red", color: "red"}
       */
      if (Array.isArray(this.wrapStyle)) {
        style = toObject(this.wrapStyle);
        style.marginRight = style.marginBottom = gutterWith;
      } else if (typeof this.wrapStyle === 'string') {
        style += gutterStyle;
      } else {
        style = gutterStyle;
      }
    }
    // 生成el-scrollbar__view容器，通过this.$slots.default将el-scrollbar组件中包裹的内容插入其中
    const view = h(this.tag, {
      class: ['el-scrollbar__view', this.viewClass],
      style: this.viewStyle,
      ref: 'resize'
    }, this.$slots.default);
    // 生成el-scrollbar__wrap结构，并绑定滚动事件，并设置overflow:scroll样式，是产生滚动的容器
    const wrap = (
      <div
        ref="wrap"
        style={ style }
        onScroll={ this.handleScroll }
        class={ [this.wrapClass, 'el-scrollbar__wrap', gutter ? '' : 'el-scrollbar__wrap--hidden-default'] }>
        // 将view结构嵌套其中
        { [view] }
      </div>
    );
    let nodes;
    //  如果不使用原生滚动条，则添加虚拟滚动条
    if (!this.native) {
      nodes = ([
        wrap,
        // 添加水平的虚拟滚动条
        <Bar
          move={ this.moveX }
          size={ this.sizeWidth }></Bar>,
        // 添加垂直的虚拟滚动条
        <Bar
          vertical
          move={ this.moveY }
          size={ this.sizeHeight }></Bar>
      ]);
    } else {
      // 否则使用原生的滚动条，并且没有绑定滚动事件
      nodes = ([
        <div
          ref="wrap"
          class={ [this.wrapClass, 'el-scrollbar__wrap'] }
          style={ style }>
          { [view] }
        </div>
      ]);
    }
    // 生成最终的组件
    return h('div', { class: 'el-scrollbar' }, nodes);
  },
```

2、打开项目的入口文件**src/utils/scrollbar-width.js**  
了解 scrollbarWidth 函数如何获取原生滚动条的宽度

```js
// 利用闭包来存储原生滚动条的宽度
let scrollBarWidth;

export default function () {
  // 如果是服务端直接返回0
  if (Vue.prototype.$isServer) return 0;
  // 如果scrollBarWidth值存在，返回已存储的值
  if (scrollBarWidth !== undefined) return scrollBarWidth;

  /**
   * 1、生成一个div为outer，将该元素插入到body中
   * 2、生成一个div为inner（宽度为100%），将该元素插入outer中
   * 3、原生滚动条宽度：outer的offsetWidth - inner的offsetWidth
   */
  const outer = document.createElement('div');
  outer.className = 'el-scrollbar__wrap';
  outer.style.visibility = 'hidden';
  outer.style.width = '100px';
  outer.style.position = 'absolute';
  outer.style.top = '-9999px';
  document.body.appendChild(outer);
  const widthNoScroll = outer.offsetWidth;
  outer.style.overflow = 'scroll';

  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;
  outer.parentNode.removeChild(outer);
  scrollBarWidth = widthNoScroll - widthWithScroll;

  return scrollBarWidth;
}
```

小结：  
1）通过 render 函数，根据配置项生成滚动条的 html 结构  
2）通过 scrollbarWidth 函数来计算原生滚动条的宽度，并给 el-scrollbar\_\_wrap 元素设置对应的偏移量，从而实现隐藏原生的滚动条

### 计算滑块的高度与位移

还是**packages/scrollbar/src/main.js**  
**scrollTop 与 clientHeight 的比例 = moveY 与虚拟滚动条 thumb 的比例 = 滚动条 thumb 的 translateY**

```js
mounted() {
  if (this.native) return;
  // 初始化时计算一次滑块的高度
  this.$nextTick(this.update);
  // 当容器的尺寸发生变化时，重新计算滑块的高度
  !this.noresize && addResizeListener(this.$refs.resize, this.update);
},
methods: {
  /**
   * 当元素滚动时，计算出水平和垂直方向滚动条的位移translateX和translateY
   * 1、视图clientHeight与scrollHeight的比例 = 虚拟滚动条thumb与滑轨bar的比例
   * 2、所以当视图滚动时，scrollTop与clientHeight的比例 = moveY与虚拟滚动条thumb的比例 = 滚动条thumb的translateY
   * 3、假如scrollTop和clientHeight都为100px,此时滚动条thumb的translateY = 100%
   * 注意：translateY和translateX距离都是基于自身宽高设置的
   * */
handleScroll() {
  const wrap = this.wrap;
  this.moveY = ((wrap.scrollTop * 100) / wrap.clientHeight);
  this.moveX = ((wrap.scrollLeft * 100) / wrap.clientWidth);
},
  /**
   * update方法用来计算滑块el-scrollbar__thumb的高度
   * 1、得到el-scrollbar__wrap容器的clientHeight/scrollHeight的比例
   * 2、根据上文的思路：视图clientHeight与scrollHeight的比例 = 虚拟滚动条thumb与滑轨bar的比例
   * 3、利用css百分比设置样式，当bar为父元素时，滑块thumb的高度为： heightPercentage + '%'
   * */
  update() {
    let heightPercentage, widthPercentage;
    const wrap = this.wrap;
    if (!wrap) return;
    // 这里乘以100，方便利用百分比设置滑块高度，水平和垂直方向计算方式一致
    heightPercentage = (wrap.clientHeight * 100 / wrap.scrollHeight);
    widthPercentage = (wrap.clientWidth * 100 / wrap.scrollWidth);

    this.sizeHeight = (heightPercentage < 100) ? (heightPercentage + '%') : '';
    this.sizeWidth = (widthPercentage < 100) ? (widthPercentage + '%') : '';
  }
},
beforeDestroy() {
  if (this.native) return;
  // 销毁组件时，移除监听事件，有始有终
  !this.noresize && removeResizeListener(this.$refs.resize, this.update);
}
```

小结：  
1、初始化时通过 update 方法，**根据视图 clientHeight 与 scrollHeight 的比例 = 虚拟滚动条 thumb 与滑轨 bar 的比例**，计算出垂直滚动条的高度或水平滚动条的宽度  
2、给 el-scrollbar\_\_wrap 元素绑定滚动事件，来计算虚拟滚动条 thumb 的位移，**滚动条 thumb 的 translateY = scrollTop 与 clientHeight 的比例 = moveY 与虚拟滚动条 thumb 的比例**  
3、当容器的尺寸发生变化时，重新计算滑块的高度

## el-scrollbar\_\_bar 虚拟滚动条

### 生成 hmtl

打开**packages/scrollbar/src/bar.js**  
1、通过 render 函数，生成`el-scrollbar__bar`滑轨和`el-scrollbar__thumb`滑块  
2、给滑轨和滑块分别绑定`mousedown`事件，监听鼠标左键按下事件。  
**这里分两种情况，一种鼠标点击滑轨，另一种是鼠标拖动滑块**

```js
export default {
  name: 'Bar',
  props: {
    vertical: Boolean, // 是否垂直滚动条
    size: String, // size 对应的是水平滚动条的width或垂直滚动条的height
    move: Number // move 用于设置 translateX 或 translateY 属性
  },
  computed: {
    // 从BAR_MAP中返回一个的新对象，垂直滚动条属性集合 或 水平滚动条属性集合
    bar() {
      return BAR_MAP[this.vertical ? 'vertical' : 'horizontal'];
    },
    // 获取父元素的el-scrollbar__wrap，用于获取对应的scrollTop 值
    wrap() {
      return this.$parent.wrap;
    }
  },
  render(h) {
    /**
     * 以垂直滚动条为例，vertical为true
     * 1、bar会返回当前滚动条类型的滚动条属性集合
     * 2、滑轨的类名为：el-scrollbar__bar is-vertical，通过绝对定位，滑轨的高度 = { top: 2px; bottom: 2px; right: 2px;}, 靠右撑满了el-scrollbar__wrap
     * 3、通过renderThumbStyle方法，来设计滑块的高度与translateY
     * 4、给滑轨和滑块分别绑定mousedown事件，监听鼠标左键按下事件，这里分两种情况，一种鼠标点击滑轨，另一种是鼠标拖动滑块
     * */
    const { size, move, bar } = this;
    return (
      <div
        class={ ['el-scrollbar__bar', 'is-' + bar.key] }
        onMousedown={ this.clickTrackHandler } >
        <div
          ref="thumb"
          class="el-scrollbar__thumb"
          onMousedown={ this.clickThumbHandler }
          style={ renderThumbStyle({ size, move, bar }) }>
        </div>
      </div>
    );
  }
```

**renderThumbStyle**方法用来设置水平和垂直方向滚动条的样式

```js
/**
 * 以垂直滚动条为例
 * renderThumbStyle({ 40%, 50%, {
 *   offset: 'offsetHeight',
 *   scroll: 'scrollTop',
 *   scrollSize: 'scrollHeight',
 *   size: 'height',
 *   key: 'vertical',
 *   axis: 'Y',
 *   client: 'clientY',
 *   direction: 'top'
 *  }} 转化为 {height: 50%; transform: translateY(40%);}
 * */
export function renderThumbStyle({ move, size, bar }) {
  const style = {};
  const translate = `translate${bar.axis}(${move}%)`;

  style[bar.size] = size;
  style.transform = translate;
  style.msTransform = translate;
  style.webkitTransform = translate;

  return style;
}
```

### 情况 1：鼠标点击滑轨

**如下图所示：**  
点击**轨道区域**时，滑块中心会快速移动到该位置，并且更新视图的`scrollTop`  
**流程小结：**  
1、计算出鼠标点击的位置距离滑轨顶部的距离`offset`  
2、让滑块的中心滑动到鼠标点击的位置`offset - thumb.offsetHeight`的一半  
3、计算出滑块滑动距离与滑轨的占比`thumbPositionPercentage`  
4、根据：**视图 clientHeight 与 scrollHeight 的比例 = 虚拟滚动条 thumb 与滑轨 bar 的比例，反向得到，滑块滑块的距离的占比 = scrollTop 与 scrollHeight 的比例**，反向计算出视图的`scrollTop`
![bar.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/66b201d2ac1446a48575e79161b41542~tplv-k3u1fbpfcp-watermark.image?)
具体流程见`clickTrackHandler`方法

```js
// 点击滑轨时的处理逻辑
clickTrackHandler(e) {
  /**
   * 主要流程：
   * 1、e.target.getBoundingClientRect()[this.bar.direction] → el-scrollbar__bar.top来获取滑轨距页面顶部的距离
   * 2、e[this.bar.client]) → e.clientY来获取鼠标距页面顶部的距离
   * 3、offset为鼠标距el-scrollbar__bar容器顶部的距离
   * 4、thumbHalf为滑块offsetHeight的一半，获取一半高度的原因，是鼠标点击后，期望滑块的中心移动到此
   * 5、thumbPositionPercentage为计算后得到的滑块偏移位置，根据偏移量与滑轨的占比，也就是滚动块所处的位置
   * 6、根据上文中提到的：视图clientHeight与scrollHeight的比例 = 虚拟滚动条thumb与滑轨bar的比例，反向得到，滑块滑块的距离的占比 = scrollTop与scrollHeight的比例
   * 7、反向计算出scrollTop的值，然后修改this.wrap.scrollTop，使el-scrollbar__wrap触发滚动
   *
  * */
  const offset = Math.abs(e.target.getBoundingClientRect()[this.bar.direction] - e[this.bar.client]);
  const thumbHalf = (this.$refs.thumb[this.bar.offset] / 2);
  const thumbPositionPercentage = ((offset - thumbHalf) * 100 / this.$el[this.bar.offset]);

  this.wrap[this.bar.scroll] = (thumbPositionPercentage * this.wrap[this.bar.scrollSize] / 100);
},
```

### 情况 2：鼠标拖动滑块

**流程小结：**  
1、滑块拖动前，先记录鼠标距滑块底部的距离（this.Y）  
2、滑块拖动时，计算鼠标距滑轨顶部的距离  
3、`offset - thumbClickPosition`计算出滑动距离占滑轨的比例（计算方式和情况 1 一样）  
4、根据：**视图 clientHeight 与 scrollHeight 的比例 = 虚拟滚动条 thumb 与滑轨 bar 的比例，反向得到，滑块滑块的距离的占比 = scrollTop 与 scrollHeight 的比例**，反向计算出视图的 scrollTop

```js
clickThumbHandler(e) {
  /**
   * 防止右键单击滑动块
   * e.ctrlKey: 检测事件发生时Ctrl键是否被按住了
   * e.button： 指示当事件被触发时哪个鼠标按键被点击 0，鼠标左键；1，鼠标中键；2，鼠标右键
   */
  if (e.ctrlKey || e.button === 2) {
    return;
  }
  //  开始拖拽
  this.startDrag(e);
  /**
   * 计算点击滑块时鼠标距滑块底部的距离
   * 1、e.currentTarget[this.bar.offset] ⇒ el-scrollbar__thumb.offsetHeight（滑块的高度）
   * 2、e[this.bar.client] ⇒ e.clientY (鼠标距顶部的距离)
   * 3、e.currentTarget.getBoundingClientRect()[this.bar.direction]) ⇒ el-scrollbar__thumb.getBoundingClientRect().top (滑块距页面顶部的距离)
   * 4、this[this.bar.axis] ⇒ this.Y = 鼠标距滑块底部的距离
   * */
  this[this.bar.axis] = (e.currentTarget[this.bar.offset] - (e[this.bar.client] - e.currentTarget.getBoundingClientRect()[this.bar.direction]));
},

startDrag(e) {
  // 停止后续的相同事件函数执行
  e.stopImmediatePropagation();
  // 按下状态设为true
  this.cursorDown = true;
  // 监听鼠标移动事件
  on(document, 'mousemove', this.mouseMoveDocumentHandler);
  // 监听鼠标按键松开事件
  on(document, 'mouseup', this.mouseUpDocumentHandler);
  // 拖拽滚动块时，此时禁止鼠标长按划过文本选中。
  document.onselectstart = () => false;
},

// 按下滚动条，并且鼠标移动时
mouseMoveDocumentHandler(e) {
  // 如果按下状态为false，返回
  if (this.cursorDown === false) return;
  // 获取this.Y 滑动时鼠标距滑块底部的距离
  const prevPage = this[this.bar.axis];

  if (!prevPage) return;

  /**
   * 计算按下滑块滑动时，鼠标距滑轨顶部的距离
   * 1、this.$el.getBoundingClientRect()[this.bar.direction] ⇒ el-scrollbar__bar.getBoundingClientRect().top来获取滑轨距页面顶部的距离 (滑块距顶部的距离)
   * 2、e[this.bar.client] ⇒ e.clientY (鼠标距顶部的距离)
   * 3、offset = 滑块滑动时鼠标距滑轨顶部的距离
  * */
  const offset = ((this.$el.getBoundingClientRect()[this.bar.direction] - e[this.bar.client]) * -1);
  // thumbClickPosition为鼠标距滑块顶部的距离
  const thumbClickPosition = (this.$refs.thumb[this.bar.offset] - prevPage);
  /**
   *  计算出滚动距离占滑轨的比例
   *  1、offset - thumbClickPosition 为滑块滚动的距离
   *  2、滚动距离占滑轨的比例 = (offset - thumbClickPosition) * 100 / el-scrollbar__bar.offsetHeight
   * */
  const thumbPositionPercentage = ((offset - thumbClickPosition) * 100 / this.$el[this.bar.offset]);

  /**
   * 计算出视图需要滚动的距离
   * 1、根据上文的结论，反向得到，滑块滑块的距离的占比 = scrollTop与scrollHeight的比例
   * 2、最终计算出 this.wrap.scrollTop的距离
   * */
  this.wrap[this.bar.scroll] = (thumbPositionPercentage * this.wrap[this.bar.scrollSize] / 100);
},
```

## 总结

**1、巧妙的设计思路**  
1）虚拟滚动条的设计思想：**视图 clientHeight 与 scrollHeight 的比例 = 虚拟滚动条 thumb 与滑轨 bar 的比例**  
2）建立视图与虚拟滚动条的联动关系；联动关系大致分为两种：  
① 视图自身的滚动 ② 滑块位置的移动；两者任何一个的变化要同步修改另一个的状态

**2、单个知识点总结：**  
1）计算原生滚动条的宽度，如何隐藏原生滚动条  
2）`new ResizeObserver`监听元素尺寸的变化  
3）`getBoundingClientRect`获取元素的大小及其相对于视口的位置  
4）`document.onselectstart = () => false;`禁止鼠标选中文本  
5）`translateX、translateY`是相对于自身尺寸进行设置的  
6）`e.stopImmediatePropagation()`停止后续的相同事件函数执行  
7）再次复习了`offsetHeight、scrollTop、scrollHeight`这些属性

## 参考链接

[# Element-ui el-scrollbar 源码解析](https://juejin.cn/post/6844903834175668237)
