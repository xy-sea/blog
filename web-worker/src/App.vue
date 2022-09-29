<template>
  <div id="app">
    <div class="changeRadio">
      <el-radio-group v-model="radio">
        <el-radio :label="1">表格计算示例</el-radio>
        <el-radio :label="2">canvas绘制示例</el-radio>
      </el-radio-group>
    </div>

    <dataList v-if="radio == 1" />
    <canvasDemo v-if="radio == 2" />
  </div>
</template>

<script>
import dataList from './components/dataList.vue';
import canvasDemo from './components/canvasDemo.vue';
export default {
  name: 'App',
  data() {
    return {
      radio: 1
    };
  },
  components: {
    dataList,
    canvasDemo
  }
};
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  .changeRadio {
    height: 60px;
    line-height: 60px;
    text-align: center;
    background: #f2f6fc;
    .el-radio-group {
      margin: 0 auto;
    }
  }
}
</style>
