import React, { Fragment } from 'react';
import { Modal, Input } from 'antd';

export default (type, title, successCallback) => {
  let dialogTitle;
  let dialogText;

  let input = '';

  const onInputChange = userInput => {
    input = userInput.target.value;
  };

  if (type === 'trace') {
    dialogTitle = 'Delete Trace?';
    dialogText = `Are you sure you want to delete this Trace?
          Please enter the first 5 characters (without space) of the Trace title while skipping any spaces:
    `;
  } else if (type === 'refund') {
    dialogTitle = 'Refund Donation?';
    dialogText = `Are you sure you want to refund your donation?
          Your donation will be cancelled and a payment will be authorized to refund your tokens. All withdrawals must be confirmed for security reasons and may take a day or two. Upon confirmation, your tokens will be transferred to your wallet. Please enter the first 5 letters (without space) of the Campaign/Community.
    `;
  } else if (type === 'campaign') {
    dialogTitle = 'Cancel Campaign?';
    dialogText = `Are you sure you want to cancel this Campaign?
          Please enter the first 5 characters (without space) of the Campaign title while skipping any spaces:
    `;
  }

  Modal.confirm({
    title: <h5>{dialogTitle}</h5>,
    content: (
      <Fragment>
        <p>{dialogText}</p>
        <div className="d-flex flex-column text-center">
          <p className="mb-3 font-weight-bold">{title}</p>
          <Input
            placeholder="First five characters (without space) of the above title"
            className="confirmation-input w-100 rounded"
            onChange={onInputChange}
          />
        </div>
      </Fragment>
    ),
    cancelText: 'Dismiss',
    okText: 'Yes, Delete',
    centered: true,
    width: 500,
    onOk: () => {
      const formattedTitle = title
        .split(' ')
        .join('')
        .slice(0, 5);
      if (input === formattedTitle) {
        successCallback();
      } else {
        Modal.error({
          centered: true,
          title: 'Failed!',
          content: 'Incorrect name.',
        });
      }
    },
  });
};
