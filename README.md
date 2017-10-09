# giveth-dapp

> Dapp for donating ether without losing ownership 

Welcome to the code for Giveth's dapp. This is an open source effort to realize the potential of ethereum smart contracts. More specifically, the Giveth dapp provides an alternative to traditional donation.

## Table of content

- [Getting Started](#getting-started)
    - [Install](#install)
    - [Run dapp](#run-dapp)
- [Build](#build)
- [Port](#port)
- [Dependencies](#dependencies)
- [Where are the config files?](#where-are-the-config-files?)
- [You don't use Redux?](#you-dont-use-redux?)
- [Local Development with TestRPC](#Local-Development-with-TestRPC)
- [Help](#help)

## Requirements
Must install and run [feathers-giveth](https://github.com/Giveth/feathers-giveth) .

## Get Started

### Install
1. Click **Star** on this repo near the top-right corner of this web page.
2. Join our [slack](http://slack.giveth.io) if you haven't already.
3. Fork this repo by clicking **Fork** button in top-right corner of this web page. Continue to follow instruction steps from your own feathers-giveth repo.
5. The rest of these steps must be done from your machine's command line. Clone your own "giveth-dapp" repo: 
    ```
    git clone https://github.com/GITHUB_USERNAME/giveth-dapp.git
    ```
6. Change directories to feathers-giveth:
    ```
    cd giveth-dapp
    ```
5. Make sure you have [NodeJS](https://nodejs.org/) (v8.4.0 or higher) and [npm](https://www.npmjs.com/) (5.4.1 or higher) installed.
6. Install dependencies from within feathers-giveth directory:
    ```
    npm install
    ```

### Run dapp
1. The Giveth dapp will need to connect to a [feathers-giveth](https://github.com/Giveth/feathers-giveth) server. Follow the feathers-giveth readme instructions to install and run server before proceeding further.
2. From the giveth-dapp directory, start the dapp.
    ```
    npm start
    ```
3. Once the dapp is up in your browser, click "Sign In" from the main menu.
4. For testing locally, choose any of the wallet files found in the `giveth-dapp/keystores/` folder using the wallet password: `password`. **DO NOT USE THESE ON MAINNET ETHEREUM.**


## Build
`npm run build`

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