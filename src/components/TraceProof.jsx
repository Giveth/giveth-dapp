/* eslint react/no-did-mount-set-state: 0 */

import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';

import TraceItem from './TraceItem';
import AddTraceItem from './AddTraceItem';
import AddTraceItemModal from './AddTraceItemModal';

BigNumber.config({ DECIMAL_PLACES: 18 });

class TraceProof extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items: props.refreshList,
      addTraceItemModalVisible: false,
    };
  }

  onAddItem(item) {
    this.addItem(item);
    this.setState({ addTraceItemModalVisible: false });
  }

  addItem(item) {
    this.setState(
      prevState => ({ items: prevState.items.concat(item) }),
      () => this.props.onItemsChanged(this.state.items),
    );
  }

  removeItem(index) {
    const { items } = this.state;
    delete items[index];
    this.setState({ items: items.filter(() => true) }, () =>
      this.props.onItemsChanged(this.state.items),
    );
  }

  toggleAddTraceItemModal() {
    this.setState(prevState => ({
      addTraceItemModalVisible: !prevState.addTraceItemModalVisible,
    }));
  }

  render() {
    const { items, addTraceItemModalVisible } = this.state;
    const { isEditMode, token, traceStatus } = this.props;

    const canEdit = isEditMode && ['Proposed', 'Pending'].includes(traceStatus);

    return (
      <div>
        <div className="form-group row dashboard-table-view">
          <div className="col-12">
            <div className="card trace-items-card">
              <div className="card-body">
                {items.length > 0 && (
                  <div className="table-container">
                    <table className="table table-responsive table-striped table-hover">
                      <thead>
                        <tr>
                          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                          {canEdit && <th className="td-item-action" />}
                          <th className="td-item-date">Date</th>
                          <th className="td-item-description">Description</th>
                          <th className="td-item-amount-fiat">Amount Fiat</th>
                          <th className="td-item-fiat-amount">Amount {token.name}</th>
                          <th className="td-item-file-upload">Attached proof</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <TraceItem
                            name={`traceItem-${i}`}
                            key={`traceItem-${item._id || uuidv4()}`}
                            index={i}
                            item={item}
                            removeItem={() => this.removeItem(i)}
                            isEditMode={canEdit}
                            token={token}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {items.length > 0 && canEdit && (
                  <AddTraceItem onClick={() => this.toggleAddTraceItemModal()} />
                )}

                {items.length === 0 && canEdit && (
                  <div className="text-center">
                    <p>Attach an expense, invoice or anything else that requires payment.</p>
                    <AddTraceItem onClick={() => this.toggleAddTraceItemModal()} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <AddTraceItemModal
          openModal={addTraceItemModalVisible}
          onClose={() => this.toggleAddTraceItemModal()}
          onAddItem={item => this.onAddItem(item)}
          token={token}
        />
      </div>
    );
  }
}

TraceProof.propTypes = {
  onItemsChanged: PropTypes.func,
  refreshList: PropTypes.arrayOf(PropTypes.object),
  isEditMode: PropTypes.bool.isRequired,
  traceStatus: PropTypes.string.isRequired,
  token: PropTypes.shape().isRequired,
};

TraceProof.defaultProps = {
  onItemsChanged: () => {},
  refreshList: [],
};

export default TraceProof;
