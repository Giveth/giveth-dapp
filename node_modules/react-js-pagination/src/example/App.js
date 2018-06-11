import React, { Component } from "react";
import Pagination from "../components/Pagination";
import SyntaxHighlighter from "react-syntax-highlighter";
import { sunburst } from "react-syntax-highlighter/dist/styles";
import "./App.less";
import "bootstrap/less/bootstrap.less";

const PER_PAGE = 10;
const TOTAL_COUNT = 450;

export default class App extends Component {
  constructor(props) {
    super();
    this.state = {
      activePage: 1
    };
    this.handlePageChange = ::this._handlePageChange;
  }

  _handlePageChange(pageNumber) {
    console.log(`active page is ${pageNumber}`);
    this.setState({activePage: pageNumber});
  }

  render() {
    const defaultSnippet = `render() {
  return (
    <Pagination
      activePage={this.state.activePage}
      itemsCountPerPage={PER_PAGE}
      totalItemsCount={TOTAL_COUNT}
      onChange={this.handlePageChange}
    />
  );
}`;

    const hideDisabled = `render() {
  return (
    <Pagination
      hideDisabled
      activePage={this.state.activePage}
      itemsCountPerPage={PER_PAGE}
      totalItemsCount={TOTAL_COUNT}
      onChange={this.handlePageChange}
    />
  );
}`;

    const customRange = `render() {
  return (
    <Pagination
      pageRangeDisplayed={10}
      activePage={this.state.activePage}
      itemsCountPerPage={PER_PAGE}
      totalItemsCount={TOTAL_COUNT}
      onChange={this.handlePageChange}
    />
  );
}`;

	  const hideNavigation = `render() {
  return (
    <Pagination
      hideNavigation
      pageRangeDisplayed={10}
      activePage={this.state.activePage}
      itemsCountPerPage={PER_PAGE}
      totalItemsCount={TOTAL_COUNT}
      onChange={this.handlePageChange}
    />
  );
}`;

    const hideFirstLastPages = `render() {
  return (
    <Pagination
      hideFirstLastPages
      pageRangeDisplayed={10}
      activePage={this.state.activePage}
      itemsCountPerPage={PER_PAGE}
      totalItemsCount={TOTAL_COUNT}
      onChange={this.handlePageChange}
    />
  );
}`;

    const overrideText = `render() {
  return (
    <Pagination
      prevPageText='prev'
      nextPageText='next'
      firstPageText='first'
      lastPageText='last'
      activePage={this.state.activePage}
      itemsCountPerPage={PER_PAGE}
      totalItemsCount={TOTAL_COUNT}
      onChange={this.handlePageChange}
    />
  );
}`;

    const overrideElement = `render() {
  return (
    <Pagination
      firstPageText={<i className='glyphicon glyphicon-chevron-left'/>}
      lastPageText={<i className='glyphicon glyphicon-chevron-right'/>}
      prevPageText={<i className='glyphicon glyphicon-menu-left'/>}
      nextPageText={<i className='glyphicon glyphicon-menu-right'/>}
      activePage={this.state.activePage}
      itemsCountPerPage={PER_PAGE}
      totalItemsCount={TOTAL_COUNT}
      onChange={this.handlePageChange}
    />
  );
}`;

    return (
      <div className='app'>
        <div className="panel panel-default">
          <div className="panel-heading">
            <a href='#default'>
              <h4 id='default' className="panel-title">Default</h4>
            </a>
          </div>
          <div className="panel-body">
            <SyntaxHighlighter language='javascript' style={sunburst}>{defaultSnippet}</SyntaxHighlighter>
            <div className='text-center'>
              <Pagination
                activePage={this.state.activePage}
                itemsCountPerPage={PER_PAGE}
                totalItemsCount={TOTAL_COUNT}
                onChange={this.handlePageChange}
              />
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <a href='#hide-disabled'>
              <h4 id='hide-disabled' className="panel-title">Hide disabled</h4>
            </a>
          </div>
          <div className="panel-body">
            <SyntaxHighlighter language='javascript' style={sunburst}>{hideDisabled}</SyntaxHighlighter>
            <div className='text-center'>
              <Pagination
                hideDisabled
                activePage={this.state.activePage}
                itemsCountPerPage={PER_PAGE}
                totalItemsCount={TOTAL_COUNT}
                onChange={this.handlePageChange}
              />
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <a href='#custom-range'>
              <h4 id='custom-range'>Custom pages range:</h4>
            </a>
          </div>
          <div className="panel-body">
            <SyntaxHighlighter language='javascript' style={sunburst}>{customRange}</SyntaxHighlighter>
            <div className='text-center'>
              <Pagination
                pageRangeDisplayed={10}
                activePage={this.state.activePage}
                itemsCountPerPage={PER_PAGE}
                totalItemsCount={TOTAL_COUNT}
                onChange={this.handlePageChange}
              />
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <a href='#custom-navigation-text'>
              <h4 id='custom-navigation-text'>Custom navigation texts:</h4>
            </a>
          </div>
          <div className="panel-body">
            <SyntaxHighlighter language='javascript' style={sunburst}>{overrideText}</SyntaxHighlighter>
            <div className='text-center'>
              <Pagination
                prevPageText='prev'
                nextPageText='next'
                firstPageText='first'
                lastPageText='last'
                activePage={this.state.activePage}
                itemsCountPerPage={PER_PAGE}
                totalItemsCount={TOTAL_COUNT}
                onChange={this.handlePageChange}
              />
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <a href='#custom-navigation-elements'>
              <h4 id='custom-navigation-elements'>Custom navigation elements:</h4>
            </a>
          </div>
          <div className="panel-body">
            <SyntaxHighlighter language='javascript' style={sunburst}>{overrideElement}</SyntaxHighlighter>
            <div className='text-center'>
              <Pagination
                firstPageText={<i className='glyphicon glyphicon-chevron-left'/>}
                lastPageText={<i className='glyphicon glyphicon-chevron-right'/>}
                prevPageText={<i className='glyphicon glyphicon-menu-left'/>}
                nextPageText={<i className='glyphicon glyphicon-menu-right'/>}
                activePage={this.state.activePage}
                itemsCountPerPage={PER_PAGE}
                totalItemsCount={TOTAL_COUNT}
                onChange={this.handlePageChange}
              />
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <a href='#nav-arrows'>
              <h4 id='nav-arrows'>Hide navigation arrows</h4>
            </a>
          </div>
          <div className="panel-body">
            <SyntaxHighlighter language='javascript' style={sunburst}>{hideNavigation}</SyntaxHighlighter>
            <div className='text-center'>
              <Pagination
                  hideNavigation
                  pageRangeDisplayed={10}
                  activePage={this.state.activePage}
                  itemsCountPerPage={PER_PAGE}
                  totalItemsCount={TOTAL_COUNT}
                  onChange={this.handlePageChange}
              />
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <div className="panel-heading">
            <a href='#hide-first-last-pages'>
              <h4 id='nav-arrows'>Hide first/last pages</h4>
            </a>
          </div>
          <div className="panel-body">
            <SyntaxHighlighter language='javascript' style={sunburst}>{hideFirstLastPages}</SyntaxHighlighter>
            <div className='text-center'>
              <Pagination
                hideFirstLastPages
                pageRangeDisplayed={10}
                activePage={this.state.activePage}
                itemsCountPerPage={PER_PAGE}
                totalItemsCount={TOTAL_COUNT}
                onChange={this.handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
