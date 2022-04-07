import config from '../configuration';
import ImageTools from '../lib/ImageResizer';
import { feathersClient } from '../lib/feathersClient';
import ErrorHandler from '../lib/ErrorHandler';

class IPFSService {
  /**
   * Upload a json object or Blob to ipfs
   *
   * @param {object|Blob|string} obj Object/Blob to upload to ipfsGateway. The only valid string is a base64 encoded image.
   */
  static async upload(obj) {
    const { ipfsGateway } = config;
    if (!ipfsGateway || ipfsGateway === '') {
      console.log('not uploading to ipfs. missing ipfsGateway url');
      return Promise.resolve();
    }

    if (typeof obj === 'string') {
      if (obj.match(/^\/ipfs\/[^/]+$/) !== null) {
        return Promise.resolve(obj);
      }
      if (!ImageTools.isImage(obj)) {
        throw new Error('Cant upload string to ipfs');
      }
    }

    const reader = new FileReader();
    reader.readAsDataURL(obj);
    await new Promise(resolve => {
      reader.onloadend = resolve;
    });

    try {
      return await feathersClient.service('uploadByImpactGraph').create({ uri: reader.result });
    } catch (e) {
      ErrorHandler(e, 'Something went wrong with the upload.', true);
      throw new Error('IPFS upload unsuccessful');
    }
  }
}

export default IPFSService;
