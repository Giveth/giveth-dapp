import { withFormsy } from 'formsy-react';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { convertEthHelper, getTruncatedText } from 'lib/helpers';
import Item from 'models/MilestoneItem';

/** *
 * NOTE: This component is created as a Formsy form component
 * That way we can perform validation on editing milestones
 * based on milestone items being added
 *
 * This also means that this component needs to be wrapped in a
 * Formsy Form component or it won't mount
 *
 * See EditMilestone component
 ** */

class MilestoneItem extends React.Component {
  componentDidMount() {
    if (this.props.isEditMode) this.props.setValue(true); // required for validation being true
  }

  render() {
    const { removeItem, item, isEditMode, token } = this.props;
    return (
      <tr>
        <td className="td-item-date">{moment.utc(item.date).format('Do MMM YYYY')}</td>

        <td className="td-item-description">{getTruncatedText(item.description)}</td>

        <td className="td-item-amount-fiat">
          {item.selectedFiatType} {item.fiatAmount}
          <br />
          <span className="help-block">
            {`1 ${token.name} = ${item.conversionRate} ${item.selectedFiatType}`}
          </span>
        </td>

        <td className="td-item-amount-ether">{convertEthHelper(item.wei)}</td>

        <td className="td-item-file-upload">
          {item.image &&
            isEditMode && (
              <div className="image-preview small">
                <img src={item.image} alt="Preview of uploaded file" />
              </div>
            )}

          {item.image &&
            !isEditMode && (
              <div className="image-preview small">
                <a href={item.image} target="_blank" rel="noopener noreferrer">
                  <img src={item.image} alt="View uploaded file" />
                </a>
              </div>
            )}
        </td>

        {isEditMode && (
          <td className="td-item-remove">
            <button type="button" className="btn btn-link" onClick={removeItem}>
              X
            </button>
          </td>
        )}
      </tr>
    );
  }
}

MilestoneItem.propTypes = {
  setValue: PropTypes.func.isRequired,

  removeItem: PropTypes.func,
  item: PropTypes.instanceOf(Item).isRequired,
  isEditMode: PropTypes.bool,
  token: PropTypes.shape({}),
};

MilestoneItem.defaultProps = {
  isEditMode: false,
  removeItem: () => {},
  token: undefined,
};

export default withFormsy(MilestoneItem);
