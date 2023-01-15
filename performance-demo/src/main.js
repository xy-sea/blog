import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { Table, TableColumn, Form, FormItem, Input, Select, Option, TimePicker, Switch, Checkbox, CheckboxGroup, Radio, RadioGroup, Button, Dialog } from 'element-ui';
import moment from 'moment';
import * as echarts from 'echarts';
import VueLazyLoad from 'vue-lazyload';

Vue.use(VueLazyLoad, {
  preLoad: 1,
  attempt: 2
});
Vue.prototype.$moment = moment;
Vue.prototype.$echarts = echarts;
Vue.config.productionTip = false;

Vue.use(Dialog);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Input);
Vue.use(Select);
Vue.use(TimePicker);
Vue.use(Option);
Vue.use(Switch);
Vue.use(Checkbox);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(Button);
Vue.use(CheckboxGroup);

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app');
