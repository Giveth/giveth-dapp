import React from 'react';

function MilestoneCreateOptionsMenu() {
  // Fix relative path of the options menu
  const currentUrl = window.location.href;
  function CreateOptionsUrl(url) {
    if (currentUrl[currentUrl.length - 1] === '/') {
      return currentUrl + url;
    }
    return `${currentUrl}/${url}`;
  }

  return (
    <div id="campaign-create-new-view">
      <div className="link-card-container">
        <a className="link-card" href={CreateOptionsUrl('milestone')}>
          <img
            className="link-card-logo"
            src={`${process.env.PUBLIC_URL}/img/milestone.png`}
            alt="milestone-logo"
          />
          <h2 className="link-card-title ">Milestone</h2>
          <p className="link-card-desc">
            Your Campaign will get rewarded after accomplishing this task.
          </p>
          <img
            className="link-card-arrow"
            src={`${process.env.PUBLIC_URL}/img/right-arrow.svg`}
            alt="milestone-logo"
          />
        </a>
        <a className="link-card" href={CreateOptionsUrl('bounty')}>
          <img
            className="link-card-logo"
            src={`${process.env.PUBLIC_URL}/img/bounty.png`}
            alt="bounty-logo"
          />
          <h2 className="link-card-title ">Bounty</h2>
          <p className="link-card-desc">
            Reward offered by an organization for a specific task done
          </p>
          <img
            className="link-card-arrow"
            src={`${process.env.PUBLIC_URL}/img/right-arrow.svg`}
            alt="milestone-logo"
          />
        </a>
        <a className="link-card" href={CreateOptionsUrl('expense')}>
          <img
            className="link-card-logo"
            src={`${process.env.PUBLIC_URL}/img/expense.png`}
            alt="expense-logo"
          />
          <h2 className="link-card-title ">Expense</h2>
          <p className="link-card-desc">Submit receipts for your expenses.</p>
          <img
            className="link-card-arrow"
            src={`${process.env.PUBLIC_URL}/img/right-arrow.svg`}
            alt="milestone-logo"
          />
        </a>
        <a className="link-card" href={CreateOptionsUrl('payment')}>
          <img
            className="link-card-logo"
            src={`${process.env.PUBLIC_URL}/img/payment.png`}
            alt="payment-logo"
          />
          <h2 className="link-card-title ">Payment</h2>
          <p className="link-card-desc">
            Create a payment request, can be used for contract work, salaries or bounties.
          </p>
          <img
            className="link-card-arrow"
            src={`${process.env.PUBLIC_URL}/img/right-arrow.svg`}
            alt="milestone-logo"
          />
        </a>
      </div>
    </div>
  );
}

export default MilestoneCreateOptionsMenu;
