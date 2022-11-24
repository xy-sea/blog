<template>
  <div class="home">
    <button @click="make">js报错</button>
    <img alt="Vue logo" src="../assets/logo.png" />
    <HelloWorld />
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue';

export default {
  name: 'HomeView',
  components: {
    HelloWorld
  },
  created() {
    this.fn();
  },
  mounted() {
    // 验证资源加载失败
    setTimeout(() => {
      this.loadScript();
    }, 1000);

    // 验证异步错误
    setTimeout(() => {
      JSON.parse(undefined);
    }, 3000);

    // 验证Promise错误
    setTimeout(() => {
      this.getPromise();
    }, 5000);
  },
  methods: {
    loadScript() {
      let script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://www.test.com/xxx.js';
      document.body.appendChild(script);
    },
    getPromise() {
      new Promise((resolve) => {
        JSON.parse('');
        resolve();
      });
    },
    fn() {
      let a = undefined;
      if (a.length) {
        console.log('1');
      }
    },
    make() {
      let list = [1, 2, 3];
      list.forEach((item) => item + 1);
      let str = JSON.parse(undefined);
      console.log('str', str);
    }
  }
};
</script>
