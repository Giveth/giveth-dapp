import React, { Component } from 'react'
import { socket } from '../../lib/feathersClient'

import GoBackButton from '../GoBackButton'
import Loader from '../Loader'
import Avatar from 'react-avatar'

/**
 Shows the user's profile
 **/

class Profile extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      hasError: false
    }
  }

  componentWillMount(){
    socket.emit('users::find', {address: this.props.match.params.userAddress}, (error, resp) => {    
      console.log(error, resp)
      if(resp) {
        this.setState(Object.assign({}, resp.data[0], {
          isLoading: false,
          hasError: false
        })) 
      } else {
        this.setState( { 
          isLoading: false,
          hasError: true
        })  
      }
    })
  } 

  render() {
    const { history } = this.props
    let { isLoading, hasError, avatar, name, address, email, linkedIn } = this.state

    return (
      <div id="profile-view">
        <div className="container-fluid page-layout">
          <div className="row">
            <div className="col-md-8 m-auto">
              { isLoading && 
                <Loader className="fixed"/>
              }
              
              { !isLoading && !hasError &&
                <div>
                  <GoBackButton history={history}/>

                  <center>
                    <Avatar size={100} src={avatar} round={true}/>                  
                    <h1>{name}</h1>
                    <p>{address}</p>
                    <p>{email}</p>
                    <p>{linkedIn}</p>
                  </center>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Profile