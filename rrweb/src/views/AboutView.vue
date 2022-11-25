<template>
  <div class="about">
    <h1>This is an about page</h1>
    <button @click="getData">js报错</button>
  </div>
</template>
<script>
export default {
  name: 'AboutView',
  created() {},
  methods: {
    getData() {
      let list = {};
      list.map((item) => {
        return item + 1;
      });
    }
  }
};
</script>
