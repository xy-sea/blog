<template>
  <div class="homeView">
    {{ dataTime }}
    <el-button type="primary" @click="dialogTableVisible = !dialogTableVisible">打开弹框</el-button>
    <el-table class="my-table" :data="tableData" stripe>
      <el-table-column prop="date" label="日期" width="180"> </el-table-column>
      <el-table-column prop="name" label="姓名" width="180"> </el-table-column>
      <el-table-column prop="address" label="地址"> </el-table-column>
    </el-table>
    <el-form ref="form" :model="form" label-width="80px">
      <el-form-item label="活动名称">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="活动区域">
        <el-select v-model="form.region" placeholder="请选择活动区域">
          <el-option label="区域一" value="shanghai"></el-option>
          <el-option label="区域二" value="beijing"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="即时配送">
        <el-switch v-model="form.delivery"></el-switch>
      </el-form-item>
      <el-form-item label="活动性质">
        <el-checkbox-group v-model="form.type">
          <el-checkbox label="美食/餐厅线上活动" name="type"></el-checkbox>
          <el-checkbox label="地推活动" name="type"></el-checkbox>
          <el-checkbox label="线下主题活动" name="type"></el-checkbox>
          <el-checkbox label="单纯品牌曝光" name="type"></el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="特殊资源">
        <el-radio-group v-model="form.resource">
          <el-radio label="线上品牌商赞助"></el-radio>
          <el-radio label="线下场地免费"></el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="活动形式">
        <el-input type="textarea" v-model="form.desc"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">立即创建</el-button>
        <el-button>取消</el-button>
      </el-form-item>
    </el-form>
    <dialogInfo v-if="dialogTableVisible" />
  </div>
</template>

<script>
import axiosWrap from '../util/axiosWrap';
import { targetType } from '../util';
// import dialogInfo from '@/components/dialogInfo';

export default {
  name: 'homeView',
  data() {
    return {
      dialogTableVisible: false,
      dataTime: '',
      activeNames: ['1'],
      form: {
        name: '',
        region: '',
        date1: '',
        date2: '',
        delivery: false,
        type: [],
        resource: '',
        desc: ''
      },
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
      ]
    };
  },
  components: {
    dialogInfo: () => import(/* webpackChunkName: "dialogInfo" */ '@/components/dialogInfo')
    // dialogInfo
  },
  mounted() {
    this.dataTime = this.$moment().format('YYYY年MM月DD日');
    let url = `${location.origin}/logstorage/common`;
    let params = {
      appId: 'web-see',
      timestamp: 1672912057659
    };
    axiosWrap.post(url, params).then((res) => {
      console.log(res, 'res');
    });
  },
  methods: {
    targetType: targetType,
    getRightIcon({ name, title }) {
      console.log(name, title);
    },
    handleChange(val) {
      console.log(val);
    },
    onSubmit() {
      console.log('submit!');
    }
  }
};
</script>
<style scoped lang="less">
.homeView {
  padding: 10px;

  .my-table {
    width: 80%;
  }
}
</style>
