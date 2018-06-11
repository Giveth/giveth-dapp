var nextTick = 'undefined' !== typeof process
  ? process.nextTick
  : 'undefined' !== typeof setImmediate
  ? setImmediate
  : setTimeout

function series(arr, ready, safe) {
  var length = arr.length
    , orig

  if (!length) return nextTick(ready, 1)

  function handleItem(idx) {
    arr[idx](function(err) {
      if (err) return ready(err)
      if (idx < length - 1) return handleItem(idx + 1)
      return ready()
    })
  }

  if (safe) {
    orig = handleItem
    handleItem = function(idx) {
      nextTick(function() {
        orig(idx)
      }, 1)
    }
  }

  handleItem(0)
}

module.exports = series
