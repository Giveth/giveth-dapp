import React, { Fragment } from 'react';
import { Helmet } from 'react-helmet';

import { Router } from 'react-router-dom';

import localforage from 'localforage';

import { history } from '../lib/helpers';

import config from '../configuration';

// components
import Routes from './Routes';
import Header from '../components/layout/MainMenu';
import ErrorBoundary from '../components/ErrorBoundary';

// context providers
import UserProvider, { Consumer as UserConsumer } from '../contextProviders/UserProvider';
import ConversionRateProvider from '../contextProviders/ConversionRateProvider';
import Web3Provider, { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import WhiteListProvider, {
  Consumer as WhiteListConsumer,
} from '../contextProviders/WhiteListProvider';
import NotificationModalProvider from '../contextProviders/NotificationModalProvider';

/**
 * This container holds the application and its routes.
 * It is also responsible for loading application persistent data.
 * As long as this component is mounted, the data will be persistent,
 * if passed as props to children.
 * -> moved to data to UserProvider
 */
const Application = () => {
  localforage.config({
    name: 'giveth',
  });

  return (
    <ErrorBoundary>
      {/* Header stuff goes here */}
      <Helmet>
        {config.analytics.useHotjar && window.location.origin.includes('trace') && (
          <script>{`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:944408,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}</script>
        )}
        <title>Giveth Trace</title>
      </Helmet>

      <Router history={history}>
        <WhiteListProvider>
          <WhiteListConsumer>
            {({ state: { fiatWhitelist } }) => (
              <Web3Provider>
                <Web3Consumer>
                  {({ state: { account, web3 } }) => (
                    <ConversionRateProvider fiatWhitelist={fiatWhitelist}>
                      <UserProvider account={account} web3={web3}>
                        <UserConsumer>
                          {({ state: { hasError } }) => (
                            <Fragment>
                              <NotificationModalProvider>
                                {!hasError && (
                                  <Fragment>
                                    <Header />
                                    <Routes />
                                  </Fragment>
                                )}

                                {hasError && (
                                  <div className="text-center">
                                    <h2>Oops, something went wrong...</h2>
                                    <p>
                                      The Giveth dapp could not load for some reason. Please try
                                      again...
                                    </p>
                                  </div>
                                )}
                              </NotificationModalProvider>
                            </Fragment>
                          )}
                        </UserConsumer>
                      </UserProvider>
                    </ConversionRateProvider>
                  )}
                </Web3Consumer>
              </Web3Provider>
            )}
          </WhiteListConsumer>
        </WhiteListProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default Application;
