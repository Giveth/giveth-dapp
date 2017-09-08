import { socket, feathersClient } from '../lib/feathersClient'

/**
 * Loads and watches a FeatherJS resource
 * @params:
 *    service (string): the service name
 *    callback (function): function that will be called whenever data is loaded or changed.
 *      @returns: 
 *        data (array): all the data
 */

class loadAndWatchFeatherJSResource {
  constructor(service, query, callback){
    this.service = service
    this.data = []
    this.page = 1
    this.callback = callback
    this.query = query

    this.getResource()
    this.watchResource()
  }  

  getResource(){
    feathersClient.service(this.service).find(this.query)
      .then(data => {
        console.info('Found ' + this.service + ' >> ', data);
        this.data = data
        this.callback(data)
      })
      .catch(()=>this.callback(null, true))
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


    // when a new object is removed, remove it from the UI
    socket.on(this.service + " removed", object => {
      console.log('removed object: ', object)      
      
      this.data.data = this.data.data.filter((o) => o._id !== object._id)
      this.data.total--
      this.callback(this.data)      
    })  


    // when an object is updated, update it in the UI
    socket.on(this.object + " updated", object => {
      console.log('updated object: ', object)

      this.data.data = this.data.data.map((o) => o._id === object._id ? object : o)
      this.callback(this.data)            
    })    

    // when an object is patched, update it in the UI
    socket.on(this.object + " patched", object => {
      console.log('patched object: ', object)

      this.data.data = this.data.data.map((o) => o._id === object._id ? object : o)
      this.callback(this.data)            
    })       
  }
}

export default loadAndWatchFeatherJSResource