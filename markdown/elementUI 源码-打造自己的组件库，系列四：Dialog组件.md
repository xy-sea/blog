来吧继续阅读组件源码，dialog 组件安排上  
个人觉得 dialog 组件的难点在于弹出框的流程，特别是层级的处理  
当然其他小的知识点也是不少的，这就是阅读源码的快乐

## 上源码

源码大致分为三部分阅读，先易后难没毛病

### html 部分

打开**packages/dialog/src/component.vue**

```js
<template>
  <!--transition组件可以给任何元素和组件添加进入/离开过渡-->
  <!--after-enter、after-leave是对应的钩子-->
  <transition
    name="dialog-fade"
    @after-enter="afterEnter"
    @after-leave="afterLeave">
    <div
      v-show="visible"
      class="el-dialog__wrapper"
     <!-- click.self 只当在 event.target 是当前元素自身时触发处理函数, 即点击弹框背景是触发，点击弹框内部元素不会触发 -->
      @click.self="handleWrapperClick">
      <div
        role="dialog"
        <!--亮点：通过改变key值来销毁div-->
        :key="key"
        aria-modal="true"
        :aria-label="title || 'dialog'"
        :class="['el-dialog', { 'is-fullscreen': fullscreen, 'el-dialog--center': center }, customClass]"
        ref="dialog"
        :style="style">
        <!--dialog_header包含：标题、关闭按钮-->
        <div class="el-dialog__header">
          <!--标题-->
          <slot name="title">
            <span class="el-dialog__title">{{ title }}</span>
          </slot>
          <!--关闭按钮-->
          <button
            type="button"
            class="el-dialog__headerbtn"
            aria-label="Close"
            v-if="showClose"
            @click="handleClose">
            <i class="el-dialog__close el-icon el-icon-close"></i>
          </button>
        </div>
        <!--中间的内容-->
        <div class="el-dialog__body" v-if="rendered"><slot></slot></div>
        <!--底部内容-->
        <div class="el-dialog__footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>
```

**总结：**  
1、亮点：通过改变 key 值来销毁 div（铁子们还知道 vue 中 key 的其他用法吗？）  
2、vue 内置`transition`组件及其钩子函数的灵活运用  
3、`@click.self` 指触发元素自身时生效

### script 部分

还是**packages/dialog/src/component.vue**

```js
<script>
  // Popup用来对dialog弹框的流程控制，是下一小节分析的重点
  import Popup from 'element-ui/src/utils/popup';
  // migrating.js 主要目的是在浏览器控制台输出element ui 已经移除的一些属性
  import Migrating from 'element-ui/src/mixins/migrating';
  // emitter.js 中有两个方法，dispatch是用于派发事件，而broadcast用于广播到子组件以及子孙指定组件
  import emitter from 'element-ui/src/mixins/emitter';

  export default {
    name: 'ElDialog',
    mixins: [Popup, emitter, Migrating],
    props: {
      title: {
        type: String,
        default: ''
      },
      modal: {
        type: Boolean,
        default: true
      },
      modalAppendToBody: {
        type: Boolean,
        default: true
      },
      appendToBody: {
        type: Boolean,
        default: false
      },
      lockScroll: {
        type: Boolean,
        default: true
      },
      closeOnClickModal: {
        type: Boolean,
        default: true
      },
      closeOnPressEscape: {
        type: Boolean,
        default: true
      },
      showClose: {
        type: Boolean,
        default: true
      },
      width: String,
      fullscreen: Boolean,
      customClass: {
        type: String,
        default: ''
      },
      top: {
        type: String,
        default: '15vh'
      },
      beforeClose: Function,
      center: {
        type: Boolean,
        default: false
      },
      destroyOnClose: Boolean
    },

    data() {
      return {
        closed: false,
        key: 0
      };
    },

    watch: {
      // 监听visible来控制弹框的打开与关闭
      visible(val) {
        if (val) {
          /* 组件打开时的流程 */
          this.closed = false;
          // 执行组件外部绑定的open方法，如 <el-dialog @open=openDialog />
          this.$emit('open');
          // 给弹框绑定scroll事件，滚动时触发updatePopper，通过emitter.js中broadcast向子孙组件广播 让他们更新 Popper
          this.$el.addEventListener('scroll', this.updatePopper);
          // 然后dialog 滚动到顶部
          this.$nextTick(() => {
            this.$refs.dialog.scrollTop = 0;
          });
          // appendToBody属性用来控制Dialog自身是否插入至body元素上
          if (this.appendToBody) {
            document.body.appendChild(this.$el);
          }
        } else {
          /* 组件关闭时的流程 */
          // 移除scroll事件
          this.$el.removeEventListener('scroll', this.updatePopper);
          // 执行组件外部绑定的open方法，如 <el-dialog @close=closeDialog />
          if (!this.closed) this.$emit('close');
          // 如果设置destroyOnClose，该属性用来控制关闭时销毁Dialog中的元素，通过改变key值来销毁组件
          if (this.destroyOnClose) {
            this.$nextTick(() => {
              this.key++;
            });
          }
        }
      }
    },

    computed: {
      style() {
        let style = {};
        if (!this.fullscreen) {
          style.marginTop = this.top;
          if (this.width) {
            style.width = this.width;
          }
        }
        return style;
      }
    },

    methods: {
      getMigratingConfig() {
        return {
          props: {
            'size': 'size is removed.'
          }
        };
      },
      handleWrapperClick() {
        // 设置close-on-click-modal，来控制是否可以通过点击 modal 关闭 Dialog
        if (!this.closeOnClickModal) return;
        this.handleClose();
      },
      handleClose() {
        // 设置before-close 关闭前的回调，会暂停 Dialog 的关闭
        if (typeof this.beforeClose === 'function') {
          // 将hide方法作为参数传递，外部可以通过执行该参数来关闭弹框
          this.beforeClose(this.hide);
        } else {
          this.hide();
        }
      },
      // 关闭弹框的方法
      hide(cancel) {
        if (cancel !== false) {
          /*
          * 此处补充说明下.sync
          * <el-dialog :visible.sync="dialogVisible"/> .sync 是一个语法糖。是父组件监听子组件更新某个props的请求的缩写语法
          * 组件内部可以通过$emit('update:visible') 来修改外部visible所绑定dialogVisible的值
          * */
          this.$emit('update:visible', false);
          this.$emit('close');
          this.closed = true;
        }
      },
      // updatePopper 用来通知ElSelectDropdown和ElDropdownMenu这两个子孙组件（如果这两个组件有的话）
      updatePopper() {
        this.broadcast('ElSelectDropdown', 'updatePopper');
        this.broadcast('ElDropdownMenu', 'updatePopper');
      },
      // 触发Dialog 打开动画结束时的回调
      afterEnter() {
        this.$emit('opened');
      },
      // 触发Dialog 关闭动画结束时的回调
      afterLeave() {
        this.$emit('closed');
      }
    },

    mounted() {
      // 如果visible初始值为true的流程
      if (this.visible) {
        this.rendered = true;
        this.open();
        if (this.appendToBody) {
          document.body.appendChild(this.$el);
        }
      }
    },

    destroyed() {
      // 如果appendToBody属性为true, 移除掉插入到body上面的弹框组件，别说这一点我都忘了，严谨
      if (this.appendToBody && this.$el && this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el);
      }
    }
  };
</script>
```

总结：  
1、了解了 dialog 组件的整体流程，以及 dialog 各个 Attributes 参数的实际作用  
2、通过 dialog 组件可以看到 elementUI 的严谨性，如事件的绑定与移除，元素的插入与销毁，`$nextTick`合理利用  
3、复习了`.sync`语法糖，`$emit('update:visible')`的用途

### 难点部分

#### emitter.js

打开**packages/src/mixins/emitter**  
先来点开胃菜  
如上文所说，`emitter.js`定义了`dispatch`和`broadcast`方法用来派发和广播事件  
1）`dispatch`是用于派发事件到父组件以及更上级别的指定组件进行接收的  
2）`broadcast`方法主要用于将数据或者方法广播到子组件以及子孙指定组件进行接收

```js
/**
 * 广播方法定义
 * @param String componentName 组件名称
 * @param String eventName 事件名称
 * @param Object params 参数
 */

function broadcast(componentName, eventName, params) {
  // 遍历子组件，对子组件的componentName进行匹配
  // 阅读源码，发现很多组件除了定义name属性外，还定义了componentName了，这里就了解componentName的作用
  this.$children.forEach((child) => {
    var name = child.$options.componentName;
    if (name === componentName) {
      // 子组件中与传入的componentName相等时，则在子组件中执行eventName方法，参数为params
      // 注意$emit会触发组件中的$on事件（vue中内置的$emit、$on）
      // 通过apply将this指向为当前组件，apply第二个参数为一个数组
      child.$emit.apply(child, [eventName].concat(params));
    } else {
      // 如果不存在则继续执行broadcast方法，this指向子组件
      broadcast.apply(child, [componentName, eventName].concat([params]));
    }
  });
}
export default {
  methods: {
    /**
     * 派发方法定义
     * @param String componentName 组件名称
     * @param String eventName 事件名称
     * @param Object params 参数
     */
    dispatch(componentName, eventName, params) {
      // 通过while循环找到对应的父组件（找父组件的场景在平常开发中也会用到）
      // 定义父组件对象，如果该组件上面没有对象，则parent为根组件
      var parent = this.$parent || this.$root;
      var name = parent.$options.componentName;
      // 当父组件对象存在时且父组件名称不等于componentName时，则改变parent值，并将parent值向上赋值；当parent不存在或者name === componentName时，跳出循环
      while (parent && (!name || name !== componentName)) {
        parent = parent.$parent;
        // 如果父组件存在，取父组件的componentName
        if (parent) {
          name = parent.$options.componentName;
        }
      }
      // 找到对应的父组件时，执行该组件中eventName方法，参数为params
      if (parent) {
        parent.$emit.apply(parent, [eventName].concat(params));
      }
    },
    broadcast(componentName, eventName, params) {
      broadcast.call(this, componentName, eventName, params);
    }
  }
};
```

#### popup

打开**packages/src/utils/popup/index.js**  
重点来了，来吧一起了解下 dialog 弹框的流程  
**dialog 弹框打开的流程总结：**  
1、通过 mixins 混入 popup/index.js  
2、watch 监听 visible 属性的变化，为 true 时先执行`this.open`方法，再执行`this.doOpen`方法  
3、在 this.doOpen 方法中调用`PopupManager.openModal`打开遮罩  
4、`lockScroll`属性为 true 时，给 body 设置`overflow: hidden;`实现弹框打开时将 body 滚动锁定  
5、给当前的 dialog 组件加上层级，层级的高度比遮罩高一层  
6、如果打开多个弹框，公用一个遮罩，通过`openModal`控制遮罩的层级  
（下面会分析 PopupManager.openModal 方法）

**dialog 弹框关闭的流程总结：**  
1、watch 监听 visible 属性的变化，为 false 时先执行`this.close`方法，再执行`this.doClose`方法  
2、在`this.doAfterClose`方法中调用`PopupManager.closeModal`关闭遮罩  
3、关闭遮罩时如果存在多个弹框，需将遮罩的层级降为上一个弹框的层级  
（下面会分析`PopupManager.closeModal`方法）

```js
import Vue from 'vue';
import merge from 'element-ui/src/utils/merge';
import PopupManager from 'element-ui/src/utils/popup/popup-manager';
import getScrollBarWidth from '../scrollbar-width';
import { getStyle, addClass, removeClass, hasClass } from '../dom';

let idSeed = 1;
let scrollBarWidth;
export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    openDelay: {},
    closeDelay: {},
    zIndex: {},
    modal: {
      type: Boolean,
      default: false
    },
    modalFade: {
      type: Boolean,
      default: true
    },
    modalClass: {},
    modalAppendToBody: {
      type: Boolean,
      default: false
    },
    lockScroll: {
      type: Boolean,
      default: true
    },
    closeOnPressEscape: {
      type: Boolean,
      default: false
    },
    closeOnClickModal: {
      type: Boolean,
      default: false
    }
  },

  beforeMount() {
    // 生成一个_popupId，调用PopupManager.register将当前组件的实例对象注册到instances中
    this._popupId = 'popup-' + idSeed++;
    PopupManager.register(this._popupId, this);
  },

  // 关闭时 销毁对应的实例，并移除body的class类名
  beforeDestroy() {
    PopupManager.deregister(this._popupId);
    PopupManager.closeModal(this._popupId);

    this.restoreBodyStyle();
  },

  data() {
    return {
      opened: false,
      bodyPaddingRight: null,
      computedBodyPaddingRight: 0,
      withoutHiddenClass: true,
      rendered: false
    };
  },

  watch: {
    visible(val) {
      // 同dialog组件一样，也是监听visible
      if (val) {
        if (this._opening) return;
        if (!this.rendered) {
          this.rendered = true;
          Vue.nextTick(() => {
            // 第一次进入到这里
            this.open();
          });
        } else {
          this.open();
        }
      } else {
        // 进入关闭的流程
        this.close();
      }
    }
  },

  methods: {
    open(options) {
      if (!this.rendered) {
        this.rendered = true;
      }
      // 通过merge方法 合并props，这里没用到
      const props = merge({}, this.$props || this, options);

      if (this._closeTimer) {
        clearTimeout(this._closeTimer);
        this._closeTimer = null;
      }
      clearTimeout(this._openTimer);

      const openDelay = Number(props.openDelay);
      if (openDelay > 0) {
        this._openTimer = setTimeout(() => {
          this._openTimer = null;
          this.doOpen(props);
        }, openDelay);
      } else {
        // 到这里  我们来看
        this.doOpen(props);
      }
    },

    doOpen(props) {
      // 是否是服务端渲染
      if (this.$isServer) return;
      if (this.willOpen && !this.willOpen()) return;
      if (this.opened) return;
      // 这里 _opening = true
      this._opening = true;
      // 这个 this.$el 就是dialog的el-dialog__wrapper元素
      const dom = this.$el;

      // modal属性 是否需要遮罩层
      const modal = props.modal;

      const zIndex = props.zIndex;
      // 第一次props.zIndex为undefined
      if (zIndex) {
        PopupManager.zIndex = zIndex;
      }

      // 有遮罩层
      if (modal) {
        // 如果正在关闭  现在基本跟我们没有 关系
        if (this._closing) {
          PopupManager.closeModal(this._popupId);
          this._closing = false;
        }
        /**
         * PopupManager.openModal是用来控制灰色遮罩的打开
         * @param String _popupId 弹窗的id
         * @param String PopupManager.nextZIndex 弹窗的zIndex层级
         * @param Object this.modalAppendToBody ? undefined : dom 如果设置modal-append-to-body属性，传入undefined，否则传入当前组件
         * @param String modalClass modal弹层的显示时候的 class
         * @param Boolean modalFade 是否是淡入淡出
         */
        PopupManager.openModal(
          this._popupId,
          PopupManager.nextZIndex(),
          this.modalAppendToBody ? undefined : dom,
          props.modalClass,
          props.modalFade
        );
        // 如果设置了lock-scroll属性，默认为true
        if (props.lockScroll) {
          // 这边的话 判断body是不是有 el-popup-parent--hidden
          this.withoutHiddenClass = !hasClass(document.body, 'el-popup-parent--hidden');
          if (this.withoutHiddenClass) {
            // 获取到 body的 padding-right
            this.bodyPaddingRight = document.body.style.paddingRight;
            this.computedBodyPaddingRight = parseInt(getStyle(document.body, 'paddingRight'), 10);
          }
          // getScrollBarWidth方法用来获取浏览器默认的滚动条宽度
          scrollBarWidth = getScrollBarWidth();
          // 判断body是否需要滚动
          let bodyHasOverflow = document.documentElement.clientHeight < document.body.scrollHeight;
          // 查看body overflowY 属性
          let bodyOverflowY = getStyle(document.body, 'overflowY');
          // 总的来说这边条件就是说 body边上 有滚动条了 那么就给body加上 相应的 padding-right
          // 免得 body 设置上 overflow 为 hidden的时候滚动条消失 页面变宽  发生页面的抖动
          if (
            scrollBarWidth > 0 &&
            (bodyHasOverflow || bodyOverflowY === 'scroll') &&
            this.withoutHiddenClass
          ) {
            document.body.style.paddingRight =
              this.computedBodyPaddingRight + scrollBarWidth + 'px';
          }
          // 给body添加el-popup-parent--hidden类名，该类名的样式为overflow: hidden; 从而实现将 body 滚动锁定
          addClass(document.body, 'el-popup-parent--hidden');
        }
      }

      // 如果dialog外层是没有定位的话  那么就加上 absolute
      if (getComputedStyle(dom).position === 'static') {
        dom.style.position = 'absolute';
      }
      // 给当前的dialog组件加上层级，层级的高度比遮罩高一层
      dom.style.zIndex = PopupManager.nextZIndex();
      this.opened = true;

      this.onOpen && this.onOpen();

      this.doAfterOpen();
    },

    doAfterOpen() {
      // _opening正在打开属性设为false, 打开弹框的流程就是这样了
      this._opening = false;
    },

    close() {
      if (this.willClose && !this.willClose()) return;

      if (this._openTimer !== null) {
        clearTimeout(this._openTimer);
        this._openTimer = null;
      }
      clearTimeout(this._closeTimer);

      const closeDelay = Number(this.closeDelay);

      if (closeDelay > 0) {
        this._closeTimer = setTimeout(() => {
          this._closeTimer = null;
          this.doClose();
        }, closeDelay);
      } else {
        this.doClose();
      }
    },

    doClose() {
      // _closing 正在关闭的属性设为true
      this._closing = true;

      this.onClose && this.onClose();

      if (this.lockScroll) {
        setTimeout(this.restoreBodyStyle, 200);
      }

      this.opened = false;

      this.doAfterClose();
    },

    doAfterClose() {
      /**
       *  PopupManager.closeModal 用来控制灰色遮罩的关闭
       * @param String _popupId 弹窗的id
       */
      PopupManager.closeModal(this._popupId);
      // _closing 正在关闭的属性设为false, 关闭流程介绍
      this._closing = false;
    },

    restoreBodyStyle() {
      if (this.modal && this.withoutHiddenClass) {
        document.body.style.paddingRight = this.bodyPaddingRight;
        removeClass(document.body, 'el-popup-parent--hidden');
      }
      this.withoutHiddenClass = true;
    }
  }
};

export { PopupManager };
```

打开**packages/src/utils/popup/popup-manager.js**  
重点分析下`PopupManager.openModal`和`PopupManager.closeModal`方法

```js
import Vue from 'vue';
import { addClass, removeClass } from 'element-ui/src/utils/dom';

let hasModal = false;
let hasInitZIndex = false;
let zIndex;

// getModal方法用来生成弹框的灰色遮罩
// 遮罩只用生成一次，然后存到PopupManager.modalDom中，所有的弹框都用同一个遮罩
const getModal = function () {
  if (Vue.prototype.$isServer) return;
  let modalDom = PopupManager.modalDom;
  if (modalDom) {
    hasModal = true;
  } else {
    hasModal = false;
    modalDom = document.createElement('div');
    PopupManager.modalDom = modalDom;

    // 给遮罩绑定上touchmove事件
    modalDom.addEventListener('touchmove', function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    // 给遮罩绑定上click事件
    modalDom.addEventListener('click', function () {
      PopupManager.doOnModalClick && PopupManager.doOnModalClick();
    });
  }

  return modalDom;
};

const instances = {};

const PopupManager = {
  // 是否是淡入淡出
  modalFade: true,

  // 获取instance上的实例
  getInstance: function (id) {
    return instances[id];
  },

  // 往instance上的注册实例
  register: function (id, instance) {
    if (id && instance) {
      instances[id] = instance;
    }
  },

  // instance上的销毁实例
  deregister: function (id) {
    if (id) {
      instances[id] = null;
      delete instances[id];
    }
  },

  // 计算zIndex层级
  nextZIndex: function () {
    return PopupManager.zIndex++;
  },

  // 存储弹框的栈
  modalStack: [],

  // 执行对应弹框组件上的close方法
  doOnModalClick: function () {
    const topItem = PopupManager.modalStack[PopupManager.modalStack.length - 1];
    if (!topItem) return;

    const instance = PopupManager.getInstance(topItem.id);
    if (instance && instance.closeOnClickModal) {
      instance.close();
    }
  },

  // 该方法用来打开弹框的灰色遮罩
  openModal: function (id, zIndex, dom, modalClass, modalFade) {
    if (Vue.prototype.$isServer) return;
    if (!id || zIndex === undefined) return;
    // 这里要注意this指向，此时的this为PopupManager对象
    this.modalFade = modalFade;

    // 第一次这个栈 默认是个空的数组[]
    const modalStack = this.modalStack;

    // 遍历栈，找到对应id的弹框
    for (let i = 0, j = modalStack.length; i < j; i++) {
      const item = modalStack[i];
      if (item.id === id) {
        return;
      }
    }

    // 获取灰色遮罩的dom元素
    const modalDom = getModal();
    /* 给遮罩加上 v-modal类名，遮罩的半透明背景就是这样类名设置的
      .v-modal {
      position: fixed;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      opacity: 0.5;
      background: #000000;
    }*/
    addClass(modalDom, 'v-modal');
    if (this.modalFade && !hasModal) {
      // 加上v-modal-enter渐变的类名
      addClass(modalDom, 'v-modal-enter');
    }
    if (modalClass) {
      let classArr = modalClass.trim().split(/\s+/);
      classArr.forEach((item) => addClass(modalDom, item));
    }
    // 200毫秒后去掉 v-modal-enter
    setTimeout(() => {
      removeClass(modalDom, 'v-modal-enter');
    }, 200);

    // 将遮罩添加到body上
    if (dom && dom.parentNode && dom.parentNode.nodeType !== 11) {
      dom.parentNode.appendChild(modalDom);
    } else {
      document.body.appendChild(modalDom);
    }

    if (zIndex) {
      modalDom.style.zIndex = zIndex;
    }
    modalDom.tabIndex = 0;
    modalDom.style.display = '';

    // 将当前弹框的id 已经遮罩的zIndex 存到modalStack中
    this.modalStack.push({ id: id, zIndex: zIndex, modalClass: modalClass });
  },

  // 用来关闭遮罩（存在同时打开多个弹框的情况）
  /*
   * 1、根据id 获取对应的遮罩对象
   * 2、如果这个id就是modalStack最后一个，直接pop，并将遮罩的层级降为此时modalStack最后一个的层级
   * 3、如果modalStack.length === 0，也就是此时页面没有弹框了，将body上的modalDom移除，并PopupManager.modalDom = undefined
   * */
  closeModal: function (id) {
    // 获取modalStack
    const modalStack = this.modalStack;
    const modalDom = getModal();

    if (modalStack.length > 0) {
      // 取出最后一个
      const topItem = modalStack[modalStack.length - 1];
      if (topItem.id === id) {
        // 如果有当前的这个有modalClass  那么把这些个class都去掉
        if (topItem.modalClass) {
          let classArr = topItem.modalClass.trim().split(/\s+/);
          classArr.forEach((item) => removeClass(modalDom, item));
        }
        // 最后一个删除掉
        modalStack.pop();
        // 还有的话，也就是同时打开多个弹框的情况
        if (modalStack.length > 0) {
          // 将遮罩的层级降为此时modalStack最后一个的层级
          // 一般来说就是  流程是
          // modal 层级 2001  对话框层级 2002
          // 在打开一个对话框 modal层级2003 对话框层级2004
          // 关闭一个对话框  modal 层级变为又要变成2001放在 层级在第一个对话框的下面
          modalDom.style.zIndex = modalStack[modalStack.length - 1].zIndex;
        }
      } else {
        // 如果要移除的不是最后一个 那么只要将这个对象移除就行了 层级不用做什么操作
        for (let i = modalStack.length - 1; i >= 0; i--) {
          if (modalStack[i].id === id) {
            modalStack.splice(i, 1);
            break;
          }
        }
      }
    }

    // 所有弹框都关闭的情况
    if (modalStack.length === 0) {
      // 加入淡入淡出的样式
      if (this.modalFade) {
        addClass(modalDom, 'v-modal-leave');
      }
      setTimeout(() => {
        if (modalStack.length === 0) {
          // 从body上移除遮罩，并重置PopupManager.modalDom
          if (modalDom.parentNode) modalDom.parentNode.removeChild(modalDom);
          modalDom.style.display = 'none';
          PopupManager.modalDom = undefined;
        }
        removeClass(modalDom, 'v-modal-leave');
      }, 200);
    }
  }
};

// 通过Object.defineProperty对PopupManager上的zIndex的拦截
// 第一次获取zIndex时，返回初始值为2000
Object.defineProperty(PopupManager, 'zIndex', {
  configurable: true,
  get() {
    if (!hasInitZIndex) {
      zIndex = zIndex || (Vue.prototype.$ELEMENT || {}).zIndex || 2000;
      hasInitZIndex = true;
    }
    return zIndex;
  },
  set(value) {
    zIndex = value;
  }
});

const getTopPopup = function () {
  if (Vue.prototype.$isServer) return;
  if (PopupManager.modalStack.length > 0) {
    const topPopup = PopupManager.modalStack[PopupManager.modalStack.length - 1];
    if (!topPopup) return;
    const instance = PopupManager.getInstance(topPopup.id);

    return instance;
  }
};

if (!Vue.prototype.$isServer) {
  // handle `esc` key when the popup is shown
  window.addEventListener('keydown', function (event) {
    if (event.keyCode === 27) {
      const topPopup = getTopPopup();

      if (topPopup && topPopup.closeOnPressEscape) {
        topPopup.handleClose
          ? topPopup.handleClose()
          : topPopup.handleAction
          ? topPopup.handleAction('cancel')
          : topPopup.close();
      }
    }
  });
}

export default PopupManager;
```

## 到站

**1、总体来说，通过阅读 dialog 组件源码，感觉还是挺惊艳的。没想到一个小小的弹框组件，也是内有乾坤啊。  
2、弹框的流程控制、层级控制、组件之间的派发与广播、如何递归向上查找父组件、对.sync 的运用、甚至是\$emit、\$on，这些都可以运用到平常的开发中。**

## 参考链接

[vue elementUi dialog 组件 逐行解读分析](https://juejin.cn/post/6905749357262274574)  
[element-ui 的 dispatch 和 broadcast 方法分析](https://www.jianshu.com/p/87c6aead9678)
