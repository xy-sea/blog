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
    setTimeout(() => {
      JSON.parse(undefined);
    }, 3000);
  },
  methods: {
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
