import moment from 'moment';

/**
 * The Basic model containing helper functions
 */
class Model {
  /**
   * Checks that type of passed value is one of types
   *
   * @param value    Value which type is to be tested
   * @param types    Array containing allowed PropTypes
   * @param propName Name of the property that is being inspected
   *
   * @throws TypeError describing what was the passed type and which types were expected
   */
  checkType(value, types, propName) {
    // console.log(value, types, propName, typeof value)
    if (!types.includes(typeof value)) {
      throw new TypeError(
        `The type of ${propName} supplied to ${
          this.constructor.name
        } is: ${typeof value}. Expected one of: ${types.join(', ')}.`,
      );
    }
  }

  /**
   * Checks passed value is one of approved values
   *
   * @param value    Value which type is to be tested
   * @param values   Array containing allowed values
   * @param propName Name of the property that is being inspected
   *
   * @throws Error describing what was the passed value and which values were expected
   */
  checkValue(value, values, propName) {
    // console.log(value, values, propName)
    if (!values.includes(value)) {
      throw new Error(
        `The value of ${propName} supplied to ${
          this.constructor.name
        } is: ${value}. Expected one of: ${values.join(', ')}.`,
      );
    }
  }

  /**
   * Checks that type of passed value is of a specific class instance
   *
   * @param value            Value which is to be tested
   * @param classInstance    Class to be tested
   * @param propName         Name of the property that is being inspected
   *
   * @throws TypeError describing what was the passed type and which types were expected
   */
  checkInstanceOf(value, classInstance, propName) {
    if (!(value instanceof classInstance)) {
      throw new TypeError(
        `The type of ${propName} supplied to ${
          this.constructor.name
        } is: ${typeof value}. Expected ${classInstance.constructor.name}`,
      );
    }
  }

  /**
   * Checks that type of passed value is as moment
   *
   * @param value            Value which is to be tested
   *
   * @throws TypeError describing what was the passed type and which types were expected
   */
  checkIsMoment(value, propName) {
    if (!moment.isMoment(value)) {
      throw new TypeError(
        `The type of ${propName} supplied to ${
          this.constructor.name
        } is: ${typeof value}. Expected a moment`,
      );
    }
  }
}

export default Model;
