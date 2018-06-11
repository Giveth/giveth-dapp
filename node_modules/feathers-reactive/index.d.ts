import { Observable } from 'rxjs/Observable';
import { NullableId, Pagination, Params } from 'feathers';

declare function FeathersReactive(options: FeathersReactive.Options): () => void;
export = FeathersReactive;

declare namespace FeathersReactive {
  // TODO: check for completeness
  interface _Options {
    idField: string,
    dataField?: string,
    sorter: any,
    matcher: any,
    listStrategies: {
      [name: string]: any
    },
    listStrategy?: string,
    let?: (obs: Observable<any>) => Observable<any>
  }

  // until _Options is complete, allow any, too
  type Options = _Options | any;
}

declare module 'feathers' {
  interface Service<T> {
    watch(): ReactiveService<T>
  }

  interface ReactiveService<T extends any> {
    /**
     * Retrieves a list of all resources from the service.
     * Provider parameters will be passed as params.query
     */
    find(params?: Params, callback?: any): Observable<T[] | Pagination<T>>;

    /**
     * Retrieves a single resource with the given id from the service.
     */
    get(id: number | string, params?: Params, callback?: any): Observable<T>;

    /**
     * Creates a new resource with data.
     */
    create(data: T[], params?: Params, callback?: any): Observable<T[]>;
    create(data: T, params?: Params, callback?: any): Observable<T>;

    /**
     * Replaces the resource identified by id with data.
     * Update multiples resources with id equal `null`
     */
    update(id: NullableId, data: T, params?: Params, callback?: any): Observable<T>;

    /**
     * Merges the existing data of the resource identified by id with the new data.
     * Implement patch additionally to update if you want to separate between partial and full updates and support the PATCH HTTP method.
     * Patch multiples resources with id equal `null`
     */
    patch(id: NullableId, data: any, params?: Params, callback?: any): Observable<T>;

    /**
     * Removes the resource with id.
     * Delete multiple resources with id equal `null`
     */
    remove(id: NullableId, params?: Params, callback?: any): Observable<T>;
  }
}
