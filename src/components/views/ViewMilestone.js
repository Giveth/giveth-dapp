import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { utils } from 'web3';

import { feathersClient } from './../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'
import { getUserName, getUserAvatar } from '../../lib/helpers'

import Loader from './../Loader'
import GoBackButton from '../GoBackButton'
import BackgroundImageHeader from '../BackgroundImageHeader'
import Avatar from 'react-avatar'
import DonateButton from '../DonateButton'
import ShowTypeDonations from '../ShowTypeDonations'
import currentUserModel from '../../models/currentUserModel'
import getNetwork from './../../lib/blockchain/getNetwork';


/**
  Loads and shows a single milestone

  @route params:
    milestoneId (string): id of a milestone
**/

class ViewMilestone extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      hasError: false,
      isLoadingDonations: true,
      errorLoadingDonations: false,
      donations: [],
      etherScanUrl: ''
    };

    getNetwork().then(network => {
      this.setState({
        etherScanUrl: network.etherscan
      })
    })
  }  

  componentDidMount() {
    const milestoneId = this.props.match.params.milestoneId

    this.setState({ id: milestoneId })

    feathersClient.service('milestones').find({ query: {_id: milestoneId }})
      .then(resp =>
        this.setState(Object.assign({}, resp.data[0], {  
          isLoading: false,
          hasError: false
        })))
      .catch(() =>
        this.setState({ isLoading: false, hasError: true })
      )

    // lazy load donations
    //TODO fetch "non comitted" donations? add "intendedProjectId: milestoneId" to query to get all "pending aproval" donations for this milestone
    const query = paramsForServer({ 
      query: { ownerId: milestoneId },
      schema: 'includeGiverDetails'
    })  
    
    this.donationsObserver = feathersClient.service('donations').watch({ listStrategy: 'always' }).find(query).subscribe(
      resp =>
        this.setState({
          donations: resp.data,
          isLoadingDonations: false,
          errorLoadingDonations: false
        }),
      err => this.setState({ isLoadingDonations: false, errorLoadingDonations: true })
    )     
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe()
  } 

  isActiveMilestone() {
    return this.state.status === 'InProgress' && parseInt(utils.fromWei(this.state.totalDonated)) < parseInt(utils.fromWei(this.state.maxAmount))
  } 

  render() {
    const { history, wallet, currentUser } = this.props

    let { isLoading, 
          id,
          projectId,
          title, 
          description, 
          recipientAddress, 
          reviewerAddress, 
          completionDeadline, 
          image,
          donations,
          isLoadingDonations,
          ownerAddress,
          owner,
          maxAmount,
          totalDonated,
          recipient,
          etherScanUrl
    } = this.state

    return (
      <div id="view-milestone-view">
        { isLoading && 
          <Loader className="fixed"/>
        }
        
        { !isLoading &&
          <div>
            <BackgroundImageHeader image={image} height={300} >
              <h6>Milestone</h6>
              <h1>{title}</h1>
              

              { !this.state.status === 'InProgress' &&
                <p>This milestone is not active anymore</p>
              }

              { parseInt(utils.fromWei(this.state.totalDonated)) >= parseInt(utils.fromWei(this.state.maxAmount)) &&
                <p>This milestone has reached its funding goal. Completion deadline {this.state.completionDeadline}</p>
              }              

              { parseInt(utils.fromWei(this.state.totalDonated)) < parseInt(utils.fromWei(this.state.maxAmount)) &&
                <p>Ξ{utils.fromWei(this.state.totalDonated)} of Ξ{utils.fromWei(this.state.maxAmount)} raised. Completion deadline {this.state.completionDeadline}</p>
              }

              { this.isActiveMilestone() && 
                <DonateButton type="milestone" model={{ title: title, _id: id, adminId: projectId }} wallet={wallet} currentUser={currentUser} history={history}/>
              }              


            </BackgroundImageHeader>

            <div className="container-fluid">

              <div className="row">
                <div className="col-md-8 m-auto">
                  <div>
                    <GoBackButton history={history}/>

                    <center>
                      <Link to={`/profile/${ ownerAddress }`}>
                        <Avatar size={50} src={getUserAvatar(owner)} round={true}/>                  
                        <p className="small">{getUserName(owner)}</p>
                      </Link> 
                    </center>

                    <div className="card content-card">
                      <div className="card-body content">
                        <div dangerouslySetInnerHTML={{__html: description}}></div>
                      </div>
                    </div>              
                  </div>
                </div>
              </div>  

              <div className="row spacer-top-50">
                <div className="col-md-8 m-auto">  
                  <h4>Details</h4>

                  <div className="form-group">
                    <label>Reviewer</label>
                    <small className="form-text">This person will review the actual completion of the milestone</small>

                    <table className="table-responsive">
                      <tbody>
                        <tr>
                          <td className="td-user">
                            <Link to={`/profile/${ reviewerAddress }`}>
                              <Avatar size={30} src={getUserAvatar(recipient.avatar)} round={true}/>
                              <span>{getUserName(recipient.name)}</span>
                            </Link>
                          </td>
                          {etherScanUrl &&
                            <td className="td-address"> - <a href={`${etherScanUrl}address/${reviewerAddress}`}>{reviewerAddress}</a></td>
                          }
                          {!etherScanUrl &&
                            <td className="td-address"> - {reviewerAddress}</td>
                          }
                        </tr> 
                      </tbody>
                    </table>                                        
                  </div> 

                  <div className="form-group">
                    <label>Recipient</label>
                    <small className="form-text">Where the Ether goes after successful completion of the milestone</small>

                    <table className="table-responsive">
                      <tbody>
                        <tr>
                          <td className="td-user">
                            <Link to={`/profile/${ recipientAddress }`}>
                              <Avatar size={30} src={getUserAvatar(recipient.avatar)} round={true}/>
                              <span>{getUserName(recipient.name)}</span>
                            </Link>
                          </td>
                          {etherScanUrl &&
                            <td className="td-address"> - <a href={`${etherScanUrl}address/${recipientAddress}`}>{recipientAddress}</a></td>
                          }
                          {!etherScanUrl &&
                            <td className="td-address"> - {recipientAddress}</td>
                          }
                        </tr> 
                      </tbody>
                    </table>                     
                  </div>

                  <div className="form-group">
                    <label>Max amount to raise</label>
                    <small className="form-text">The maximum amount of &#926; that can be donated to this milestone</small>
                    &#926;{utils.fromWei(maxAmount)}
                  </div>

                  <div className="form-group">
                    <label>Amount donated</label>
                    <small className="form-text">The amount of &#926; currently donated to this milestone</small>
                    &#926;{utils.fromWei(totalDonated)}
                  </div>  

                  <div className="form-group">
                    <label>Completion deadline</label>
                    <small className="form-text">When the milestone will be completed</small>
                    {completionDeadline}
                  </div>                  
                </div>
              </div>                          

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">    
                  <h4>Donations</h4>        
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />  
                  { this.isActiveMilestone() && 
                    <DonateButton type="milestone" model={{ title: title, _id: id, adminId: projectId }} wallet={wallet} currentUser={currentUser} history={history}/>
                  }
                </div>
              </div> 

            </div>
          </div>                
        }
      </div>
    )
  } 
}

export default ViewMilestone

ViewMilestone.propTypes = {
  history: PropTypes.object.isRequired,
  currentUser: currentUserModel
}