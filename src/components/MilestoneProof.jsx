/* eslint react/no-did-mount-set-state: 0 */

import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';

import MilestoneItem from './MilestoneItem';
import AddMilestoneItem from './AddMilestoneItem';
import AddMilestoneItemModal from './AddMilestoneItemModal';

BigNumber.config({ DECIMAL_PLACES: 18 });

class MilestoneProof extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items: props.items,
      addMilestoneItemModalVisible: false,
    };
  }

  componentDidMount() {
    this.setState({ items: this.props.items });
  }

  onAddItem(item) {
    this.addItem(item);
    this.setState({ addMilestoneItemModalVisible: false });
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

  toggleAddMilestoneItemModal() {
    this.setState(prevState => ({
      addMilestoneItemModalVisible: !prevState.addMilestoneItemModalVisible,
    }));
  }

  render() {
    const { items, addMilestoneItemModalVisible } = this.state;
    const { isEditMode, token, milestoneStatus } = this.props;

    const canEdit = isEditMode || ['Proposed', 'Pending'].includes(milestoneStatus);

    return (
      <div>
        <div className="form-group row dashboard-table-view">
          <div className="col-12">
            <div className="card milestone-items-card">
              <div className="card-body">
                {items.length > 0 && (
                  <div className="table-container">
                    <table className="table table-responsive table-striped table-hover">
                      <thead>
                        <tr>
                          <th className="td-item-date">Date</th>
                          <th className="td-item-description">Description</th>
                          <th className="td-item-amount-fiat">Amount Fiat</th>
                          <th className="td-item-fiat-amount">Amount {token.name}</th>
                          <th className="td-item-file-upload">Attached proof</th>
                          {canEdit && <th className="td-item-action" />}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <MilestoneItem
                            name={`milestoneItem-${i}`}
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

                {items.length > 0 &&
                  canEdit && (
                    <AddMilestoneItem onClick={() => this.toggleAddMilestoneItemModal()} />
                  )}

                {items.length === 0 &&
                  canEdit && (
                    <div className="text-center">
                      <p>Attach an expense, invoice or anything else that requires payment.</p>
                      <AddMilestoneItem onClick={() => this.toggleAddMilestoneItemModal()} />
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        <AddMilestoneItemModal
          openModal={addMilestoneItemModalVisible}
          onClose={() => this.toggleAddMilestoneItemModal()}
          onAddItem={item => this.onAddItem(item)}
          token={token}
        />
      </div>
    );
  }
}

MilestoneProof.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  onItemsChanged: PropTypes.func,
  isEditMode: PropTypes.bool.isRequired,
  milestoneStatus: PropTypes.string,
  token: PropTypes.shape().isRequired,
};

MilestoneProof.defaultProps = {
  onItemsChanged: () => {},
  milestoneStatus: '',
};

export default MilestoneProof;
