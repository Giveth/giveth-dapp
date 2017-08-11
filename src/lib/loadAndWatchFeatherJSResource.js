import { socket } from '../lib/feathersClient'

/**
 * Loads and watches a FeatherJS resource
 * @params:
 *    service (string): the service name
 *    callback (function): function that will be called whenever data is loaded or changed.
 *      @returns: 
 *        data (array): all the data
 */

class loadAndWatchFeatherJSResource {
  constructor(service, callback){
    this.service = service
    this.data = []
    this.limit = 50
    this.page = 1
    this.callback = callback

    this.getResource()
    this.watchResource()
  }  

  getResource(){
    socket.emit(this.service + '::find', { $limit: this.limit}, (error, data) => {
      if(data){
        console.info('Found all ' + this.service + "with limit " + this.limit, data);
        this.data = data
        this.callback(data)
      }
    });
  }    

  watchResource(){
    console.log('start watching resource ' + this.service)

    // when a new object is added to the server, add it to the data store
    socket.on(this.service + " created", object => {
      console.log('created object: ', object)      
      
      this.data.data.push(object)
      this.data.total++

      this.callback(this.data)
    })


    // when a new cause is removed, remove it from the UI
    socket.on(this.service + " removed", object => {
      console.log('removed object: ', object)      
      
      this.data.data = this.data.data.filter((o) => o._id !== object._id)
      this.data.total--
      this.callback(this.data)      
    })  


    // when a new cause is updated, update it in the UI
    socket.on(this.service + " updated", object => {
      console.log('updated object: ', object)

      this.data.data = this.data.data.map((o) => o._id === object._id ? object : o)
      this.callback(this.data)            
    })      
  }
}

export default loadAndWatchFeatherJSResource