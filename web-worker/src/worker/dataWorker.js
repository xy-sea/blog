onmessage = function (e) {
  let data = e.data;
  let list = [];
  for (let i = 1; i < 400; i++) {
    for (let j = 0; j < 10; j++) {
      list.push({ ...data[j], key: `数据${j + 1 + i * 10}` });
    }
  }
  // 发送数据事件
  postMessage(list);
};
