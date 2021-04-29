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
import DACService from '../services/DACService';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import DAC from '../models/DAC';
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

  const style = {
    display: 'inline-block',
  };

  return (
    <span style={style}>
      <Button ref={ref} type="donate" className={className} onClick={doDonate}>
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
    </span>
  );
});

const modelTypes = PropTypes.shape({
  type: PropTypes.string.isRequired,
  adminId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  id: PropTypes.string.isRequired,
  dacId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string.isRequired,
  campaignId: PropTypes.string,
  token: PropTypes.shape({}),
  acceptsSingleToken: PropTypes.bool,
  ownerAddress: PropTypes.string,
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
};

DonateButton.defaultProps = {
  maxDonationAmount: undefined, // new BigNumber(10000000000000000),
  afterSuccessfulDonate: () => {},
  match: undefined,
  autoPopup: false,
  className: '',
};

const DonateButtonWithRouter = withRouter(React.memo(DonateButton));

const Root = props => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const defaultDacDonateButton = useRef();

  const [defaultDacModel, setDefaultDacModel] = useState(undefined);

  const { model, className } = props;

  useEffect(() => {
    const { defaultDacId } = config;
    if (defaultDacId) {
      if (model.type !== DAC.type || Number(model.adminId) !== defaultDacId) {
        DACService.getByDelegateId(defaultDacId).then(defaultDac => {
          if (defaultDac) {
            const dacModel = {
              type: DAC.type,
              title: defaultDac.title,
              id: defaultDac.id,
              token: { symbol: config.nativeTokenName },
              adminId: defaultDac.delegateId,
            };

            setDefaultDacModel(dacModel);
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
      } else if (defaultDacModel) {
        // Thanks and Donate to Defualt DAC suggestion
        React.swal({
          title: 'Thank you!',
          text: 'Would you like to support Giveth as well?',
          icon: 'success',
          buttons: ['No Thanks', 'Support Giveth'],
        }).then(result => {
          if (result) {
            defaultDacDonateButton.current.click();
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
    defaultDacModel,
    customThanksMessage,
  ]);

  return (
    <Fragment>
      <DonateButtonWithRouter afterSuccessfulDonate={afterSuccessfulDonateMemorized} {...props} />
      {defaultDacModel && (
        <div style={{ display: 'none' }}>
          <DonateButton
            model={defaultDacModel}
            ref={defaultDacDonateButton}
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
