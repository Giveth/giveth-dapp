// eslint-disable-next-line max-classes-per-file
import React, {
  forwardRef,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';
import { withRouter } from 'react-router';
import { Button } from 'antd';

import config from '../configuration';
import CommunityService from '../services/CommunityService';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import Community from '../models/Community';
import { checkProfileAfterDonation } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';
import DonateButtonModal from './DonateButtonModal';

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    minWidth: '40%',
    maxWidth: '80%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'auto',
    maxHeight: '64%',
  },
};

Modal.setAppElement('#root');

const DonateButton = forwardRef((props, ref) => {
  const { model, autoPopup, className, match } = props;

  const {
    state: { isEnabled },
    actions: { enableProvider },
  } = useContext(Web3Context);

  const [modalVisible, setModalVisible] = useState(false);

  const doDonate = () => {
    if (!isEnabled) {
      enableProvider();
    }
    setModalVisible(true);
  };

  useEffect(() => {
    setTimeout(() => {
      if (autoPopup && match && typeof match.url === 'string' && match.url.endsWith('/donate')) {
        doDonate();
      }
    }, 1000);
  }, []);

  return (
    <Fragment>
      <Button
        type="donate"
        block
        onClick={doDonate}
        ref={ref}
        className={className}
        size={props.size}
        style={props.style}
      >
        Donate
      </Button>
      <Modal
        isOpen={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        shouldCloseOnOverlayClick={false}
        contentLabel={`Support this ${model.type}!`}
        style={modalStyles}
      >
        <DonateButtonModal {...props} setModalVisible={setModalVisible} />
      </Modal>
    </Fragment>
  );
});

const modelTypes = PropTypes.shape({
  type: PropTypes.string.isRequired,
  adminId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  id: PropTypes.string.isRequired,
  communityId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string.isRequired,
  campaignId: PropTypes.string,
  token: PropTypes.shape({}),
  acceptsSingleToken: PropTypes.bool,
  ownerAddress: PropTypes.string,
  customThanksMessage: PropTypes.string,
});

DonateButton.propTypes = {
  model: modelTypes.isRequired,
  maxDonationAmount: PropTypes.instanceOf(BigNumber),
  afterSuccessfulDonate: PropTypes.func,
  match: PropTypes.shape({
    path: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }),
  autoPopup: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  style: PropTypes.shape(),
};

DonateButton.defaultProps = {
  maxDonationAmount: undefined, // new BigNumber(10000000000000000),
  afterSuccessfulDonate: () => {},
  match: undefined,
  autoPopup: false,
  className: '',
  size: 'middle',
  style: {},
};

const DonateButtonWithRouter = withRouter(React.memo(DonateButton));

const Root = props => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const defaultCommunityDonateButton = useRef();

  const [defaultCommunityModel, setDefaultCommunityModel] = useState(undefined);

  const { model, className } = props;

  useEffect(() => {
    const { defaultCommunityId } = config;
    if (defaultCommunityId) {
      if (model.type !== Community.type || Number(model.adminId) !== defaultCommunityId) {
        CommunityService.getByDelegateId(defaultCommunityId).then(defaultCommunity => {
          if (defaultCommunity) {
            const communityModel = {
              type: Community.type,
              title: defaultCommunity.title,
              id: defaultCommunity.id,
              token: { symbol: config.nativeTokenName },
              adminId: defaultCommunity.delegateId,
            };

            setDefaultCommunityModel(communityModel);
          }
        });
      }
    }
  }, []);

  const { customThanksMessage } = model;
  const afterSuccessfulDonate = () => {
    const el = document.createElement('div');
    el.innerHTML = customThanksMessage;

    if (!currentUser || currentUser.name) {
      // known user
      if (typeof customThanksMessage !== 'undefined') {
        // Custom Thanks
        React.swal({
          title: 'Thank you!',
          content: el,
          icon: 'success',
          buttons: 'OK',
        });
      } else if (defaultCommunityModel) {
        // Thanks and Donate to Defualt Community suggestion
        React.swal({
          title: 'Thank you!',
          text: 'Would you like to support Giveth as well?',
          icon: 'success',
          buttons: ['No Thanks', 'Support Giveth'],
        }).then(result => {
          if (result) {
            defaultCommunityDonateButton.current.click();
          }
        });
      } else {
        // Simple Thanks
        React.swal({
          title: 'Thank you!',
          icon: 'success',
          buttons: 'OK',
        });
      }
    } else {
      //  Thanks for anon user (without profile) Register Suggestion
      checkProfileAfterDonation(currentUser);
    }
  };
  const afterSuccessfulDonateMemorized = useCallback(afterSuccessfulDonate, [
    currentUser,
    defaultCommunityModel,
    customThanksMessage,
  ]);

  return (
    <Fragment>
      <DonateButtonWithRouter afterSuccessfulDonate={afterSuccessfulDonateMemorized} {...props} />
      {defaultCommunityModel && (
        <div style={{ display: 'none' }}>
          <DonateButton
            model={defaultCommunityModel}
            ref={defaultCommunityDonateButton}
            autoPopup={false}
            className={className}
          />
        </div>
      )}
    </Fragment>
  );
};

Root.propTypes = {
  model: modelTypes.isRequired,
  autoPopup: PropTypes.bool,
  className: PropTypes.string,
};

Root.defaultProps = {
  autoPopup: false,
  className: '',
};

export default React.memo(Root);
