import React, { memo, useContext, useEffect, useState, Fragment } from 'react';
import { Button, Col, Form, PageHeader, Row } from 'antd';
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
import Web3ConnectWarning from '../Web3ConnectWarning';
import BridgedTrace from '../../models/BridgedTrace';
import { TraceSave } from '../../lib/traceSave';

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

  function goBack() {
    history.goBack();
  }

  useEffect(() => {
    if (currentUser.address) {
      authenticateUser(currentUser, false, web3).then(auth => {
        if (!auth) history.goBack();
      });
    }

    setUserIsOwner(
      campaign &&
        currentUser.address &&
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
    );
  }, [campaign.id, currentUser.address]);

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

      if (bounty.donateToCommunity) ms.communityId = config.defaultCommunityId;

      if (!userIsCampaignOwner) ms.status = Trace.PROPOSED;

      setLoading(true);
      TraceSave({
        trace: ms,
        userIsCampaignOwner,
        campaign,
        web3,
        from: currentUser.address,
        afterSave: () => setLoading(false),
        onError: () => setLoading(false),
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
