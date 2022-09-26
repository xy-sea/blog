#### let 实现原理

**借助闭包和函数作用域来实现块级作用域的效果**

```
// 用var实现案例2的效果
var a = [];

var _loop = function _loop(i) {
  a[i] = function() {
    console.log(i);
  };
};

for (var i = 0; i < 10; i++) {
  _loop(i);
}
a[0](); // 0
```

#### 手写 call apply bind

```
// 手写call
Function.prototype.Call = function(context, ...args) {
  // context为undefined或null时，则this默认指向全局window
  if (!context || context === null) {
    context = window;
  }
  // 利用Symbol创建一个唯一的key值，防止新增加的属性与obj中的属性名重复
  let fn = Symbol();
  // this指向调用call的函数
  context[fn] = this;
  // 隐式绑定this，如执行obj.foo(), foo内的this指向obj
  let res = context[fn](...args);
  // 执行完以后，删除新增加的属性
  delete context[fn];
  return res;
};

// apply与call相似，只有第二个参数是一个数组，
Function.prototype.Apply = function(context, args) {
  if (!context || context === null) {
    context = window;
  }
  let fn = Symbol();
  context[fn] = this;
  let res = context[fn](...args);
  delete context[fn];
  return res;
};

// bind要考虑返回的函数，作为构造函数被调用的情况
Function.prototype.Bind = function(context, ...args) {
  if (!context || context === null) {
    context = window;
  }
  let fn = this;
  let f = Symbol();
  const result = function(...args1) {
    if (this instanceof fn) {
      // result如果作为构造函数被调用，this指向的是new出来的对象
      // this instanceof fn，判断new出来的对象是否为fn的实例
      this[f] = fn;
      this[f](...args1, ...args);
      delete this[f];
    } else {
      // bind返回的函数作为普通函数被调用时
      context[f] = fn;
      context[f](...args1, ...args);
      delete context[f];
    }
  };
  // 如果绑定的是构造函数 那么需要继承构造函数原型属性和方法
  // 实现继承的方式: 使用Object.create
  result.prototype = Object.create(fn.prototype);
  return result;
};
```

**闭包的示例**

```
// 原始题目
for (var i = 0; i < 5; i++) {
  setTimeout(function() {
    console.log(i); // 1s后打印出5个5
  }, 1000);
}

// ⬅️利用闭包，将上述题目改成1s后，打印0,1,2,3,4

// 方法一：
for (var i = 0; i < 5; i++) {
  (function(j) {
    setTimeout(function timer() {
      console.log(j);
    }, 1000);
  })(i);
}

// 方法二：
// 利用setTimeout的第三个参数，第三个参数将作为setTimeout第一个参数的参数
for (var i = 0; i < 5; i++) {
  setTimeout(function fn(i) {
    console.log(i);
  }, 1000, i); // 第三个参数i,将作为fn的参数
}

// ⬅️将上述题目改成每间隔1s后，依次打印0,1,2,3,4
for (var i = 0; i < 5; i++) {
  setTimeout(function fn(i) {
    console.log(i);
  }, 1000 * i, i);
}
```

**手写 instanceof 方法**

```
function instanceOf(obj, fn) {
  let proto = obj.__proto__;
  if (proto) {
    if (proto === fn.prototype) {
      return true;
    } else {
      return instanceOf(proto, fn);
    }
  } else {
    return false;
  }
}

// 测试
function Dog() {}
let dog = new Dog();
console.log(instanceOf(dog, Dog), instanceOf(dog, Object)); // true true
```

**手写 new**

```
function selfNew(fn, ...args) {
  // 创建一个instance对象，该对象的原型是fn.prototype
  let instance = Object.create(fn.prototype);
  // 调用构造函数，使用apply，将this指向新生成的对象
  let res = fn.apply(instance, args);
  // 如果fn函数有返回值，并且返回值是一个对象或方法，则返回该对象，否则返回新生成的instance对象
  return typeof res === "object" || typeof res === "function" ? res : instance;
}
```

**手写寄生组合式继承**

```
// 精简版
class Child {
  constructor() {
    // 调用父类的构造函数
    Parent.call(this);
    // 利用Object.create生成一个对象，新生成对象的原型是父类的原型，并将该对象作为子类构造函数的原型，继承了父类原型上的属性和方法
    Child.prototype = Object.create(Parent.prototype);
    // 原型对象的constructor指向子类的构造函数
    Child.prototype.constructor = Child;
  }
}

// 通用版
function Parent(name) {
  this.name = name;
}
Parent.prototype.getName = function() {
  console.log(this.name);
};
function Child(name, age) {
  // 调用父类的构造函数
  Parent.call(this, name);
  this.age = age;
}
function createObj(o) {
  // 目的是为了继承父类原型上的属性和方法，在不需要实例化父类构造函数的情况下，避免生成父类的实例，如new Parent()
  function F() {}
  F.prototype = o;
  // 创建一个空对象，该对象原型指向父类的原型对象
  return new F();
}

// 等同于 Child.prototype = Object.create(Parent.prototype)
Child.prototype = createObj(Parent.prototype);
Child.prototype.constructor = Child;

let child = new Child("tom", 12);
child.getName(); // tom
```

#### 手写 Class 类

ES6 的 Class 内部是基于寄生组合式继承，它是目前最理想的继承方式  
ES6 的 Class 允许子类继承父类的静态方法和静态属性

```
// Child 为子类的构造函数， Parent为父类的构造函数
function selfClass(Child, Parent) {
  // Object.create 第二个参数，给生成的对象定义属性和属性描述符/访问器描述符
  Child.prototype = Object.create(Parent.prototype, {
    // 子类继承父类原型上的属性和方法
    constructor: {
      enumerable: false,
      configurable: false,
      writable: true,
      value: Child
    }
  });
  // 继承父类的静态属性和静态方法
  Object.setPrototypeOf(Child, Parent);
}

// 测试
function Child() {
  this.name = 123;
}
function Parent() {}
// 设置父类的静态方法getInfo
Parent.getInfo = function() {
  console.log("info");
};
Parent.prototype.getName = function() {
  console.log(this.name);
};
selfClass(Child, Parent);
Child.getInfo(); // info
let tom = new Child();
tom.getName(); // 123
```

#### 手写 promise

```
class Promise {
  constructor(fn) {
    // resolve时的回调函数列表
    this.resolveTask = [];
    // reject时的回调函数列表
    this.rejectTask = [];
    // state记录当前状态,共有pending、fulfilled、rejected 3种状态
    this.state = "pending";
    let resolve = value => {
      // state状态只能改变一次，resolve和reject只会触发一种
      if (this.state !== "pending") return;
      this.state = "fulfilled";
      this.data = value;
      // 模拟异步，保证resolveTask事件先注册成功，要考虑在Promise里面写同步代码的情况
      setTimeout(() => {
        this.resolveTask.forEach(cb => cb(value));
      });
    };
    let reject = err => {
      if (this.state !== "pending") return;
      this.state = "rejected";
      this.error = err;
      // 保证rejectTask事件注册成功
      setTimeout(() => {
        this.rejectTask.forEach(cb => cb(err));
      });
    };

    // 关键代码，执行fn函数
    try {
      fn(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(resolveCallback, rejectCallback) {
    // 解决链式调用的情况，继续返回Promise
    return new Promise((resolve, reject) => {
      // 将then传入的回调函数，注册到resolveTask中
      this.resolveTask.push(() => {
        // 重点：判断resolveCallback事件的返回值
        // 假如用户注册的resolveCallback事件又返回一个Promise，将resolve和reject传进去，这样就实现控制了链式调用的顺序
        const res = resolveCallback(this.data);
        if (res instanceof Promise) {
          res.then(resolve, reject);
        } else {
          // 假如返回值为普通值，resolve传递出去
          resolve(res);
        }
      });

      this.rejectTask.push(() => {
        // 同理：判断rejectCallback事件的返回值
        // 假如返回值为普通值，reject传递出去
        const res = rejectCallback(this.error);
        if (res instanceof Promise) {
          res.then(resolve, reject);
        } else {
          reject(res);
        }
      });
    });
  }
}

// 测试
// 打印结果：依次打印1、2
new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(1);
  }, 500);
}).then(
    res => {
      console.log(res);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(2);
        }, 1000);
      });
    }
  ).then(data => {
      console.log(data);
    });
```

#### 手写 race、all

`race`：返回 promises 列表中第一个执行完的结果  
`all`：返回 promises 列表中全部执行完的结果

```
class Promise {
  // race静态方法，返回promises列表中第一个执行完的结果
  static race(promises) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        // Promise.resolve包一下，防止promises[i]不是Promise类型
        Promise.resolve(promises[i])
          .then(res => {
            resolve(res);
          })
          .catch(err => {
            reject(err);
          });
      }
    });
  }

  // all静态方法， 返回promises列表中全部执行完的结果
  static all(promises) {
    let result = [];
    let index = 0;
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        Promise.resolve(promises[i])
          .then(res => {
            // 输出结果的顺序和promises的顺序一致
            result[i] = res;
            index++;
            if (index === promises.length) {
              resolve(result);
            }
          })
          .catch(err => {
            reject(err);
          });
      }
    });
  }
}
```

#### 手写 retry

`retry`的作用，当接口请求失败后，每间隔几秒，再重发几次

```
/*
* @param {function} fn - 方法名
* @param {number} delay - 延迟的时间
* @param {number} times - 重发的次数
*/
function retry(fn, delay, times) {
  return new Promise((resolve, reject) => {
    function func() {
      Promise.resolve(fn()).then(res => {
          resolve(res);
        })
        .catch(err => {
          // 接口失败后，判断剩余次数不为0时，继续重发
          if (times !== 0) {
            setTimeout(func, delay);
            times--;
          } else {
            reject(err);
          }
        });
    }
    func();
  });
}
```

#### 手写 async、await

```
function generatorToAsync(generatorFn) {
  // 返回的是一个新的函数
  return function() {
    // 先调用generator函数 生成迭代器
    // 对应 var gen = testG()
    const gen = generatorFn.apply(this, arguments);

    // 返回一个Promise, 因为外部是用.then的方式 或者await的方式去使用这个函数的返回值
    return new Promise((resolve, reject) => {
      // 内部定义一个step函数 用来一步步next
      function step(key, arg) {
        let res;

        // 这个方法需要包裹在try catch中
        // 如果报错了 就把promise给reject掉 外部通过.catch可以获取到错误
        try {
          res = gen[key](arg); // 这里有可能会执行返回reject状态的Promise
        } catch (error) {
          return reject(error); // 报错的话会走catch，直接reject
        }

        // gen.next() 得到的结果是一个 { value, done } 的结构
        const { value, done } = res;
        if (done) {
          // 如果done为true，说明走完了，进行resolve(value)
          return resolve(value);
        } else {
          // 如果done为false，说明没走完，还得继续走

          // value有可能是：常量\Promise；
          // Promise有可能是成功或者失败
          return Promise.resolve(value).then(
            val => step("next", val),
            err => step("throw", err)
          );
        }
      }

      step("next"); // 第一次执行
    });
  };
}

// 测试generatorToAsync

// 1秒后打印data1 再过一秒打印data2 最后打印success
const getData = () =>
  new Promise(resolve => setTimeout(() => resolve("data"), 1000));
var test = generatorToAsync(function* testG() {
  // await被编译成了yield
  const data = yield getData();
  console.log("data1: ", data);
  const data2 = yield getData();
  console.log("data2: ", data2);
  return "success";
});

test().then(res => console.log(res));
```

**手写深拷贝代码**

```
// 使用hash 存储已拷贝过的对象，避免循环拷贝和重复拷贝
function deepClone(target, hash = new WeakMap()) {
  if (!isObject(target)) return target;
  if (hash.get(target)) return hash.get(target);
  // 兼容数组和对象
  let newObj = Array.isArray(target) ? [] : {};
  // 关键代码，解决对象的属性循环引用 和 多个属性引用同一个对象的问题，避免重复拷贝
  hash.set(target, newObj);
  for (let key in target) {
    if (target.hasOwnProperty(key)) {
      if (isObject(target[key])) {
        newObj[key] = deepClone(target[key], hash); // 递归拷贝
      } else {
        newObj[key] = target[key];
      }
    }
  }
  return newObj;
}
function isObject(target) {
  return typeof target === "object" && target !== null;
}

// 示例
let info = { item: 1 };
let obj = {
  key1: info,
  key2: info,
  list: [1, 2]
};

// 循环引用深拷贝示例
obj.key3 = obj;
let val = deepClone(obj);
console.log(val);
```

**Event Loop 经典题目**

```
Promise.resolve()
  .then(function() {
    console.log("promise0");
  })
  .then(function() {
    console.log("promise5");
  });
setTimeout(() => {
  console.log("timer1");
  Promise.resolve().then(function() {
    console.log("promise2");
  });
  Promise.resolve().then(function() {
    console.log("promise4");
  });
}, 0);
setTimeout(() => {
  console.log("timer2");
  Promise.resolve().then(function() {
    console.log("promise3");
  });
}, 0);
Promise.resolve().then(function() {
  console.log("promise1");
});
console.log("start");

// 打印结果： start promise0 promise1 promise5 timer1 promise2 promise4 timer2 promise3
```

#### async、await 事件轮询执行时机

async 隐式返回 Promise，会产生一个微任务  
await 后面的代码是在微任务时执行

```
console.log("script start");
async function async1() {
  await async2(); // await 隐式返回promise
  console.log("async1 end"); // 这里的执行时机：在执行微任务时执行
}
async function async2() {
  console.log("async2 end"); // 这里是同步代码
}
async1();
setTimeout(function() {
  console.log("setTimeout");
}, 0);
new Promise(resolve => {
  console.log("Promise"); // 这里是同步代码
  resolve();
})
  .then(function() {
    console.log("promise1");
  })
  .then(function() {
    console.log("promise2");
  });
console.log("script end");

// 打印结果:  script start => async2 end => Promise => script end => async1 end => promise1 => promise2 => setTimeout
```

#### setTimeout 模拟实现 setInterval

```
// 使用闭包实现
function mySetInterval(fn, t) {
  let timer = null;
  function interval() {
    fn();
    timer = setTimeout(interval, t);
  }
  interval();
  return {
    // cancel用来清除定时器
    cancel() {
      clearTimeout(timer);
    }
  };
}
```

#### setInterval 模拟实现 setTimeout

```
function mySetTimeout(fn, time) {
  let timer = setInterval(() => {
    clearInterval(timer);
    fn();
  }, time);
}

// 使用
mySetTimeout(() => {
  console.log(1);
}, 2000);
```

**手写 reduce 函数**

```
// 如果提供了initialValue时，则作为pre的初始值，index从0开始；
// 如果没有提供initialValue，找到数组中的第一个存在的值作为pre，下一个元素的下标作为index

Array.prototype.myReduce = function(fn, initialValue) {
  let pre, index;
  let arr = this.slice();
  if (initialValue === undefined) {
    // 没有设置初始值
    for (let i = 0; i < arr.length; i++) {
      // 找到数组中第一个存在的元素，跳过稀疏数组中的空值
      if (!arr.hasOwnProperty(i)) continue;
      pre = arr[i]; // pre 为数组中第一个存在的元素
      index = i + 1; // index 下一个元素
      break; // 易错点：找到后跳出循环
    }
  } else {
    index = 0;
    pre = initialValue;
  }
  for (let i = index; i < arr.length; i++) {
    // 跳过稀疏数组中的空值
    if (!arr.hasOwnProperty(i)) continue;
    // 注意：fn函数接收四个参数，pre之前累计值、cur 当前值、 当前下标、 arr 原数组
    pre = fn.call(null, pre, arr[i], i, this);
  }
  return pre;
};
console.log([, , , 1, 2, 3, 4].myReduce((pre, cur) => pre + cur)); // 10
```

**手写 compose 函数**

```
function compose(list) {
  // 取出第一个函数，当做reduce函数的初始值
  const init = list.shift();
  return function(...arg) {
    // 执行compose函数，返回一个函数
    return list.reduce(
      (pre, cur) => {
        // 返回list.reduce的结果，为一个promise实例，外部就可以通过then获取
        return pre.then(result => {
          // pre始终为一个promise实例，result为结果的累加值
          // 在前一个函数的then中，执行当前的函数，并返回一个promise实例，实现累加传递的效果
          return cur.call(null, result);
        });
      },
      // Promise.resolve可以将非promise实例转为promise实例（一种兼容处理）
      Promise.resolve(init.apply(null, arg))
    );
  };
}

// 同步方法案例
let sync1 = data => {
  console.log("sync1");
  return data;
};
let sync2 = data => {
  console.log("sync2");
  return data + 1;
};
let sync3 = data => {
  console.log("sync3");
  return data + 2;
};
let syncFn = compose([sync1, sync2, sync3]);
syncFn(0).then(res => {
  console.log(res);
});
// 依次打印 sync1 → sync2 → sync3 → 3

// 异步方法案例
let async1 = data => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log("async1");
      resolve(data);
    }, 1000);
  });
};
let async2 = data => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log("async2");
      resolve(data + 1);
    }, 1000);
  });
};
let async3 = data => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log("async3");
      resolve(data + 2);
    }, 1000);
  });
};
let composeFn = compose([async1, async2, async3]);
composeFn(0).then(res => {
  console.log(res);
});
// 依次打印 async1 → async1 → async1 → 3

```

**手写数组扁平化**

```
// deep初始值为1
Array.prototype.myFlat = function(deep = 1) {
  let arr = this;
  // deep为0则返回，递归结束
  if (deep == 0) return arr;
  // 使用reduce作为累加器
  return arr.reduce((pre, cur) => {
    // cur为数组，继续递归，deep-1
    if (Array.isArray(cur)) {
      return [...pre, ...cur.myFlat(deep - 1)];
    } else {
      return [...pre, cur];
    }
  }, []);
};
console.log([1, 2, 3, [4, [5, [6]]]].myFlat(2)); // [1, 2, 3, 4, 5, [6]]

```

**手写 map 函数**

```
Array.prototype.selfMap = function(fn, content) {
  // map中的第二个参数作为fn函数的this
  // Array.prototype.slice.call将类数组转化为数组，同Array.from, this为调用的数组（arr）
  let arr = Array.prototype.slice.call(this);
  let mappedArr = Array(); // 创建一个空数组
  for (let i = 0; i < arr.length; i++) {
    // 判断稀疏数组，跳过稀疏数组中的空值
    // 稀疏数组：数组中元素的个数小于数组的长度，比如Array(2) 长度为2的稀疏数组
    if (!arr.hasOwnProperty(i)) continue;
    mappedArr[i] = fn.call(content, arr[i]);
  }
  return mappedArr;
};
let arr = [1, 2, 3];
console.log(arr.selfMap(item => item * 2)); // [2, 4, 6]
```

**手写 some 函数**

```
Array.prototype.mySome = function(fn) {
  let result = false;
  for (let i = 0; i < this.length; i++) {
    // 判断条件是否满足，满足跳出循环
    if (fn(this[i])) {
      result = true;
      break;
    }
  }
  return result;
};
console.log([1, 2, 3, 4].mySome(item => item > 6)); // false

```

#### 判断所有数据类型的方法

通过`Object.prototype.toString.call`实现

**示例**

```
function getDataType(target) {
  return Object.prototype.toString.call(target).slice(8, -1).toLowerCase();
}
// 判断所有的数据类型
console.log(getDataType(null)); // null
console.log(getDataType(undefined)); // undefined
console.log(getDataType(Symbol())); // symbol
console.log(getDataType(new Date())); // date
console.log(getDataType(new Set())); // set

```

#### 实现 es6 模板字符串

**replace 函数，第二个参数是函数的情况说明**：每个匹配都调用该函数，它返回的字符串将替换文本使用

**示例**

```
let name = "小明";
let age = 20;
let str1 = "我叫${name},我的年龄 ${ age}";
function tempalteStr(str) {
  return str.replace(/\$\{(.*?)\}/g, function(str, k) {
    // eval(name) 替换成 小明
    // // eval(age) 替换成 20
    return eval(k);
  });
}
console.log(tempalteStr(str1)); // 我叫小明,我的年龄20
```

#### 函数柯里化

**函数柯里化：** 将使用多个参数的一个函数，转换成一系列使用一个参数的函数

**函数柯里化的原理：** 用闭包把参数保存起来，当参数的长度等于原函数时，就开始执行原函数

**示例**

```
function mycurry(fn) {
  // fn.length 表示函数中参数的长度
  // 函数的length属性，表示形参的个数，不包含剩余参数，仅包括第一个有默认值之前的参数个数（不包含有默认值的参数）
  if (fn.length <= 1) return fn;
  // 自定义generator迭代器
  const generator = (...args) => {
    // 判断已传的参数与函数定义的参数个数是否相等
    if (fn.length === args.length) {
      return fn(...args);
    } else {
      // 不相等，继续迭代
      return (...args1) => {
        return generator(...args, ...args1);
      };
    }
  };
  return generator;
}
function fn(a, b, c, d) {
  return a + b + c + d;
}
let fn1 = mycurry(fn);
console.log(fn1(1)(2)(3)(4)); // 10

```

#### 函数防抖

**应用场景**：搜索框输入文字后调用对应搜索接口

利用闭包，不管触发频率多高，在停止触发 n 秒后才会执行，如果重复触发，会清空之前的定时器，重新计时，直到最后一次 n 秒后执行

**示例**

```
/*
 * @param {function} fn - 需要防抖的函数
 * @param {number} time - 多长时间执行一次
 * @param {boolean} flag - 第一次是否执行
 */
function debounce(fn, time, flag) {
  let timer;
  return function(...args) {
    // 在time时间段内重复执行，会清空之前的定时器，然后重新计时
    timer && clearTimeout(timer);
    if (flag && !timer) {
      // flag为true 第一次默认执行
      fn.apply(this, args);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, time);
  };
}

function fn(a) {
  console.log("执行:", a);
}
let debounceFn = debounce(fn, 3000, true);
debounceFn(1);
debounceFn(2);
debounceFn(3);

// 先打印：执行: 1
// 3s后打印: 执行: 3
```

#### 函数节流

**应用场景：** 下拉滚动加载

利用闭包，不管触发频率多高，每隔一段时间内执行一次

**示例**

```
/*
 * @param {function} fn - 需要防抖的函数
 * @param {number} time - 多长时间执行一次
 * @param {boolean} flag - 第一次是否执行
 */
function throttle(fn, time, flag) {
  let timer;
  return function(...args) {
    // flag控制第一次是否立即执行
    if (flag) {
      fn.apply(this, args);
      // 第一次执行完后，flag变为false；否则以后每次都会执行
      flag = false;
    }
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args);
        // 每次执行完重置timer
        timer = null;
      }, time);
    }
  };
}

// 测试
function fn() {
  console.log("fn");
}
let throttleFn = throttle(fn, 3000, true);
setInterval(throttleFn, 500);

// 测试结果，一开始就打印"fn", 以后每隔3s打印一次"fn"
```

#### render 函数

虚拟 dom 转化为真实 dom

**示例**

```
// 虚拟dom转化为真实dom
function render(node) {
  if (typeof node === "string") {
    // 创建文本节点
    return document.createTextNode(node);
  }
  // 创建对应的dom节点
  let dom = document.createElement(node.tag);
  if (node.attrs) {
    // 设置dom属性
    Object.keys(node.attrs).forEach(key => {
      dom.setAttribute(key, node.attrs[key]);
    });
  }
  // 递归生成子节点
  if (node.children) {
    node.children.forEach(item => {
      dom.appendChild(render(item));
    });
  }
  return dom;
}
```

#### dom To JSON

将真实 dom 转化为虚拟 dom

**示例**

```
 // 将真实dom转化为虚拟dom
function dom2Json(dom) {
  if (!dom.tagName) return;
  let obj = {};
  obj.tag = dom.tagName;
  obj.children = [];
  dom.childNodes.forEach(item => {
    // 去掉空的节点
    dom2Json(item) && obj.children.push(dom2Json(item));
  });
  return obj;
}
```

#### 图片懒加载

**图片的懒加载原理：** 当图片元素出现在屏幕中时，才给图片的 src 赋值对应的链接，去加载对应的图片

使用`IntersectionObserver`监听元素来判断是否出现在视口，当图片出现在视口时，给 img.src 赋值

IntersectionObserver 替代监听 scroll 事件来判断元素是否在视口中，性能更高

**图片懒加载示例**

```
// html内容
// <img src="./loading.jpg" data-src="https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg">
// <img src="./loading.jpg" data-src="https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg">

function observerImg() {
  // 获取所有的图片元素
  let imgList = document.getElementsByTagName("img");
  let observer = new IntersectionObserver(list => {
    // 回调的数据是一个数组
    list.forEach(item => {
      // 判断元素是否出现在视口
      if (item.intersectionRatio > 0) {
        // 设置img的src属性
        item.target.src = item.target.getAttribute("data-src");
        // 设置src属性后，停止监听
        observer.unobserve(item.target);
      }
    });
  });
  for (let i = 0; i < imgList.length; i++) {
    // 监听每个img元素
    observer.observe(imgList[i]);
  }
}
```

[IntersectionObserver API 使用教程](http://www.ruanyifeng.com/blog/2016/11/intersectionobserver_api.html)

#### 最大并发数

控制请求最大并发数，前面的请求成功后，再发起新的请求

**示例**

```
/*
 * 控制并发数
 * @param {array} list - 请求列表
 * @param {number} num - 最大并发数
 */
function control(list, num) {
  function fn() {
    if (!list.length) return;
    // 从任务数 和 num 中 取最小值，兼容并发数num > list.length的情况
    let max = Math.min(list.length, num);
    for (let i = 0; i < max; i++) {
      let f = list.shift();
      num--;
      // 请求完成后，num++
      f.finally(() => {
        num++;
        fn();
      });
    }
  }
  fn();
}

```

#### LazyMan

考察：事件轮询机制、链式调用、队列

**示例**

```
class LazyMan {
  constructor(name) {
    this.name = name;
    this.task = []; // 任务列表
    function fn() {
      console.log("hi" + this.name);
      this.next();
    }
    this.task.push(fn);
    // 重点：使用setTimeout宏任务，确保所有的任务都注册到task列表中
    setTimeout(() => {
      this.next();
    });
  }
  next() {
    // 取出第一个任务并执行
    let fn = this.task.shift();
    fn && fn.call(this);
  }
  sleepFirst(time) {
    function fn() {
      console.log("sleepFirst" + time);
      setTimeout(() => {
        this.next();
      }, time);
    }
    // 插入到第一个
    this.task.unshift(fn);
    // 返回this 可以链式调用
    return this;
  }
  sleep(time) {
    function fn() {
      console.log("sleep" + time);
      setTimeout(() => {
        this.next();
      }, time);
    }
    this.task.push(fn);
    return this;
  }
  eat(something) {
    function fn() {
      console.log("eat" + something);
      this.next();
    }
    this.task.push(fn);
    return this;
  }
}

new LazyMan("王")
  .sleepFirst(3000)
  .eat("breakfast")
  .sleep(3000)
  .eat("dinner");
```

#### sleep 函数的多种实现

JS 没有语言内置的休眠（sleep or wait）函数，所谓的 sleep 只是实现一种延迟执行的效果

等待指定时间后再执行对应方法

**示例**

```
// 方法一：
// 这种实现方式是利用一个伪死循环阻塞主线程。
// 因为JS是单线程的，所以通过这种方式可以实现真正意义上的sleep
function sleep1(fn, time) {
  let start = new Date().getTime();
  while (new Date().getTime() - start < time) {
    continue;
  }
  fn();
}

// 方式二： 定时器
function sleep2(fn, time) {
  setTimeout(fn, time);
}

// 方式三： promise
function sleep3(fn, time) {
  new Promise(resolve => {
    setTimeout(resolve, time);
  }).then(() => {
    fn();
  });
}

// 方式四： async await
async function sleep4(fn, time) {
  await new Promise(resolve => {
    setTimeout(resolve, time);
  });
  fn();
}
function fn() { console.log("fn")}

sleep1(fn, 2000);
sleep2(fn, 2000);
sleep3(fn, 2000);
sleep4(fn, 2000);

```
