import * as rt from 'runtypes';
import {
  FormBody,
  FormBodyBuilder,
  Headers,
  HeadersBuilder,
  CallRecord,
  JsonBodyBuilder,
  JsonBody,
  Method,
  PathBuilder,
  Query,
  QueryBuilder,
} from './types';
import { makeFetchFunction } from './fetcher';

type Constrained<A, R, M extends string, CurrentMethod extends string> = Omit<
  Builder<A, R, CurrentMethod | M>,
  CurrentMethod | M
>;

class Builder<A = undefined, R = void, M extends string = ''> {
  private record: CallRecord<A, any>;

  constructor() {
    this.record = { outputRuntype: rt.Void };
  }

  args<T>(runtype: rt.Runtype<T>): Constrained<T, R, M, 'args'>;
  args<T>(): Constrained<T, R, M, 'args'>;
  args(t?: rt.Runtype) {
    if (t !== undefined) {
      this.record.argRuntype = t;
    }
    return this as any;
  }

  runtype<T>(rt: rt.Runtype<T>) {
    this.record.outputRuntype = rt;
    return (this as unknown) as Constrained<A, T, M, 'runtype'>;
  }

  query(query: Query): Constrained<A, R, M, 'query'>;
  query(builder: QueryBuilder<A>): Constrained<A, R, M, 'query'>;
  query(queryOrBuilder: Query | QueryBuilder<A>) {
    this.record.queryBuilder =
      typeof queryOrBuilder === 'function'
        ? queryOrBuilder
        : () => queryOrBuilder;
    return this as any;
  }

  method(method: Method) {
    this.record.httpMethod = method;
    return (this as unknown) as Constrained<A, R, M, 'method'>;
  }

  path(path: string): Constrained<A, R, M, 'path'>;
  path(builder: PathBuilder<A>): Constrained<A, R, M, 'path'>;
  path(pathOrBuilder: string | PathBuilder<A>) {
    this.record.pathBuilder =
      typeof pathOrBuilder === 'string' ? () => pathOrBuilder : pathOrBuilder;
    return this as any;
  }

  headers(headers: Headers): Constrained<A, R, M, 'headers'>;
  headers(builder: HeadersBuilder<A>): Constrained<A, R, M, 'headers'>;
  headers(headersOrBuilder: Headers | HeadersBuilder<A>) {
    this.record.headersBuilder =
      typeof headersOrBuilder === 'function'
        ? headersOrBuilder
        : () => headersOrBuilder;
    return this as any;
  }

  map<T>(mapper: (res: R, args: A) => T) {
    this.record.mapper = mapper;
    return (this as unknown) as Constrained<A, T, M, 'mapper'>;
  }

  formBody(body: FormBody): Constrained<A, R, M, 'jsonBody' | 'formBody'>;
  formBody(
    builder: FormBodyBuilder<A>
  ): Constrained<A, R, M, 'jsonBody' | 'formBody'>;
  formBody(bodyOrBuilder: FormBody | FormBodyBuilder<A>) {
    const builder =
      typeof bodyOrBuilder === 'function' ? bodyOrBuilder : () => bodyOrBuilder;
    this.record.bodyBuilder = { kind: 'form', builder };
    return this as any;
  }

  jsonBody(body: JsonBody): Constrained<A, R, M, 'jsonBody' | 'formBody'>;
  jsonBody(
    builder: JsonBodyBuilder<A>
  ): Constrained<A, R, M, 'jsonBody' | 'formBody'>;
  jsonBody(bodyOrBuilder: JsonBody | JsonBodyBuilder<A>) {
    const builder =
      typeof bodyOrBuilder === 'function' ? bodyOrBuilder : () => bodyOrBuilder;
    this.record.bodyBuilder = { kind: 'json', builder };
    return this as any;
  }

  build() {
    return makeFetchFunction<A, R>(this.record);
  }
}

export function createApiCall() {
  return new Builder();
}
