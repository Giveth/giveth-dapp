# refs

## Reference to the component

Use the `componentRef` property to get a reference to the component.

(We access the ref using the `componentRef` prop, because our actual component is wrapped in a couple of Higher Order Components.)

```jsx
import { Form, Input, RadioGroup } from 'formsy-react-components';

class MyForm extends Component {

  componentDidMount() {
    console.info(

      // Using the `ref` prop gets a ref to the Formsy HOC.
      this.formsyHOC,

      // The Formsy HOC has prop called `innerRef` that returns a ref to the
      // component it wraps. In our case this is another HOC, our Component HOC.
      this.componentHOC,

      // We have a prop called `componentRef` that is used to return a ref to
      // the main component wrapped by the HOCs.
      this.searchInputComponent

    );
  }

  render() {
    return (
      <Form>
        <Input
          name="query"
          label="Search"
          ref={(node) => { this.formsyHOC = node; }}
          innerRef={(node) => { this.componentHOC = node; }}
          componentRef={(node) => { this.searchInputComponent = node; }}
        />
      </Form>
    );
  }
}
```

## References to form control elements

Each component exposes references to it’s form control DOM elements.

For components that wrap a single element (`<Input />`, `<Select />`, `<Textarea />` etc.) the `ref` is named “`element`”.

For components that wrap multiple form elements (`<CheckboxGroup />`, `<RadioGroup />`) the ref is named “`elements`”, this is an object where each form control is keyed by the `value` for that element.

```jsx
// Component with single control
searchInputComponent.element.focus();

// Components with multiple controls
termsCheckboxElement = annoyingCheckboxesComponent.elements['agree-to-terms'];
```

## Reference to `Formsy.Form`

Our `Form` component composes a [`Formsy.Form`](https://github.com/christianalfoni/formsy-react/blob/master/API.md#formsyform). To get a reference to the `Formsy.Form`, use we expose a `formsyForm` ref. This is handy if you wish to call `Formsy.Form` methods — in this example `reset()`.

```jsx
import { Form, Input } from 'formsy-react-components';

class MyForm extends Component {

  let frcForm = null;

  const resetForm = () => {
    const formsyForm = frcForm.formsyForm; // get the ref to the formsy-react form
    formsyForm.reset(); // call a formsy-react form method
  }

  render() {
    return (
      <Form
        ref={(node) => { frcForm = node; }}
      >
        <Input name="query" label="Search" />
        <button onClick={resetForm} type="reset" defaultValue="Reset" />
      </Form>
    );
  }
}
```
