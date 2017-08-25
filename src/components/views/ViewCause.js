import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { socket } from '../../lib/feathersClient'
import Loader from '../Loader'
import GoBackButton from '../GoBackButton'
import BackgroundImageHeader from '../BackgroundImageHeader'
import Avatar from 'react-avatar'
import DonateButton from '../DonateButton'


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
      hasError: false
    }
  }  

  componentDidMount() {
    socket.emit('causes::find', {_id: this.props.match.params.id}, (error, resp) => {      
      if(resp) {
        this.setState(Object.assign({}, resp.data[0], {  
          isLoading: false,
          hasError: false
        }))
      } else {
        this.setState({ isLoading: false, hasError: true })
      }   
    })
  }

  render() {
    const { history } = this.props
    let { isLoading, title, description, image, owner } = this.state

    return (
      <div id="view-cause-view">
        <div className="">
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
                <DonateButton/>
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
            </div>             
          }

        </div>
      </div>
    )
  } 
}

export default ViewCause

ViewCause.propTypes = {
  history: PropTypes.object.isRequired
}