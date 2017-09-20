import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { feathersClient } from '../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'
import Loader from '../Loader'
import { isAuthenticated } from '../../lib/middleware'
import DelegateButton from '../../components/DelegateButton'

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
      Promise.all([
        new Promise((resolve, reject) => {
          this.causesObserver = feathersClient.service('causes').watch({ strategy: 'always' }).find({query: { $select: [ 'ownerAddress', 'title', '_id' ] }}).subscribe(
            resp =>         
              this.setState({ 
                causes: resp.data.map( c => {
                  c.type = 'dac'
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
          this.campaignsObserver = feathersClient.service('campaigns').watch({ strategy: 'always' }).find({query: { $select: [ 'ownerAddress', 'title', '_id' ] }}).subscribe(
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
          this.milestoneObserver = feathersClient.service('milestones').watch({ strategy: 'always' }).find({query: { $select: [ 'title', '_id' ] }}).subscribe(
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
    const causesIds = this.state.causes
      .filter(c => c.ownerAddress === this.props.currentUser )
      .map(c => c['_id'])

    const campaignIds = this.state.campaigns
      .filter((c) => { return c.ownerAddress === this.props.currentUser })
      .map(c => c['_id'])


    console.log('tid', causesIds, campaignIds)

    const query = paramsForServer({
      query: { 
        type_id: { $in: causesIds.concat(campaignIds) },
        status: 'waiting'      
      },
      schema: 'includeDonorDetails'
    });

    this.donationsObserver = feathersClient.service('donations').watch({ listStrategy: 'always' }).find(query).subscribe(
      resp => {

        // join type with donations
        resp.data.map((d)=> {
          const cause = this.state.causes.find((c) => { return c._id === d.type_id })
          return d = cause ? d.type_title = cause.title : d
        })

        this.setState({
          delegations: resp.data,
          isLoading: false,
          hasError: false
        })},
      err =>
        this.setState({ isLoading: false, hasError: true })
    )             
  }

  componentWillUnmount() {
    if(this.donationsObserver) this.donationsObserver.unsubscribe()
    this.causesObserver.unsubscribe()
    this.campaignsObserver.unsubscribe()
    this.milestoneObserver.unsubscribe()
  } 



  render() {
    let { delegations, isLoading, causes, campaigns, milestones } = this.state

    return (
        <div id="edit-campaign-view">
          <div className="container-fluid page-layout">
            <div className="row">
              <div className="col-md-12">
                <h1>Your delegations</h1>

                { isLoading && 
                  <Loader className="fixed"/>
                }

                { !isLoading &&
                  <div>
                    { delegations && delegations.length > 0 && 

                      <table className="table table-responsive table-hover">
                        <thead>
                          <tr>
                            <th>Amount</th>
                            <th>To</th>
                            <th>From</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          { delegations.map((d, index) =>
                            <tr key={index}>
                              <td>{d.amount} ETH</td>
                              <td>{d.type.toUpperCase()} <em>{d.type_title}</em></td>
                              <td>{d.donor.name}</td>
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