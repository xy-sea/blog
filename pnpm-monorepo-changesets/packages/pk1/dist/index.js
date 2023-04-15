(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["web-see"] = {}));
})(this, (function (exports) { 'use strict';

  function pk1() {
      console.log('I am pk1');
  }

  exports.pk1 = pk1;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
