import { getStartOfDayUTC } from 'lib/helpers';
import { fiatTypes } from 'contextProviders/EthConversionProvider';
import moment from 'moment';
import Model from './Model';

export default class MilestoneItemModel extends Model {
  constructor(data) {
    super(data);

    this._date = getStartOfDayUTC().subtract(1, 'd');
    this._description = data.description || '';
    this._image = data.image || '';
    this._selectedFiatType = data.fiatType || 'EUR';
    this._fiatAmount = data.fiatAmount || 0;
    this._wei = data.wei || '';
    this._conversionRate = data.conversionRate || parseFloat(0);
    this._ethConversionRateTimestamp = data.ethConversionRateTimestamp || new Date().toISOString();
  }

  get date() {
    return this._date;
  }

  set date(value) {
    if (moment(value).isAfter(moment(getStartOfDayUTC().subtract(1, 'd')))) {
      throw new TypeError(`Item date should be before today`);
    } else {
      this._date = value;
    }
  }

  get description() {
    return this._description;
  }

  set description(value) {
    this.checkType(value, ['string'], 'description');
    this._description = value;
  }

  set image(value) {
    this._image = value;
  }

  get image() {
    return this._image;
  }

  get selectedFiatType() {
    return this._selectedFiatType;
  }

  set selectedFiatType(value) {
    this.checkValue(value, fiatTypes.map(t => t.value), 'selectedFiatType');
    this._selectedFiatType = value;
  }

  get fiatAmount() {
    return this._fiatAmount;
  }

  set fiatAmount(value) {
    this.checkType(value, ['string'], 'fiatAmount');
    this._fiatAmount = value;
  }

  get wei() {
    return this._wei;
  }

  set wei(value) {
    this.checkType(value, ['string'], 'wei');
    this._wei = value;
  }

  get conversionRate() {
    return this._conversionRate;
  }

  set conversionRate(value) {
    this.checkType(value, ['number'], 'conversionRate');
    this._conversionRate = value;
  }

  get ethConversionRateTimestamp() {
    return this._ethConversionRateTimestamp;
  }

  set ethConversionRateTimestamp(value) {
    this.checkType(value, ['string'], 'ethConversionRateTimestamp');
    this._ethConversionRateTimestamp = value;
  }

  getItem() {
    return {
      date: this._date,
      description: this._description,
      image: this._image,
      selectedFiatType: this._selectedFiatType,
      fiatAmount: this._fiatAmount,
      wei: this._wei,
      conversionRate: this._conversionRate,
      ethConversionRateTimestamp: this._ethConversionRateTimestamp,
    };
  }
}
