import React, { memo, useContext, useEffect, useState, Fragment } from 'react';
import { Button, Col, Form, notification, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import {
  MilestoneCampaignInfo,
  MilestoneDescription,
  MilestoneDonateToDac,
  MilestoneReviewer,
  MilestoneTitle,
} from '../EditMilestoneCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import { authenticateUser } from '../../lib/middleware';
import { ANY_TOKEN, history, isOwner, ZERO_ADDRESS } from '../../lib/helpers';
import config from '../../configuration';
import { Milestone } from '../../models';
import { MilestoneService } from '../../services';
import ErrorHandler from '../../lib/ErrorHandler';
import Web3ConnectWarning from '../Web3ConnectWarning';
import BridgedMilestone from '../../models/BridgedMilestone';

function EditBounty(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const { milestoneId } = props.match.params;

  const [campaign, setCampaign] = useState();
  const [donateToDac, setDonateToDac] = useState(true);
  const [milestone, setMilestone] = useState({
    title: '',
    description: '',
    donateToDac: true,
    reviewerAddress: '',
  });
  const [initialValues, setInitialValues] = useState({
    title: '',
    description: '',
    donateToDac: true,
    reviewerAddress: '',
  });

  const isNew = milestoneId === undefined;

  function goBack() {
    history.goBack();
  }

  useEffect(() => {
    if (!isNew && currentUser.id) {
      MilestoneService.get(milestoneId)
        .then(res => {
          if (
            res.formType !== Milestone.BOUNTYTYPE ||
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
              reviewerAddress: res.reviewerAddress,
              donateToDac: !!res.dacId,
            };
            setInitialValues(iValues);
            setDonateToDac(!!res.dacId);
            setMilestone(res);
            setCampaign(res.campaign);
          }
        })
        .catch(err => {
          const message = `Sadly we were unable to load the requested Milestone details. Please try again.`;
          ErrorHandler(err, message);
        });
    }
  }, [currentUser.id]);

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
    const ms = milestone;
    if (type === 'checkbox') {
      setDonateToDac(checked);
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

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false);
    if (!authenticated) {
      return;
    }

    if (userIsCampaignOwner && !isForeignNetwork) {
      displayForeignNetRequiredWarning();
      return;
    }

    const { description } = milestone;
    const ms = new BridgedMilestone(milestone);

    ms.token = ANY_TOKEN;
    ms.image = '/img/bountyProject.png';
    ms.campaignId = campaign._id;
    ms.parentProjectId = campaign.projectId;
    ms.dacId = donateToDac ? config.defaultDacId : 0;
    ms.formType = Milestone.BOUNTYTYPE;
    ms.ownerAddress = currentUser.address;
    ms.recipientAddress = ZERO_ADDRESS;

    if (!userIsCampaignOwner && isNew) {
      ms.status = Milestone.PROPOSED;
    }
    // make sure not to change status!
    if (!isNew && milestone.status) {
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
            notificationDescription = 'Bounty proposed to the campaign owner';
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
        } else {
          notificationDescription = 'Your Bounty has been updated!';
        }

        if (description) {
          notification.info({ description: notificationDescription });
        }
        setLoading(false);
        history.push(`/campaigns/${campaign._id}/milestones/${res._id}`);
      },
      afterMined: (created, txUrl) => {
        if (created) {
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
        } else {
          notification.success({
            description: (
              <p>
                Your Bounty has been updated!
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            ),
          });
        }
      },
      onError(message, err) {
        setLoading(false);
        return ErrorHandler(err, message);
      },
    });
  };

  // To set the correct initial values for the form in editing mode
  const toLoadForm = isNew || (!isNew && campaign);

  const btnText = () => {
    if (!isNew) {
      return 'Update Bounty';
    }
    if (userIsCampaignOwner) {
      return 'Create';
    }
    return 'Propose';
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
              title={isNew ? 'Create New Bounty' : 'Edit Bounty'}
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            {toLoadForm && (
              <Form
                className="card-form"
                requiredMark
                onFinish={submit}
                scrollToFirstError={{
                  block: 'center',
                  behavior: 'smooth',
                }}
                initialValues={initialValues}
              >
                <div className="card-form-header">
                  <img src={`${process.env.PUBLIC_URL}/img/bounty.png`} alt="bounty-logo" />
                  <div className="title">Bounty</div>
                </div>

                <MilestoneCampaignInfo campaign={campaign} />

                <div className="section">
                  <div className="title">Bounty details</div>

                  <MilestoneTitle
                    value={milestone.title}
                    onChange={handleInputChange}
                    extra="What is this Bounty about?"
                    disabled={milestoneHasFunded}
                  />

                  <MilestoneDescription
                    value={milestone.description}
                    onChange={handleInputChange}
                    extra="Explain the requirements and what success looks like."
                    placeholder="Describe the Bounty and define the acceptance criteria..."
                    id="description"
                    disabled={milestoneHasFunded}
                  />

                  <MilestoneDonateToDac
                    value={donateToDac}
                    onChange={handleInputChange}
                    disabled={!isNew && !isProposed}
                  />

                  <MilestoneReviewer
                    milestoneType="Bounty"
                    setReviewer={setReviewer}
                    hasReviewer
                    initialValue={!isNew ? initialValues.reviewerAddress : null}
                    milestoneReviewerAddress={milestone.reviewerAddress}
                    disabled={!isNew && !isProposed}
                  />
                </div>

                <div className="milestone-desc">
                  Your Bounty will collect funds in any currency. The total amount collected will be
                  the Bounty Reward.
                </div>

                <Form.Item>
                  <Button htmlType="submit" loading={loading} block size="large" type="primary">
                    {btnText()}
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

EditBounty.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string,
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const isEqual = (prevProps, nextProps) =>
  prevProps.match.params.id === nextProps.match.params.id &&
  prevProps.match.params.slug === nextProps.match.params.slug;

export default memo(EditBounty, isEqual);
