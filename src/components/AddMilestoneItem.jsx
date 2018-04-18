import React, { Component } from 'react';
import PropTypes from 'prop-types';


class AddMilestoneItem extends Component {

  render() {
    const { onClick } = this.props;
    return (
      <div className="add-milestone-item">
        <button
          type="button"
          className="btn btn-primary btn-sm btn-add-milestone-item"
          onClick={onClick}
        >
          Add item
        </button>

      </div>
    );
  }
}

AddMilestoneItem.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default AddMilestoneItem;
