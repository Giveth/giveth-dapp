![Giveth Dapp](./readme-header.png)


> Dapp for donating ether without losing ownership


Welcome to the code for Giveth's dapp. This is an open source effort to realize the potential of ethereum smart contracts. More specifically, the Giveth dapp provides an alternative to traditional donation.

## Table of content

- [Getting Started](#getting-started)
    - [Install](#install)
    - [For OSX and Linux](#for-osx-and-linux)
    - [For Windows](#for-windows)
    - [Run Dapp](#run-dapp)
    - [Video Walkthrough](#video-walkthrough)
- [Build](#build)
- [Dependencies](#dependencies)
- [Where are the config files?](#where-are-the-config-files)
- [You don't use Redux?](#you-dont-use-redux)
- [Local Development with TestRPC](#local-development-with-testrpc)
- [Testing Environments and CI](#testing-environments-and-ci)
- [Help](#help)

## Getting Started

### Install
1. Click **Star** on this repo near the top-right corner of this web page (if you want to).
2. Join our [slack](http://slack.giveth.io) if you haven't already.
3. Fork this repo by clicking **Fork** button in top-right corner of this web page. Continue to follow instruction steps from your own giveth-dapp repo.
4. Clone your own "giveth-dapp" repo. Copy the link from the "Clone or download" button near the top right of this repo's home page.
5. The rest of these steps must be done from your machine's command line. See the [OSX and Linux](#for-osx-and-linux) or [Windows](#for-windows) section to continue.

### For OSX and Linux
1. From the desired directory you wish to copy the "giveth-dapp" folder with source files to.
    ```
    git clone {paste your own repo link here}
    ```
    NOTE: Please use `develop` branch for contributing.
    ```
    git clone -b develop {paste your own repo link here}
    ```
2. Change directories to giveth-dapp:
    ```
    cd giveth-dapp
    ```
3. Make sure you have [NodeJS](https://nodejs.org/) (v8.4.0 or higher) and [npm](https://www.npmjs.com/) (5.4.1 or higher) installed.
4. Install dependencies from within giveth-dapp directory:
    ```
    npm install
    ```
5. That is it, you are now ready to run the giveth-dapp! Head to the [Run dapp](#run-dapp) section for further instructions.

### For Windows
1. Make sure you have the LTS version of [64-bit NodeJS](https://nodejs.org/en/download/current) (v8.9.1)
2. Run the node-v8.9.1-x64.msi installer and then continue through the installation as normal. Be sure to have the "Enable in PATH" option enabled before installing.
3. Open the command line in administrator mode by right clicking on the cmd.exe application and selecting "Run as administrator"
4. In the administrator command prompt, change to the directory where you want to store this repository.
   ```
   cd C:\some\directory\for\repositories
   ```
5. Update npm to the latest version (in order to make sure the next step has the latest dependencies to install) with:
   ```
   npm install npm@latest -g
   ```
6. You must install the NodeJS/NPM dependcies for Windows before you are able to continue. This command will take a few minutes to install all of the necessary dependencies for building NodeJS applications on Windows.
   ```
   npm install -g windows-build-tools
   ```
7. Install dependencies from within giveth-dapp directory:
    ```
    npm install
    ```
8. For some reason the npm node-sass package does not install correctly in windows when using the 'npm install' command, so you must rebuild the node-sass package with:
   ```
   npm rebuild node-sass
   ```
9. The web3 package does not install correctly when using the 'npm install' command, so you must install it separately in order for this dapp to run. Use the following to install web3:
   ```
   npm install web3
   ```
10. That is it, you are now ready to run the giveth-dapp! Head to the [Run dapp](#run-dapp) section for further instructions.

### Run dapp
1. The Giveth dapp will need to connect to a [feathers-giveth](https://github.com/Giveth/feathers-giveth) server. Follow the feathers-giveth readme instructions to install and run server before proceeding further.
2. Start the dapp.
    ```
    npm start
    ```
3. Once the dapp is up in your browser, click "Sign In" from the main menu.
4. For testing locally, choose any of the wallet files found in the `giveth-dapp/keystores/` folder using the wallet password: `password`. **DO NOT USE THESE ON MAINNET ETHEREUM.**

### Video Walkthrough
Video tutorial walkthrough here: https://tinyurl.com/y9lx6jrl

## Build
`npm run build`

NOTE: due to a bug in Safari create-react-app's output does not work in Safari (and any iPhone browser)
To fix this:

`cd /node_modules/giveth-react-scripts/config`
open `webpack.config.prod.js`
go to line 300, and add:
```
  mangle: {
    safari10: true,
  },
```

now the build will work in Safari

## Issues?
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

## Testing Environments and CI

### master to Ropsten
1. The Giveth Dapp is auto deployed from the master branch and is live on Ropsten and can be reached here: https://alpha.giveth.io
2. In order to use the dapp you will need ETH on the Ropsten network. You can use this faucet to get some: http://faucet.ropsten.be:3001/
3. "sign up" on the dapp to create an account.
4. Go to the "wallet" page to see your new address (0x..). Copy and past that address into the faucet link above and you will have Ropsten network ETH for testing.

### develop to remote testprc
1. The Giveth Dapp is auto deployed from the develop branch to a remote testrpc instance and can be reached here: https://giveth-develop.netlify.com/
2. In order to use the dapp you will need ETH on testrpc. You can do this by downloading a testrpc wallet from here: https://drive.google.com/open?id=1EU3U2dFkFD0MuSQqN2GjZIosvuaP4u_S
3. You can use one of the downloaded json files to "sign in" on the dapp.  The password is: password
4. **Never use this wallet anywhere except for testing.** It should have ETH if you run testrpc locally or here on the develop environment: https://giveth-develop.netlify.com/
5. Sometimes testrpc crashes. You can check if it's up by seeing if there is an error here: https://feathers3.giveth.io/get-state/
6. If you see pretty json, then you're looking at the state of the running testrpc blockchain. If you see an error message, than testrpc needs to be restarted. Reach out to @oz on [slack](slack.giveth.io).
7. We are hoping to replace remote testrpc with private geth node via [puppeth](https://modalduality.org/posts/puppeth/), as soon as we figure it out :)

## Help
Reach out to us on [slack](http://slack.giveth.io) for any help or to share ideas.
