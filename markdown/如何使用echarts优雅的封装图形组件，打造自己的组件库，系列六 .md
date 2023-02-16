elementUI 是没有图形组件的，到了手动添加新组件的时候了  
echarts 作为最常用的图表库，图形组件就基于 echarts 的二次封装

## 封装图形组件的意义

**echarts 已经够用了，为什么要基于 echarts 去封装图形组件呢？**  
echarts**优点**： echarts 的功能强大，灵活度高  
echarts**缺点**： 配置项非常多，特别是对于不太熟悉 echarts 的人，譬如那年刚入行的我

**期望图形组件实现两点优化：**  
`1、实现图形的样式统一， “样式与配置项解耦”分离的配置风格。`

期望该组件内置一套固定的样式，实现`样式与配置项解耦`，方便样式和配置项的单独维护。

`2、精简图形的配置，“数据和其他配置” 分离的配置风格`  
期望使用者只需传入图形类型和对应的数据，即可生成最终的图形，无需关心其余的配置。

**期望结果：**  
通过`“样式与配置项解耦”`和`“数据和其他配置”`分离的配置风格，统一图形组件样式，精简了外部配置项，让使用者专注于图形的数据处理，用最少的配置项实现最终效果

**最终组件效果如下**

```
<template>
  <el-chart type="bar" :chartOptions="chartOptions"></el-chart>
</template>
<script>
    export default {
      data() {
        return {
          chartOptions: {
            xAxis: {
              data: ['2018年', '2019年', '2020年', '2021年', '2022年']
            },
            yAxis: { name: '指标单位'},
            series: [
              {
                name: '项目名称1',
                data: [40, 25, 35, 20, 28]
              },
              {
                name: '项目名称2',
                data: [9, 3, 15, 20, 7]
              },
              {
                name: '项目名称3',
                data: [-15, -20, -10, -8, -6]
              }
            ]
          }
        };
      }
    };
</script>
```

最终效果
![chartDemo.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/29e505f400c6485fb366a2b7573f05f3~tplv-k3u1fbpfcp-watermark.image?)

通过示例，可以看出图形组件的配置项相对于官网示例精简了许多

## 需求分析

**图形组件需要包含哪些功能？**

### 1、通用性

要求覆盖 echarts 全部的图形类型，包括：柱状图、折线图、散点图、饼图、气泡图、k 线图、地图、雷达图等

图形组件根据外部传入的 type（图形类型）参数，内部添加对应图形的配置项，以精简外部的配置参数

### 2、样式与其他配置相分离

一般情况下，是通过如下的方式配置 echarts 图表的

这种配置方式，日常开发是完全够用的，但作为一个图形组件来说，存在一些问题：  
**弊端：**  
1）从示例可以看出 option 有大量关于样式的配置，option 非常冗余  
2）`样式与数据耦合在一起`，让配置的复用、数据的处理变的很麻烦

```
// 常规的配置方式
let option = {
  backgroundColor: '#ffffff',
  'color': ['#81adff', '#fcca6a', '#ff9e9e', '#54D5F0', '#FFA380', '#79E0B1', '#EAAFDC', '#90BBE0', '#EBCA9D', '#BBB6F5'],
  'textStyle': {
    'color': 'rgba(32,32,32,0.65)',
    'fontSize': 12,
    'fontFamily': 'Source Han Sans CN,Arial,Microsoft Yahei'
  },
  tooltip: {
    'trigger': 'axis',
    'backgroundColor': 'rgba(255,255,255,0.95)',
    'textStyle': {'fontSize': 12, 'color': 'rgba(32,32,32,0.65)'},
    'axisPointer': {'lineStyle': {'color': 'rgba(32,32,32,0.07)', 'type': 'dotted'}, 'type': 'shadow', 'z': 10}
  },
  legend: {
    'data': ['项目名称1', '项目名称2', '项目名称3'],
    'type': 'scroll',
    'pageIconColor': '#202020',
    'pageIconSize': 12,
    'pageTextStyle': {'color': 'rgba(32,32,32,0.65)', 'height': 10},
    'bottom': 10,
    'itemWidth': 10,
    'itemHeight': 10,
    'textStyle': {
      'color': 'rgba(32,32,32,0.65)',
      'fontSize': 12
    }
  },
  yAxis: {
    'name': '指标单位',
    'nameTextStyle': {
      'color': 'rgba(32,32,32,0.45)',
      'padding': [0, 10, 0, 0],
      'lineHeight': 30
     }
  },
  series: [{
    'type': 'bar',
    'data': [40, 25, 35, 20, 28],
    'name': '项目名称1'
  }, {
    'type': 'bar',
    'data': [9, 3, 15, 20, 7],
    'name': '项目名称2'
  }]
};

Echarts.init(dom);
Echarts.setOption(option);
```

虽然 echarts 也提供了[dataset 数据集](https://echarts.apache.org/handbook/zh/concepts/dataset/) 的方式，并没有解决样式与数据耦合的问题

#### 如何实现样式与配置项解耦？

好在

echarts 提供了[registerTheme](https://echarts.apache.org/zh/api.html#echarts.registerTheme)注册主题的方法，可以很好解决我们的需求

`registerTheme`支持注册自定义主题，主题可以设置绝大多数配置项的样式

**echarts 的实例化流程变成了**  
1）注册自定义主题  
Echarts.registerTheme('myTheme', myTheme);  
2）使用该主题，init 第二个参数名为定义的主题名  
Echarts.init(dom, 'myTheme');  
3）setOption(option), 此时这里的 option 是去掉样式的配置项  
Echarts.setOption(option);

示例如下：

```
// 定义一套主题
let myTheme = {
  'backgroundColor': '#ffffff',
  'title': {
    'textStyle': {'color': '#333333', 'fontSize': 13, 'fontWeight': 500},
    'subtextStyle': {'color': '#333333', 'fontSize': 12}
  },
  'textStyle': {
    'color': '#333333',
    'fontSize': 12,
    'fontFamily': 'Source Han Sans CN,Arial,Microsoft Yahei'
  },
  'tooltip': {
    'borderWidth': 0,
    'backgroundColor': 'rgba(255, 255, 255, 0.95)',
    'textStyle': {'fontSize': 12, 'color': '#333333'},
    'axisPointer': {'lineStyle': {'color': 'rgba(51,51,51,0.07)', 'type': 'dotted'}, 'type': 'line', 'z': 10},
    'borderRadius': 2,
    'extraCssText': 'box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.1);'
  },
  'legend': {
    'type': 'scroll',
    'pageIconColor': '#333333',
    'pageIconSize': 12,
    'pageTextStyle': {'color': '#333333', 'height': 10},
    'itemWidth': 10,
    'itemHeight': 10,
    'itemGap': 24,
    'textStyle': {
      'color': '#333333',
      'fontSize': 12,
      'lineHeight': 12,
      'height': 16,
      'rich': {'a': {'verticalAlign': 'middle'}},
      'padding': [4, 0, 0, 0]
    },
    'pageIconInactiveColor': 'rgba(51, 51, 51, 0.3)'
  },
  'axisPointer': {'link': {'xAxisIndex': 'all'}},
  // valueAxis 表示坐标轴type为value（数值轴）的样式
  'valueAxis': {
    'axisLine': {'lineStyle': {'color': 'rgba(51,51,51,0.12)'}},
    'axisLabel': {'color': '#333333'},
    'splitLine': {'lineStyle': {'color': 'rgba(51,51,51,0.07)', 'type': 'dotted'}},
    'nameTextStyle': {'lineHeight': 30, 'color': 'rgba(51, 51, 51, 0.45)'}
  },
  // timeAxis 表示坐标轴type为time（时间轴）的样式
  'timeAxis': {
    'axisLine': {'lineStyle': {'color': 'rgba(51,51,51,0.12)'}},
    'axisLabel': {'color': '#333333'},
    'splitLine': {'lineStyle': {'color': 'rgba(51,51,51,0.07)', 'type': 'dotted'}},
    'nameTextStyle': {'lineHeight': 30, 'color': 'rgba(51, 51, 51, 0.45)'}
  },
  // categoryAxis 表示坐标轴type为category（类目轴）的样式
  'categoryAxis': {
    'axisLine': {'lineStyle': {'color': 'rgba(51,51,51,0.12)'}},
    'axisLabel': {'color': '#333333'},
    'splitLine': {'lineStyle': {'color': 'rgba(51,51,51,0.07)', 'type': 'dotted'}},
    'nameTextStyle': {'lineHeight': 30, 'color': 'rgba(51, 51, 51, 0.45)'}
  }
  // logAxis 表示坐标轴type为log（对数轴）的样式
  'logAxis': {
    'axisLine': {'lineStyle': {'color': 'rgba(51,51,51,0.12)'}},
    'axisLabel': {'color': '#333333'},
    'splitLine': {'lineStyle': {'color': 'rgba(51,51,51,0.07)', 'type': 'dotted'}},
    'nameTextStyle': {'lineHeight': 30, 'color': 'rgba(51, 51, 51, 0.45)'}
  }
};

// 注册myTheme自定义主题
Echarts.registerTheme('myTheme', myTheme);
// 使用该主题，init第二个参数名为定义的主题名
Echarts.init(dom, 'myTheme');
// 此时这里的option是去掉样式的配置项
Echarts.setOption(option);
```

[下载完整的主题](https://echarts.apache.org/zh/theme-builder.html)

### 3、支持一键换肤

`registerTheme`支持定义多套主题，在需要换肤的时候，重新`init`,并使用新的主题

组件的 props 新增 theme（主题）参数，监听到 theme 变化时，重新`init`

**注：** 换肤时，需要通过`dispose`方法先销毁之前的实例，再`init`

```
// 定义白色主题
Echarts.registerTheme('White', WhiteJSON);
// 定义黑色主题
Echarts.registerTheme('Black', BlackJSON);

// 使用白色主题
Echarts.init(option, 'White');
// 使用黑色主题
Echarts.init(option, 'Black');

// 换肤时，先销毁之前实例，再使用对应的主题样式
echartsInstance.dispose();
```

### 4、高度可扩展

要求图形组件的参数配置格式和 echarts 文档保存一致，同时外部可灵活修改所有配置项

这里要用到`deep-merge`，将用户自定义的配置项和组件内部固有的配置深度合并

**以下为柱状图配置项的处理流程：**

```
// 引入deep-merge插件
import DeepMerge from 'deep-merge';
// 定义深度合并方法
function merge(a, b) {
  return DeepMerge((a, b) => b)(a, b);
}
// barOptions是图形组件内置的柱状图配置项
let barOptions = {
  'legend': {'bottom': 10},
  'color': ['#81adff', '#fcca6a', '#ff9e9e', '#54D5F0', '#FFA380'],
  'grid': { 'top': 50, 'left': 32, 'right': 20, 'bottom': 48, 'containLabel': true},
  'xAxis': { 'axisLine': {'show': false}, 'axisTick': {'show': false}, 'splitLine': {'show': false}},
  'yAxis': {
    'axisTick': {'show': false},
    'splitLine': {'show': true, 'type': 'value'},
    'nameTextStyle': {'padding': [0, 25, 0, 0]}
  },
  'tooltip': {'trigger': 'axis', 'axisPointer': {'type': 'shadow'}}
};

// 将外部传入的chartOptions与barOptions进行深度合并，得到最终的options
let chartOptions = {
  xAxis: {
    data: ['2018年', '2019年', '2020年', '2021年', '2022年']
  },
  yAxis: { name: '指标单位'},
  series: [
    {
      name: '项目名称1',
      data: [40, 25, 35, 20, 28]
    },
    {
      name: '项目名称2',
      data: [9, 3, 15, 20, 7]
    },
    {
      name: '项目名称3',
      data: [-15, -20, -10, -8, -6]
    }
  ]
};

let option = merge(barOptions, chartOptions);
// 生成合并参数的柱状图
Echarts.setOption(option);
```

**最终效果：**  
如果外部 chartOptions 没有对应的配置项，就用内部固有的配置；  
反之如果外部 chartOptions 重写了该配置项，通过`deep-merge`覆盖掉内部的配置

### 5、对外暴露全部的实例事件

在 ECharts 中主要通过  [on](https://echarts.apache.org/zh/api.html#echartsInstance.on)  方法添加事件处理函数  
比如常见的点击事件、legendselectchanged 事件

```
myChart.on('click', function (params) { console.log(params); });
myChart.on('legendselectchanged', function (params) { console.log(params); });
```

**如何对外暴露全部的实例事件呢？**

最开始想法是，通过$emit 先把常用的事件暴露出去，但是这样总是有漏的。  
`其实这种想法已经走进了自我设置的误区中`

因为 echarts 是通过实例` myChart.on` 绑定事件，所以**只要把 echartInstance 实例暴露出去就好了，有了实例，即获取了全部的实例事件**

外部通过$refs.elChart.myChart 获取图形实例，从而获取全部的实例事件

### 6、图形导出功能

利用[echartsInstance.getDataURL](https://echarts.apache.org/zh/api.html#echartsInstance.getDataURL)方法，该方法返回一个 `base64的URL`  
**注**：需要在`finished`（渲染完成事件）的回调函数中调用`getDataURL`方法，

**导出整体流程**：

**1、使用组件：**  
1）图形组件设置`exportConfig`属性，开启导出功能，
该属性包括 4 个选项：  
`getUrlMethod`(必须配置项：通过该方法的参数获取 base64 的方法)、  
`width`（自定义图片的宽度）、  
`height`（自定义图片的高度）、  
`isClear`（是否清除 chartExport Instance， 默认 true）  
2）通过`getUrlMethod`绑定方法，获取导出图形的`base64`

**2、内部处理流程：**  
1）因为需要自定义导出图形的宽高，需要新建了一个`chartExport`的 div 容器  
2）判断 props 是否传递了`exportConfig`属性，并且`getUrlMethod`必须是一个函数  
3）判断条件成立，则开启图形导出功能  
4）在`finished`事件的回调函数中，执行`getDataURL`方法获取对应的 base64，调用 exportConfig 中的`getUrlMethod`方法，将 base64 作为参数传递出去

## 整体的伪代码

以柱状图为例：

```
<template>
  <el-chart type='bar' :copy-config="{ getUrlMethod: getUrlMethod, copyWidth: 800, copyHeight: 360, isClear: true }"></el-chart>
</template>
<script>
  export default {
    methods: {
      // 获取导出图形base64的url
      getUrlMethod(base64) {
        console.log(base64, 'base64');
      }
    }
  };
</script>
```

```
<template>
  <div class='el-chart__container'>
    <div class='el-chart' ref='chart' :style='{ width, height }' />
    <!-- chartExport 为导出图片的容器, 因为不需要显示，所以将v-show设置false -->
    <div ref='chartExport' v-show='false' />
  </div>
</template>

<script>
  import * as Echarts from 'echarts';
  import DeepMerge from 'deep-merge';
  import deepClone from 'deep-clone';

  // 注册主题
  Echarts.registerTheme('White', WhiteTheme);
  Echarts.registerTheme('Black', BlackTheme);

  // 定义柱状图的 固定配置项
  let barOptions = {
    legend: {bottom: 10},
    color: ['#81adff', '#fcca6a', '#ff9e9e', '#54D5F0', '#FFA380'],
    grid: { 'top': 50, 'left': 32, 'right': 20, 'bottom': 48, 'containLabel': true},
    xAxis: { 'axisLine': {'show': false}, 'axisTick': {'show': false}, 'splitLine': {'show': false}},
    yAxis: {
      axisTick: {'show': false},
      splitLine: {'show': true, 'type': 'value'},
      nameTextStyle: {'padding': [0, 25, 0, 0]}
    },
    tooltip: {'trigger': 'axis', 'axisPointer': {'type': 'shadow'}}
  };

  // 定义柱状图series各项的样式
  let barSeries = {
    type: 'bar',
    itemStyle: { borderRadius: [2, 2, 0, 0] },
    barMaxWidth: 16,
    barMinWidth: 1,
    connectNulls: true
  };

  export default {
    name: 'ElChart',

    data() {
      return {
        elChart: {},
        myChartExport: {},
        options: {}
      };
    },
    watch: {
      theme: {
        handler(val) {
          if (val) {
            // 先销毁示例 再使用对应的主题样式
            this.elChart && this.elChart.dispose();
            this.elChart = Echarts.init(this.$refs.chart, this.theme);
            this.handleOption();
          }
        }
      },
      // 监听图形类型的变化
      type: {
        handler(val) {
          if (val) this.handleOption();
        }
      },
      chartOptions: {
        handler(val) {
          if (val) this.handleOption();
        },
        deep: true
      }
    },
    props: {
      type: String, // 图形类型
      theme: { default: 'White' }, // 主题
      width: { default: '100%' }, // 图形的宽度
      height: { default: '300px' }, // 图形的高度
      chartOptions: { // 图形配置项
        type: Object,
        default: () => {
          return {};
        }
      },
      exportConfig: { // 导出图形的配置
        type: Object,
        default: () => {
          return {};
        }
      }
    },
    mounted() {
      // 使用对应的主题样式
      this.elChart = Echarts.init(this.$refs.chart, this.theme);
      this.handleOption();
      // 添加resize事件，当屏幕变化时，重新渲染图形
      window.addEventListener('resize', this.chartResize);
    },
    methods: {
      handleOption() {
        /**
        * 1、给柱状图添加series基础的样式
        * 2、深度合并柱状图的配置项
        * */
        if (this.type === 'bar') {
          // chartOptions是props传递进来的值，不能直接修改，克隆后再使用
          let obj = deepClone(this.chartOptions);
          // 判断是否配置了series，并给每一项添加对应的样式
          if (Array.isArray(obj.series) && obj.series.length) {
            obj.series = obj.series.map(item => {
              return {
                ...barSeries,
                ...item
              };
            });
          }
          // 将内置的配置项与外部的配置项 深度合并
          this.options = this.merge(barOptions, obj);
        }
        // 同理添加处理其他图形的逻辑（细节省略）
        if (this.type === 'line') {}
        if (this.type === 'pie') {}


        // 判断是否配置了getUrlMethod方法， 有则提供图形的复制功能
        if (this.exportConfig.getUrlMethod && typeof this.exportConfig.getUrlMethod === 'function') {
          this.getChartUrl(this.exportConfig);
        }

        // 第二个参数为true，表示旧的组件会被完全移除，组件会根据新的option创建
        this.elChart.setOption(this.options, true);
      },
      // 尺寸变化 重新渲染
      chartResize() {
        this.elChart && this.elChart.resize();
      },
      // 深度合并
      merge(a, b) {
        return DeepMerge((a, b) => b)(a, b);
      },
      // 图形组件对外提供复制，下载图片echart初始化
      getChartUrl({getUrlMethod, width = this.$refs.chart.offsetWidth, height = this.$refs.chart.offsetHeight, isClear = true }) {
        this.myChartExport = this.$echarts.init(this.$refs.chartExport, this.theme, {
          width,
          height
        });
        this.myChartExport.setOption(this.options);

        // 渲染完成事件
        this.myChartExport.on('finished', () => {
          let myChartURL = this.myChartExport.getDataURL({
            type: 'png',
            pixelRatio: 1
          });
          // 将myChartURL作为参数传递出去
          getUrlMethod(myChartURL);
          // 销毁示例
          if (isClear) {
            this.myChartExport.dispose();
            this.myChartExport = null;
          }
        });
      }
    },
    beforeDestroy() {
      // 移除resize事件
      window.removeEventListener('resize', this.chartResize);
    }
  };
</script>
```

## elementUI 如何新增一个组件

**/build/bin/new.js**

为组件库添加新组件时会使用该脚本，一键生成组件所有文件并完成这些文件基本结构的编写和相关的引入配置  
该脚本的存在，让你在开发新组件时，只需专注于组件代码的编写即可，无需关心项目的配置

**新增组件的流程**  
1、在 package.json 中新加一个命令：`"makeNew": "node build/bin/new.js" `

2、该脚本接受两个参数：`<component-name>` 、 `[中文名]`

3、现在要新增 chart 图形组件，如执行：`npm run makeNew -- chart 图形组件`

4、执行完该命令，会自动在各个目录添加该组件的配置信息

**npm run makeNew 大致有以下变动：**

1、在 /packages 目录下新建组件目录，并完成目录结构的创建  
2、创建组件文档，/examples/docs/zh-CN/chart.md  
3、创建组件单元测试文件，/test/unit/specs/chart.spec.js  
4、创建组件样式文件，/packages/theme-chalk/src/chart.scss  
5、创建组件类型声明文件，/types/chart.d.ts  
6、配置项如下    
在 /components.json 文件中配置组件信息 _  
在 /examples/nav.config.json 中添加该组件的路由配置 _  
在 /packages/theme-chalk/src/index.scss 文件中自动引入该组件的样式文件  
将类型声明文件在 /types/element-ui.d.ts 中自动引入

## 总结

回头再看看封装好的图形组件，并不存在什么技术难点

更多的收获是对需求的梳理和对应的解决方案，最终如何方便开发者使用，体现该组件的价值

**1、反思**

敲黑板：`先想好再动手`  
前期组件需求没有梳理清楚，就盲目上手，导致后期一直在打补丁，导致又重构了一遍。  
**因为前面没有预期，所以后面自然没有结果**。

**2、单个知识点总结：**  
1）熟系 echarts 的初始化流程  
2）掌握 registerTheme、init、dispose、getDataURL 方法
3）掌握 legendselectchanged、datazoom、finished 等事件，
4）getDataURL 方法要在 finished 事件的回调函数中调用
5）掌握 elementUI 中如何新增组件

## 参考链接

[Element 源码架构](https://juejin.cn/post/6935977815342841892)
