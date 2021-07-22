import React, { useContext, useEffect, useState } from 'react';
import { Button, Modal } from 'antd';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

const Web3ConnectWarning = () => {
  const {
    state: { currentUser, isLoading: userIsLoading },
  } = useContext(UserContext);
  const {
    state: { validProvider },
    actions: { enableProvider },
  } = useContext(Web3Context);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // To stop blinking the modal before web3 prepared
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  useEffect(() => {
    // This component is just for the single case of user wallet being locked
    const visible = !isLoading && validProvider && !userIsLoading && !currentUser.address;
    let content = '';

    if (visible) {
      content = (
        <div className="text-center">
          <p className="text-left">
            It looks like your Ethereum Provider is locked or you need to enable it.
          </p>
          <Button
            className="ant-btn-lg ant-btn-donate mt-4"
            style={{ marginLeft: '-22px' }}
            onClick={enableProvider}
          >
            Enable Web3
          </Button>
        </div>
      );
      const modal = Modal.info({
        title: 'Wallet is not connected',
        content,
        visible,
        maskClosable: false,
        closable: false,
        centered: true,
        okButtonProps: { style: { display: 'none' } },
      });
      return () => modal.destroy();
    }
    return () => {};
  }, [validProvider, userIsLoading, currentUser.address, isLoading]);

  return null;
};

export default React.memo(Web3ConnectWarning);
