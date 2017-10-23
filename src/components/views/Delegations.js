import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { utils } from 'web3';

import { Link } from 'react-router-dom'
import { feathersClient } from '../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'
import Loader from '../Loader'
import { isAuthenticated } from '../../lib/middleware'
import DelegateButton from '../../components/DelegateButton'
import Avatar from 'react-avatar'
import currentUserModel from '../../models/currentUserModel'
import { getUserName, getUserAvatar } from '../../lib/helpers'

/**
  The my delegations view
**/

class Delegations extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      hasError: false,
      dacs: [],
      campaigns: [],
      milestones: [],
      delegations: []
    }    
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history).then(() => {

      /**
      Load all DACs/campaigns/milestones
      TO DO: We should really move this to a single service
       
      For each type we transform the data so that the InputToken component can handle it
      **/

      Promise.all([
        new Promise((resolve, reject) => {
          this.dacsObserver = feathersClient.service('dacs').watch({ strategy: 'always' }).find({query: { delegateId: { $gt: '0' }, $select: [ 'ownerAddress', 'title', '_id', 'delegateId' ] }}).subscribe(
            resp =>         
              this.setState({ 
                dacs: resp.data.map( c => {
                  c.type = 'dac'
                  c.name = c.title
                  c.id = c._id
                  c.element = <span>{c.title} <em>DAC</em></span>
                  return c
                })
              }, resolve()),
            err => reject()
          )
        })
      ,
        new Promise((resolve, reject) => {
          this.campaignsObserver = feathersClient.service('campaigns').watch({ strategy: 'always' }).find({
            query: {
              projectId: {
                $gt: '0'
              },
              status: "Active",
              $select: [ 'ownerAddress', 'title', '_id', 'projectId' ] }
          }).subscribe(
            resp =>         
              this.setState({ 
                campaigns: resp.data.map( c => {
                  c.type = 'campaign'
                  c.name = c.title
                  c.id = c._id
                  c.element = <span>{c.title} <em>Campaign</em></span>
                  return c
                })

              }, resolve()),
            err => reject()
          )
        })
      ,        
        new Promise((resolve, reject) => {
          this.milestoneObserver = feathersClient.service('milestones').watch({ strategy: 'always' }).find({
            query: { 
              projectId: { $gt: '0' }, 
              status: "InProgress",
              $select: [ 'title', '_id', 'projectId', 'campaignId', 'maxAmount', 'totalDonated', 'status' ] }
            }).subscribe(
            resp => {
              console.log(resp)
              this.setState({ 
                milestones: resp.data.map( m => { 
                  m.type ='milestone'
                  m.name = m.title
                  m.id = m._id
                  m.element = <span>{m.title} <em>Milestone</em></span> 
                  return m
                }) //.filter((m) => m.totalDonated < m.maxAmount)
              }, resolve())},
            err => reject()
          )      
        })
      ]).then( (resp) => this.getAndWatchDonations())
        .catch( e => this.setState({ isLoading: false, hasError: true }))     
    })
  }

  getAndWatchDonations() {
    // here we get all the ids.
    // TO DO: less overhead here if we move it all to a single service.
    // NOTE: This will not rerun, meaning after any dac/campaign/milestone is added

    console.log('watching donations')

    const dacsIds = this.state.dacs
      .filter(c => c.ownerAddress === this.props.currentUser.address )
      .map(c => c['_id'])

    const campaignIds = this.state.campaigns
      .filter((c) => { return c.ownerAddress === this.props.currentUser.address })
      .map(c => c['_id'])

    const query = paramsForServer({
      query: {
        $or: [
          { ownerId: { $in: campaignIds } },
          { delegateId: { $in: dacsIds } },
          { ownerId: this.props.currentUser.address, $not: { delegateId: { $gt: '0' } } },
        ],
        status: {
          $in: ['waiting', 'committed']
        }
      },
      schema: 'includeTypeAndGiverDetails'
    });

    // start watching donations, this will re-run when donations change or are added
    this.donationsObserver = feathersClient.service('donations').watch({ listStrategy: 'always' }).find(query).subscribe(
      resp => { console.log(resp); this.setState({
          delegations: resp.data,
          isLoading: false,
          hasError: false
        })},
      err => this.setState({ isLoading: false, hasError: true })
    );
  }

  componentWillUnmount() {
    if(this.donationsObserver) this.donationsObserver.unsubscribe()
    this.dacsObserver.unsubscribe()
    this.campaignsObserver.unsubscribe()
    this.milestoneObserver.unsubscribe()
  } 



  render() {
    let { wallet, currentUser, history } = this.props
    let { delegations, isLoading, dacs, campaigns, milestones } = this.state

    return (
        <div id="delegations-view">
          <div className="container-fluid page-layout dashboard-table-view">
            <div className="row">
              <div className="col-md-10 m-auto">

                { (isLoading || (delegations && delegations.length > 0)) &&
                  <h1>Your delegations</h1>
                }              

                { isLoading && 
                  <Loader className="fixed"/>
                }

                { !isLoading &&
                  <div>
                    { delegations && delegations.length > 0 && 

                      <table className="table table-responsive table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Amount</th>
                            <th>Donated to</th>
                            <th>Received from</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          { delegations.map((d, index) =>
                            <tr key={index}>
                              <td>&#926;{utils.fromWei(d.amount)}</td>
                              {d.delegate > 0 &&
                                <td><Link to={`/dacs/${d._id}`}>DAC <em>{d.delegateEntity.title}</em></Link></td>
                              }
                              {!d.delegate &&
                                <td><Link to={`/${d.ownerType}s/${d.ownerEntity._id}`}>{d.ownerType.toUpperCase()} <em>{d.ownerEntity.title}</em></Link></td>
                              }
                              <td>
                                <Avatar size={30} src={getUserAvatar(d.giver)} round={true}/>
                                {getUserName(d.giver)}</td>
                              <td>{d.giverAddress}</td>
                              <td>{d.status}</td>
                              <td>                                
                                {/* when donated to a dac, allow delegation to anywhere */}
                                {(d.delegate > 0  || d.ownerId === currentUser.address )&&
                                  <DelegateButton 
                                    types={dacs.concat(campaigns).concat(milestones)} 
                                    model={d} 
                                    wallet={wallet}
                                    history={history}/>
                                }

                                {/* when donated to a campaign, only allow delegation to milestones of this campaign */}
                                {d.ownerType === 'campaign' &&
                                  <DelegateButton 
                                    types={milestones.filter((m) => { return m.campaignId === d.ownerId })} 
                                    model={d} 
                                    milestoneOnly={true} 
                                    wallet={wallet}
                                    history={history}/>
                                }                                

                              </td>
                            </tr>
                          )}

                        </tbody>

                      </table>
                    }

                    { delegations && delegations.length === 0 &&
                      <div>            
                        <center>
                          <h3>There's nothing to delegate yet!</h3>
                          <img className="empty-state-img" src={process.env.PUBLIC_URL + "/img/delegation.svg"} width="200px" height="200px" alt="no-delegations-icon"/>
                        </center>
                      </div>                         
                    }

                  </div>
                }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Delegations

Delegations.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired
}