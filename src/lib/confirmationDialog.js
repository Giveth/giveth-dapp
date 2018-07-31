import React from 'react';

export default (type, title, successCallback) => {
  const sweetContent = document.createElement('div');
  sweetContent.style.display = 'flex';
  sweetContent.style['flex-direction'] = 'column';
  sweetContent.innerHTML = `
    <b style="margin-bottom: 10px">${title}</b>
    <input type="text" placeholder="Campaign name (without spaces)" class="confirmation-input" style="width: 100%" />`;
  React.swal({
    title: `Cancel ${type}?`,
    text: `Are you sure you want to cancel this ${type}?
          Please enter the first 5 characters of the ${type} title while skipping any spaces:
    `,
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
