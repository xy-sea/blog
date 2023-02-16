<template>
  <div id="app">
    <a-button type="primary"> Primary </a-button>
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue';

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  mounted() {
    this.func();
  },
  methods: {
    f1() {
      return new Promise((resolve, reject) => {
        reject('failure');
      });
    },
    async func() {
      let value = await this.f1();
      let value1 = await this.f1();
      console.log('value1', value, value1);
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
