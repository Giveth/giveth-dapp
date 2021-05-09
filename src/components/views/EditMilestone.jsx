import React, { Fragment, memo, useContext, useEffect, useState } from 'react';
import { Button, Col, Form, notification, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';

import { ANY_TOKEN, history, isOwner, ZERO_ADDRESS } from '../../lib/helpers';
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

function EditMilestone(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const { milestoneId } = props.match.params;

  const [image, setImage] = useState('');
  const [campaign, setCampaign] = useState();
  const [hasReviewer, setHasReviewer] = useState(true);
  const [donateToDac, setDonateToDac] = useState(true);
  const [milestone, setMilestone] = useState({
    title: '',
    description: '',
    donateToDac: true,
    reviewerAddress: '',
    image: '',
  });
  const [initialValues, setInitialValues] = useState({
    title: '',
    description: '',
    donateToDac: true,
    reviewerAddress: '',
    image: '',
  });

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);

  function goBack() {
    history.goBack();
  }

  useEffect(() => {
    if (currentUser.id) {
      MilestoneService.get(milestoneId)
        .then(res => {
          if (
            res.formType !== Milestone.MILESTONETYPE ||
            !(
              isOwner(res.owner.address, currentUser) ||
              isOwner(res.campaign.ownerAddress, currentUser)
            ) ||
            res.donationCounters.length > 0
          ) {
            goBack();
          } else {
            const iValues = {
              title: res.title,
              description: res.description,
              recipientAddress: res.recipientAddress,
              reviewerAddress: res.reviewerAddress,
              image: res.image,
              donateToDac: !!res.dacId,
            };
            const imageUrl = res.image ? res.image.match(/\/ipfs\/.*/)[0] : '';
            setInitialValues(iValues);
            setDonateToDac(!!res.dacId);
            setMilestone(res);
            setImage(imageUrl);
            setCampaign(res.campaign);
          }
        })
        .catch(err => {
          const message = `Sadly we were unable to load the requested Milestone details. Please try again.`;
          ErrorHandler(err, message);
        });
    }
  }, [currentUser.id]);

  useEffect(() => {
    setUserIsOwner(
      campaign &&
        currentUser.address &&
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
    );
  }, [campaign, currentUser]);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    const ms = milestone;
    if (type === 'checkbox' && name === 'hasReviewer') {
      setHasReviewer(checked);
    } else if (type === 'checkbox' && name === 'donateToDac') {
      setDonateToDac(checked);
    } else if (name === 'image') {
      setImage(value);
    } else {
      ms[name] = value;
      setMilestone(ms);
    }
  };

  function setReviewer(_, option) {
    handleInputChange({
      target: { name: 'reviewerAddress', value: option.value },
    });
  }

  function setPicture(address) {
    handleInputChange({ target: { name: 'image', value: address } });
  }

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false);
    if (!authenticated) {
      return;
    }

    if (userIsCampaignOwner && !isForeignNetwork) {
      displayForeignNetRequiredWarning();
      return;
    }

    const { description, reviewerAddress } = milestone;
    const ms = new LPMilestone(milestone);

    ms.token = ANY_TOKEN;
    ms.image = image;
    ms.recipientId = campaign.projectId.toString();
    ms.reviewerAddress = hasReviewer ? reviewerAddress : ZERO_ADDRESS;
    ms.ownerAddress = currentUser.address;
    ms.campaignId = campaign._id;
    ms.formType = Milestone.MILESTONETYPE;
    ms.parentProjectId = campaign.projectId;
    ms.dacId = donateToDac ? config.defaultDacId : 0;

    if (milestone.status) {
      ms.status =
        !userIsCampaignOwner || milestone.status === Milestone.REJECTED
          ? Milestone.PROPOSED
          : milestone.status;
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
              Your Milestone has been updated!
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
  };

  const milestoneHasFunded =
    milestone && milestone.donationCounters && milestone.donationCounters.length > 0;

  const isProposed =
    milestone &&
    milestone.status &&
    [Milestone.PROPOSED, Milestone.REJECTED].includes(milestone.status);

  return (
    <Fragment>
      <Web3ConnectWarning />

      <div id="create-milestone-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header"
              onBack={goBack}
              title="Edit Milestone"
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            {campaign && (
              <Form
                className="card-form"
                requiredMark
                onFinish={submit}
                form={form}
                scrollToFirstError={{
                  block: 'center',
                  behavior: 'smooth',
                }}
                initialValues={initialValues}
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
                    disabled={milestoneHasFunded}
                  />

                  <MilestoneDescription
                    value={milestone.description}
                    onChange={handleInputChange}
                    extra="Explain how you are going to do this successfully."
                    placeholder="Describe how you are going to execute this milestone successfully..."
                    id="description"
                    disabled={milestoneHasFunded}
                  />

                  <MilestonePicture
                    setPicture={setPicture}
                    picture={image}
                    milestoneTitle={milestone.title}
                  />

                  <MilestoneDonateToDac
                    value={donateToDac}
                    onChange={handleInputChange}
                    disabled={!isProposed}
                  />

                  <MilestoneReviewer
                    toggleHasReviewer={handleInputChange}
                    setReviewer={setReviewer}
                    hasReviewer={hasReviewer}
                    milestoneReviewerAddress={milestone.reviewerAddress}
                    milestoneType="Milestone"
                    initialValue={initialValues.reviewerAddress}
                    disabled={!isProposed}
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
                    Update Milestone
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        </Row>
      </div>
    </Fragment>
  );
}

EditMilestone.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const isEqual = (prevProps, nextProps) =>
  prevProps.match.params.milestoneId === nextProps.match.params.milestoneId;

export default memo(EditMilestone, isEqual);
