declare module 'feathers-client' {
  import events = require('events');
  
  interface FeathersApp {
    // Authentication.
    authenticate(options: any) :Promise<any>;
    logout(): void;
    get(type: string): any;
  
    // Services.
    service<T>(name: string): FeathersService<T>;
    
    configure(fn: () => void): FeathersApp;
  }
  
  interface FeathersService<T> extends events.EventEmitter {
    // REST interface.
    find(params?: any): Promise<T>;
    get(id: string, params?: any): Promise<T>;
    create(data: T, params?: any): Promise<T>;
    update(id: string, data: T, params?: any): Promise<T>;
    patch(id: string, data: T, params?: any) : Promise<T>;
    remove(id: string, params?: any): Promise<T>;
  
    // Realtime interface.
    on(eventType: string, callback: (data: T) => void);
    timeout?: number;
  }

  interface FeathersFactory {
    (): FeathersApp;
    socketio: (socket: any) => any;
    primus: (config: any, configurer: any | Function) => () => void;
    rest: (base: string) => any;
    hooks: () => any;
    authentication: (config?: any) => () => void;
    errors: any;
  }

  const feathers: FeathersFactory;

  export default feathers;
}
