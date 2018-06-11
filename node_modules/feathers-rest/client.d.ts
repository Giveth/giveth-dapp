
declare function rest(base: string): rest.Transport;

declare namespace rest {
  interface HandlerResult extends Function {
    /**
     * initialize service
     */
    (): void;
    /**
     * Transport Service
     */
    Service: any;

    /**
     * default Service
     */
    service: any;
  }

  interface Handler {
    (connection, options?): () => HandlerResult;
  }

  interface Transport {
    jquery: Handler;
    superagent: Handler;
    request: Handler;
    fetch: Handler;
    axios: Handler;
    angular: Handler;
  }
}

export = rest;
