import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { feathersClient } from '../../lib/feathersClient'
import loadAndWatchFeatherJSResource from '../../lib/loadAndWatchFeatherJSResource'
import { paramsForServer } from 'feathers-hooks-common'

import Loader from '../Loader'
import GoBackButton from '../GoBackButton'
import BackgroundImageHeader from '../BackgroundImageHeader'
import Avatar from 'react-avatar'
import DonateButton from '../DonateButton'
import ShowTypeDonations from '../ShowTypeDonations'


/**
  Loads and shows a single DAC

  @route params:
    id (string): id of a DAC
**/

class ViewCause extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      hasError: false,
      isLoadingDonations: true,
      errorLoadingDonations: false,
      donations: []
    }
  }  

  componentDidMount() {
    const dacId = this.props.match.params.id

    this.setState({ id: dacId })

    feathersClient.service('causes').find({ query: {_id: dacId }})
      .then(resp =>
        this.setState(Object.assign({}, resp.data[0], {  
          isLoading: false,
          hasError: false
        })))
      .catch(() =>
        this.setState({ isLoading: false, hasError: true })
      )

    // lazy load donations         
    const query = paramsForServer({ 
      query: { type_id: dacId },
      schema: 'includeDonorDetails'
    })  

    new loadAndWatchFeatherJSResource('donations', query, (resp, err) => {
      if(resp){
        this.setState({
          donations: resp.data,
          isLoadingDonations: false,
          errorLoadingDonations: false
        })
      } else {
        this.setState({ isLoadingDonations: false, errorLoadingDonations: true })
      }
    })      
  }

  render() {
    const { history } = this.props
    let { isLoading, id, title, description, image, owner, donations, isLoadingDonations } = this.state

    return (
      <div id="view-cause-view">
        { isLoading && 
          <Loader className="fixed"/>
        }
        
        { !isLoading &&
          <div>
            <BackgroundImageHeader image={image} height={300} >
              <Link to={`/profile/${ owner.address }`}>
                <Avatar size={50} src={owner.avatar} round={true}/>                  
                <p className="small">{owner.name}</p>
              </Link> 
              <h6>Democratic Autonomous Charity</h6>
              <h1>{title}</h1>
              
              <DonateButton type="DAC" model={{ title: title, _id: id }}/>
            </BackgroundImageHeader>

            <div className="row">
              <div className="col-md-8 m-auto">

                <GoBackButton history={history}/>

                <div className="content">
                  <h2>About this DAC</h2>
                  <div dangerouslySetInnerHTML={{__html: description}}></div>
                </div>

              </div>
            </div>   

            <div className="row">
              <div className="col-md-8 m-auto">    
                <h4>Donations</h4>        
                <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />  
              </div>
            </div>          

          </div>             
        }
      </div>
    )
  } 
}

export default ViewCause

ViewCause.propTypes = {
  history: PropTypes.object.isRequired
}