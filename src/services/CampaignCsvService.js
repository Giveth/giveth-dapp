import { feathersClient } from '../lib/feathersClient';

const campaigncsv = feathersClient.service('campaigncsv');

class CampaignCsvService {
  /**
   * Get a CampaignCsv
   *
   * @param id   ID of the Campaign to be retrieved
   */
  static get(id) {
    return new Promise((resolve, reject) => {
      campaigncsv
        .get(id)
        .then(resp => {
          const data = new Blob([resp], { type: 'text/plain' });
          const url = window.URL.createObjectURL(data);
          document.getElementById('download_link').href = url;
          resolve(resp);
        })
        .catch(reject);
    });
  }
}

export default CampaignCsvService;
