import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';
import gasLogo from '../../assets/gas-paid-logo.svg';

const userEntityName = 'YOU';
const tweetUrl = 'https://beta.giveth.io';
const tweetHashtags = 'blockchain4good';

const TotalGasPaid = ({ gasPaidUsdValue, entity, className }) => {
  const tweetMessage =
    'Giveth pays the gas fees for withdrawing funds via Giveth TRACE so' +
    ` the users don't have to. To date, Giveth has covered ${gasPaidUsdValue} USD for me alone! Try it out for yourself:`;
  return (
    <Row className={className || ''} id="TotalGasPaidView">
      <Col className="text-left my-auto" style={{ width: '34px' }}>
        <img src={gasLogo} alt="gas logo" />
      </Col>
      <Col className="col px-0 my-auto">
        <Row>
          <Col>
            <div className="pr-2">{`TOTAL GAS WE PAID FOR ${entity}`}</div>
          </Col>
          <Col>
            <div className="font-weight-bold">{`${gasPaidUsdValue} USD`}</div>
          </Col>
        </Row>
      </Col>
      {entity !== userEntityName && (
        <Col className="px-0 my-auto ml-4">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://twitter.com/intent/tweet?text=${tweetMessage}&url=${tweetUrl}&hashtags=${tweetHashtags}`}
          >
            Tweet this
          </a>
        </Col>
      )}
    </Row>
  );
};

TotalGasPaid.propTypes = {
  // it was getting warning wo I changed it from number to string
  gasPaidUsdValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  entity: PropTypes.string,
  className: PropTypes.string,
};

TotalGasPaid.defaultProps = {
  entity: userEntityName,
  className: undefined,
};

export default TotalGasPaid;
