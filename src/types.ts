import * as rt from 'runtypes';

export type HttpMethod = 'DELETE' | 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT';

export type PayloadMethod = Extract<HttpMethod, 'POST' | 'PUT' | 'PATCH'>;

export type EmptyMethod = Exclude<HttpMethod, PayloadMethod>;

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

interface OnBeforeInfo {
  startTimeMs: number;
}

interface OnAfterInfo<T> {
  startTimeMs: number;
  beforeState: T;
}

export interface Config<T> {
  rootUrl: string;
  userAgent?: string;
  onBefore?: (info: OnBeforeInfo) => T;
  onAfter?: (info: OnAfterInfo<T>) => void;
}
