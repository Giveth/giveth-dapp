import React, { memo, useContext, useEffect, useState, Fragment } from 'react';
import { Button, Col, Form, notification, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import useCampaign from '../../hooks/useCampaign';
import {
  TraceCampaignInfo,
  TraceDescription,
  TraceDonateToCommunity,
  TraceReviewer,
  TraceTitle,
} from '../EditTraceCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import { authenticateUser } from '../../lib/middleware';
import { ANY_TOKEN, history, ZERO_ADDRESS } from '../../lib/helpers';
import config from '../../configuration';
import { Trace } from '../../models';
import { TraceService } from '../../services';
import ErrorHandler from '../../lib/ErrorHandler';
import Web3ConnectWarning from '../Web3ConnectWarning';
import BridgedTrace from '../../models/BridgedTrace';
import { sendAnalyticsTracking } from '../../lib/SegmentAnalytics';

function CreateBounty(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const { id: campaignId, slug: campaignSlug } = props.match.params;

  const campaign = useCampaign(campaignId, campaignSlug);
  const [bounty, setBounty] = useState({
    title: '',
    description: '',
    recipientAddress: ZERO_ADDRESS,
    picture: '/img/bountyProject.png',
    donateToCommunity: true,
    reviewerAddress: '',
  });

  const [loading, setLoading] = useState(false);
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);

  useEffect(() => {
    setUserIsOwner(
      campaign &&
        currentUser.address &&
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
    );
  }, [campaign, currentUser]);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setBounty({ ...bounty, [name]: checked });
    } else {
      setBounty({ ...bounty, [name]: value });
    }
  };

  function setReviewer(_, option) {
    handleInputChange({
      target: { name: 'reviewerAddress', value: option.value },
    });
  }

  function goBack() {
    history.goBack();
  }

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false, web3);

    if (authenticated) {
      if (userIsCampaignOwner && !isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      const { title, description, reviewerAddress, picture, recipientAddress } = bounty;
      const ms = new BridgedTrace({
        title,
        description,
        reviewerAddress,
        recipientAddress,
        token: ANY_TOKEN,
        image: picture,
      });

      ms.ownerAddress = currentUser.address;
      ms.campaignId = campaign._id;
      ms.parentProjectId = campaign.projectId;
      ms.formType = Trace.BOUNTYTYPE;

      if (bounty.donateToCommunity) {
        ms.communityId = config.defaultCommunityId;
      }

      if (!userIsCampaignOwner) {
        ms.status = Trace.PROPOSED;
      }

      setLoading(true);

      await TraceService.save({
        trace: ms,
        from: currentUser.address,
        afterSave: (created, txUrl, res) => {
          let notificationDescription;
          const analyticsData = {
            traceId: res._id,
            slug: res.slug,
            parentCampaignAddress: campaign.ownerAddress,
            traceRecipientAddress: res.recipientAddress,
            title: ms.title,
            ownerAddress: ms.ownerAddress,
            traceType: ms.formType,
            parentCampaignId: campaign.id,
            parentCampaignTitle: campaign.title,
            reviewerAddress: ms.reviewerAddress,
            userAddress: currentUser.address,
          };
          if (created) {
            if (!userIsCampaignOwner) {
              notificationDescription = 'Bounty proposed to the Campaign Owner';
              sendAnalyticsTracking('Trace Create', {
                action: 'proposed',
                ...analyticsData,
              });
            }
          } else if (txUrl) {
            notificationDescription = (
              <p>
                Your Bounty is pending....
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            );
            sendAnalyticsTracking('Trace Create', {
              action: 'created',
              ...analyticsData,
            });
          } else {
            const notificationError =
              'It seems your Bounty has been updated!, this should not be happened';
            notification.error({ description: notificationError });
          }

          if (notificationDescription) {
            notification.info({ description: notificationDescription });
          }
          setLoading(false);
          history.push(`/campaigns/${campaign._id}/traces/${res._id}`);
        },
        afterMined: (created, txUrl) => {
          notification.success({
            description: (
              <p>
                Your Bounty has been created!
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            ),
          });
        },
        onError(message, err) {
          setLoading(false);
          return ErrorHandler(err, message);
        },
        web3,
      });
    }
  };

  return (
    <Fragment>
      <Web3ConnectWarning />
      <div id="create-trace-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header"
              onBack={goBack}
              title="Create New Bounty"
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            <Form
              className="card-form"
              requiredMark
              onFinish={submit}
              scrollToFirstError={{
                block: 'center',
                behavior: 'smooth',
              }}
            >
              <div className="card-form-header">
                <img src={`${process.env.PUBLIC_URL}/img/bounty.png`} alt="bounty-logo" />
                <div className="title">Bounty</div>
              </div>

              <TraceCampaignInfo campaign={campaign} />

              <div className="section">
                <div className="title">Bounty details</div>

                <TraceTitle
                  value={bounty.title}
                  onChange={handleInputChange}
                  extra="What is this Bounty about?"
                />

                <TraceDescription
                  value={bounty.description}
                  onChange={handleInputChange}
                  extra="Explain the requirements and what success looks like."
                  placeholder="Describe the Bounty and define the acceptance criteria..."
                  id="description"
                />

                <TraceDonateToCommunity
                  value={bounty.donateToCommunity}
                  onChange={handleInputChange}
                />

                <TraceReviewer
                  traceType="Bounty"
                  setReviewer={setReviewer}
                  hasReviewer
                  traceReviewerAddress={bounty.reviewerAddress}
                />
              </div>

              <div className="trace-desc">
                Your bounty will collect funds in any currency. The total amount collected will be
                the Bounty Reward.
              </div>

              <Form.Item>
                <Button htmlType="submit" loading={loading} block size="large" type="primary">
                  {userIsCampaignOwner ? 'Create' : 'Propose'}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Row>
      </div>
    </Fragment>
  );
}

CreateBounty.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string,
      traceId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const isEqual = (prevProps, nextProps) =>
  prevProps.match.params.id === nextProps.match.params.id &&
  prevProps.match.params.slug === nextProps.match.params.slug;

export default memo(CreateBounty, isEqual);
