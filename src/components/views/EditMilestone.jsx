import React, { Fragment, memo, useContext, useEffect, useState } from 'react';
import { Button, Col, Form, notification, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';

import { history, isOwner, ZERO_ADDRESS } from '../../lib/helpers';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import LPTrace from '../../models/LPTrace';
import { Trace } from '../../models';
import { TraceService } from '../../services';
import config from '../../configuration';
import { authenticateUser } from '../../lib/middleware';
import ErrorHandler from '../../lib/ErrorHandler';
import {
  TraceCampaignInfo,
  TraceDescription,
  TraceDonateToCommunity,
  TracePicture,
  TraceReviewer,
  TraceTitle,
} from '../EditTraceCommons';

function EditMilestone(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const { traceId } = props.match.params;

  const [image, setImage] = useState('');
  const [campaign, setCampaign] = useState();
  const [hasReviewer, setHasReviewer] = useState(true);
  const [donateToCommunity, setDonateToCommunity] = useState(true);
  const [trace, setTrace] = useState();
  const [initialValues, setInitialValues] = useState({
    title: '',
    description: '',
    donateToCommunity: true,
    reviewerAddress: '',
    image: '',
  });

  const [form] = Form.useForm();

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
      ms.formType !== Trace.MILESTONETYPE ||
      !(isOwner(ms.owner.address, currentUser) || userIsCampaignOwner) ||
      ms.donationCounters.length > 0
    );
  };

  useEffect(() => {
    if (trace) {
      if (isEditNotAllowed(trace)) {
        goBack();
      }
    } else if (currentUser.id) {
      TraceService.get(traceId)
        .then(res => {
          if (isEditNotAllowed(res)) {
            goBack();
          } else {
            const isReviewer = res.reviewerAddress !== ZERO_ADDRESS;
            const iValues = {
              title: res.title,
              description: res.description,
              reviewerAddress: isReviewer ? res.reviewerAddress : null,
              image: res.image,
              donateToCommunity: !!res.communityId,
            };
            const imageUrl = res.image ? res.image.match(/\/ipfs\/.*/)[0] : '';
            setInitialValues(iValues);
            setDonateToCommunity(!!res.communityId);
            setHasReviewer(isReviewer);
            setTrace(res);
            setImage(imageUrl);
            setCampaign(res.campaign);
          }
        })
        .catch(err => {
          const message = `Sadly we were unable to load the requested Trace details. Please try again.`;
          ErrorHandler(err, message);
        });
    }
  }, [currentUser.id, isEditNotAllowed, trace, traceId]);

  useEffect(() => {
    setUserIsOwner(
      campaign &&
        currentUser.address &&
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
    );
  }, [campaign, currentUser]);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    const ms = trace;
    if (type === 'checkbox' && name === 'hasReviewer') {
      setHasReviewer(checked);
    } else if (type === 'checkbox' && name === 'donateToCommunity') {
      setDonateToCommunity(checked);
    } else if (name === 'image') {
      setImage(value);
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

    const { reviewerAddress } = trace;
    const ms = new LPTrace(trace);

    ms.image = image;
    ms.reviewerAddress = hasReviewer ? reviewerAddress : ZERO_ADDRESS;
    ms.parentProjectId = campaign.projectId;
    ms.communityId = donateToCommunity ? config.defaultCommunityId : 0;

    ms.status = isProposed || trace.status === Trace.REJECTED ? Trace.PROPOSED : trace.status; // make sure not to change status!

    setLoading(true);

    await TraceService.save({
      trace: ms,
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

  return (
    <Fragment>
      <Web3ConnectWarning />

      <div id="create-trace-view">
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

                <TraceCampaignInfo campaign={campaign} />

                <div className="section">
                  <div className="title">Milestone details</div>

                  <TraceTitle
                    value={trace.title}
                    onChange={handleInputChange}
                    extra="What are you going to accomplish in this Trace?"
                    disabled={traceHasFunded}
                  />

                  <TraceDescription
                    value={trace.description}
                    onChange={handleInputChange}
                    extra="Explain how you are going to do this successfully."
                    placeholder="Describe how you are going to execute this milestone successfully..."
                    id="description"
                    disabled={traceHasFunded}
                  />

                  <TracePicture setPicture={setPicture} picture={image} traceTitle={trace.title} />

                  <TraceDonateToCommunity
                    value={donateToCommunity}
                    onChange={handleInputChange}
                    disabled={!isProposed}
                  />

                  <TraceReviewer
                    toggleHasReviewer={handleInputChange}
                    setReviewer={setReviewer}
                    hasReviewer={hasReviewer}
                    traceReviewerAddress={trace.reviewerAddress}
                    traceType="Milestone"
                    initialValue={initialValues.reviewerAddress}
                    disabled={!isProposed}
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
      traceId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const isEqual = (prevProps, nextProps) =>
  prevProps.match.params.traceId === nextProps.match.params.traceId;

export default memo(EditMilestone, isEqual);
