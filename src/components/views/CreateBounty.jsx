import React, { useState } from 'react';
import { Button, Col, Form, Input, PageHeader, Row, Select } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import useCampaign from '../../hooks/useCampaign';
import {
  MilestoneDescription,
  MilestoneDonateToDac,
  MilestonePicture,
  MilestoneReviewer,
  MilestoneTitle,
} from '../EditMilestoneCommons';

function CreateBounty(props) {
  const currencies = [
    'ETH',
    'DAI',
    'PAN',
    'BTC',
    'USDC',
    'USD',
    'AUD',
    'BRL',
    'CAD',
    'CHF',
    'CZK',
    'EUR',
    'GBP',
    'MXN',
    'THB',
  ];
  const campaign = useCampaign(props.match.params.id);
  const [bounty, setBounty] = useState({
    title: '',
    description: '',
    picture: '',
    donateToDac: true,
    hasReviewer: true,
    reviewer: '',
    amount: '',
    currency: '',
  });

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setBounty({ ...bounty, [name]: checked });
    } else {
      setBounty({ ...bounty, [name]: value });
    }
  };

  function toggleHasReviewer(checked) {
    handleInputChange({ target: { name: 'hasReviewer', value: checked } });
  }

  function handleSelectReviewer(_, option) {
    handleInputChange({ target: { name: 'reviewer', value: option.value } });
  }

  function handleSelectCurrency(_, option) {
    handleInputChange({ target: { name: 'currency', value: option.value } });
  }

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
  }

  function goBack() {
    props.history.goBack();
  }

  return (
    <div id="create-bounty-view">
      <Row>
        <Col span={24}>
          <PageHeader
            className="site-page-header my-test"
            onBack={goBack}
            title="Create New Bounty"
            ghost={false}
          />
        </Col>
      </Row>
      <Row>
        <div className="card-form-container">
          <Form className="card-form">
            <div className="card-form-header">
              <img src={`${process.env.PUBLIC_URL}/img/bounty.png`} alt="bounty-logo" />
              <div className="title">Bounty</div>
            </div>
            <div className="campaign-info">
              <div className="lable">Campaign</div>
              <div className="content">{campaign && campaign.title}</div>
            </div>
            <div className="section">
              <div className="title">Bounty details</div>
              <MilestoneTitle
                value={bounty.title}
                onChange={handleInputChange}
                extra="What is this Bounty about?"
              />
              <MilestoneDescription
                value={bounty.description}
                onChange={handleInputChange}
                extra="Explain the requirements and what success looks like."
                placeholder="Describe the Bounty and define the acceptance criteria..."
              />

              <MilestonePicture
                setPicture={setPicture}
                milestoneTitle={bounty.title}
                picture={bounty.picture}
              />

              <MilestoneDonateToDac value={bounty.donateToDac} onChange={handleInputChange} />

              <MilestoneReviewer
                toggleHasReviewer={toggleHasReviewer}
                setReviewer={handleSelectReviewer}
                hasReviewer={bounty.hasReviewer}
                milestoneReviewerAddress={bounty.reviewer}
              />
            </div>

            <div className="section">
              <div className="title">Bounty reward</div>
              <Row gutter={16}>
                <Col className="gutter-row" span={10}>
                  <Form.Item name="amount" label="Amount" className="custom-form-item">
                    <Input
                      value={bounty.amount}
                      name="amount"
                      type="number"
                      placeholder="Enter Amount"
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Item>
                </Col>
                <Col className="gutter-row" span={10}>
                  <Form.Item
                    name="currency"
                    label="Currency"
                    className="custom-form-item"
                    extra="Select the currency of this bounty."
                  >
                    <Select
                      showSearch
                      placeholder="Select a Currency"
                      optionFilterProp="children"
                      name="currency"
                      onSelect={handleSelectCurrency}
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      value={bounty.currency}
                      required
                    >
                      {currencies.map(cur => (
                        <Select.Option key={cur} value={cur}>
                          {cur}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="submit-button">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Row>
    </div>
  );
}

CreateBounty.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default CreateBounty;
