import React, { Fragment, memo, useContext, useEffect, useState } from 'react';
import { Button, Col, Form, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import useCampaign from '../../hooks/useCampaign';
import { ANY_TOKEN, history, ZERO_ADDRESS } from '../../lib/helpers';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import LPTrace from '../../models/LPTrace';
import { Trace } from '../../models';
import config from '../../configuration';
import { authenticateUser } from '../../lib/middleware';
import {
  TraceCampaignInfo,
  TraceDescription,
  TraceDonateToCommunity,
  TraceReviewer,
  TraceTitle,
} from '../EditTraceCommons';
import UploadPicture from '../UploadPicture';
import { TraceSave } from '../../lib/traceSave';

function CreateMilestone(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const { id: campaignId, slug: campaignSlug } = props.match.params;

  const campaign = useCampaign(campaignId, campaignSlug);

  const [milestone, setMilestone] = useState({
    title: '',
    description: '',
    picture: '',
    donateToCommunity: true,
    hasReviewer: true,
    reviewerAddress: '',
  });

  const [loading, setLoading] = useState(false);
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);

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
  }, [campaign, currentUser]);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setMilestone({ ...milestone, [name]: checked });
    } else {
      setMilestone({ ...milestone, [name]: value });
    }
  };

  function setReviewer(_, option) {
    handleInputChange({
      target: { name: 'reviewerAddress', value: option.value },
    });
  }

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
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

      const { title, description, reviewerAddress, hasReviewer, picture } = milestone;
      const ms = new LPTrace({
        title,
        description,
        reviewerAddress: hasReviewer ? reviewerAddress : ZERO_ADDRESS,
        recipientId: campaign.projectId,
        token: ANY_TOKEN,
        image: picture,
      });

      ms.ownerAddress = currentUser.address;
      ms.campaignId = campaign._id;
      ms.parentProjectId = campaign.projectId;
      ms.formType = Trace.MILESTONETYPE;

      if (milestone.donateToCommunity) {
        ms.communityId = config.defaultCommunityId;
      }

      if (!userIsCampaignOwner) {
        ms.status = Trace.PROPOSED;
      }

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
              title="Create New Milestone"
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
                <img src={`${process.env.PUBLIC_URL}/img/milestone.png`} alt="milestone-logo" />
                <div className="title">Milestone</div>
              </div>

              <TraceCampaignInfo campaign={campaign} />

              <div className="section">
                <div className="title">Milestone details</div>

                <TraceTitle
                  value={milestone.title}
                  onChange={handleInputChange}
                  extra="What are you going to accomplish in this Milestone?"
                />

                <TraceDescription
                  value={milestone.description}
                  onChange={handleInputChange}
                  extra="Explain how you are going to do this successfully."
                  placeholder="Describe how you are going to execute this milestone successfully..."
                  id="description"
                />

                <UploadPicture
                  setPicture={setPicture}
                  picture={milestone.picture}
                  imgAlt={milestone.title}
                />

                <TraceDonateToCommunity
                  value={milestone.donateToCommunity}
                  onChange={handleInputChange}
                />

                <TraceReviewer
                  toggleHasReviewer={handleInputChange}
                  setReviewer={setReviewer}
                  hasReviewer={milestone.hasReviewer}
                  traceReviewerAddress={milestone.reviewerAddress}
                  traceType="Milestone"
                />

                <div className="trace-desc">
                  Contributions to this milestone will be sent directly to the
                  <strong>{` ${campaign && campaign.title} `}</strong>
                  Campaign address. As a preventative measure, please confirm that someone working
                  on the project has access to funds that are sent to this address!
                </div>
              </div>
              <Form.Item>
                <Button block size="large" type="primary" htmlType="submit" loading={loading}>
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

CreateMilestone.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const isEqual = (prevProps, nextProps) =>
  prevProps.match.params.id === nextProps.match.params.id &&
  prevProps.match.params.slug === nextProps.match.params.slug;

export default memo(CreateMilestone, isEqual);
