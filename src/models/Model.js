
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
    if (!types.includes(typeof value)) {
      throw new TypeError(`The type of ${propName} supplied to ${this.constructor.name} is: ${typeof value}. Expected one of: ${types.join(', ')}.`);
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
    if (!values.includes(value)) {
      throw new Error(`The value of ${propName} supplied to ${this.constructor.name} is: ${value}. Expected one of: ${values.join(', ')}.`);
    }
  }
}

export default Model;
