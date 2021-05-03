const AmountSliderMarks = (maxAmount, decimals) => {
  const _decimals = Number(decimals);
  const sliderMarks = {};
  sliderMarks[0] = {
    style: {
      color: '#f50',
    },
    label: '0%',
  };
  sliderMarks[Number((maxAmount / 4).toFixed(_decimals))] = '25%';
  sliderMarks[Number((maxAmount / 2).toFixed(_decimals))] = '50%';
  sliderMarks[Number(((3 * maxAmount) / 4).toFixed(_decimals))] = '75%';
  sliderMarks[Number(maxAmount.toFixed(_decimals))] = 'Max';
  return sliderMarks;
};

export default AmountSliderMarks;
