function promise(executor) {
  let _this = this;
  _this.status = "pending"; // 等待态
  _this.value = undefined;
  _this.reason = undefined;
  // 缓存resolve,reject回调
  _this.onResolvedCallbacks = [];
  _this.onRejectedCallbacks = [];
  function resolve(value) {
    if (_this.status === "pending") {
      _this.value = value;
      _this.status = "fulfilled";
      // 当函数成功时，调用数组里的每一项，以便多次then
      _this.onResolvedCallbacks.forEach(fn => {
        fn();
      });
    }
  }
  function reject(reason) {
    if (_this.status === "pending") {
      _this.reason = reason;
      _this.status = "rejected";
      _this.onRejectedCallbacks.forEach(fn => {
        fn();
      });
    }
  }
  try {
    executor(resolve, reject);
  } catch (error) {
    // 在实例中抛出错误，调用reject
    reject(error);
  }
}
promise.prototype.then = (onFulfilled, onRejected) => {
  // 如果 onFulfilled 不是函数，那就默认生成一个
  // 如果 onRejected 同理
  onFulfilled =
    typeof onFulfilled === "function"
      ? onFulfilled
      : function(value) {
          return value;
        };
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : function(err) {
          return err;
        };

  let _this = this;
  let promise2; // 返回promise
  if (_this.status === "fulfilled") {
    // 链式调用，所以返回promise
    promise2 = new Promise(function(resolve, reject) {
      // onFulfilled onRejected需要异步执行情况
      setTimeout(function() {
        try {
          let x = onFulfilled(_this.value);
          resolvePromise(promise2, x, reslove, reject);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  if (_this.status === "rejected") {
    promise2 = new Promise(function(resolve, reject) {
      setTimeout(function() {
        try {
          let x = onRejected(_this.value);
          resolvePromise(promise2, x, reslove, reject);
        } catch (error) {
          reject(error);
        }
      },0);
    });
  }
  if (_this.status === "pending") {
    promise2 = new Promise(function(resolve, reject) {
      _this.onResolvedCallbacks.push(function() {
        setTimeout(function() {
          try {
            let x = onFulfilled(_this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });
      _this.onRejectedCallbacks.push(function() {
        setTimeout(function() {
          try {
            let x = onRejected(_this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  }
  return promise2;
};
function resolvePromise(promise, x, resolve, reject) {
  if (promise === x) {
    // promise x 为同一个值
    return reject(new TypeError());
  }
  let called;
  if (x !== null && (typeof x === "object" || typeof x === "function")) {
    try {
      let then = x.then; // promise对象中有then方法
      if (typeof then === "function") {

        then.call(
          x,
          function(y) { // 
            if (called) return;
            called = true;
            resolvePromise(promise, y, resolve, reject);
          },
          function(err) {
            if (called) return;
            called = true;
            reject(err);
          }
        );
      } else {
        resolve(x);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  } else {
    // x为普通值
    try {
      resolve(x);
    } catch (error) {
      reject(error);
    }
  }
}
promise.prototype.catch = function(callback) {
  return this.then(null, callback);
};
promise.prototype.all = function(promises) {
  return new Promise(function(resolve, reject) {
    let arr = [];
    let i = 0;
    function resolveData(index, y) {
      arr[index] = y;
      //当所有promise达到成功状态，则resolve
      if(index === promises.length - 1) {
        resolve(arr);
      }
    }
    for(let i = 0; i<promises.length; i++){
      promises[i].then(function(y) {
        resolveData(i, y);
      }, reject)
    }
  });
}
promise.prototype.race = function(promise) {
  return new Promise(function(resolve, reject) {
    for(let i = 0; i<promises.length; i++) {
      // 只要有一个promise状态变更，则执行
      promise[i].then(resolve, reject);
    }
  });
}
promise.prototype.resolve = function(value) {
  return new Promise(function(resolve, reject) {
    resolve(value);
  })
}
promise.prototype.reject = function(error) {
  return new Promise(function(resolve, reject) {
    reject(error);
  })
}
module.exports = promise;
