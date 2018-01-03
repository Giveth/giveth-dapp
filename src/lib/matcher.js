import { _, matcher } from 'feathers-commons';

export default originalQuery => {
  const query = _.omit(originalQuery, '$client'); // default matcher doesn't omit $client query params

  return matcher(query);
};
