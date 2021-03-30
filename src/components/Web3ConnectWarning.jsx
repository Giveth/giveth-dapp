import React, { useContext, useEffect } from 'react';
import { Modal } from 'antd';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

const Web3ConnectWarning = () => {
  const {
    state: { currentUser, isLoading: userIsLoading },
  } = useContext(UserContext);
  const {
    state: { validProvider },
  } = useContext(Web3Context);

  useEffect(() => {
    const visible = !validProvider || (!userIsLoading && !currentUser.address);
    let content = '';

    if (visible) {
      if (!validProvider) {
        content = (
          <p>
            Please install <a href="https://metamask.io/">MetaMask</a> to collaborate
          </p>
        );
      } else {
        content = 'It looks like your Ethereum Provider is locked or you need to enable it.';
      }
    }
    if (visible) {
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
  }, [validProvider, userIsLoading, currentUser.address]);

  return null;
};

export default React.memo(Web3ConnectWarning);
