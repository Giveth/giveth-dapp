import React from 'react';
import PropTypes from 'prop-types';

function AddTraceItem(props) {
  const { onClick } = props;
  return (
    <div className="add-trace-item">
      <button type="button" className="btn btn-primary btn-sm btn-add-trace-item" onClick={onClick}>
        Add Line Item
      </button>
    </div>
  );
}

AddTraceItem.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default AddTraceItem;
