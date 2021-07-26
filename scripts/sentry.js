// eslint-disable-next-line import/no-extraneous-dependencies
const SentryCli = require('@sentry/cli');

async function createReleaseAndUpload() {
  const release = process.env.REACT_APP_SENTRY_RELEASE;
  if (!release) {
    console.warn('REACT_APP_SENTRY_RELEASE is not set');

    return;
  }

  const cli = new SentryCli();

  try {
    console.log(`Creating sentry release ${release}`);
    await cli.releases.new(release);

    console.log('Uploading source maps');
    await cli.releases.uploadSourceMaps(release, {
      include: ['build/static/js'],
      urlPrefix: '~/static/js',
      rewrite: false,
    });

    console.log('Finalizing release');
    await cli.releases.finalize(release);
  } catch (e) {
    console.error('Source maps uploading failed:', e);
  }
}

createReleaseAndUpload();
