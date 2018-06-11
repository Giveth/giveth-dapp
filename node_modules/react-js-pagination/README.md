[![Build Status](https://travis-ci.org/vayser/react-js-pagination.svg?branch=master)](https://travis-ci.org/vayser/react-js-pagination)

[![NPM](https://nodei.co/npm/react-js-pagination.png?downloads=true)](https://nodei.co/npm/react-js-pagination/)

# react-js-pagination

**A ReactJS [dumb](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) component to render a pagination.**

The component comes with no built-in styles. HTML layout compatible with [Bootstrap](http://getbootstrap.com/components/#pagination) pagination stylesheets.

## Installation

Install `react-js-pagination` with [npm](https://www.npmjs.com/):

```
$ npm install react-js-pagination
```

## Usage

Very easy to use. Just provide props with total amount of things that you want to display on the page.

```js
import React, { Component } from "react";
import ReactDOM from "react-dom";
import Pagination from "react-js-pagination";
require("bootstrap/less/bootstrap.less");

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePage: 15
    };
  }

  handlePageChange(pageNumber) {
    console.log(`active page is ${pageNumber}`);
    this.setState({activePage: pageNumber});
  }

  render() {
    return (
      <div>
        <Pagination
          activePage={this.state.activePage}
          itemsCountPerPage={10}
          totalItemsCount={450}
          pageRangeDisplayed={5}
          onChange={::this.handlePageChange}
        />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

```

Check [Live example](http://vayser.github.io/react-js-pagination)

![Example](https://i.gyazo.com/9af4c2b9e20aa95a67597d3ca64efde3.png)

## Params

Name | Type | Default | Description
--- | --- | --- | --- |
`totalItemsCount` | Number | | **Required.** Total count of items which you are going to display
`onChange` | Function | | **Required.** Page change handler. Receive pageNumber as arg
`activePage` | Number | `1` | **Required.** Active page
`itemsCountPerPage` | Number | `10` | Count of items per  page
`pageRangeDisplayed` | Number | `5` | Range of pages in paginator, exclude navigation blocks (prev, next, first, last pages)
`prevPageText` | String / ReactElement | `⟨` | Text of prev page navigation button
`firstPageText` | String / ReactElement | `«` | Text of first page navigation button
`lastPageText` | String / ReactElement | `»` | Text of last page navigation button
`nextPageText` | String / ReactElement | `⟩` | Text of next page navigation button
`getPageUrl` | Function | | Generate href attribute for page
`innerClass` | String | `pagination` | Class name of `<ul>` tag
`activeClass` | String | `active` | Class name of active `<li>` tag
`activeLinkClass` | String |  | Class name of active `<a>` tag
`itemClass` | String | | Default class of the `<li>` tag
`itemClassFirst` | String | | Class of the first `<li>` tag
`itemClassPrev` | String | | Class of the previous `<li>` tag
`itemClassNext` | String | | Class of the next `<li>` tag
`itemClassLast` | String | | Class of the last `<li>` tag
`disabledClass` | String | `disabled` | Class name of the first, previous, next and last `<li>` tags when disabled
`hideDisabled` | Boolean | `false` | Hide navigation buttons (prev, next, first, last) if they are disabled.
`hideNavigation` | Boolean | `false` | Hide navigation buttons (prev page, next page)
`hideFirstLastPages` | Boolean | `false` | Hide first/last navigation buttons
`linkClass` | String | | Default class of the `<a>` tag
`linkClassFirst` | String | | Class of the first `<a>` tag
`linkClassPrev` | String | | Class of the previous `<a>` tag
`linkClassNext` | String | | Class of the next `<a>` tag
`linkClassLast` | String | | Class of the last `<a>` tag
