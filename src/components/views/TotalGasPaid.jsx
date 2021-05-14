import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';
import gasLogo from '../../assets/gas-paid-logo.png';

const TotalGasPaid = ({ gasPaidUsdValue, entity, className }) => {
  return (
    <Row className={className || ''} id="TotalGasPaidView">
      <Col className="text-left" style={{ width: '34px', margin: 'auto 0' }}>
        <img src={gasLogo} alt="gas logo" />
      </Col>
      <Col className="col px-0" style={{ margin: 'auto 0' }}>
        <Row>
          <Col>
            <span className="pr-2">{`TOTAL GAS WE PAID FOR ${entity}:`}</span>
          </Col>
          <Col>
            <span className="font-weight-bold">{`${gasPaidUsdValue} USD`}</span>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

TotalGasPaid.propTypes = {
  gasPaidUsdValue: PropTypes.number.isRequired,
  entity: PropTypes.string,
  className: PropTypes.string,
};

TotalGasPaid.defaultProps = {
  entity: 'YOU',
  className: undefined,
};

export default TotalGasPaid;
