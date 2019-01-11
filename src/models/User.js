import Model from './Model';
import IPFSService from '../services/IPFSService';
import UserService from '../services/UserService';
import ErrorPopup from '../components/ErrorPopup';
import { cleanIpfsPath } from '../lib/helpers';

/**
 * The DApp User model
 *
 * @attribute address       Ethereum address of the user
 * @attribute avatar        URL to user avatar
 * @attribute commitTime
 * @attribute email         Email address of the user
 * @attribute giverId       Giver ID used for querying donations
 * @attribute linkedin      Link to the linkedin profile
 * @attribute name          Name of the user
 * @attribute url           Url attached to LiquidPledging admin
 * @attribute authenticated If the user is authenticated w/ feathers
 */
class User extends Model {
  constructor(data) {
    super(data);

    this.authenticated = false;

    if (data) {
      this._address = data.address;
      this._avatar = data.avatar;
      this._commitTime = data.commitTime;
      this._email = data.email;
      this._giverId = data.giverId;
      this._linkedin = data.linkedin;
      this._name = data.name;
      this._updatedAt = data.updatedAt;
      this._url = data.url;
      this._authenticated = data.authenticated || false;
    }
  }

  toIpfs() {
    return {
      name: this._name,
      email: this._email,
      linkedin: this._linkedin,
      avatar: cleanIpfsPath(this._avatar),
      version: 1,
    };
  }

  toFeathers(txHash) {
    const user = {
      name: this._name,
      email: this._email,
      linkedIn: this._linkedin,
      avatar: cleanIpfsPath(this._avatar),
    };
    if (this._giverId === undefined && txHash) {
      // set to 0 so we don't attempt to create multiple givers in lp for the same user
      user._giverId = 0;
      user._txHash = txHash;
    }
    return user;
  }

  save(onSave, afterEmit) {
    if (this._newAvatar) {
      IPFSService.upload(this._newAvatar)
        .then(hash => {
          // Save the new avatar
          this._avatar = hash;
          delete this._newAvatar;
        })
        .catch(err => ErrorPopup('Failed to upload avatar', err))
        .finally(() => UserService.save(this, onSave, afterEmit));
    } else {
      UserService.save(this, onSave, afterEmit);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  get type() {
    return 'giver';
  }

  get id() {
    return this._address;
  }

  get address() {
    return this._address;
  }

  set address(value) {
    this.checkType(value, ['undefined', 'string'], 'address');
    this._address = value;
  }

  get avatar() {
    return this._avatar;
  }

  set avatar(value) {
    this.checkType(value, ['undefined', 'string'], 'avatar');
    this._avatar = value;
  }

  set newAvatar(value) {
    this.checkType(value, ['string'], 'newAvatar');
    this._newAvatar = value;
  }

  get commitTime() {
    return this._commitTime;
  }

  set commitTime(value) {
    this.checkType(value, ['undefined', 'number'], 'commitTime');
    this._commitTime = value;
  }

  get email() {
    return this._email;
  }

  set email(value) {
    this.checkType(value, ['undefined', 'string'], 'email');
    this._email = value;
  }

  get giverId() {
    return this._giverId;
  }

  set giverId(value) {
    this.checkType(value, ['undefined', 'number'], 'giverId');
    this._giverId = value;
  }

  get linkedin() {
    return this._linkedin;
  }

  set linkedin(value) {
    this.checkType(value, ['undefined', 'string'], 'linkedin');
    this._linkedin = value;
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this.checkType(value, ['undefined', 'string'], 'name');
    this._name = value;
  }

  get url() {
    return this._url;
  }

  set url(value) {
    this.checkType(value, ['undefined', 'string'], 'url');
    this._url = value;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  set updatedAt(value) {
    this.checkType(value, ['undefined', 'string'], 'updatedAt');
    this._updatedAt = value;
  }

  get authenticated() {
    return this._authenticated;
  }

  set authenticated(value) {
    this.checkType(value, ['boolean'], 'authenticated');
    this._authenticated = value;
  }
}

export default User;
