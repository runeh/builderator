import * as rt from 'runtypes';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'DELETE';

export type PathPart = string | number | boolean;
export type PathBuilder<A> = (args: A) => string | readonly PathPart[];

export type Query = URLSearchParams | Record<string, string>;
export type QueryBuilder<Args> = (args: Args) => Query;

export type Headers = Record<string, string>;
export type HeadersBuilder<A> = (args: A) => Headers;

// fixme: allow more types here?
export type FormBody = URLSearchParams | Record<string, string>;
export type FormBodyBuilder<A> = (args: A) => FormBody;

export type JsonBody = Record<string, unknown>;
export type JsonBodyBuilder<A> = (args: A) => JsonBody;

export interface CallRecord<A, R> {
  argRuntype?: rt.Runtype;
  headersBuilder?: HeadersBuilder<A>;
  httpMethod?: Method;
  outputRuntype: rt.Runtype<R>;
  pathBuilder?: PathBuilder<A>;
  queryBuilder?: QueryBuilder<A>;
  mapper?: (response: R, args: A) => any;
  bodyBuilder?:
    | { kind: 'form'; builder: FormBodyBuilder<A> }
    | { kind: 'json'; builder: JsonBodyBuilder<A> };
}

export interface Config {
  rootUrl: string;
  userAgent?: string;
  onBefore?: (info: { startTimeMs: number }) => void;
  onAfter?: (info: { startTimeMs: number }) => void;
}
