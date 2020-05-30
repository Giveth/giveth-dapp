import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import Slider from 'react-rangeslider';
import { convertEthHelper } from '../lib/helpers';

const WAIT_INTERVAL = 10;

const getStepValue = (value, maxAmount, steps) => {
  const stepValue = new BigNumber(value)
    .times(steps)
    .div(maxAmount)
    .decimalPlaces(0, BigNumber.ROUND_DOWN)
    .toNumber();
  return stepValue;
};

const getMaxAmountLabel = (maxAmount, token) => {
  return maxAmount
    .decimalPlaces(Number(token.decimals), BigNumber.ROUND_DOWN)
    .precision(6, BigNumber.ROUND_DOWN)
    .toString();
};

class RangeSlider extends React.PureComponent {
  constructor(props) {
    super(props);

    const { maxAmount, value, steps, token } = this.props;
    const maxAmountLabel = getMaxAmountLabel(maxAmount, token);
    this.state = {
      stepValue: getStepValue(value, maxAmount, steps),
      internalAmount: value,
      storedMaxAmount: maxAmount,
      maxAmountLabel,
    };

    this.timer = null;
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { internalAmount, storedMaxAmount } = prevState;
    const { value, maxAmount, steps, token } = nextProps;
    if (!storedMaxAmount.eq(maxAmount) || internalAmount !== value) {
      const mutation = {
        internalAmount: value,
        stepValue: getStepValue(value, maxAmount, steps),
      };
      if (!storedMaxAmount.eq(maxAmount)) {
        mutation.maxAmountLabel = getMaxAmountLabel(maxAmount, token);
        mutation.storedMaxAmount = maxAmount;
      }
      return mutation;
    }
    return {};
  }

  render() {
    const { maxAmount, steps, token, onChange } = this.props;
    const { stepValue, maxAmountLabel } = this.state;

    // Slider is useless if max amount is zero!
    if (maxAmountLabel === '0') return null;

    return (
      <Slider
        type="range"
        name="amount"
        min={0}
        max={steps}
        step={1}
        value={stepValue}
        labels={{
          0: '0',
          [steps]: maxAmountLabel,
        }}
        tooltip={false}
        onChange={newValue => {
          this.setState({ stepValue: newValue });
          clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            const newAmount = convertEthHelper(
              maxAmount.times(newValue).div(steps),
              token.decimals,
            );
            onChange(newAmount);
            this.setState({
              internalAmount: newAmount,
            });
          }, WAIT_INTERVAL);
        }}
      />
    );
  }
}

RangeSlider.propTypes = {
  maxAmount: PropTypes.instanceOf(BigNumber).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  steps: PropTypes.number,
  token: PropTypes.instanceOf(Object).isRequired,
};

RangeSlider.defaultProps = {
  steps: 1000,
};
export default RangeSlider;
