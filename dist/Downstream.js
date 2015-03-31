module.exports=function(t){function r(e){if(n[e])return n[e].exports;var i=n[e]={exports:{},id:e,loaded:!1};return t[e].call(i.exports,i,i.exports,r),i.loaded=!0,i.exports}var n={};return r.m=t,r.c=n,r.p="",r(0)}([function(t,r,n){"use strict";var e=function(t){return t&&t.__esModule?t["default"]:t},i=e(n(8));t.exports={contextTypes:{app:i},send:function(t){for(var r,n=arguments.length,e=Array(n>1?n-1:0),i=1;n>i;i++)e[i-1]=arguments[i];(r=this.context.app).send.apply(r,[t].concat(e))}}},function(t){"use strict";function r(t,r){var n=void 0===arguments[2]?{}:arguments[2],e=Object.keys(t);return e.reduce(function(n,e){return n[e]=r(t[e],e),n},n)}t.exports=r},function(t,r,n){"use strict";var e=function(t){return t&&t.__esModule?t["default"]:t},i=Object.assign||function(t){for(var r=1;r<arguments.length;r++){var n=arguments[r];for(var e in n)Object.prototype.hasOwnProperty.call(n,e)&&(t[e]=n[e])}return t},o=function(t,r){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")},s=e(n(3)),u=e(n(4)),a=e(n(5)),c=e(n(6)),f=e(n(7)),p=e(n(1)),l=function(){function t(){o(this,t),f(this),this._state={},this._stores={},this._plugins=[]}return t.prototype.push=function(t){this.commit(this.deserialize(t))},t.prototype.pull=function(t){return this._state[t]},t.prototype.clone=function(){return Object.create(this._state)},t.prototype.commit=function(t){this._state=t,this.emit()},t.prototype.prepare=function(t){for(var r,n=arguments.length,e=Array(n>1?n-1:0),i=1;n>i;i++)e[i-1]=arguments[i];return u("function"==typeof t,"prepare was called with no callable action."),(r=this.send).bind.apply(r,[this,t].concat(e))},t.prototype.send=function(t){for(var r=this,n=arguments.length,e=Array(n>1?n-1:0),i=1;n>i;i++)e[i-1]=arguments[i];u(t,"send method expected an action, instead got "+t);var o=t.apply(this,e);return o instanceof Promise?o.then(function(n){return r.dispatch(t,n)}):this.dispatch(t,o)},t.prototype.dispatch=function(t,r){var n=this,e=a(this._stores,function(r){return t in r});return Object.keys(e).length>0&&!function(){var i=n.clone(),o=p(e,function(n){return n[t](i[n],r)},i);n.commit(o)}(),r},t.prototype.addPlugin=function(t,r){u("register"in t,"Plugins must have a register method."),this._plugins.push([t,r])},t.prototype.addStore=function(t){var r=i({},s,t);u(!this._stores[t],'Tried to add "'+t+'" but it is not unique'),this._stores[r]=r},t.prototype.serialize=function(){var t=this;return p(this._stores,function(r){return r.serialize(t.pull(r))})},t.prototype.deserialize=function(){var t=void 0===arguments[0]?{}:arguments[0];return p(this._stores,function(r){return r.deserialize(t[r])})},t.prototype.toJSON=function(){return this.serialize()},t.prototype.toObject=function(){return a(this._state,function(){return!0})},t.prototype.start=function(){for(var t=arguments.length,r=Array(t),n=0;t>n;n++)r[n]=arguments[n];this._state=p(this._stores,function(t){return t.getInitialState()}),c(this._plugins,this,function(){r.forEach(function(t){return t()})})},t}();t.exports=l},function(t){"use strict";t.exports={getInitialState:function(){return void 0},serialize:function(t){return t},deserialize:function(){var t=void 0===arguments[0]?this.getInitialState():arguments[0];return t},toString:function(){throw new Error("Stores must implement a toString() method")}}},function(t){"use strict";function r(t,r){if(!t){var n=new Error(r);throw n.framesToPop=1,n}}t.exports=r},function(t){"use strict";t.exports=function(t,r){var n={};for(var e in t)r(t[e])&&(n[e]=t[e]);return n}},function(t){"use strict";function r(t,i,o){var s=e(t),u=s[0],a=s.slice(1);if(!u)return o();var c=n(u,2),f=c[0],p=c[1];f.register(i,p,function(t){if(t)throw t;r(a,i,o)})}var n=function(t,r){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t)){for(var n,e=[],i=t[Symbol.iterator]();!(n=i.next()).done&&(e.push(n.value),!r||e.length!==r););return e}throw new TypeError("Invalid attempt to destructure non-iterable instance")},e=function(t){return Array.isArray(t)?t:Array.from(t)};t.exports=r},function(t){"use strict";function r(){var t=void 0===arguments[0]?{}:arguments[0],r=[];return t.ignore=function(t){r=r.filter(function(r){return r!==t})},t.listen=function(t){r.push(t)},t.emit=function(){for(var t=0;t<r.length;t++)r[t].call(this)},t}t.exports=r},function(t,r,n){"use strict";var e=function(t){return t&&t.__esModule?t["default"]:t},i=e(n(2));t.exports=function(t,r,n){if(t[r]instanceof i==!1)throw new Error("Context type "+r+" of <"+n+"> should be an instance of Microcosm")}}]);
//# sourceMappingURL=Downstream.js.map