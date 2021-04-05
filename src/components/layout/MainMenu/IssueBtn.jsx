import React from 'react';

const IssueBtn = () => {
  return (
    <a
      className="mx-auto order-3 order-lg-2 main-menu"
      href="https://www.github.com/Giveth/giveth-dapp/issues/new"
    >
      <div className="btn btn-dark btn-sm btn-report-issue">
        <i className="fa fa-github" />
        Report Issue
      </div>
    </a>
  );
};

export default IssueBtn;

IssueBtn.propTypes = {};

IssueBtn.defaultProps = {};
