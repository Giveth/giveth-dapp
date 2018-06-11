# CSS Classes

It is possible to add or remove CSS class names on the markup generated for the enclosing row, label, and element wrapper.

Class names are added or removed using the ["deduped" version of JedWatson/classnames](https://github.com/JedWatson/classnames#alternate-dedupe-version).

```jsx
<Input
  name="cssRowTweak"
  id="example"
  type="text"
  rowClassName="yellow"
  labelClassName={[{'col-sm-3': false}, 'col-sm-5']}
  elementWrapperClassName={[{'col-sm-9': false}, 'col-sm-7']}
/>
```

The output for the example above becomes:

```html
<div class="form-group row yellow">
  <label class="control-label col-sm-5" for="example">This row is yellow</label>
  <div class="col-sm-7">
    <input class="form-control" name="cssRowTweak" value="" type="text" id="example">
  </div>
</div>
```

See the [Layout tweaks](http://twisty.github.io/formsy-react-components/playground/) in the playground for an example ([code](../examples/playground/src/playground.js#L224-L245)).
