<template>
  <div id="app">
    <router-view />
    <div id="text"></div>
  </div>
</template>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding: 30px;
}

.errdetail {
  text-align: left;
}
.code-line {
  padding: 5px 0;
}
.heightlight {
  background-color: yellowgreen;
}
.errheader {
  padding: 10px;
  border-bottom: 1px solid rgb(214, 210, 210);
}
</style>
