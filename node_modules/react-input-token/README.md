# REACT INPUT TOKEN
![screenshot](https://github.com/amgradetech/react-token-input/blob/master/screenshot.png)

## Basic usage
```javascript
import React, { Component } from "react";
import InputToken from "react-input-token";
import "react-input-token/lib/style.css";

class App extends Component {
  state = {
    tokens: [],
    isLoading: false,
  };

  selectToken = ({ target: { value: tokens } }) => {
    this.setState({ tokens })
  };

  render() {
    return (
      <div className="App">
        <InputToken
          name="test"
          isLoading={this.state.isLoading}
          value={this.state.tokens}
          options={[
            { id: 1, name: 'option 1', element: <span>option 1</span> },
            { id: 2, name: 'option 2', element: <span>option 2</span> },
            { id: 3, name: 'option 3', element: <span>option 3</span> },
            { id: 4, name: 'option 4', element: <span>option 4</span> },
            { id: 5, name: 'option 5', element: <span>option 5</span> },
            { id: 6, name: 'option 6', element: <span>option 6</span> },
            { id: 7, name: 'option 7', element: <span>option 7</span> },
            { id: 8, name: 'option 8', element: <span>option 8</span> },
            { id: 9, name: 'option 9', element: <span>option 9</span> },
            { id: 10, name: 'option 10', element: <span>option 10</span> },
            { id: 11, name: 'option 11', element: <span>option 11</span> },
          ]}
          onSelect={this.selectToken}/>
      </div>
    );
  }
}

export default App;
```

## Props

```
// inputs' disabled prop
disabled: {boolean},

// inputs' id
id: {string},

// Whether options are being loaded
isLoading: {boolean},

// custom loader element
loaderElement: {element},

// Maximum options to select
maxLength: {number},

// Input name (is required)
name: {string},

// Handle select option event, cannot be uncontrolled (is required)
onSelect: {function},

options: array of  {
  id: {string|number} (is required),
  name: {string} (is required),

   // custom element for option display
   element: {element},
} (is required)

// input placeholder
placeholder: {string},

// selected options array (is required)
value: {value},
```