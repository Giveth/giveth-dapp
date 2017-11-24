import { feathersClient } from '../lib/feathersClient';

class UploadsService {
  static save(file) {
    return feathersClient.service('/uploads').create({ uri: file });
  }
}

export default UploadsService;
