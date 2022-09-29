<template>
  <div id="app">
    <dataList />
  </div>
</template>

<script>
import dataList from './components/dataList.vue';
export default {
  name: 'App',
  components: {
    dataList
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
