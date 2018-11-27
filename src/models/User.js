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
      this.address = data.address;
      this.avatar = data.avatar;
      this.commitTime = data.commitTime;
      this.email = data.email;
      this.giverId = data.giverId;
      this.linkedin = data.linkedin;
      this.name = data.name;
      this.updatedAt = data.updatedAt;
      this.url = data.url;
      this.authenticated = data.authenticated || false;
    }
  }

  toIpfs() {
    return {
      name: this.name,
      email: this.email,
      linkedin: this.linkedin,
      avatar: cleanIpfsPath(this.avatar),
      version: 1,
    };
  }

  toFeathers(txHash) {
    const user = {
      name: this.name,
      email: this.email,
      linkedin: this.linkedin,
      avatar: cleanIpfsPath(this.avatar),
    };
    if (this.giverId === undefined && txHash) {
      // set to 0 so we don't attempt to create multiple givers in lp for the same user
      user.giverId = 0;
      user.txHash = txHash;
    }
    return user;
  }

  save(onSave, afterEmit) {
    if (this.myNewAvatar) {
      IPFSService.upload(this.myNewAvatar)
        .then(hash => {
          // Save the new avatar
          this.avatar = hash;
          delete this.myNewAvatar;
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
    return this.myAddress;
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

  set newAvatar(value) {
    this.checkType(value, ['string'], 'newAvatar');
    this.myNewAvatar = value;
  }

  get commitTime() {
    return this.myCommitTime;
  }

  set commitTime(value) {
    this.checkType(value, ['undefined', 'number'], 'commitTime');
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
    this.checkType(value, ['undefined', 'number'], 'giverId');
    this.myGiverId = value;
  }

  get linkedin() {
    return this.mylinkedin;
  }

  set linkedin(value) {
    this.checkType(value, ['undefined', 'string'], 'linkedin');
    this.mylinkedin = value;
  }

  get name() {
    return this.myName;
  }

  set name(value) {
    this.checkType(value, ['undefined', 'string'], 'name');
    this.myName = value;
  }

  get url() {
    return this.myUrl;
  }

  set url(value) {
    this.checkType(value, ['undefined', 'string'], 'url');
    this.myUrl = value;
  }

  get updatedAt() {
    return this.myUpdatedAt;
  }

  set updatedAt(value) {
    this.checkType(value, ['undefined', 'string'], 'updatedAt');
    this.myUpdatedAt = value;
  }

  get authenticated() {
    return this.myIsAuthenticated;
  }

  set authenticated(value) {
    this.checkType(value, ['boolean'], 'authenticated');
    this.myIsAuthenticated = value;
  }
}

export default User;
