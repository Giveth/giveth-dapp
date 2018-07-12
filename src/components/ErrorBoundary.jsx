import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error,
      errorInfo,
    });
    // You can also log error messages to an error reporting service here
  }

  render() {
    if (this.state.errorInfo) {
      // Error path
      return (
        <div style={{ padding: '20px' }}>
          <h2>There has been an error in the DApp.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <h3>Error message:</h3>
            <p>{this.state.error.message}</p>
            <h3>Component stack:</h3>
            <p>{this.state.errorInfo.componentStack}</p>
            <h3>Error lineNumber:</h3>
            <p>{this.state.error.lineNumber}</p>
            <h3>Error fileName:</h3>
            <p>{this.state.error.fileName}</p>
            <h3>Error stack:</h3>
            <p>{this.state.error.stack}</p>
          </details>
        </div>
      );
    }
    // Normally, just render children
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
