# Layouts

There are currently three layout modes that you can select.

1. [Horizontal](#horizontal)
2. [Vertical](#vertical)
3. [Element only](#element-only)

The default layout is "Horizontal".

## Horizontal layout

```jsx
<Input
  name="my-input"
  type="text"
  layout="horizontal"
/>
```

The horizontal layout aims to mirror the [Bootstrap horizontal form layout](http://getbootstrap.com/css/#forms-horizontal).

This layout requires that the enclosing form has the `form-horizontal` classname applied.

The default classes are `col-sm-3` for the labels, and `col-sm-9` for the element. It is possible to modify these classes, see [Modifying CSS class names](css-classes.md).

## Vertical layout

```jsx
<Input
  name="my-input"
  type="text"
  layout="vertical"
/>
```

This is similar to the horizontal layout, except we don’t add any grid classes to the component. This layout is the same as the [Bootstrap basic form example](http://getbootstrap.com/css/#forms-example).

## “Element only” layout

```jsx
<Input
  name="my-input"
  type="text"
  layout="elementOnly"
/>
```

Only renders the form control.
