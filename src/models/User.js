import Model from './Model';

/**
 * The DApp User model
 *
 * @attribute address     Ethereum address of the user
 * @attribute avatar      URL to user avatar
 * @attribute commitTime
 * @attribute email       Email address of the user
 * @attribute giverId     Giver ID used for querying donations
 * @attribute linkedin    Link to the linkedin profile
 * @attribute name        Name of the user
 */
class User extends Model {
  constructor({ address, avatar, commitTime, email, giverId, linkedin, name }) {
    super();
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
    this.checkType(value, ['undefined', 'string'], 'address');
    this.myAddress = value;
  }

  get avatar() {
    return this.myAvatar;
  }

  set avatar(value) {
    this.checkType(value, ['undefined', 'string'], 'avatar');
    this.myAvatar = value;
  }

  get commitTime() {
    return this.myCommitTime;
  }

  set commitTime(value) {
    this.checkType(value, ['undefined', 'string'], 'commitTime');
    this.myCommitTime = value;
  }

  get email() {
    return this.myEmail;
  }

  set email(value) {
    this.checkType(value, ['undefined', 'string'], 'email');
    this.myEmail = value;
  }

  get giverId() {
    return this.myGiverId;
  }

  set giverId(value) {
    this.checkType(value, ['undefined', 'string', 'number'], 'giverId');
    this.myGiverId = value;
  }

  get linkedin() {
    return this.myLinkedIn;
  }

  set linkedin(value) {
    this.checkType(value, ['undefined', 'string'], 'linkedin');
    this.myLinkedIn = value;
  }

  get name() {
    return this.myName;
  }

  set name(value) {
    this.checkType(value, ['undefined', 'string'], 'name');
    this.myName = value;
  }
}

export default User;
