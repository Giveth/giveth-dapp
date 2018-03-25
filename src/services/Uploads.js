import { feathersRest } from '../lib/feathersClient';

class UploadsService {
  static save(file) {
    return feathersRest.service('uploads').create({ uri: file });
  }
}

export default UploadsService;
