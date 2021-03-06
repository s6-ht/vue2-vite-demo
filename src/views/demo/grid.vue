<template>
  <div class="grid">
    <div class="grid__item"></div>
    <div class="grid__item"></div>
    <div class="grid__item"></div>
  </div>
</template>

<style lang="less" scoped>
.grid {
  display: grid;
  width: 300px;
  height: 300px;
  // border: 1px solid red;
  box-sizing: border-box;
  // align-items: center;
  // justify-items: center;
  // 第二种
  // align-items: center;
  // justify-content: center;
  // 第三种
  // align-content: center;
  // justify-items: center;
  // // 第四种
  // align-content: center;
  // justify-content: center;
  &__item {
    width: 100px;
    height: 100px;
    border: 1px solid red;
  }
}
</style>
