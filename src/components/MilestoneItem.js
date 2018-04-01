import React from 'react';
import createReactClass from 'create-react-class';
import Formsy from 'formsy-react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { getTruncatedText } from './../lib/helpers';

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

const MilestoneItem = createReactClass({
  mixins: [Formsy.Mixin],

  componentDidMount() {
    this.setValue(true); // required for validation being true
  },

  render() {
    const { removeItem, item, isEditMode } = this.props;

    return (
      <tr>
        <td className="td-item-date">{moment.utc(item.date).format('Do MMM YYYY')}</td>

        <td className="td-item-description">{getTruncatedText(item.description)}</td>

        <td className="td-item-amount-fiat">
          {item.selectedFiatType} {item.fiatAmount}
          <br />
          <span className="help-block">
            {`1 ETH = ${item.conversionRate} ${item.selectedFiatType}`}
          </span>
        </td>

        <td className="td-item-amount-ether">{item.etherAmount}</td>

        <td className="td-item-file-upload">
          {item.image &&
            isEditMode && (
              <div className="image-preview">
                <img src={item.image} alt="Preview of uploaded file" />
              </div>
            )}

          {item.image &&
            !isEditMode && (
              <div className="image-preview">
                <a href={item.image} target="_blank" rel="noopener noreferrer">
                  <img src={item.image} alt="View uploaded file" />
                </a>
              </div>
            )}
        </td>

        {isEditMode && (
          <td className="td-item-remove">
            <button className="btn btn-link" onClick={removeItem}>
              X
            </button>
          </td>
        )}
      </tr>
    );
  },
});

export default MilestoneItem;
