import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return {
      error: error.message,
    };
  }

  componentDidCatch(_error: Error, _errorInfo: any) {
    // console.error('Something bad happened!', error, errorInfo);
  }

  render() {
    if (this.state.error != null) {
      return (
        <div>
          <h1>Something went wrong :(</h1>
          <p>{this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
