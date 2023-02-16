<template>
  <div class="aboutView">
    <h1>This is an about page</h1>
    <el-button type="primary" @click="dialogTableVisible = !dialogTableVisible">打开弹框</el-button>
    <div id="main" style="width: 400px; height: 300px"></div>
    <ul class="img">
      <li v-for="(item, index) in imgList" :key="index">
        <img v-lazy="item" alt="" style="width: 768px" />
      </li>
    </ul>
    <dialogInfo v-if="dialogTableVisible" />
  </div>
</template>
<script>
// import dialogInfo from '@/components/dialogInfo';
const dialogInfo = () => import(/* webpackChunkName: "dialogInfo" */ '@/components/dialogInfo');

export default {
  name: 'homeView',
  data() {
    return {
      imgList: [
        'https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg',
        'https://fuss10.elemecdn.com/1/34/19aa98b1fcb2781c4fba33d850549jpeg.jpeg',
        'https://fuss10.elemecdn.com/0/6f/e35ff375812e6b0020b6b4e8f9583jpeg.jpeg',
        'https://fuss10.elemecdn.com/9/bb/e27858e973f5d7d3904835f46abbdjpeg.jpeg',
        'https://fuss10.elemecdn.com/d/e6/c4d93a3805b3ce3f323f7974e6f78jpeg.jpeg',
        'https://fuss10.elemecdn.com/3/28/bbf893f792f03a54408b3b7a7ebf0jpeg.jpeg',
        'https://fuss10.elemecdn.com/2/11/6535bcfb26e4c79b48ddde44f4b6fjpeg.jpeg'
      ],
      dialogTableVisible: false
    };
  },
  components: {
    dialogInfo
  },
  mounted() {
    this.myEcharts();
  },
  methods: {
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
    }
  }
};
</script>
<style scoped lang="less">
.aboutView {
  padding: 10px;

  .img {
    width: 80%;
  }
}
</style>
