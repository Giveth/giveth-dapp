[![TEST](https://github.com/Giveth/giveth-dapp/actions/workflows/TEST.yml/badge.svg)](https://github.com/Giveth/giveth-dapp/actions/workflows/TEST.yml)
![Giveth Dapp](./readme-header.png)


> DApp - Donation Application for charitable giving without losing ownership

Welcome to the code for Giveth's DApp. This is an open source effort to realize the potential of ethereum smart contracts. More specifically, the Giveth DApp provides an alternative to traditional donation.

## Table of content

- [Table of content](#table-of-content)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
    - [OSX and Linux](#osx-and-linux)
    - [Windows](#windows)
  - [Run](#run)
  - [Build](#build)
  - [Configuration](#configuration)
  - [Analytics](#analytics)
- [Contributing](#contributing)
  - [Local Development](#local-development)
  - [Development and PR Testing](#development-and-pr-testing)
  - [Deployment Environments](#deployment-environments)
  - [Release Process](#release-process)
- [Help](#help)

## Getting Started
In the following sections you will learn all you need to know to run the DApp locally and to start contributing. All the steps are also described in this amazing [Video Tutorial Walkthrough](https://tinyurl.com/y9lx6jrl) by Oz.

#### Prerequisites
- You need to use NodeJS v10 LTS.
- You need to use yarn (v1.22.10 or higher) to correctly install the dependencies.
- You need to have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).

### Install
1. Click **Star** on this repo near the top-right corner of this web page (if you want to).
2. Join us on [Element](http://join.giveth.io) or [Discord](https://discord.gg/Uq2TaXP9bC) if you haven't already.
3. Fork this repo by clicking **Fork** button in top-right corner of this web page. Continue to follow instruction steps from your own giveth-dapp repo.
4. Clone your own "giveth-dapp" repo. Copy the link from the "Clone or download" button near the top right of this repo's home page.
5. The rest of these steps must be done from your machine's command line. See the [OSX and Linux](#for-osx-and-linux) or [Windows](#for-windows) section to continue.

#### OSX and Linux
If your operative system is any distribution of linux you can use an All-in-One installation scripts special thanks to Dapp contributor Jurek Brisbane, available [here](https://github.com/Giveth/giveth-dapp/files/3674808/givethBuildStartScripts_2019-09-29.zip) along with a youtube [video](https://www.youtube.com/watch?v=rzLhxxAz73k&feature=youtu.be), otherwise try the following:

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
3. Make sure you have [NodeJS](https://nodejs.org/) (v10) and [yarn](https://yarnpkg.com/) (v1.22.10 or higher) installed.
4. Install dependencies from within giveth-dapp directory:
    ```
    yarn install
    ```
5. That is it, you are now ready to run the giveth-dapp! Head to the [Run DApp](#run) section for further instructions.

#### Windows
1. Install the latest version of Python from this [Link](https://www.python.org/downloads/). (make sure python is added to $PATH)
2. Install Microsoft Visual Studio 2017 (double-check the version) from this [link](https://download.visualstudio.microsoft.com/download/pr/3e542575-929e-4297-b6c6-bef34d0ee648/639c868e1219c651793aff537a1d3b77/vs_buildtools.exe). Giveth-Dapp needs the node-gyp module and node-gyp needs VS C++ 2017 Build Tools to be installed.
3. After downloading, install the packages marked from this [image](https://cdn.discordapp.com/attachments/849682448102457374/850480734291623946/unknown.png).
4. Then run command below in command prompt
   ```
   npm config set msvs_version 2017
   ```
5. After installing the above, you should install NodeJS version 10 [LTS](https://nodejs.org/dist/latest-v10.x/) (it is better to be v10.24.1 LTS).
6. Download and run the node-v10.24.1-x64.msi installer and then continue through the installation as normal. Be sure to have the "Enable in PATH" option enabled before installing.
7. Open the command line in administrator mode by right-clicking on the cmd.exe application and selecting "Run as administrator"
8. In the administrator command prompt, change to the directory where you want to store this repository.
   ```
   cd C:\some\directory\for\repositories
   ```
9. Double-check the node version with CMD command:
   ```
   node -v
   ```
10. After that, install the latest version of Yarn.  Be careful not to install packages with NPM. If you have already tried "npm install", you should first delete "node modules" folder.
    ```
    yarn install
    ```
11. That is it, you are now ready to run the giveth-dapp! Head to the [Run dapp](#run-dapp) section for further instructions.

### Run
1. The Giveth dapp will need to connect to a [feathers-giveth](https://github.com/Giveth/feathers-giveth) server. Follow the feathers-giveth readme instructions to install and run server before proceeding further. Alternatively, you could change the configuration to connect to the `develop` environment, see the [Configuration](#configuration) section.
2. Start the dapp.
    ```
    npm start
    ```
3. Once the dapp is up in your browser, click "Sign In" from the main menu.
4. For testing locally, choose any of the wallet files found in the `giveth-dapp/keystores/` folder using the wallet password: `password`. **DO NOT USE THESE ON ANY MAINNET EVMs.**

5. Using the test token
   To use the test token you need to import the keystore.json you use for your account to MetaMask.
   After importing, click on 'Add token' > 'Custom token' and enter the MiniMe Token address that can be found when deploying the contracts
   (should be `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab` by default but make sure to check)
   The token balance should show up automatically, and the token symbol is MMT.
   However, in the dApp the token symbol is referred to as ANT, b/c the dapp needs to be able to fetch a conversion rate.

NOTE:
When resetting feathers or redeploying the contracts, you need to remove the keystore from metamask and follow this procedure again.

### Build
```
npm run build
```

NOTE: due to some web3 libraries that are not transpiled from es6, we have to use our [giveth-react-scripts](https://github.com/Giveth/create-react-app/tree/master/packages/react-scripts) fork of react-scripts .

### Configuration
The DApp has several node environment variables which can be used to alter the DApp behaviour without changing the code. You can set them through `.env` or `.env.local` files in the DApp folder.

Variable name | Default Value | Description |
---|---|---|
PORT | 3010 | Port on which the DApp runs |
REACT_APP_ENVIRONMENT | 'localhost' | To which feathers environment should the DApp connect. By default it connects to localhost feathers. Allowed values are: `localhost`, `develop`, `release`, `alpha`, `mainnet`. See [Deployment Environments](#deploy-environments). |
REACT_APP_DECIMALS | 8 | How many decimal should be shown for cryptocurrency values. Note that the calculations are still done with 18 decimals. |
REACT_APP_FEATHERJS_CONNECTION_URL | Differs per REACT_APP_ENVIRONMENT | Overwrites the environment injected feathers connection URL. |
REACT_APP_NODE_CONNECTION_URL | Differs per REACT_APP_ENVIRONMENT | Overwrites the EVM node connection URL for making EVM transactions. |
REACT_APP_LIQUIDPLEDGING_ADDRESS | Differs per REACT_APP_ENVIRONMENT | Overwrites the Liquid Pledging contract address. |
REACT_APP_DAC_FACTORY_ADDRESS | Differs per REACT_APP_ENVIRONMENT | Overwrites the Communities contract address. |
REACT_APP_CAMPAIGN_FACTORY_ADDRESS | Differs per REACT_APP_ENVIRONMENT | Overwrites the Campaign Factory contract address. |
REACT_APP_MILESTONE_FACTORY_ADDRESS | Differs per REACT_APP_ENVIRONMENT | Overwrites the MilestoneFactory contract address. |
REACT_APP_TOKEN_ADDRESSES | Differs per REACT_APP_ENVIRONMENT | Overwrites the bridged token addresses. This is a JSON object string w/ token name : token address. |
REACT_APP_BLOCKEXPLORER | Differs per REACT_APP_ENVIRONMENT | Overwrites the block explorer base URL. The DApp assumes such blockexplorer api is `\<BLOCKEXPLORER\>/tx/\<TRANSACTION_HASH\>` |
REACT_APP_DEFAULT_GASPRICE | 10 | Overwrites the default gasPrice that is used if ethgasstation service is down. The value is in gwei. |
REACT_APP_ANALYTICS_KEY | "" | Overwrites `Segment` analytics key

Example of `.env.local` file that makes the DApp run on port 8080, connects to the **develop** environment and uses custom blockexplorer:

```
PORT=8080
REACT_APP_ENVIRONMENT='develop'
REACT_APP_BLOCKEXPLORER='www.awesomeopensourceexplorer.io'
```

The rest of the configuration can be found in `configuration.js`

### Analytics
Segment Analytics can be enabled by setting REACT_APP_ANALYTICS_KEY

### Query Strings
The milestone creation/proposal view now supports query string arguments!
The following arguments are available:

| Argument | Expected Values | Type |
|------------------|------------------------------------------------------------|--------|
| title | The title of the milestone | string |
| description | The description of the milestone | string |
| recipientAddress | The address of the recipient | string |
| reviewerAddress | The address of the reviewer | string |
| selectedFiatType | A valid fiat type (i.e. USD) | string |
| date | A valid milestone date string | string |
| token | A valid token symbol (i.e. DAI) | string |
| tokenAddress | A valid token address | string |
| maxAmount | A valid max amount of ETH or token | number |
| fiatAmount | A valid max amount of fiat (dependant on selectedFiatType) | number |
| isCapped | Determines whether the milestone should be capped | 0 or 1 (boolean) |
| requireReviewer | Determines whether the milestone should require a reviewer | 0 or 1 (boolean) |


## Contributing
The DApp is fully open-source software, and we would love to have your helping hand! See [CONTRIBUTING.md](CONTRIBUTING.md) for more information on what we're looking for and how to get started. You can then look for issues labeled [good first issue](https://github.com/Giveth/giveth-dapp/labels/good%20first%20issue) or [help wanted](https://github.com/Giveth/giveth-dapp/labels/help%20wanted). We regularly reward contributions with ether using the Reward DAO.

If you are not a developer, you can still help us by testing new releases periodically. See the [Release Process](#release-process) section.

If you want to better understand how does the development process works, please refer to our [wiki pages](https://wiki.giveth.io/documentation/DApp), especially to the [Product Definition](https://wiki.giveth.io/documentation/DApp/product-definition/), [Product Roadmap](https://wiki.giveth.io/documentation/DApp/product-roadmap/) and [Development Process & Quality Assurance](https://wiki.giveth.io/documentation/DApp/product-development-testing/).

### Local Development
At first you would like to run the DApp locally. When running `testrpc` locally in `deterministic` mode, you can use any of the keystores in the `giveth-dapp/keystores` as your wallet.
This will provide you access to the testrpc accounts for local development. Each keystore uses the same password: `password`. **DO NOT USE THESE ON ANY MAINNET EVMs**

The keystores are seeded with 10.000 ANT tokens for testing donations. To get started with testing donations,
make sure to add your account's keystore to MetaMask and swith MetaMask to Ganache. The donation modal should
then show the appropriate balance when donating in ANT tokens.

**NOTE**: If you get a nonce error in MetaMask or if the dapp fails to load with your metamask unlocked, it could be b/c metamask is confused. You should go to "settings" -> "Reset Account" in MetaMask in order to reset the nonce & cached account data.

### Development and PR Testing
1. The Giveth Dapp is auto deployed from the develop branch and is live on Rinkeby [develop.giveth.io](https://develop.giveth.io). All pull requests are autodeployed and the PR preview will be generated upon submission. To learn how to access PR previews see [Development Process & Quality Assurance](https://wiki.giveth.io/documentation/DApp/product-development-testing/) on our wiki.
2. In order to use the dapp you will need to create account. If this is your first time, click "sign up" to create an account. If you already have a valid keychain file, use it to sign in.
3. You will need test ether on the Rinkeby network. Go to the "wallet" page to see your new address (0x..). Copy that address and use the faucet to get some: https://faucet.rinkeby.io/



### Deployment Environments
At Giveth, we are using the [gitflow](http://nvie.com/posts/a-successful-git-branching-model/) branching model to deploy to 4 different environments.

Name | Blockchain | Branch Deployed | Auto Deploy | Use |
-----|------------|-----------------|-------------|-----|
[mainnet](https://mainnet.giveth.io) | Ethereum Main Network | master | no | Main network deployment for now abandoned due to high transaction costs until sustainable solution is found.
[alpha](https://alpha.giveth.io)  | Rinkeby Test Network | master | no | Environment used as a production version until scalability is resolved.
[release](https://release.giveth.io) | Rinkeby Test Network | release | yes | Environment for release candidate quality control testing by non-devs.
[develop](https://develop.giveth.io) | Rinkeby Test Network | develop | yes | Development environment for integrating new features. Feature and pull request branches are also automatically deployed to this environment.

You can change the environment to which the DApp connects through the node environment variables. See the [Configuration](#Configuration) section for more details.

### Release Process
The development uses the Gitflow process with 2 weeks long sprints. This means there is new release to be tested every fortnight. We invite contributors to help us test the DApp in the release
environment before we merge it to the master branch and deploy to production environments. If you are interested, write to the DApp Development channel on [Element
](https://join.giveth.io). You can read more about the release planning on [our wiki](https://wiki.giveth.io/documentation/DApp/product-development-testing/).

## Help
Reach out to us on [Element](https://join.giveth.io) or [Discord](https://discord.gg/Uq2TaXP9bC) for any help or to share ideas.
