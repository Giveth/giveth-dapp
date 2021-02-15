import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { CheckboxGroup, Form } from 'formsy-react-components';
import { User } from '../models';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { feathersClient } from '../lib/feathersClient';
import { actionWithLoggedIn } from '../lib/middleware';
import ErrorHandler from '../lib/ErrorHandler';

function ProfileUpdatePermission({ user }) {
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const [rolesInitValue, setRolesInitValue] = useState([]);

  const [changed, setChanged] = useState(false);
  const [loading, setLoading] = useState(false);

  const { authenticated } = currentUser;

  const roleAccessKeys = ['isReviewer', 'isProjectOwner', 'isDelegator'];

  const updateRolesInitValue = () => {
    setRolesInitValue(roleAccessKeys.filter(key => user[key]));
  };

  const multiOptions = [
    { label: 'DAC Owner', value: 'isDelegator' },
    { label: 'Campaign Owner', value: 'isProjectOwner' },
    { label: 'Reviewer', value: 'isReviewer' },
  ];

  const checkboxRef = useRef();

  const submitForm = data => {
    if (!authenticated) {
      React.signIn();
      return;
    }
    setLoading(true);
    setChanged(false);
    const mutation = {};
    const { roles = [] } = data;
    roleAccessKeys.forEach(key => {
      mutation[key] = roles.includes(key);
    });
    actionWithLoggedIn(currentUser).then(() => {
      feathersClient
        .service('users')
        .patch(user.address, mutation)
        .then(() => {
          React.toast.success('User permission is updated');
        })
        .catch(err => {
          ErrorHandler(err, 'Something wrong in updating user roles, please try later');
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  useEffect(() => {
    updateRolesInitValue();
  }, [user]);

  return (
    <Fragment>
      {currentUser.isAdmin && (
        <Fragment>
          <Form onSubmit={submitForm}>
            <div className="update-role-header">
              <h4>User Role</h4>
              <button
                type="submit"
                disabled={loading || (authenticated && !changed)}
                className="btn btn-primary btn-lg mx-2 btn-update-role"
              >
                {authenticated ? 'Update' : 'Sign In to Update'}
              </button>
            </div>
            <CheckboxGroup
              disabled={!authenticated || loading}
              name="roles"
              labelClassName={[{ 'col-sm-3': false }]}
              onChange={() => setChanged(true)}
              options={multiOptions}
              value={rolesInitValue}
              componentRef={component => {
                checkboxRef.current = component;
              }}
            />
          </Form>
        </Fragment>
      )}
    </Fragment>
  );
}

ProfileUpdatePermission.propTypes = {
  user: PropTypes.instanceOf(User).isRequired,
};

ProfileUpdatePermission.defaultProp = {
  user: {},
};

const isEqual = (prevProps, nextProps) => {
  return (
    prevProps.user.address === nextProps.user.address &&
    prevProps.user.isReviewer === nextProps.user.isReviewer &&
    prevProps.user.isProjectOwner === nextProps.user.isProjectOwner &&
    prevProps.user.isDelegator === nextProps.user.isDelegator
  );
};

export default React.memo(ProfileUpdatePermission, isEqual);
