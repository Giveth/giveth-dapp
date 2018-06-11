# Component Properties

The following props can be set on the form components:

- [`disabled`](#disabled)
- [`help`](#help)
- [`label`](#label)
- [`layout`](#layout)
- [`onChange`](#onchange)
- [`validatePristine`](#validatepristine)
- [`validateOnSubmit`](#validateonsubmit)

In addition, you can pass any [Formsy.Mixin property](https://github.com/christianalfoni/formsy-react/blob/master/API.md#formsymixin). At the least, components require a [`name`](https://github.com/christianalfoni/formsy-react/blob/master/API.md#name).

Other props are passed through and applied to the form control, React will render these according to it’s [HTML attribute whitelist](https://facebook.github.io/react/docs/tags-and-attributes.html). For example a <code>placeholder</code> property passed to the component would be applied to the form control within the component.

### disabled

* Type: `React.PropTypes.bool`
* Default: `false`

Disables this form component. For components that allow selecting multiple values (`<RadioGroup>`, `<CheckboxGroup>`, `<Select>`), it is possible to disable individual elements within that control. See the documentation for individual components for details.

Alternatively you may disable all form elements by setting the `disabled` prop on the parent form. See [Formsy.Mixin isFormDisabled](https://github.com/christianalfoni/formsy-react/blob/master/API.md#isformdisabled).

### help

* Type: `React.PropTypes.string`

Text to render for the help text, typically displayed underneath the form control. See [Bootstrap forms: help text](http://getbootstrap.com/css/#forms-help-text).

### label

* Type: `React.PropTypes.node`

Content rendered within the label tag of the component.

### layout

* Type: `React.PropTypes.oneOf('horizontal', 'vertical', 'elementOnly')`
* Default: `'horizontal'`

Use one of the bundled layouts.

### onChange

* Type: `React.PropTypes.func`

If supplied, callback signature is `(name, value)` where `name` is the name of the element, and `value` is it’s changed value.

### validatePristine

* Type: `React.PropTypes.bool`
* Default: `false`

Whether to present validation notices on pristine elements.

### validateOnSubmit

* Type: `React.PropTypes.bool`
* Default: `false`

When `true`, validation notices are hidden until the user attempts to submit the form.
