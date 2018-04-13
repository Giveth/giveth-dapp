import React from 'react';

// /* global window */

export default (shortDescription, error) => {
  const errorHandler = () => {
    // const body = `
    //   Description of the Error:
    //   ${shortDescription}
    //
    //   Error name:
    //   ${error.message}
    //
    //   Error lineNumber:
    //   ${error.lineNumber}
    //
    //   Error fileName:
    //   ${error.fileName}
    //
    //   Error stack:
    //   ${error.stack}
    // `;
    // const name = '';
    // window.open(`mailto:${name}@giveth.io?subject='Error in DApp'&body=${body}`);
  };

  if (error && error instanceof Error) {
    React.swal({
      title: 'Oh no!',
      content: shortDescription,
      icon: 'error',
      buttons: ['OK', 'Send email to Developers'],
    }).then(value => {
      if (value) {
        errorHandler();
      }
    });
  } else {
    React.swal({
      title: 'Oh no!',
      content: shortDescription,
      icon: 'error',
    });
  }
};
