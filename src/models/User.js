
/**
 * The DApp User model
 *
 * @attribute address {string} Ethereum address of the user
 * @attribute avatar  {string} URL to user avatar
 */
class User {
  /**
   * Checks that type of passef value is one of types
   *
   * @param value    Value which type is to be tested
   * @param types    Array containing allowed PropTypes
   * @param propName Name of the property that is being inspected
   *
   * @throws TypeError describing what wes the passed type and which types were expected
   */
  static checkType(value, types, propName) {
    if (!types.includes(typeof value)) {
      throw new TypeError(`The type of ${propName} supplied to User is: ${typeof value}. Expected one of ${types.join(', ')}.`);
    }
  }

  constructor({
    address, avatar, commitTime, email, giverId, linkedin, name,
  }) {
    this.address = address;
    this.avatar = avatar;
    this.commitTime = commitTime;
    this.email = email;
    this.giverId = giverId;
    this.linkedin = linkedin;
    this.name = name;
  }

  get address() {
    return this.myAddress;
  }

  set address(value) {
    User.checkType(value, ['undefined', 'string'], 'address');
    this.myAddress = value;
  }

  get avatar() {
    return this.myAvatar;
  }

  set avatar(value) {
    User.checkType(value, ['undefined', 'string'], 'avatar');
    this.myAvatar = value;
  }

  get commitTime() {
    return this.myCommitTime;
  }

  set commitTime(value) {
    User.checkType(value, ['undefined', 'string'], 'commitTime');
    this.myCommitTime = value;
  }

  get email() {
    return this.myEmail;
  }

  set email(value) {
    User.checkType(value, ['undefined', 'string'], 'email');
    this.myEmail = value;
  }

  get giverId() {
    return this.myGiverId;
  }

  set giverId(value) {
    User.checkType(value, ['undefined', 'string'], 'giverId');
    this.myGiverId = value;
  }

  get linkedin() {
    return this.myLinkedIn;
  }

  set linkedin(value) {
    User.checkType(value, ['undefined', 'string'], 'linkedin');
    this.myLinkedIn = value;
  }

  get name() {
    return this.myName;
  }

  set name(value) {
    User.checkType(value, ['undefined', 'string'], 'name');
    this.myName = value;
  }
}

export default User;
