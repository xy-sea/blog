**如何让前端拥有后端的计算能力，在算力紧缺的年代，扩展前端的业务边界！**

## 前言

页面中有十万条数据，对其进行复杂运算，需要多久呢？

表格 4000 行，25 列，共十万条数据

**运算包括**：总和、算术平均、加权平均、最大、最小、计数、样本标准差、样本方差、中位数、总体标准差、总体方差

![table.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9244b9f93e7546059844ba41176339eb~tplv-k3u1fbpfcp-watermark.image?)

答案是: **35s 左右**

_注：具体时间根据电脑配置会有所不同_

**并且** 这个时间段内，页面一直处于假死状态，对页面做任何操作都没有反应 😭😭😭

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b2df71b2125a44c3b1160bc9daf3476d~tplv-k3u1fbpfcp-watermark.image?" alt="boom.gif" width="20%" />

**什么是假死？**

浏览器有 GUI 渲染线程与 JS 引擎线程，这两个线程是互斥的关系

当 js 有大量计算时，会造成 UI 阻塞，出现界面卡顿、掉帧等情况，严重时会出现页面卡死的情况，俗称**假死**

## 致命 bug

**强行送测吧**

测试小姐姐：你的页面又死了！！  
我：还没有死，在 ICU…… ，过一会就好了  
测试小姐姐：已经等了好一会了，还不行啊，是个**致命 bug**💥  
我：……

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4006164b249041f8915173749370f343~tplv-k3u1fbpfcp-watermark.image?" alt="绝望.jpg" width="25%" />

**闯荡前端数十载，竟被提了个致命 bug，颜面何在！🙈**

## Performance 分析假死期间的性能表现

**如下图所示： 此次计算总用时为 35.45s**

重点从以下三个方面分析：

**1）FPS**

FPS: 表示每秒传输帧数，是分析动画的一个主要性能指标，绿色的长度越长，用户体验越好；反之红色越长，说明卡顿严重

**从图中看到 FPS 中有一条持续了 35s 的红线，说明这期间卡顿严重**

**2）火焰图 Main**  
Main: 表示主线程运行状况，包括 js 的计算与执行、css 样式计算、Layout 布局等等。

展开 Main,红色倒三角的为**Long Task**,执行时长 50ms 就属于长任务，会阻塞页面渲染

**从图中看到计算过程的 Long Task 执行时间为 35.45s, 是造成页面假死的原因**

**3）Summary 统计汇总面板**  
Summary: 表示各指标时间占用统计报表

- Loading:  加载时间
- Scripting: js 计算时间
- Rendering:  渲染时间
- Painting:  绘制时间
- Other:  其他时间
- Idle:  浏览器闲置时间

**Scripting 代码执行为 35.9s**

![performance8.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/100da80ce95148cca9ac19286828e80c~tplv-k3u1fbpfcp-watermark.image?)

**拿什么拯救你，我的页面**

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/38eb3e8c08974c5e92b48438758ba716~tplv-k3u1fbpfcp-watermark.image" alt="" width="30%" />

## 召唤 Web Worker，出来吧神龙

![R-C (1).gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ba759292d25f45fb8c28af3aa07444f9~tplv-k3u1fbpfcp-watermark.image?)

**神龙，我想让页面的计算变快，并且不卡顿**

**Web Worker 了解一下：**

在 HTML5 的新规范中，实现了 Web Worker 来引入 js 的 “多线程” 技术, 可以让我们在页面主运行的 js 线程中，加载运行另外单独的一个或者多个 js 线程

**一句话： Web Worker 专门处理复杂计算的，从此让前端拥有后端的计算能力**

## 在 Vue 中 使用 Web Worker

1、安装 worker-loader

```js
npm install worker-loader
```

2、编写 worker.js

```js
onmessage = function (e) {
  // onmessage获取传入的初始值
  let sum = e.data;
  for (let i = 0; i < 200000; i++) {
    for (let i = 0; i < 10000; i++) {
      sum += Math.random();
    }
  }
  // 将计算的结果传递出去
  postMessage(sum);
};
```

3、通过行内 loader 引入 worker.js

```js
import Worker from 'worker-loader!./worker';
```

4、最终代码

```js
<template>
    <div>
        <button @click="makeWorker">开始线程</button>
        <!--在计算时 往input输入值时 没有发生卡顿-->
        <p><input type="text"></p>
    </div>
</template>

<script>
    import Worker from "worker-loader!./worker";

    export default {
        methods: {
            makeWorker() {
                // 获取计算开始的时间
                let start = performance.now();
                // 新建一个线程
                let worker = new Worker();
                // 线程之间通过postMessage进行通信
                worker.postMessage(0);
                // 监听message事件
                worker.addEventListener("message", (e) => {
                    // 关闭线程
                    worker.terminate();
                    // 获取计算结束的时间
                    let end = performance.now();
                    // 得到总的计算时间
                    let durationTime = end - start;
                    console.log('计算结果:', e.data);
                    console.log(`代码执行了 ${durationTime} 毫秒`);
                });
            }
        },
    }
</script>
```

计算过程中，在 input 框输入值，页面一直未发生卡顿

![total.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d294d8e1a5bf4051acd935d5fb96671d~tplv-k3u1fbpfcp-watermark.image?)

## 对比试验

如果直接把下面这段代码直接丢到主线程中，计算过程中页面一直处于假死状态，input 框无法输入

```js
let sum = 0;
for (let i = 0; i < 200000; i++) {
  for (let i = 0; i < 10000; i++) {
    sum += Math.random();
  }
}
```

## 前戏差不多了，上硬菜

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1da9b4626f5d4a81b901a215981bc263~tplv-k3u1fbpfcp-watermark.image" alt="" width="50%" />

**开启多线程，并行计算**

回到要解决的问题，执行多种运算时，给每种运算开启单独的线程，线程计算完成后要及时关闭

**多线程代码**

```js
<template>
    <div>
        <button @click="makeWorker">开始线程</button>
        <!--在计算时 往input输入值时 没有发生卡顿-->
        <p><input type="text"></p>
    </div>
</template>

<script>
    import Worker from "worker-loader!./worker";

    export default {
        data() {
          // 模拟数据
          let arr = new Array(100000).fill(1).map(() => Math.random()* 10000);
          let weightedList = new Array(100000).fill(1).map(() => Math.random()* 10000);
          let calcList = [
              {type: 'sum', name: '总和'},
              {type: 'average', name: '算术平均'},
              {type: 'weightedAverage', name: '加权平均'},
              {type: 'max', name: '最大'},
              {type: 'middleNum', name: '中位数'},
              {type: 'min', name: '最小'},
              {type: 'variance', name: '样本方差'},
              {type: 'popVariance', name: '总体方差'},
              {type: 'stdDeviation', name: '样本标准差'},
              {type: 'popStandardDeviation', name: '总体标准差'}
          ]
          return {
              workerList: [], // 用来存储所有的线程
              calcList, // 计算类型
              arr, // 数据
              weightedList // 加权因子
          }
        },
        methods: {
            makeWorker() {
                this.calcList.forEach(item => {
                    let workerName = `worker${this.workerList.length}`;
                    let worker = new Worker();
                    let start = performance.now();
                    worker.postMessage({arr: this.arr, type: item.type, weightedList: this.weightedList});
                    worker.addEventListener("message", (e) => {
                        worker.terminate();

                        let tastName = '';
                        this.calcList.forEach(item => {
                            if(item.type === e.data.type) {
                                item.value = e.data.value;
                                tastName = item.name;
                            }
                        })

                        let end = performance.now();
                        let duration = end - start;
                        console.log(`当前任务: ${tastName}, 计算用时: ${duration} 毫秒`);
                    });
                    this.workerList.push({ [workerName]: worker });
                })
            },
            clearWorker() {
                if (this.workerList.length > 0) {
                    this.workerList.forEach((item, key) => {
                        item[`worker${key}`].terminate && item[`worker${key}`].terminate(); // 终止所有线程
                    });
                }
            }
        },
        // 页面关闭，如果还没有计算完成，要销毁对应线程
        beforeDestroy() {
            this.clearWorker();
        },
    }
</script>
```

**worker.js**

```js
import { create, all } from 'mathjs';
const config = {
  number: 'BigNumber',
  precision: 20 // 精度
};
const math = create(all, config);

//加
const numberAdd = (arg1, arg2) => {
  return math.number(math.add(math.bignumber(arg1), math.bignumber(arg2)));
};
//减
const numberSub = (arg1, arg2) => {
  return math.number(math.subtract(math.bignumber(arg1), math.bignumber(arg2)));
};
//乘
const numberMultiply = (arg1, arg2) => {
  return math.number(math.multiply(math.bignumber(arg1), math.bignumber(arg2)));
};
//除
const numberDivide = (arg1, arg2) => {
  return math.number(math.divide(math.bignumber(arg1), math.bignumber(arg2)));
};

// 数组总体标准差公式
const popVariance = (arr) => {
  return Math.sqrt(popStandardDeviation(arr));
};

// 数组总体方差公式
const popStandardDeviation = (arr) => {
  let s,
    ave,
    sum = 0,
    sums = 0,
    len = arr.length;
  for (let i = 0; i < len; i++) {
    sum = numberAdd(Number(arr[i]), sum);
  }
  ave = numberDivide(sum, len);
  for (let i = 0; i < len; i++) {
    sums = numberAdd(
      sums,
      numberMultiply(numberSub(Number(arr[i]), ave), numberSub(Number(arr[i]), ave))
    );
  }
  s = numberDivide(sums, len);
  return s;
};

// 数组加权公式
const weightedAverage = (arr1, arr2) => {
  // arr1: 计算列，arr2: 选择的权重列
  let s,
    sum = 0, // 分子的值
    sums = 0, // 分母的值
    len = arr1.length;
  for (let i = 0; i < len; i++) {
    sum = numberAdd(numberMultiply(Number(arr1[i]), Number(arr2[i])), sum);
    sums = numberAdd(Number(arr2[i]), sums);
  }
  s = numberDivide(sum, sums);
  return s;
};

// 数组样本方差公式
const variance = (arr) => {
  let s,
    ave,
    sum = 0,
    sums = 0,
    len = arr.length;
  for (let i = 0; i < len; i++) {
    sum = numberAdd(Number(arr[i]), sum);
  }
  ave = numberDivide(sum, len);
  for (let i = 0; i < len; i++) {
    sums = numberAdd(
      sums,
      numberMultiply(numberSub(Number(arr[i]), ave), numberSub(Number(arr[i]), ave))
    );
  }
  s = numberDivide(sums, len - 1);
  return s;
};

// 数组中位数
const middleNum = (arr) => {
  arr.sort((a, b) => a - b);
  if (arr.length % 2 === 0) {
    //判断数字个数是奇数还是偶数
    return numberDivide(numberAdd(arr[arr.length / 2 - 1], arr[arr.length / 2]), 2); //偶数个取中间两个数的平均数
  } else {
    return arr[(arr.length + 1) / 2 - 1]; //奇数个取最中间那个数
  }
};

// 数组求和
const sum = (arr) => {
  let sum = 0,
    len = arr.length;
  for (let i = 0; i < len; i++) {
    sum = numberAdd(Number(arr[i]), sum);
  }
  return sum;
};

// 数组平均值
const average = (arr) => {
  return numberDivide(sum(arr), arr.length);
};

// 数组最大值
const max = (arr) => {
  let max = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (max < arr[i]) {
      max = arr[i];
    }
  }
  return max;
};

// 数组最小值
const min = (arr) => {
  let min = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (min > arr[i]) {
      min = arr[i];
    }
  }
  return min;
};

// 数组有效数据长度
const count = (arr) => {
  let remove = ['', ' ', null, undefined, '-']; // 排除无效的数据
  return arr.filter((item) => !remove.includes(item)).length;
};

// 数组样本标准差公式
const stdDeviation = (arr) => {
  return Math.sqrt(variance(arr));
};

// 数字三位加逗号，保留两位小数
const formatNumber = (num, pointNum = 2) => {
  if ((!num && num !== 0) || num == '-') return '--';
  let arr = (typeof num == 'string' ? parseFloat(num) : num).toFixed(pointNum).split('.');
  let intNum = arr[0].replace(/\d{1,3}(?=(\d{3})+(.\d*)?$)/g, '$&,');
  return arr[1] === undefined ? intNum : `${intNum}.${arr[1]}`;
};

onmessage = function (e) {
  let { arr, type, weightedList } = e.data;
  let value = '';
  switch (type) {
    case 'sum':
      value = formatNumber(sum(arr));
      break;
    case 'average':
      value = formatNumber(average(arr));
      break;
    case 'weightedAverage':
      value = formatNumber(weightedAverage(arr, weightedList));
      break;
    case 'max':
      value = formatNumber(max(arr));
      break;
    case 'middleNum':
      value = formatNumber(middleNum(arr));
      break;
    case 'min':
      value = formatNumber(min(arr));
      break;
    case 'variance':
      value = formatNumber(variance(arr));
      break;
    case 'popVariance':
      value = formatNumber(popVariance(arr));
      break;
    case 'stdDeviation':
      value = formatNumber(stdDeviation(arr));
      break;
    case 'popStandardDeviation':
      value = formatNumber(popStandardDeviation(arr));
      break;
  }

  // 发送数据事件
  postMessage({ type, value });
};
```

## 35s 变成 6s

**从原来的 35s 变成了最长 6s，并且计算过程中全程无卡顿，YYDS**

![time1.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/498cca4446ce45fcb46c3b4f5f1800fe~tplv-k3u1fbpfcp-watermark.image?)

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/adf28e0964754127a009fd3a3eb3385a~tplv-k3u1fbpfcp-watermark.image?" alt="src=http___img.soogif.com_n7sySW0OULhVlH5j7OrXHpbqEiM9hDsr.gif&refer=http___img.soogif.gif" width="35%" />

**最终的效果**

![table.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/18cd82fd70d84211b8317d69fa922713~tplv-k3u1fbpfcp-watermark.image?)

## 十万条太 low 了，百万条数据玩一玩

```js
// 修改上文的模拟数据
let arr = new Array(1000000).fill(1).map(() => Math.random() * 10000);
let weightedList = new Array(1000000).fill(1).map(() => Math.random() * 10000);
```

时间明显上来了，最长要 50 多 s 了，没事玩一玩，开心就好

![time3.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a58e9dbcc4ab4147a18c519bad9572e0~tplv-k3u1fbpfcp-watermark.image?)

## web worker 提高 Canvas 运行速度

web worker 除了单纯进行计算外，还可以结合**离屏 canvas**进行绘图，提升绘图的渲染性能和使用体验

**离屏 canvas 案例**

```js
<template>
    <div>
        <button @click="makeWorker">开始绘图</button>
        <canvas id="myCanvas" width="300" height="150"></canvas>
    </div>
</template>

<script>
    import Worker from "worker-loader!./worker";
    export default {
        methods: {
            makeWorker() {
                let worker = new Worker();
                let htmlCanvas = document.getElementById("myCanvas");
                // 使用canvas的transferControlToOffscreen函数获取一个OffscreenCanvas对象
                let offscreen = htmlCanvas.transferControlToOffscreen();
                // 注意：第二个参数不能省略
                worker.postMessage({canvas: offscreen}, [offscreen]);
            }
        }
    }
</script>
```

**worker.js**

```js
onmessage = function (e) {
  // 使用OffscreenCanvas（离屏Canvas）
  let canvas = e.data.canvas;
  // 获取绘图上下文
  let ctx = canvas.getContext('2d');
  // 绘制一个圆弧
  ctx.beginPath(); // 开启路径
  ctx.arc(150, 75, 50, 0, Math.PI * 2);
  ctx.fillStyle = '#1989fa'; //设置填充颜色
  ctx.fill(); //开始填充
  ctx.stroke();
};
```

**效果：**

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/097856c80b2a4ad6824c8c581c1f279c~tplv-k3u1fbpfcp-watermark.image?" alt="cricle.gif" width="50%" />

**离屏 canvas 的优势**

1、对于复杂的 canvas 绘图，可以避免阻塞主线程

2、由于这种解耦，OffscreenCanvas 的渲染与 DOM 完全分离了开来，并且比普通 Canvas 速度提升了一些

## Web Worker 的限制

1、在 Worker 线程的运行环境中没有 window 全局对象，也无法访问 DOM 对象

2、Worker 中只能获取到部分浏览器提供的 API，如`定时器`、`navigator`、`location`、`XMLHttpRequest`等

3、由于可以获取`XMLHttpRequest` 对象，可以在 Worker 线程中执行`ajax`请求

4、每个线程运行在完全独立的环境中，需要通过`postMessage`、 `message`事件机制来实现的线程之间的通信

## 计算时长 超过多长时间 适合用 Web Worker

**原则上，运算时间超过 50ms 会造成页面卡顿，属于 Long task，这种情况就可以考虑使用 Web Worker**

但还要先考虑`通信时长`的问题

假如一个运算执行时长为 100ms, 但是通信时长为 300ms, 用了 Web Worker 可能会更慢

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/874f81857de64876808f1a3868770246~tplv-k3u1fbpfcp-watermark.image?" alt="face.jpg" width="20%" />

### 通信时长

新建一个 web worker 时, 浏览器会加载对应的 worker.js 资源

**下图中的 Time 是这个 js 资源的加载时长**

![load.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3b3f1e0b00b34a35813dd06f1354ee18~tplv-k3u1fbpfcp-watermark.image?)

**最终标准：**

**计算的运算时长 - 通信时长 > 50ms，推荐使用 Web Worker**

## 场景补充说明

**遇到大数据，第一反应: 为什么不让后端去计算呢？**

这里比较特殊，表格 4000 行，25 列  
1）用户可以对表格进行灵活操作，比如删除任何行或列，选择或剔除任意行  
2）用户可以灵活选择运算的类型，计算一个或多个

即便是让后端计算，需要把大量数据传给后端，计算好再返回，这个时间也不短，还可能出现用户频繁操作，接口数据被覆盖等情况

## github 仓库

想动手玩一玩的小伙伴，可以从[**github 仓库**](https://github.com/xy-sea/blog/tree/dev/web-worker)下载

**示例演示**

![webworker.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/47bf26f3a4ca459ea360946d7a659647~tplv-k3u1fbpfcp-watermark.image?)

## 总结

**Web Worker 为前端带来了后端的计算能力，扩大了前端的业务边界**

可以实现主线程与复杂计运算线程的分离，从而减轻了因大量计算而造成 UI 阻塞的情况

并且更大程度地利用了终端硬件的性能

![R-C.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c6fe05af53f14760b7abb55be9f5de0f~tplv-k3u1fbpfcp-watermark.image?)

## 参考链接

[JavaScript 中的多线程 -- Web Worker](https://zhuanlan.zhihu.com/p/25184390)  
[OffscreenCanvas-离屏 canvas 使用说明](https://blog.csdn.net/netcy/article/details/103781610)
