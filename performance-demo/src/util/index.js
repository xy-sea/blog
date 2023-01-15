export function targetType(target) {
  return Object.prototype.toString.call(target).slice(8, -1).toLowerCase();
}
export function deepClone(target) {
  return JSON.parse(JSON.stringify(target));
}

export function listToTree(data) {
  // 使用对象重新存储数据, 空间换时间
  let map = {};
  // treeData存储最后结果
  let treeData = [];
  // 遍历原始数据data，存到map中，id为key，值为数据
  for (let i = 0; i < data.length; i++) {
    map[data[i].id] = data[i];
  }
  // 遍历对象
  for (let i in map) {
    // 根据 parentId 找到的是父节点
    if (map[i].parentId) {
      if (!map[map[i].parentId].children) {
        map[map[i].parentId].children = [];
      }
      // 将子节点放到父节点的 children中
      map[map[i].parentId].children.push(map[i]);
    } else {
      // parentId 找不到对应值，说明是根结点，直接插到根数组中
      treeData.push(map[i]);
    }
  }
  return treeData;
}

export function formatMenuTree({ data, pkey, ckey = 'id', lKey = 'label', pnKey }) {
  data = data.map((item) => {
    item.label = item[lKey];
    return item;
  });
  let tree = data.filter((item) => {
    const childArr = data.filter((sub) => {
      if (sub[pkey] === item[ckey]) {
        sub.hasParent = true;
        sub.rootId = item.rootId || item.id;
        if (pnKey) {
          // 传递第一级的参数到子级
          sub[pnKey.format] = item[pnKey.format] || item[pnKey.initial];
        }
      }
      return sub[pkey] === item[ckey];
    });
    if (childArr.length > 0) item.children = childArr;
    return !item.hasParent;
  });
  tree = tree.filter((item) => !item.hasParent);
  return tree;
}
