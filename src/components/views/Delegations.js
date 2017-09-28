import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { utils } from 'web3';

import { feathersClient } from '../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'
import Loader from '../Loader'
import { isAuthenticated } from '../../lib/middleware'
import DelegateButton from '../../components/DelegateButton'
import Avatar from 'react-avatar'

/**
  The my delegations view
**/

class Delegations extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      hasError: false,
      causes: [],
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
          this.causesObserver = feathersClient.service('dacs').watch({ strategy: 'always' }).find({query: { delegateId: { $gt: '0' }, $select: [ 'ownerAddress', 'title', '_id', 'delegateId' ] }}).subscribe(
            resp =>         
              this.setState({ 
                causes: resp.data.map( c => {
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
          this.campaignsObserver = feathersClient.service('campaigns').watch({ strategy: 'always' }).find({query: { projectId: { $gt: '0' }, $select: [ 'ownerAddress', 'title', '_id', 'projectId' ] }}).subscribe(
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
          this.milestoneObserver = feathersClient.service('milestones').watch({ strategy: 'always' }).find({query: { projectId: { $gt: '0' }, $select: [ 'title', '_id', 'projectId', 'maxAmount', 'totalDonated' ] }}).subscribe(
            resp => 
              this.setState({ 
                milestones: resp.data.map( m => { 
                  m.type ='milestone'
                  m.name = m.title
                  m.id = m._id
                  m.element = <span>{m.title} <em>Milestone</em></span> 
                  return m
                })
              }, resolve()),
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

    const causesIds = this.state.causes
      .filter(c => c.ownerAddress === this.props.currentUser )
      .map(c => c['_id'])

    const campaignIds = this.state.campaigns
      .filter((c) => { return c.ownerAddress === this.props.currentUser })
      .map(c => c['_id'])

    const query = paramsForServer({
      query: {
        $or: [
          { ownerId: { $in: campaignIds } },
          { delegateId: { $in: causesIds } },
        ],
        status: {
          $in: ['waiting', 'committed']
        }
      },
      schema: 'includeTypeAndDonorDetails'
    });

    // start watching donations, this will re-run when donations change or are added
    this.donationsObserver = feathersClient.service('donations').watch({ listStrategy: 'always' }).find(query).subscribe(
      resp => this.setState({
          delegations: resp.data,
          isLoading: false,
          hasError: false
        }),
      err => this.setState({ isLoading: false, hasError: true })
    );
  }

  componentWillUnmount() {
    if(this.donationsObserver) this.donationsObserver.unsubscribe()
    this.causesObserver.unsubscribe()
    this.campaignsObserver.unsubscribe()
    this.milestoneObserver.unsubscribe()
  } 



  render() {
    let { delegations, isLoading, causes, campaigns, milestones, currentUser } = this.state

    return (
        <div id="delegations-view">
          <div className="container-fluid page-layout dashboard-table-view">
            <div className="row">
              <div className="col-md-10 m-auto">
                <h1>Your delegations</h1>

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
                              <td>{utils.fromWei(d.amount)} ETH</td>
                              {d.delegate > 0 &&
                                <td>DAC <em>{d.dac.title}</em></td>
                              }
                              {!d.delegate &&
                                <td>{d.ownerType.toUpperCase()} <em>{d.campaign.title}</em></td>
                              }
                              <td>
                                {d.donor.avatar &&
                                  <Avatar size={30} src={d.donor.avatar} round={true}/>                  
                                }
                                {d.donor.name}</td>
                              <td>{d.donorAddress}</td>
                              <td>{d.status}</td>
                              <td>
                                <DelegateButton types={causes.concat(campaigns).concat(milestones)} model={d} />
                              </td>
                            </tr>
                          )}

                        </tbody>

                      </table>
                    }

                    { delegations && delegations.length === 0 &&
                      <center>There's nothing to delegate yet!</center>
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
  currentUser: PropTypes.string,
  history: PropTypes.object.isRequired
}