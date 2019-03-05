import React from 'react';

export default (type, title, successCallback) => {
  let dialogTitle;
  let dialogText;
  const sweetContent = document.createElement('div');
  sweetContent.style.display = 'flex';
  sweetContent.style['flex-direction'] = 'column';
  if (type === 'milestone') {
    dialogTitle = 'Delete Milestone?';
    dialogText = `Are you sure you want to delete this Milestone?
          Please enter the first 5 characters of the Milestone title while skipping any spaces:
    `;
  } else if (type === 'refund') {
    dialogTitle = 'Refund Donation?';
    dialogText = `Are you sure you want to refund your donation?
          Your donation will be cancelled and a payment will be authorized to refund your tokens. All withdrawals must be confirmed for security reasons and may take a day or two. Upon confirmation, your tokens will be transferred to your wallet. Please enter the first 5 letters of the Campaign/Community.
    `;
  } else if (type === 'campaign') {
    dialogTitle = 'Cancel Campaign?';
    dialogText = `Are you sure you want to cancel this Campaign?
          Please enter the first 5 characters of the Campaign title while skipping any spaces:
    `;
  }
  sweetContent.innerHTML = `
    <b style="margin-bottom: 10px">${title}</b>
    <input type="text" placeholder="First five characters of the above title" class="confirmation-input" style="width: 100%" />`;
  React.swal({
    title: dialogTitle,
    text: dialogText,
    icon: 'warning',
    content: {
      element: sweetContent,
    },
    dangerMode: true,
    buttons: {
      cancel: {
        text: 'Dismiss',
        value: null,
        visible: true,
      },
      confirm: {
        text: 'Yes, Cancel',
        visible: true,
        value: true,
        className: 'confirm-cancel-button',
        closeModal: true,
      },
    },
  })
    .then(isConfirmed => {
      const inputValue = document.querySelector('.confirmation-input').value;
      const formattedTitle = title
        .split(' ')
        .join('')
        .slice(0, 5);
      if (isConfirmed !== null) {
        if (inputValue === formattedTitle) {
          successCallback();
        } else {
          React.swal('Failed!', 'Incorrect name.', 'warning');
        }
      }
    })
    .catch(err => {
      if (err === 'noBalance') {
        // handle no balance error
      }
    });
};
