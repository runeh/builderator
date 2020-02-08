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

class Builder<A, R, M extends string = ''> {
  private record: CallRecord<A, any>;

  constructor() {
    this.record = { outputRuntype: rt.Unknown };
  }

  withArgs<T>() {
    return this as Constrained<T, R, M, 'withArgs' | 'withArgRuntype'>;
  }

  withRuntype<T>(rt: rt.Runtype<T>) {
    this.record.outputRuntype = rt;
    return (this as unknown) as Constrained<A, T, M, 'withRuntype'>;
  }

  withArgsRuntype<T>(rt: rt.Runtype<T>) {
    this.record.argRuntype = rt;
    return this as Constrained<T, R, M, 'withArgs' | 'withArgsRuntype'>;
  }

  withQuery(query: Query): Constrained<A, R, M, 'withQuery'>;
  withQuery(builder: QueryBuilder<A>): Constrained<A, R, M, 'withQuery'>;
  withQuery(queryOrBuilder: Query | QueryBuilder<A>) {
    this.record.queryBuilder =
      typeof queryOrBuilder === 'function'
        ? queryOrBuilder
        : () => queryOrBuilder;
    return this as any;
  }

  withMethod(method: Method) {
    this.record.httpMethod = method;
    return (this as unknown) as Constrained<A, R, M, 'withMethod'>;
  }

  withPath(path: string): Constrained<A, R, M, 'withPath'>;
  withPath(builder: PathBuilder<A>): Constrained<A, R, M, 'withPath'>;
  withPath(pathOrBuilder: string | PathBuilder<A>) {
    this.record.pathBuilder =
      typeof pathOrBuilder === 'string' ? () => pathOrBuilder : pathOrBuilder;
    return this as any;
  }

  withHeaders(headers: Headers): Constrained<A, R, M, 'withHeaders'>;
  withHeaders(builder: HeadersBuilder<A>): Constrained<A, R, M, 'withHeaders'>;
  withHeaders(headersOrBuilder: Headers | HeadersBuilder<A>) {
    this.record.headersBuilder =
      typeof headersOrBuilder === 'function'
        ? headersOrBuilder
        : () => headersOrBuilder;
    return this as any;
  }

  withMapper<T>(mapper: (res: R, args: A) => T) {
    this.record.mapper = mapper;
    return (this as unknown) as Constrained<A, T, M, 'withMapper'>;
  }

  withFormBody(
    body: FormBody
  ): Constrained<A, R, M, 'withJsonBody' | 'withFormBody'>;
  withFormBody(
    builder: FormBodyBuilder<A>
  ): Constrained<A, R, M, 'withJsonBody' | 'withFormBody'>;
  withFormBody(bodyOrBuilder: FormBody | FormBodyBuilder<A>) {
    const builder =
      typeof bodyOrBuilder === 'function' ? bodyOrBuilder : () => bodyOrBuilder;
    this.record.bodyBuilder = { kind: 'form', builder };
    return this as any;
  }

  withJsonBody(
    body: JsonBody
  ): Constrained<A, R, M, 'withJsonBody' | 'withFormBody'>;
  withJsonBody(
    builder: JsonBodyBuilder<A>
  ): Constrained<A, R, M, 'withJsonBody' | 'withFormBody'>;
  withJsonBody(bodyOrBuilder: JsonBody | JsonBodyBuilder<A>) {
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
