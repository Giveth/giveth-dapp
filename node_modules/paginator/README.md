Paginator
=========

Generic pagination algorithm wrapped in a CommonJS module.

Overview
--------

When developing any kind of application that involves fetching an arbitrary
number of elements from somewhere, you'll almost always want some form of
pagination. It's impossible to tell in advance how the rest of the application
will work, so a generic module that does -only- the pagination algorithm is
useful. Enter *Paginator*.

Usage
-----

Also see the [documentation](http://deoxxa.github.com/paginator/docs/).

```javascript
var Paginator = require("paginator");

// Arguments are `per_page` and `length`. `per_page` changes the number of
// results per page, `length` changes the number of links displayed.
var paginator = new Paginator(30, 7);

// Arguments are `total_results` and `current_page`. I hope these are self
// explanatory.
var pagination_info = paginator.build(10000, 50);

// The returned object will look something like this.
{
  total_pages: 334,
  current_page: 50,
  first_page: 46,
  last_page: 53,
  previous_page: 49,
  next_page: 51,
  has_previous_page: true,
  has_next_page: true,
  total_results: 10000,
  results: 30,
  first_result: 1470,
  last_result: 1499,
}
```

License
-------

Licensed under an MIT license.
