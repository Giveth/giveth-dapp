import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { socket } from '../../lib/feathersClient'
import Loader from '../Loader'
import GoBackButton from '../GoBackButton'


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
    let { isLoading, title, description, image } = this.state

    return (
      <div id="view-cause-view">
        <div className="container-fluid page-layout reduced-padding">
          <div className="row">
            <div className="col-md-8 m-auto">
              { isLoading && 
                <Loader className="fixed"/>
              }
              
              { !isLoading &&
                <div>
                  <GoBackButton history={history}/>

                  <p>Democratic Autonomous Charity</p>
                  <h1 className="cause-title">{title}</h1>
                  <img className="cause-header-image" src={image} alt=""/>
                  <div dangerouslySetInnerHTML={{__html: description}}></div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  } 
}

export default ViewCause

ViewCause.propTypes = {
  history: PropTypes.object.isRequired
}