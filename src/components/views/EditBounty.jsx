import React, { memo, useContext, useEffect, useState, Fragment } from 'react';
import { Button, Col, Form, notification, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
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
import { history, isOwner } from '../../lib/helpers';
import config from '../../configuration';
import { Trace } from '../../models';
import { TraceService } from '../../services';
import ErrorHandler from '../../lib/ErrorHandler';
import Web3ConnectWarning from '../Web3ConnectWarning';
import BridgedTrace from '../../models/BridgedTrace';

function EditBounty(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);
  const { traceId } = props.match.params;

  const [campaign, setCampaign] = useState();
  const [donateToCommunity, setDonateToCommunity] = useState(true);
  const [trace, setTrace] = useState();
  const [initialValues, setInitialValues] = useState({
    title: '',
    description: '',
    donateToCommunity: true,
    reviewerAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);

  const traceHasFunded = trace && trace.donationCounters && trace.donationCounters.length > 0;

  const isProposed =
    trace && trace.status && [Trace.PROPOSED, Trace.REJECTED].includes(trace.status);

  function goBack() {
    history.goBack();
  }

  const isEditNotAllowed = ms => {
    return (
      ms.formType !== Trace.BOUNTYTYPE ||
      !(
        isOwner(ms.owner.address, currentUser) ||
        isOwner(ms.campaign.ownerAddress, currentUser) ||
        isOwner(ms.campaign.coownerAddress, currentUser)
      ) ||
      ms.donationCounters.length > 0
    );
  };

  useEffect(() => {
    if (trace) {
      setUserIsOwner(
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
      );
      if (isEditNotAllowed(trace)) {
        ErrorHandler({}, 'You are not allowed to edit.');
        goBack();
      }
    } else if (currentUser.address) {
      TraceService.get(traceId)
        .then(res => {
          if (isEditNotAllowed(res)) {
            ErrorHandler({}, 'You are not allowed to edit.');
            goBack();
          } else {
            const iValues = {
              title: res.title,
              description: res.description,
              reviewerAddress: res.reviewerAddress,
              donateToCommunity: !!res.communityId,
            };
            const _campaign = res.campaign;
            setInitialValues(iValues);
            setDonateToCommunity(!!res.communityId);
            setTrace(res);
            setCampaign(_campaign);
            setUserIsOwner(
              [_campaign.ownerAddress, _campaign.coownerAddress].includes(currentUser.address),
            );
          }
        })
        .catch(err => {
          const message = `Sadly we were unable to load the requested Trace details. Please try again.`;
          ErrorHandler(err, message);
        });
    }
  }, [currentUser.address]);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    const ms = trace;
    if (type === 'checkbox') {
      setDonateToCommunity(checked);
    } else {
      ms[name] = value;
      setTrace(ms);
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

    const ms = new BridgedTrace(trace);

    ms.parentProjectId = campaign.projectId;
    ms.communityId = donateToCommunity ? config.defaultCommunityId : 0;
    ms.status = isProposed || trace.status === Trace.REJECTED ? Trace.PROPOSED : trace.status; // make sure not to change status!

    setLoading(true);
    await TraceService.save({
      trace: ms,
      from: currentUser.address,
      afterSave: (created, txUrl, res) => {
        let notificationDescription;
        const analyticsData = {
          formType: 'bounty',
          id: res._id,
          title: ms.title,
          campaignTitle: campaign.title,
        };

        if (created) {
          if (!userIsCampaignOwner) {
            notificationDescription = 'Bounty proposed to the campaign owner';
            window.analytics.track('Trace Edit', {
              action: 'updated proposed',
              ...analyticsData,
            });
          } else {
            notificationDescription = 'The Bounty has been updated!';
            window.analytics.track('Trace Edit', {
              action: 'updated proposed',
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
          window.analytics.track('Trace Edit', {
            action: 'created',
            ...analyticsData,
          });
        } else {
          notificationDescription = 'Your Bounty has been updated!';
          window.analytics.track('Trace Edit', {
            action: 'updated proposed',
            ...analyticsData,
          });
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
              Your Bounty has been updated!
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

  return (
    <Fragment>
      <Web3ConnectWarning />
      <div id="create-trace-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header"
              onBack={goBack}
              title="Edit Bounty"
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

                <TraceCampaignInfo campaign={campaign} />

                <div className="section">
                  <div className="title">Bounty details</div>

                  <TraceTitle
                    value={trace.title}
                    onChange={handleInputChange}
                    extra="What is this Bounty about?"
                    disabled={traceHasFunded}
                  />

                  <TraceDescription
                    value={trace.description}
                    onChange={handleInputChange}
                    extra="Explain the requirements and what success looks like."
                    placeholder="Describe the Bounty and define the acceptance criteria..."
                    id="description"
                    disabled={traceHasFunded}
                  />

                  <TraceDonateToCommunity
                    value={donateToCommunity}
                    onChange={handleInputChange}
                    disabled={!isProposed}
                  />

                  <TraceReviewer
                    traceType="Bounty"
                    setReviewer={setReviewer}
                    hasReviewer
                    initialValue={initialValues.reviewerAddress}
                    traceReviewerAddress={trace.reviewerAddress}
                    disabled={!isProposed}
                  />
                </div>

                <div className="trace-desc">
                  Your Bounty will collect funds in any currency. The total amount collected will be
                  the Bounty Reward.
                </div>

                <Form.Item>
                  <Button htmlType="submit" loading={loading} block size="large" type="primary">
                    Update Bounty
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
      traceId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const isEqual = (prevProps, nextProps) =>
  prevProps.match.params.traceId === nextProps.match.params.traceId;

export default memo(EditBounty, isEqual);
