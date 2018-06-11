import 'express';

declare function rest(handler?: Formatter): Function;

declare interface Formatter {
  (request: Express.Request, response: Express.Response, next?: Function): void;
}

declare namespace rest {
  const formatter: Formatter;
}

export = rest;
