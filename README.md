# Install
`npm install`

# Start
`npm start`

# Build
`npm run build`

# Issues?
- You need to use Node > v6
- You need to use npm 4.x, or npm >= 5.3, or yarn to correctly install the dependencies
- Don't use NPM? All commands can be used using Yarn.
- Don't like port 3010? Change it in `.env`

## Dependencies
- Bootstrap 4 (via CDN)
- Font Awesome (via CDN)
- Sass

All dependencies can be found in package.json, however here are the most important ones:
- React Router

## Where are the config files?
This project is setup using [Create React App](https://github.com/facebookincubator/create-react-app). It can do almost everything (config via package.json) and best, it just works! :-)
If required you can 'eject' the project by running `npm run eject`. Note that there's no way back!

## You don't use Redux?
Nope. We use container architecture instead. So persistent data is loaded in containers, for example `Application.js`, and passed on as props to its children.
As long as a container is rendered the data is persistent.

## Local Development with TestRPC
When running `testrpc` locally and in `deterministic` mode, you can use any of the keystores in the `keystores` when loading your wallet.
This will provide you access to the testrpc accounts for local development. Each keystore uses the same password: `password`. **DO NOT USE
THESE ON MAINNET ETHEREUM.**