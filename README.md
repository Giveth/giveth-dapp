![Giveth Dapp](./readme-header.png)


> Dapp for donating ether without losing ownership 

Welcome to the code for Giveth's dapp. This is an open source effort to realize the potential of ethereum smart contracts. More specifically, the Giveth dapp provides an alternative to traditional donation.

## Table of content

- [Getting Started](#getting-started)
    - [Install Windows](#install-Windows)
    - [Install Linux](#install-Linux/OSX)
    - [Run dapp](#run-dapp)
- [Build](#build)
- [Port](#port)
- [Dependencies](#dependencies)
- [Where are the config files?](#where-are-the-config-files)
- [You don't use Redux?](#you-dont-use-redux)
- [Local Development with TestRPC](#local-development-with-testrpc)
- [Help](#help)

## Getting Started

### Install Windows 
1. Click **Star** on this repo near the top-right corner of this web page.
2. Join our [slack](http://slack.giveth.io) if you haven't already.
3. Fork this repo by clicking **Fork** button in top-right corner of this web page. Continue to follow instruction steps from your own giveth-dapp repo.
4. Download the most current version of [64-bit NodeJS](https://nodejs.org/en/download/current) (v8.4.0 or higher) 

5. Run the node-v8.X.X-x64.msi installer and then continue through the installation as normal. Be sure to have the "Enable in PATH" option enabled before installing.
 
   The rest of these steps must be done from your machine's command line. 

6. Open the command line in administrator mode by right clicking on the cmd.exe application and selecting "Run as administrator"
7. In the administrator command prompt, change to the directory where you want to store this repository.
   ```
   cd C:\some\directory\for\repositories
   ```

8. Update npm to the latest version (in order to make sure the next step has the latest dependencies to install) with:
    ```
    npm install npm@latest -g
    ```

9. You must install the NodeJS/NPM dependcies for Windows before you are able to continue. This command will take a few minutes to install all of the necessary dependencies for building NodeJS applications on Windows.
   ```
   npm install -g windows-build-tools
   ```

10. Copy the link from the "Clone or download" button near the top right of this repo's home page.
    ```
    git clone {paste your own repo link here}
    ```

11. Change directories to giveth-dapp:
    ```
    cd giveth-dapp
    ```

12. Install the giveth-dapp dependencies in order to be able to run the giveth-dapp:
    ```
    npm install
    ```

13. That is it, you are now ready to run the giveth-dapp! Head to the [Run dapp] (#run-dapp) section for further instructions.

### Install Linux/OSX
1. Click **Star** on this repo near the top-right corner of this web page.
2. Join our [slack](http://slack.giveth.io) if you haven't already.
3. Fork this repo by clicking **Fork** button in top-right corner of this web page. Continue to follow instruction steps from your own giveth-dapp repo.
5. The rest of these steps must be done from your machine's command line.  Copy the link from the "Clone or download" button near the top right of this repo's home page.
    ```
    git clone {paste your own repo link here}
    ```
6. Change directories to giveth-dapp:
    ```
    cd giveth-dapp
    ```
5. Make sure you have [NodeJS](https://nodejs.org/) (v8.4.0 or higher) and [npm](https://www.npmjs.com/) (5.4.1 or higher) installed.
6. Install dependencies from within giveth-dapp directory:
    ```
    npm install
    ```
    
### Run dapp
1. The Giveth dapp will need to connect to a [feathers-giveth](https://github.com/Giveth/feathers-giveth) server. Follow the feathers-giveth readme instructions to install and run server before proceeding further.
2. From the giveth-dapp directory, create a filed called `.env.local` with these configs.
    ```
    PORT=3010
    REACT_APP_FEATHERJS_CONNECTION_URL=http://localhost:3030
    REACT_APP_ETH_NODE_CONNECTION_URL=ws://localhost:8546
    ```

3. Start the dapp.
    ```
    npm start
    ```
4. Once the dapp is up in your browser, click "Sign In" from the main menu.
5. For testing locally, choose any of the wallet files found in the `giveth-dapp/keystores/` folder using the wallet password: `password`. **DO NOT USE THESE ON MAINNET ETHEREUM.**

## Build
```
npm run build
```
    
## Port
- Don't like port 3010? Change it in `.env`

## Dependencies
All dependencies can be found in package.json, however here are the most important ones:
- React Router
- Bootstrap 4 (via CDN)
- Font Awesome (via CDN)
- Sass

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

## Help
Reach out to us on [slack](http://slack.giveth.io) for any help or to share ideas.
