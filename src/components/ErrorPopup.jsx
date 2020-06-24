import React from 'react';
import config from '../configuration';
// /* global window */

export default (shortDescription, error) => {
  if (!config.sendErrors) {
    console.error(shortDescription, error); // eslint-disable-line no-console
    return;
  }

  const errorHandler = value => {
    let body;
    if (error instanceof Error) {
      if (value !== 'github') {
        body = `
        Description of the Error:
        ${shortDescription}

        Error name:
        ${error.message}

        Error lineNumber:
        ${error.lineNumber}

        Error fileName:
        ${error.fileName}

        Error stack:
        ${error.stack}
       `;
      } else {
        // language=GitHub Markdown
        body =
          `Issue type: **Error**\n${shortDescription}\n\n` +
          `**Name:**\n${error.message}\n\n` +
          `**LineNumber:**\n${error.lineNumber}\n\n` +
          `**FileName:**\n${error.fileName}\n` +
          `<details><summary>Stack</summary>\n\n${JSON.stringify(
            error.stack,
            null,
            2,
          )}\n</details>`;
      }
    } else if (value !== 'github') {
      body = `
      Description of the Error:
      ${shortDescription}

      Transaction link:
      ${JSON.stringify(error, null, 2)}
      `;
    } else {
      body = `Issue type: **Error**\n${shortDescription}\n\n**TransactionLink:**\n${JSON.stringify(
        error,
        null,
        2,
      )}`;
    }

    if (value === 'email') {
      window.open(
        `mailto:${config.bugsEmail}?subject=Error in DApp&body=${encodeURIComponent(body)}`,
      );
    } else if (value === 'github') {
      window.open(`${config.githubUrl}/issues/new?body=${encodeURIComponent(body)}`);
    }
  };

  if (error) {
    React.swal({
      title: 'Oh no!',
      content: React.swal.msg(
        <div>
          <p>{shortDescription}</p>
          <p>Is this a recurring problem? Click Report.</p>
        </div>,
      ),
      icon: 'error',
      buttons: {
        ok: {
          text: 'Close',
          value: null,
          visible: true,
          className: 'bg-success',
          closeModal: true,
        },
        email: {
          text: 'Report',
          value: 'email',
          visible: true,
          closeModal: true,
        },
        github: {
          text: 'Report Issue',
          value: 'github',
          visible: true,
          closeModal: true,
        },
      },
      className: 'swal-wide',
    }).then(value => {
      if (value) {
        errorHandler(value);
      }
    });
  } else {
    React.swal({
      title: 'Oh no!',
      content: React.swal.msg(<p>{shortDescription}</p>),
      icon: 'error',
    });
  }
};
