import React from 'react';
import { Button, Modal } from 'antd';
import config from '../configuration';
// /* global window */

export default (shortDescription, error) => {
  if (!config.sendErrors) {
    console.error(shortDescription, error); // eslint-disable-line no-console
    return;
  }

  let modal;

  const errorHandler = value => {
    if (value === 'destroy') modal.destroy();
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
    modal = Modal.error({
      title: 'Oh no!',
      content: (
        <div>
          <p>{shortDescription}</p>
          <p>Is this a recurring problem? Click Report.</p>
          <br />
          <div>
            <Button className="ant-btn-donate ant-btn-lg" onClick={() => errorHandler('destroy')}>
              Close
            </Button>
            <Button
              type="primary"
              className="mx-2 ant-btn-lg"
              onClick={() => errorHandler('email')}
            >
              Report
            </Button>
            <Button type="primary" className="ant-btn-lg" onClick={() => errorHandler('github')}>
              Report Issue
            </Button>
          </div>
        </div>
      ),
      centered: true,
      width: 500,
      className: 'antModalNoBtn',
    });
  }
};
