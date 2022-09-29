import { create, all } from 'mathjs';
const config = {
  number: 'BigNumber',
  precision: 20 // 精度
};
const math = create(all, config);

//加
const numberAdd = (arg1, arg2) => {
  return math.number(math.add(math.bignumber(arg1), math.bignumber(arg2)));
};
//减
const numberSub = (arg1, arg2) => {
  return math.number(math.subtract(math.bignumber(arg1), math.bignumber(arg2)));
};
//乘
const numberMultiply = (arg1, arg2) => {
  return math.number(math.multiply(math.bignumber(arg1), math.bignumber(arg2)));
};
//除
const numberDivide = (arg1, arg2) => {
  return math.number(math.divide(math.bignumber(arg1), math.bignumber(arg2)));
};

// 数组总体标准差公式
const popVariance = (arr) => {
  return Math.sqrt(popStandardDeviation(arr));
};

// 数组总体方差公式
const popStandardDeviation = (arr) => {
  let s,
    ave,
    sum = 0,
    sums = 0,
    len = arr.length;
  for (let i = 0; i < len; i++) {
    sum = numberAdd(Number(arr[i]), sum);
  }
  ave = numberDivide(sum, len);
  for (let i = 0; i < len; i++) {
    sums = numberAdd(sums, numberMultiply(numberSub(Number(arr[i]), ave), numberSub(Number(arr[i]), ave)));
  }
  s = numberDivide(sums, len);
  return s;
};

// 数组加权公式
const weightedAverage = (arr1, arr2) => {
  // arr1: 计算列，arr2: 选择的权重列
  let s,
    sum = 0, // 分子的值
    sums = 0, // 分母的值
    len = arr1.length;
  for (let i = 0; i < len; i++) {
    sum = numberAdd(numberMultiply(Number(arr1[i]), Number(arr2[i])), sum);
    sums = numberAdd(Number(arr2[i]), sums);
  }
  s = numberDivide(sum, sums);
  return s;
};

// 数组样本方差公式
const varianceArr = (arr) => {
  let s,
    ave,
    sum = 0,
    sums = 0,
    len = arr.length;
  for (let i = 0; i < len; i++) {
    sum = numberAdd(Number(arr[i]), sum);
  }
  ave = numberDivide(sum, len);
  for (let i = 0; i < len; i++) {
    sums = numberAdd(sums, numberMultiply(numberSub(Number(arr[i]), ave), numberSub(Number(arr[i]), ave)));
  }
  s = numberDivide(sums, len - 1);
  return s;
};

// 数组中位数
const middleNum = (arr) => {
  arr.sort((a, b) => a - b);
  if (arr.length % 2 === 0) {
    //判断数字个数是奇数还是偶数
    return numberDivide(numberAdd(arr[arr.length / 2 - 1], arr[arr.length / 2]), 2); //偶数个取中间两个数的平均数
  } else {
    return arr[(arr.length + 1) / 2 - 1]; //奇数个取最中间那个数
  }
};

// 数组求和
const sum = (arr) => {
  let sum = 0,
    len = arr.length;
  for (let i = 0; i < len; i++) {
    sum = numberAdd(Number(arr[i]), sum);
  }
  return sum;
};

// 数组平均值
const average = (arr) => {
  return numberDivide(sum(arr), arr.length);
};

// 数组最大值
const max = (arr) => {
  return Math.max(...arr);
};

// 数组最小值
const min = (arr) => {
  return Math.min(...arr);
};

// 数组有效数据长度
const count = (arr) => {
  let remove = ['', ' ', null, undefined, '-'];
  return arr.filter((item) => !remove.includes(item)).length;
};

// 数组样本标准差公式
const stdDeviation = (arr) => {
  return Math.sqrt(varianceArr(arr));
};

// 数字三位加逗号，保留两位小数
const formatNumber = (num, pointNum = 2) => {
  if ((!num && num !== 0) || num == '-') return '--';
  let arr = (typeof num == 'string' ? parseFloat(num) : num).toFixed(pointNum).split('.');
  let intNum = arr[0].replace(/\d{1,3}(?=(\d{3})+(\.\d*)?$)/g, '$&,');
  return arr[1] === undefined ? intNum : `${intNum}.${arr[1]}`;
};

onmessage = function (e) {
  let { calcType, columnList, dataMap, selectValue } = e.data;
  let arr = [calcType.title];
  columnList.forEach((item) => {
    let Alias = item.Alias;
    let type = calcType.type;
    switch (type) {
      case 'count':
        arr.push(count(dataMap[Alias]));
        break;
      case 'sum':
        arr.push(formatNumber(sum(dataMap[Alias])));
        break;
      case 'arithmeticMean':
        arr.push(formatNumber(average(dataMap[Alias])));
        break;
      case 'weightedAverage':
        arr.push(formatNumber(weightedAverage(dataMap[Alias], dataMap[selectValue])));
        break;
      case 'maxNum':
        arr.push(formatNumber(max(dataMap[Alias])));
        break;
      case 'median':
        arr.push(formatNumber(middleNum(dataMap[Alias])));
        break;
      case 'smallest':
        arr.push(formatNumber(min(dataMap[Alias])));
        break;
      case 'variance':
        arr.push(formatNumber(varianceArr(dataMap[Alias])));
        break;
      case 'popVariance':
        arr.push(formatNumber(popVariance(dataMap[Alias])));
        break;
      case 'standardDeviation':
        arr.push(formatNumber(stdDeviation(dataMap[Alias])));
        break;
      case 'popStandardDeviation':
        arr.push(formatNumber(popStandardDeviation(dataMap[Alias])));
        break;
    }
  });

  // 发送数据事件
  postMessage(arr);
};
