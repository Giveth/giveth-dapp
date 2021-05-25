import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { updateSubscription, inquirySubscriptionStatus } from '../services/subscriptionService';
import ErrorHandler from '../lib/ErrorHandler';
import { authenticateUser } from '../lib/middleware';

function ProjectSubscription({ projectTypeId, projectType }) {
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleSubscription = async enabled => {
    const authenticated = await authenticateUser(currentUser, false);
    if (!authenticated) {
      return;
    }
    setLoading(true);
    try {
      const result = await updateSubscription({
        projectTypeId,
        projectType,
        enabled,
      });
      setSubscribed(result.enabled);
      React.toast.success(
        enabled
          ? 'You have been subscribed successfully'
          : 'You have been unsubscribed successfully',
      );
    } catch (err) {
      ErrorHandler(err, 'Something wrong in updating subscription, please try later');
    } finally {
      setLoading(false);
    }
  };

  useEffect(async () => {
    if (!currentUser) {
      return;
    }
    const isSubscribed = await inquirySubscriptionStatus({
      projectTypeId,
      userAddress: currentUser.address,
    });
    setSubscribed(isSubscribed);
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="project-subscription  vertical-align flex-row">
        <span className="flex-grow-1">
          Get notifications whenever there is an activity in this {projectType}
        </span>
        {!subscribed && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              toggleSubscription(true);
            }}
            className="btn btn-outline-primary  btn-lg mx-2 btn-update-role fa fa-bell"
          >
            {/* {authenticated ? 'Update' : 'Sign In to Update'} */}
            &nbsp;&nbsp;Subscribe
          </button>
        )}
        {subscribed && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              toggleSubscription(false);
            }}
            // className="btn btn-primary btn-lg mx-2 btn-update-role"
            className="btn btn-outline-primary btn-lg mx-2 btn-update-role  fa fa-bell-slash"
          >
            {/* {authenticated ? 'Update' : 'Sign In to Update'} */}
            &nbsp;&nbsp;Unsubscribe
          </button>
        )}
      </div>
    </div>
  );
}

ProjectSubscription.propTypes = {
  projectTypeId: PropTypes.string,
  projectType: PropTypes.oneOf(['campaign', 'trace', 'community']),
};

ProjectSubscription.defaultProps = {
  projectTypeId: '',
  projectType: '',
};

export default React.memo(ProjectSubscription);
