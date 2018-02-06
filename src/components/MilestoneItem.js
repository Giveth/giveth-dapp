import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { getTruncatedText } from './../lib/helpers';

class MilestoneItem extends Component {
  render(){
    const { removeItem, item } = this.props;

    return(
      <tr>
        <td className="td-item-date">
          {moment(item.date).format("Do MMM YYYY - HH:MMa(Z)")}
        </td>


        <td className="td-item-description">
          {getTruncatedText(item.description)}
        </td>

        <td className="td-item-amount-fiat">
          {item.selectedFiatType}{item.fiatAmount}
        </td>           

        <td className="td-item-amount-ether"> 
          {item.etherAmount}     
        </td> 

        <td className="td-item-file-upload"> 
          {item.image &&     
            <div id="image-preview">
              <img src={item.image} alt="Preview of uploaded file" />
            </div>
          }
        </td> 

        <td className="td-item-remove">
          <button className="btn btn-link" onClick={removeItem}>
            X
          </button>
        </td>         
      </tr>
    )
  }
}

export default MilestoneItem;