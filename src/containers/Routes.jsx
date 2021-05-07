import React, { useContext } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

// views
import Profile from '../components/views/Profile';
// import UserWallet from '../components/views/UserWallet';
import EditProfile from '../components/views/EditProfile';

import ViewMilestone from '../components/views/ViewMilestone';
import EditDAC from '../components/views/EditDAC';
import ViewDAC from '../components/views/ViewDAC';
import Donations from '../components/views/Donations';
import Delegations from '../components/views/Delegations';
import MyDACs from '../components/views/MyDACs';
import MyCampaigns from '../components/views/MyCampaigns';
import MyMilestones from '../components/views/MyMilestones';
import NotFound from '../components/views/NotFound';
import Explore from '../components/views/Explore';
import Milestones from '../components/views/Milestones';
import Campaigns from '../components/views/Campaigns';
import DACs from '../components/views/DACs';

import ViewCampaign from '../components/views/ViewCampaign';
import EditMilestoneOld from '../components/views/EditMilestoneOld';

import MilestoneCreateOptionsMenu from '../components/views/MilestoneCreateOptionsMenu';
import CreatePayment from '../components/views/CreatePayment';
import CreateBounty from '../components/views/CreateBounty';
import CreateMilestone from '../components/views/CreateMilestone';
import CreateExpense from '../components/views/CreateExpense';
import EditBounty from '../components/views/EditBounty';
import EditMilestone from '../components/views/EditMilestone';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import EditCampaign from '../components/views/EditCampaign';

const Routes = () => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
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

      <Route
        exact
        path="/dacs/new"
        render={props => (
          <EditDAC
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
        path={getViewEntityPathsList('/dacs/:id')}
        render={props => <ViewDAC {...props} />}
      />
      <Route
        exact
        path={getViewEntityPathsList('/dac/:slug')}
        render={props => <ViewDAC {...props} />}
      />
      <Route
        exact
        path="/dacs/:id/edit"
        render={props => (
          <EditDAC
            balance={balance}
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            {...props}
          />
        )}
      />

      <Route
        exact
        path="/campaigns/new"
        render={props => (
          <EditCampaign
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
        path={getViewEntityPathsList('/campaigns/:id')}
        render={props => <ViewCampaign currentUser={currentUser} balance={balance} {...props} />}
      />
      <Route
        exact
        path={getViewEntityPathsList('/campaign/:slug')}
        render={props => <ViewCampaign currentUser={currentUser} balance={balance} {...props} />}
      />
      <Route
        exact
        path="/campaigns/:id/edit"
        render={props => (
          <EditCampaign
            balance={balance}
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            {...props}
          />
        )}
      />
      <Route
        exact
        path="/campaign/:slug/new"
        render={props => <MilestoneCreateOptionsMenu {...props} />}
      />
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
        path="/campaigns/:id/milestones/new"
        render={props => (
          <EditMilestoneOld
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
        path="/campaigns/:id/milestones/propose"
        render={props => (
          <EditMilestoneOld
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
        path={getViewEntityPathsList('/campaigns/:id/milestones/:milestoneId')}
        render={props => <ViewMilestone currentUser={currentUser} balance={balance} {...props} />}
      />
      <Route
        exact
        path={getViewEntityPathsList('/milestone/:milestoneSlug')}
        render={props => <ViewMilestone currentUser={currentUser} balance={balance} {...props} />}
      />
      <Route
        exact
        path="/campaigns/:id/milestones/:milestoneId/edit"
        render={props => (
          <EditMilestoneOld
            balance={balance}
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            {...props}
          />
        )}
      />
      <Route
        exact
        path="/campaigns/:id/milestones/:milestoneId/edit/proposed"
        render={props => (
          <EditMilestoneOld
            balance={balance}
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            isProposed
            {...props}
          />
        )}
      />
      <Route exact path="/bounty/:milestoneId/edit" render={props => <EditBounty {...props} />} />
      <Route
        exact
        path="/expense/:milestoneId/edit"
        render={props => <CreateExpense {...props} />}
      />
      <Route
        exact
        path="/payment/:milestoneId/edit"
        render={props => <CreatePayment {...props} />}
      />
      <Route
        exact
        path="/milestone/:milestoneId/edit"
        render={props => <EditMilestone {...props} />}
      />
      <Route
        exact
        path="/campaigns/:id/milestones"
        render={({ match }) => <Redirect to={`/campaigns/${match.params.id}`} />}
      />
      <Route
        exact
        path="/donations"
        render={props => (
          <Donations
            key={currentUser ? currentUser.id : 0}
            currentUser={currentUser}
            balance={balance}
            {...props}
          />
        )}
      />
      <Route
        exact
        path="/delegations"
        render={props => (
          <Delegations
            key={currentUser ? currentUser.id : 0}
            currentUser={currentUser}
            balance={balance}
            {...props}
          />
        )}
      />
      <Route
        exact
        path="/my-dacs"
        render={props => (
          <MyDACs
            key={currentUser ? currentUser.id : 0}
            currentUser={currentUser}
            balance={balance}
            {...props}
          />
        )}
      />
      <Route
        exact
        path="/my-campaigns"
        render={props => (
          <MyCampaigns
            key={currentUser ? currentUser.id : 0}
            currentUser={currentUser}
            balance={balance}
            {...props}
          />
        )}
      />
      <Route exact path="/my-milestones" render={() => <MyMilestones />} />

      {/* <Route
                                        exact
                                        path="/wallet"
                                        render={props => (
                                          <UserWallet
                                            currentUser={currentUser}
                                            // wallet={wallet}
                                            {...props}
                                          />
                                        )}
                                      /> */}
      <Route
        exact
        path="/profile"
        render={props => (
          <EditProfile
            balance={balance}
            isForeignNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            {...props}
          />
        )}
      />
      <Route exact path="/profile/:userAddress" render={props => <Profile {...props} />} />

      <Route exact path="/" render={props => <Explore {...props} />} />
      <Route exact path="/milestones" render={props => <Milestones {...props} />} />
      <Route exact path="/campaigns" render={() => <Campaigns />} />
      <Route exact path="/dacs" render={() => <DACs />} />

      <Route component={NotFound} />
    </Switch>
  );
};

Routes.propTypes = {};

export default Routes;
