import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Checkbox, Button } from 'antd';
import { User } from '../models';
import { Context as UserContext } from '../contextProviders/UserProvider';
import { feathersClient } from '../lib/feathersClient';
import { authenticateUser } from '../lib/middleware';
import ErrorHandler from '../lib/ErrorHandler';
import { Context as Web3Context } from '../contextProviders/Web3Provider';

function ProfileUpdatePermission({ user, updateUser }) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { web3 },
  } = useContext(Web3Context);

  const [rolesInitValue, setRolesInitValue] = useState([]);
  const [changed, setChanged] = useState(false);
  const [loading, setLoading] = useState(false);

  const { authenticated } = currentUser;

  const roleAccessKeys = ['isReviewer', 'isProjectOwner', 'isDelegator'];

  const updateRolesInitValue = () => {
    setRolesInitValue(roleAccessKeys.filter(key => user[key]));
  };

  const setRoles = roles => {
    setRolesInitValue(roles);
    if (!changed) setChanged(true);
  };

  const multiOptions = [
    { label: 'Community Owner', value: 'isDelegator' },
    { label: 'Campaign Owner', value: 'isProjectOwner' },
    { label: 'Reviewer', value: 'isReviewer' },
  ];

  const submitForm = () => {
    if (!authenticated) {
      React.signIn();
      return;
    }
    setLoading(true);
    setChanged(false);
    const mutation = {};
    roleAccessKeys.forEach(key => {
      mutation[key] = rolesInitValue.includes(key);
    });
    authenticateUser(currentUser, false, web3).then(isAuthenticated => {
      if (!isAuthenticated) return;
      feathersClient
        .service('users')
        .patch(user.address, mutation)
        .then(newUser => {
          React.toast.success('User permission is updated');
          updateUser(new User(newUser));
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

  return currentUser.isAdmin ? (
    <Form onSubmit={submitForm} className="text-left">
      <div className="update-role-header">
        <h4>User Role</h4>
      </div>
      <Checkbox.Group
        options={multiOptions}
        name="roles"
        disabled={!authenticated || loading}
        value={rolesInitValue}
        onChange={setRoles}
      />
      <br />
      <Button
        onClick={submitForm}
        type="primary"
        disabled={loading || (authenticated && !changed)}
        className="ant-btn-lg mt-3"
        loading={loading}
      >
        {authenticated ? 'Update' : 'Sign In to Update'}
      </Button>
    </Form>
  ) : null;
}

ProfileUpdatePermission.propTypes = {
  user: PropTypes.instanceOf(User),
  updateUser: PropTypes.func,
};

ProfileUpdatePermission.defaultProps = {
  user: {},
  updateUser: () => {},
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
