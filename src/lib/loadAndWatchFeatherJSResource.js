import { feathersClient, socket } from '../lib/feathersClient'

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
    console.log(service)

    this.service = service
    this.data = []
    this.limit = 10
    this.page = 1
    this.callback = callback

    this.getResource()
    this.watchResource()
  }  

  getResource(){
    const self = this

    socket.emit(this.service + '::find', {}, (error, data) => {
      if(data){
        console.info('Found all ' + self.service , data);
        self.data = data
        self.callback(data)
      }
    });
  }    

  watchResource(){
    const self = this

    console.log('start watching resource')


    // when a new object is added to the server, add it to the data store
    socket.on(this.service + " created", object => {
      console.log('created object: ', object)      
      
      self.data.data.push(object)
      self.data.total++

      self.callback(self.data)
    })


    // when a new cause is removed, remove it from the UI
    socket.on(this.service + " removed", object => {
      console.log('removed object: ', object)      
      
      self.data.data = self.data.data.filter(function(o){
        return o._id !== object._id
      })

      self.data.total--

      self.callback(self.data)      
    })  


    // when a new cause is updated, update it in the UI
    socket.on(this.service + " updated", object => {
      console.log('updated object: ', object)

      self.data.data = self.data.data.map(function(o){
        if(o._id === object._id) { o = object }
        return o;
      })

      self.callback(self.data)            
    })      
  }
}

export default loadAndWatchFeatherJSResource