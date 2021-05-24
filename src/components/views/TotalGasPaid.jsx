import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';
import gasLogo from '../../assets/gas-paid-logo.svg';

const TotalGasPaid = ({ gasPaidUsdValue, entity, className }) => {
  return (
    <Row className={className || ''} id="TotalGasPaidView">
      <Col className="text-left" style={{ width: '34px', margin: 'auto 0' }}>
        <img src={gasLogo} alt="gas logo" />
      </Col>
      <Col className="col px-0" style={{ margin: 'auto 0' }}>
        <Row>
          <Col>
            <div className="pr-2">{`TOTAL GAS WE PAID FOR ${entity}`}</div>
          </Col>
          <Col>
            <div className="font-weight-bold">{`${gasPaidUsdValue} USD`}</div>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

TotalGasPaid.propTypes = {
  // it was getting warning wo I changed it from number to string
  gasPaidUsdValue: PropTypes.string.isRequired,
  entity: PropTypes.string,
  className: PropTypes.string,
};

TotalGasPaid.defaultProps = {
  entity: 'YOU',
  className: undefined,
};

export default TotalGasPaid;
