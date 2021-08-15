import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { convertEthHelper } from 'lib/helpers';
import TraceItemModel from 'models/TraceItem';
import { utils } from 'web3';
import DescriptionRender from './DescriptionRender';

const TraceItem = ({ item, token }) => {
  return (
    <tr>
      <td className="td-item-date">{moment.utc(item.date).format('Do MMM YYYY')}</td>

      <td
        className="td-item-description"
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          minWidth: 150,
          marginBottom: 20,
        }}
      >
        {DescriptionRender(item.description)}
      </td>

      <td className="td-item-amount-fiat">
        {item.selectedFiatType} {item.fiatAmount.toFixed()}
        <br />
        <span className="help-block">
          {`1 ${token.name} = ${item.conversionRate} ${item.selectedFiatType}`}
        </span>
      </td>

      <td className="td-item-amount-ether">
        {convertEthHelper(utils.fromWei(item.wei), token.decimals)}
      </td>

      <td className="td-item-file-upload">
        {item.image && (
          <div className="image-preview small">
            <a href={item.image} target="_blank" rel="noopener noreferrer">
              <img src={item.image} alt="View uploaded file" style={{ height: 'initial' }} />
            </a>
          </div>
        )}
      </td>
    </tr>
  );
};

TraceItem.propTypes = {
  item: PropTypes.instanceOf(TraceItemModel).isRequired,
  token: PropTypes.shape().isRequired,
};

export default TraceItem;
