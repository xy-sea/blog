<template>
  <div class="home">
    <el-button type="primary" @click="start">录屏</el-button>
    <el-button type="success" @click="play">播放</el-button>
    <div id="main" style="width: 400px; height: 300px"></div>
    <el-input v-model="input" placeholder="请输入内容"></el-input>
    <el-button type="text" @click="dialogVisible = true">点击打开 Dialog</el-button>
    <el-dialog title="提示" :visible.sync="dialogVisible" width="30%" :before-close="handleClose">
      <span>这是一段信息</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
    <el-select v-model="value" placeholder="请选择">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
    </el-select>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="date" label="日期" width="180"> </el-table-column>
      <el-table-column prop="name" label="姓名" width="180"> </el-table-column>
      <el-table-column prop="address" label="地址"> </el-table-column>
    </el-table>

    <el-dialog title="播放录屏" custom-class="play-disalog" top="10vh" :fullscreen="true" :visible.sync="rrwebdialog" width="90%" :destroy-on-close="true" @opened="opened">
      <div id="replaycontent"></div>
    </el-dialog>
  </div>
</template>

<script>
import { record } from 'rrweb';
import 'rrweb-player/dist/style.css';
import rrwebPlayer from 'rrweb-player';
import pako from 'pako';
import { Base64 } from 'js-base64';

export default {
  name: 'HomeView',
  data() {
    return {
      stopFn: null,
      rrwebdialog: false,
      input: '',
      events: [],
      options: [
        {
          value: '选项1',
          label: '黄金糕'
        },
        {
          value: '选项2',
          label: '双皮奶'
        },
        {
          value: '选项3',
          label: '蚵仔煎'
        },
        {
          value: '选项4',
          label: '龙须面'
        },
        {
          value: '选项5',
          label: '北京烤鸭'
        }
      ],
      value: '',
      dialogVisible: false,
      tableData: [
        {
          date: '2016-05-02',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1518 弄'
        },
        {
          date: '2016-05-04',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1517 弄'
        },
        {
          date: '2016-05-01',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1519 弄'
        },
        {
          date: '2016-05-03',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1516 弄'
        }
      ],
      timer: null
    };
  },
  mounted() {
    this.myEcharts();
  },
  methods: {
    // 压缩
    zip(data) {
      if (!data) return data;
      // 判断数据是否需要转为JSON
      const dataJson = typeof data !== 'string' && typeof data !== 'number' ? JSON.stringify(data) : data;
      // 使用Base64.encode处理字符编码，兼容中文
      const str = Base64.encode(dataJson);
      let binaryString = pako.gzip(str);
      let arr = Array.from(binaryString);
      let s = '';
      arr.forEach((item) => {
        s += String.fromCharCode(item);
      });
      return Base64.btoa(s);
    },
    // 解压
    unzip(b64Data) {
      let strData = Base64.atob(b64Data);
      let charData = strData.split('').map(function (x) {
        return x.charCodeAt(0);
      });
      let binData = new Uint8Array(charData);
      let data = pako.ungzip(binData);
      // ↓切片处理数据，防止内存溢出报错↓
      let str = '';
      const chunk = 8 * 1024;
      let i;
      for (i = 0; i < data.length / chunk; i++) {
        str += String.fromCharCode.apply(null, data.slice(i * chunk, (i + 1) * chunk));
      }
      str += String.fromCharCode.apply(null, data.slice(i * chunk));
      // ↑切片处理数据，防止内存溢出报错↑
      const unzipStr = Base64.decode(str);
      let result = '';
      // 对象或数组进行JSON转换
      try {
        result = JSON.parse(unzipStr);
      } catch (error) {
        if (/Unexpected token o in JSON at position 0/.test(error)) {
          // 如果没有转换成功，代表值为基本数据，直接赋值
          result = unzipStr;
        }
      }
      return result;
    },
    start() {
      let _this = this;
      // 重新录屏
      if (_this.stopFn) _this.stopFn();
      _this.events = [];
      // 调用stopFn停止录屏
      _this.stopFn = record({
        emit(event) {
          _this.events.push(event);
        },
        recordCanvas: true
        // 每10s重新制作快照
        // checkoutEveryNms: 10 * 1000
      });
    },
    play() {
      // 停止录屏
      if (this.stopFn) {
        this.stopFn();
        this.stopFn = null;
      }
      this.rrwebdialog = true;
    },
    opened() {
      const data = this.zip(this.events);
      const result = this.unzip(data);
      new rrwebPlayer({
        target: document.getElementById('replaycontent'),
        props: {
          events: result,
          UNSAFE_replayCanvas: true
        }
      });
    },
    myEcharts() {
      // 基于准备好的dom，初始化echarts实例
      let myChart = this.$echarts.init(document.getElementById('main'));

      // 指定图表的配置项和数据
      let option = {
        animation: false,
        title: {
          text: 'ECharts 入门示例'
        },
        tooltip: {},
        legend: {
          data: ['销量']
        },
        xAxis: {
          data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
        },
        yAxis: {},
        series: [
          {
            name: '销量',
            type: 'bar',
            data: [5, 20, 36, 10, 10, 20]
          }
        ]
      };

      // 使用刚指定的配置项和数据显示图表。
      myChart.setOption(option);
    },
    handleClose(done) {
      this.$confirm('确认关闭？')
        .then(() => {
          done();
        })
        .catch(() => {});
    }
  }
};
</script>
<style>
.rr-player {
  float: unset;
  margin: 0 auto;
}
.replaycontent {
  width: 100%;
}

.play-disalog .el-dialog__body {
  height: 720px;
}
</style>
