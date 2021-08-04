import React, { useContext, useEffect, useState, Fragment } from 'react';
import Avatar from 'react-avatar';
import { Link, useLocation } from 'react-router-dom';
import { withRouter } from 'react-router';
import { Menu, Grid } from 'antd';

import { Context as UserContext } from '../../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../../contextProviders/Web3Provider';
import { Context as WhiteListContext } from '../../../contextProviders/WhiteListProvider';
import MenuBarCreateButton from '../../MenuBarCreateButton';
import TotalGasPaid from '../../views/TotalGasPaid';
import TraceService from '../../../services/TraceService';
import DonationService from '../../../services/DonationService';
import ErrorPopup from '../../ErrorPopup';
import LoadProjectsInfo from '../../views/myDelegations/LoadProjectsInfo';
import GetDonations from '../../views/myDelegations/GetDonations';
import Campaign from '../../../models/Campaign';
import ErrorHandler from '../../../lib/ErrorHandler';
import CampaignService from '../../../services/CampaignService';
import CommunityService from '../../../services/CommunityService';
import { shortenAddress } from '../../../lib/helpers';

const { SubMenu } = Menu;
const { useBreakpoint } = Grid;

const RightMenu = () => {
  const { lg } = useBreakpoint();
  const [selectedKeys, setSelectedKeys] = useState('');
  const [userTotalTraces, setUserTotalTraces] = useState(0);
  const [userTotalDelegations, setUserTotalDelegations] = useState();
  const [userTotalDonations, setUserTotalDonations] = useState();
  const [userTotalCampaigns, setUserTotalCampaigns] = useState();
  const [userTotalCommunities, setUserTotalCommunities] = useState();

  const MenuBarCreateButtonWithRouter = withRouter(MenuBarCreateButton);

  const {
    state: { currentUser },
  } = useContext(UserContext);

  const {
    state: { isEnabled, validProvider, web3 },
    actions: { enableProvider, initOnBoard, switchWallet },
  } = useContext(Web3Context);

  const {
    state: { reviewerWhitelistEnabled, delegateWhitelistEnabled, projectOwnersWhitelistEnabled },
  } = useContext(WhiteListContext);

  const userIsDelegator = currentUser.isDelegator || !delegateWhitelistEnabled;
  const userIsCampaignManager = currentUser.isProjectOwner || !projectOwnersWhitelistEnabled;
  const userIsReviewer = currentUser.isReviewer || !reviewerWhitelistEnabled;
  const userAddress = currentUser.address;

  const { pathname } = useLocation();

  const getUserTraces = () => {
    TraceService.getUserTraces({
      ownerAddress: userAddress,
      recipientAddress: userAddress,
      skipPages: 0,
      itemsPerPage: 0,
      onResult: resp => {
        setUserTotalTraces(resp.total);
      },
      onError: err => {
        ErrorPopup('Something went wrong on getting user Traces!', err);
      },
    }).then();
  };

  const getUserDonations = () => {
    DonationService.getUserDonations({
      currentUser,
      itemsPerPage: 0,
      skipPages: 0,
      subscribe: false,
      onResult: resp => {
        setUserTotalDonations(resp.total);
      },
      onError: err => {
        ErrorPopup('Something went wrong on getting user donations!', err);
      },
    });
  };

  const getUserDelegations = () => {
    LoadProjectsInfo({ userAddress, noTraces: true })
      .then(resArray => {
        const communities = resArray[0].data;
        const campaigns = resArray[1].data.map(c => new Campaign(c));
        GetDonations({
          userAddress,
          communities,
          campaigns,
          itemsPerPage: 0,
          skipPages: 0,
          onResult: resp => setUserTotalDelegations(resp.total),
          onError: err => {
            const message = `Error in fetching delegations info. ${err}`;
            ErrorHandler(err, message);
          },
        });
      })
      .catch(err => {
        const message = `Unable to load Communities, Campaigns or Traces. ${err}`;
        ErrorHandler(err, message);
      });
  };

  const getUserCommunities = () => {
    CommunityService.getUserCommunities(
      userAddress,
      0,
      0,
      communities => setUserTotalCommunities(communities.total),
      err => {
        const message = `Something went wrong on getting user Communities! ${err}`;
        ErrorHandler(err, message);
      },
    );
  };

  const getUserCampaigns = () => {
    CampaignService.getUserCampaigns(
      userAddress,
      0,
      0,
      camp => setUserTotalCampaigns(camp.total),
      err => {
        const message = `Something went wrong on getting user Campaigns! ${err}`;
        ErrorHandler(err, message);
      },
    );
  };

  useEffect(() => {
    const userAddressLC = userAddress && userAddress.toLowerCase();
    switch (true) {
      case pathname === '/profile':
      case pathname.toLowerCase() === `/profile/${userAddressLC}`:
        setSelectedKeys('profile:1');
        break;

      case pathname === '/my-traces':
        setSelectedKeys('profile:2');
        break;

      case pathname === '/my-donations':
        setSelectedKeys('profile:3');
        break;

      case pathname === '/my-delegations':
        setSelectedKeys('profile:4');
        break;

      case pathname === '/my-communities':
        setSelectedKeys('profile:5');
        break;

      case pathname === '/my-campaigns':
        setSelectedKeys('profile:6');
        break;

      default:
        setSelectedKeys('');
    }
  }, [pathname, userAddress]);

  useEffect(() => {
    if (userAddress) {
      getUserTraces();
      getUserDelegations();
      getUserDonations();
      getUserCampaigns();
      getUserCommunities();
    }
  }, [userAddress]);

  let walletIcon;
  if (web3 && web3.MetaMask) {
    walletIcon = `${process.env.PUBLIC_URL}/img/MetaMask.png`;
  } else if (web3 && web3.Torus) walletIcon = `${process.env.PUBLIC_URL}/img/Torus.svg`;

  return (
    <Menu selectedKeys={[selectedKeys]} mode={lg ? 'horizontal' : 'inline'}>
      <Menu.Item key="CreateButton">
        <MenuBarCreateButtonWithRouter />
      </Menu.Item>

      {currentUser.address && (
        <Menu.Item key="userAddress">
          <button type="button" className="btn btn-outline-success btn-sm" onClick={switchWallet}>
            {walletIcon && <Avatar className="mr-2" size={25} src={walletIcon} />}
            <span>{shortenAddress(currentUser.address)}</span>
          </button>
        </Menu.Item>
      )}

      {validProvider && currentUser.address && (
        <SubMenu
          key="profile"
          title={
            <Fragment>
              {currentUser.avatar && (
                <Avatar className="mr-2" size={30} src={currentUser.avatar} round />
              )}
              <span>{currentUser.name ? currentUser.name : 'Hi, you!'}</span>
            </Fragment>
          }
        >
          <Menu.Item
            key="profile:1"
            className="mt-0"
            style={{
              borderBottom: '1px solid #EAEBEE',
              paddingBottom: '44px',
              paddingTop: '6px',
            }}
          >
            <Link to="/profile">{currentUser.name ? 'Profile' : 'Register Here!'}</Link>
          </Menu.Item>
          <Menu.Item key="profile:2">
            <Link className="d-flex justify-content-between" to="/my-traces">
              My Traces<span>{userTotalTraces}</span>
            </Link>
          </Menu.Item>
          <Menu.Item key="profile:3">
            <Link className="d-flex justify-content-between" to="/my-donations">
              My Donations<span>{userTotalDonations}</span>
            </Link>
          </Menu.Item>
          <Menu.Item key="profile:4">
            <Link className="d-flex justify-content-between" to="/my-delegations">
              My Delegations<span>{userTotalDelegations}</span>
            </Link>
          </Menu.Item>
          {(userIsDelegator || userIsReviewer) && (
            <Menu.Item key="profile:5">
              <Link className="d-flex justify-content-between" to="/my-communities">
                My Communities<span>{userTotalCommunities}</span>
              </Link>
            </Menu.Item>
          )}
          {(userIsCampaignManager || userIsReviewer) && (
            <Menu.Item key="profile:6">
              <Link className="d-flex justify-content-between" to="/my-campaigns">
                My Campaigns<span>{userTotalCampaigns}</span>
              </Link>
            </Menu.Item>
          )}
          <Menu.Item className="p-0 mb-0" style={{ height: '70px' }}>
            <TotalGasPaid gasPaidUsdValue={currentUser.gasPaidUsdValue} className="menuGasPaid" />
          </Menu.Item>
        </SubMenu>
      )}

      {validProvider && !isEnabled && !currentUser.address && (
        <Menu.Item key="EnableWeb3">
          <button type="button" className="btn btn-outline-success btn-sm" onClick={enableProvider}>
            Connect Wallet
          </button>
        </Menu.Item>
      )}
      {validProvider && isEnabled && !currentUser.address && (
        <Menu.Item key="unlock">
          <small className="text-muted">Please unlock MetaMask</small>
        </Menu.Item>
      )}
      {!validProvider && (
        <Menu.Item key="SignUp">
          <button type="button" className="btn btn-outline-success btn-sm" onClick={initOnBoard}>
            Connect Wallet
          </button>
        </Menu.Item>
      )}
    </Menu>
  );
};

export default withRouter(RightMenu);
