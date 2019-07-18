import React from 'react';
import DACProvider, { Consumer as DACConsumer } from '../../contextProviders/DACProvider';

import DACCard from '../DacCard';
import Loader from '../Loader';

/**
 * The DACs view mapped to /dacs
 */
const DACs = () => (
  <DACProvider>
    <DACConsumer>
      {({ state: { dacs, isLoading, total, hasError } }) => (
        <div id="campaigns-view" className="card-view">
          <div className="container-fluid page-layout reduced-padding">
            <h4>
              Decentralized Altruistic Communities{' '}
              {total > 0 && <span className="badge badge-success">{total}</span>}
            </h4>
            {!hasError && isLoading && <Loader />}
            {// There are some DACs in the system, show them
            !hasError && !isLoading && dacs.length > 0 && (
              <div>
                <p>
                  These Communities are solving causes. Help them realise their goals by joining
                  them and giving Ether or tokens!
                </p>
                <div className="cards-grid-container">
                  {dacs.map(dac => (
                    <DACCard key={dac.id} dac={dac} />
                  ))}
                </div>
              </div>
            )}

            {// There are no DACs, show empty state
            !hasError && !isLoading && dacs.length === 0 && (
              <div>
                <center>
                  <p>There are no Decentralized Altruistic Communities (DACs) yet!</p>
                  <img
                    className="empty-state-img"
                    src={`${process.env.PUBLIC_URL}/img/community.svg`}
                    width="200px"
                    height="200px"
                    alt="no-campaigns-icon"
                  />
                </center>
              </div>
            )}
            {hasError && (
              <p>
                <strong>Oops, something went wrong...</strong> The Giveth dapp could not load any
                DACs for some reason. Please try refreshing the page...
              </p>
            )}
          </div>
        </div>
      )}
    </DACConsumer>
  </DACProvider>
);

DACs.propTypes = {};

export default DACs;
