import matrixSdk from 'matrix-js-sdk';
import config from '../configuration';

class MatrixService {
  static async createChatRoom() {
    const { matrixHomeserver, matrixToken } = config;

    if (!matrixHomeserver || matrixHomeserver === '') {
      console.log('No Matrix homeserver provided.');
      return '';
    }

    if (!matrixToken || matrixToken === '') {
      console.log('Matrix Token not provided. Cannot do authorized actions to Matrix API.');
      return '';
    }

    const client = matrixSdk.createClient({
      baseUrl: matrixHomeserver,
      accessToken: matrixToken,
    });

    const { room_id: roomId } = await new Promise(resolve => {
      client.createRoom({}, (err, res) => {
        if (err) {
          resolve({ room_id: '' });
        } else {
          resolve(res);
        }
      });
    });

    return roomId;
  }
}

export default MatrixService;
