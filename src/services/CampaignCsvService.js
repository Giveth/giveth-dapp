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
          resolve(resp);
        })
        .catch(reject);
    });
  }
}

export default CampaignCsvService;
