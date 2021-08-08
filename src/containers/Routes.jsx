import React, { useContext } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

// views
import Profile from '../components/views/Profile';
import EditProfile from '../components/views/EditProfile';

import ViewTrace from '../components/views/ViewTrace';
import SentryTest from '../components/views/SentryTest';
import EditCommunity from '../components/views/EditCommunity';
import ViewCommunity from '../components/views/ViewCommunity';
import MyDonations from '../components/views/MyDonations';
import MyDelegations from '../components/views/myDelegations/MyDelegations';
import MyCommunities from '../components/views/MyCommunities';
import MyCampaigns from '../components/views/MyCampaigns';
import MyTraces from '../components/views/MyTraces';
import NotFound from '../components/views/NotFound';
import Explore from '../components/views/Explore';
import { TracesExplore } from '../components/views/Traces';
import { CampaignsExplore } from '../components/views/Campaigns';
import { CommunitiesExplore } from '../components/views/Communities';

import ViewCampaign from '../components/views/ViewCampaign';
import EditTraceOld from '../components/views/EditTraceOld';

import TraceCreateOptionsMenu from '../components/views/TraceCreateOptionsMenu';
import CreatePayment from '../components/views/CreatePayment';
import CreateBounty from '../components/views/CreateBounty';
import CreateMilestone from '../components/views/CreateMilestone';
import CreateExpense from '../components/views/CreateExpense';
import EditBounty from '../components/views/EditBounty';
import EditPayment from '../components/views/EditPayment';
import EditExpense from '../components/views/EditExpense';
import EditMilestone from '../components/views/EditMilestone';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import EditCampaign from '../components/views/EditCampaign';

const Routes = () => {
  const {
    state: { isForeignNetwork, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const { pathname } = useLocation();

  // Path and it's donate sub path
  const getViewEntityPathsList = originPath => {
    return [originPath, `${originPath}/donate`];
  };

  return (
    <Switch>
      {/* All routes ending '/' will bre redirected to path with omitted last character */}
      <Redirect from="/:url*(/+)" to={pathname.slice(0, -1)} />
      {/* Routes are defined here. Persistent data is set as props on components
                                NOTE order matters, wrong order breaks routes!
                            */}
      <Route exact path="/communities/new" render={props => <EditCommunity isNew {...props} />} />
      <Route exact path="/communities/:id/edit" render={props => <EditCommunity {...props} />} />
      <Route
        exact
        path={getViewEntityPathsList('/communities/:id')}
        render={props => <ViewCommunity {...props} />}
      />
      <Route
        exact
        path={getViewEntityPathsList('/community/:slug')}
        render={props => <ViewCommunity {...props} />}
      />
      <Route
        exact
        path={getViewEntityPathsList('/dacs/:id')}
        render={({ match }) => <Redirect to={`/communities/${match.params.id}`} />}
      />
      <Route
        exact
        path={getViewEntityPathsList('/dac/:slug')}
        render={({ match }) => <Redirect to={`/community/${match.params.slug}`} />}
      />
      <Route exact path="/campaigns/new" render={() => <EditCampaign />} />
      <Route exact path="/campaigns/:id/edit" render={() => <EditCampaign />} />
      <Route
        exact
        path={getViewEntityPathsList('/campaigns/:id')}
        render={props => <ViewCampaign {...props} />}
      />
      <Route
        exact
        path={getViewEntityPathsList('/campaign/:slug')}
        render={props => <ViewCampaign {...props} />}
      />
      <Route exact path="/campaign/:slug/new" render={() => <TraceCreateOptionsMenu />} />
      <Route
        exact
        path="/campaign/:slug/new/milestone"
        render={props => <CreateMilestone {...props} />}
      />
      <Route
        exact
        path="/campaign/:slug/new/payment"
        render={props => <CreatePayment {...props} />}
      />
      <Route
        exact
        path="/campaign/:slug/new/bounty"
        render={props => <CreateBounty {...props} />}
      />
      <Route
        exact
        path="/campaign/:slug/new/expense"
        render={props => <CreateExpense {...props} />}
      />
      <Route
        exact
        path="/campaigns/:id/traces/new"
        render={props => (
          <EditTraceOld
            isNew
            balance={balance}
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            {...props}
          />
        )}
      />
      <Route
        exact
        path="/campaigns/:id/traces/propose"
        render={props => (
          <EditTraceOld
            isNew
            isProposed
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            balance={balance}
            {...props}
          />
        )}
      />
      <Route
        exact
        path={[
          ...getViewEntityPathsList('/campaigns/:id/milestones/:traceId'),
          ...getViewEntityPathsList('/campaigns/:id/traces/:traceId'),
        ]}
        render={props => <ViewTrace {...props} />}
      />
      <Route
        exact
        path={getViewEntityPathsList('/trace/:traceSlug')}
        render={props => <ViewTrace {...props} />}
      />
      <Route
        exact
        path={getViewEntityPathsList('/milestone/:traceSlug')}
        render={({ match }) => <Redirect to={`/trace/${match.params.traceSlug}`} />}
      />
      <Route
        exact
        path="/campaigns/:id/traces/:traceId/edit"
        render={props => (
          <EditTraceOld
            balance={balance}
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            {...props}
          />
        )}
      />
      <Route
        exact
        path="/campaigns/:id/traces/:traceId/edit/proposed"
        render={props => (
          <EditTraceOld
            balance={balance}
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            isProposed
            {...props}
          />
        )}
      />
      <Route exact path="/bounty/:traceId/edit" render={props => <EditBounty {...props} />} />
      <Route exact path="/expense/:traceId/edit" render={props => <EditExpense {...props} />} />
      <Route exact path="/payment/:traceId/edit" render={props => <EditPayment {...props} />} />
      <Route exact path="/milestone/:traceId/edit" render={props => <EditMilestone {...props} />} />
      <Route
        exact
        path="/campaigns/:id/traces"
        render={({ match }) => <Redirect to={`/campaigns/${match.params.id}`} />}
      />
      <Route exact path="/my-donations" render={() => <MyDonations />} />
      <Route exact path="/my-delegations" render={() => <MyDelegations />} />
      <Route exact path="/my-communities" render={() => <MyCommunities />} />
      <Route exact path="/my-dacs" render={() => <Redirect to="/my-communities/" />} />
      <Route exact path="/my-campaigns" render={() => <MyCampaigns />} />
      <Route exact path="/my-traces" render={() => <MyTraces />} />
      <Route exact path="/my-milestones" render={() => <Redirect to="/my-traces/" />} />

      <Route
        exact
        path="/profile"
        render={() => (
          <EditProfile
            balance={balance}
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
          />
        )}
      />
      <Route exact path="/profile/:userAddress" render={props => <Profile {...props} />} />
      <Route exact path="/" render={() => <Explore />} />
      <Route exact path="/traces" render={() => <TracesExplore />} />
      <Route exact path="/milestones" render={() => <Redirect to="/traces" />} />
      <Route exact path="/campaigns" render={() => <CampaignsExplore />} />
      <Route exact path="/communities" render={() => <CommunitiesExplore />} />
      <Route exact path="/dacs" render={() => <Redirect to="/communities" />} />
      <Route exact path="/sentry-test" render={() => <SentryTest />} />
      <Route component={NotFound} />
    </Switch>
  );
};

Routes.propTypes = {};

export default Routes;
