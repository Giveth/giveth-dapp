# form-data-to-object
Converts application/x-www-form-urlencoded data structure to plain JS object

## API
- `formData.toObj()` - Converts keys in x-www-form-urlencoded format on an object to a normal object
- `formData.fromObj()` - Converts a normal object to object with keys in x-www-form-urlencoded format
```js

// keys in x-www-form-urlencoded format
{
  'foo': 'bar',
  'foo2[name]': 'bar2',
  'foo3[0]': 'bar3',
  'foo3[1][name]': 'bar4'
}

// converts from/to

// normal object
{
  foo: 'bar',
  foo2: {
    name: 'bar2'
  },
  foo3: ['bar3', {
    name: 'bar4'
  }]
}
```
