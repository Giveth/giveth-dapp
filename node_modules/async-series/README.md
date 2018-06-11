# async-series #

Run a series of callbacks in sequence, as simply as possible.

More or less equivalent to
[async.series](https://github.com/caolan/async#series) - solely
for the sake of keeping some modules tiny for
[browserify](http://browserify.org/).

## Installation ##

``` bash
npm install async-series
```

## Usage ##

**series(tasks, callback, safe)**

Where `tasks` is an array of functions, each with their own `done`
argument. `callback` is called when finished. Setting `safe` to true
will ensure there's at least a tick between each task to prevent RangeErrors.

``` javascript
series([
  function(done) {
    console.log('first thing')
    done()
  },
  function(done) {
    console.log('second thing')
    done(new Error('another thing'))
  },
  function(done) {
    // never happens, because "second thing"
    // passed an error to the done() callback
  }
], function(err) {
  console.log(err.message) // "another thing"
})
```
