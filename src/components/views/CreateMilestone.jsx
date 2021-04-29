import React, { Fragment, memo, useContext, useEffect, useState } from 'react';
import { Button, Col, Form, notification, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import useCampaign from '../../hooks/useCampaign';
import { ANY_TOKEN, history, ZERO_ADDRESS } from '../../lib/helpers';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import LPMilestone from '../../models/LPMilestone';
import { Milestone } from '../../models';
import { MilestoneService } from '../../services';
import config from '../../configuration';
import { authenticateUser } from '../../lib/middleware';
import ErrorHandler from '../../lib/ErrorHandler';
import {
  MilestoneCampaignInfo,
  MilestoneDescription,
  MilestoneDonateToDac,
  MilestonePicture,
  MilestoneReviewer,
  MilestoneTitle,
} from '../EditMilestoneCommons';

function CreateMilestone(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const { id: campaignId, slug: campaignSlug } = props.match.params;

  const campaign = useCampaign(campaignId, campaignSlug);
  const [form] = Form.useForm();

  const [milestone, setMilestone] = useState({
    title: '',
    description: '',
    picture: '',
    donateToDac: true,
    hasReviewer: true,
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
    const authenticated = await authenticateUser(currentUser, false);

    if (authenticated) {
      if (userIsCampaignOwner && !isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      const { title, description, reviewerAddress, hasReviewer, picture } = milestone;
      const ms = new LPMilestone({
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

      if (milestone.donateToDac) {
        ms.dacId = config.defaultDacId;
      }

      if (!userIsCampaignOwner) {
        ms.status = Milestone.PROPOSED;
      }

      setLoading(true);

      await MilestoneService.save({
        milestone: ms,
        from: currentUser.address,
        afterSave: (created, txUrl, res) => {
          let notificationDescription;
          if (created) {
            if (!userIsCampaignOwner) {
              notificationDescription = 'Milestone proposed to the Campaign Owner';
            }
          } else if (txUrl) {
            notificationDescription = (
              <p>
                Your Milestone is pending....
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            );
          } else {
            notificationDescription = 'Your Milestone has been updated!';
          }

          if (description) {
            notification.info({ description: notificationDescription });
          }
          setLoading(false);
          history.push(`/campaigns/${campaign._id}/milestones/${res._id}`);
        },
        afterMined: (created, txUrl) => {
          notification.success({
            description: (
              <p>
                Your Milestone has been created!
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
      });
    }
  };

  return (
    <Fragment>
      <Web3ConnectWarning />

      <div id="create-milestone-view">
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
              form={form}
              scrollToFirstError={{
                block: 'center',
                behavior: 'smooth',
              }}
            >
              <div className="card-form-header">
                <img src={`${process.env.PUBLIC_URL}/img/milestone.png`} alt="milestone-logo" />
                <div className="title">Milestone</div>
              </div>

              <MilestoneCampaignInfo campaign={campaign} />

              <div className="section">
                <div className="title">Milestone details</div>

                <MilestoneTitle
                  value={milestone.title}
                  onChange={handleInputChange}
                  extra="What are you going to accomplish in this Milestone?"
                />

                <MilestoneDescription
                  value={milestone.description}
                  onChange={handleInputChange}
                  extra="Explain how you are going to do this successfully."
                  placeholder="Describe how you are going to execute this milestone successfully..."
                  id="description"
                />

                <MilestonePicture
                  setPicture={setPicture}
                  picture={milestone.picture}
                  milestoneTitle={milestone.title}
                />

                <MilestoneDonateToDac value={milestone.donateToDac} onChange={handleInputChange} />

                <MilestoneReviewer
                  toggleHasReviewer={handleInputChange}
                  setReviewer={setReviewer}
                  hasReviewer={milestone.hasReviewer}
                  milestoneReviewerAddress={milestone.reviewerAddress}
                  milestoneType="Milestone"
                />

                <div className="milestone-desc">
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
