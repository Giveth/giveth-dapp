import React from 'react';
import PropTypes from 'prop-types';

function AddMilestoneItem(props) {
  const { onClick } = props;
  return (
    <div className="add-milestone-item">
      <button
        type="button"
        className="btn btn-primary btn-sm btn-add-milestone-item"
        onClick={onClick}
      >
        Add Line Item
      </button>
    </div>
  );
}

AddMilestoneItem.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default AddMilestoneItem;
