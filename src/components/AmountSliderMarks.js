const AmountSliderMarks = (maxAmount, decimals) => {
  const sliderMarks = {};
  sliderMarks[0] = {
    style: {
      color: '#f50',
    },
    label: '0%',
  };
  sliderMarks[Number((maxAmount / 4).toFixed(decimals))] = '25%';
  sliderMarks[Number((maxAmount / 2).toFixed(decimals))] = '50%';
  sliderMarks[Number(((3 * maxAmount) / 4).toFixed(decimals))] = '75%';
  sliderMarks[Number(maxAmount.toFixed(decimals))] = 'Max';
  return sliderMarks;
};

export default AmountSliderMarks;
