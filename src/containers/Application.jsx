import React from 'react';
import ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';

import { Router } from 'react-router-dom';

import localforage from 'localforage';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import Sweetalert from 'sweetalert';

import { history } from '../lib/helpers';

import config from '../configuration';

// components
import Routes from './Routes';
import Header from '../components/layout/MainMenu';
import Loader from '../components/Loader';
import ErrorBoundary from '../components/ErrorBoundary';

// context providers
import UserProvider, { Consumer as UserConsumer } from '../contextProviders/UserProvider';
import ConversionRateProvider from '../contextProviders/ConversionRateProvider';
import Web3Provider, { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import WhiteListProvider, {
  Consumer as WhiteListConsumer,
} from '../contextProviders/WhiteListProvider';
import NotificationModalProvider from '../contextProviders/NotificationModalProvider';

import '../lib/validators';

/**
 * Here we hack to make stuff globally available
 */
// Make sweet alert global
React.swal = Sweetalert;

// Construct a dom node to be used as content for sweet alert
React.swal.msg = reactNode => {
  const wrapper = document.createElement('span');
  ReactDOM.render(reactNode, wrapper);
  return wrapper.firstChild;
};

// make toast globally available
React.toast = toast;

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
              <div>
                <Web3Provider>
                  <Web3Consumer>
                    {({ state: { account, web3 } }) => (
                      <div>
                        {(!account || !web3) && <Loader className="fixed" />}
                        {account && web3 && (
                          <ConversionRateProvider fiatWhitelist={fiatWhitelist}>
                            <UserProvider account={account} web3={web3}>
                              <UserConsumer>
                                {({ state: { hasError } }) => (
                                  <div>
                                    <NotificationModalProvider>
                                      {!hasError && (
                                        <div>
                                          <Header />
                                          <Routes />
                                        </div>
                                      )}

                                      {hasError && (
                                        <div className="text-center">
                                          <h2>Oops, something went wrong...</h2>
                                          <p>
                                            The Giveth dapp could not load for some reason. Please
                                            try again...
                                          </p>
                                        </div>
                                      )}

                                      <ToastContainer
                                        position="top-right"
                                        type="default"
                                        autoClose={5000}
                                        hideProgressBar
                                        newestOnTop={false}
                                        closeOnClick
                                        pauseOnHover
                                      />
                                    </NotificationModalProvider>
                                  </div>
                                )}
                              </UserConsumer>
                            </UserProvider>
                          </ConversionRateProvider>
                        )}
                      </div>
                    )}
                  </Web3Consumer>
                </Web3Provider>
              </div>
            )}
          </WhiteListConsumer>
        </WhiteListProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default Application;
