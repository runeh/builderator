import * as rt from 'runtypes';
import {
  Headers,
  HeadersBuilder,
  Query,
  QueryBuilder,
  EmptyMethod,
  PayloadMethod,
  Config,
  PathPart,
  PathBuilder,
  FormBody,
  FormBodyBuilder,
  JsonBody,
  JsonBodyBuilder,
} from './types';
import nodeFetch from 'node-fetch';
import { ApiError } from './exceptions';
import { URLSearchParams } from 'url';

export function argType<T>() {
  return (t: T) => ({ payload: t });
}

type ArgTypeSentinel<P> = (...args: any[]) => { payload: P };

interface BaseRequest<Arg, Ret> {
  path: string | PathBuilder<Arg>;
  headers?: Headers | HeadersBuilder<Arg>;
  query?: Query | QueryBuilder<Arg>;
  runtype?: rt.Runtype<Ret>;
  args?: rt.Runtype<Arg> | ArgTypeSentinel<Arg>;
  map?: (response: Ret, arg: Arg) => any;
}

interface PayloadRequest<Arg, Ret> extends BaseRequest<Arg, Ret> {
  method: PayloadMethod;
  jsonBody?: JsonBody | JsonBodyBuilder<Arg>;
  formBody?: FormBody | FormBodyBuilder<Arg>;
}

interface EmptyRequest<Arg, Ret> extends BaseRequest<Arg, Ret> {
  method: EmptyMethod;
}

type RequestDefinition<Arg = any, Ret = any> =
  | PayloadRequest<Arg, Ret>
  | EmptyRequest<Arg, Ret>;

function isRuntype(thing: any): thing is rt.Runtype {
  if (thing != null && typeof thing.check === 'function') {
    return true; // fixme
  } else {
    return false;
  }
}

function pathToString(path: string | readonly PathPart[]): string {
  return typeof path === 'string' ? path : path.join('/');
}

function queryToSearchParams(query: Query | undefined): URLSearchParams {
  if (query === undefined) {
    return new URLSearchParams();
  } else if (query instanceof URLSearchParams) {
    return query;
  } else {
    return new URLSearchParams(query as any); // fixme
  }
}

// fixme: Also options
function buildUrl<A, R>(def: RequestDefinition<A, R>, args: A): URL {
  const { path, query } = def;
  const pathFun = typeof path === 'string' ? () => path : path;
  const queryFun = typeof query === 'function' ? query : () => query;
  // fixme
  const url = new URL('http://example.org');
  url.pathname = pathToString(pathFun(args));
  for (const [key, value] of queryToSearchParams(queryFun(args))) {
    url.searchParams.set(key, value);
  }
  return url;
}

function buildHeaders<A, R>(
  def: RequestDefinition<A, R>,
  args: A,
  config: Config<any>
): Record<string, string> {
  const allHeaders: Record<string, string> =
    def.headers === undefined
      ? {}
      : typeof def.headers === 'function'
      ? def.headers(args)
      : def.headers;

  if (config.userAgent) {
    allHeaders['User-Agent'] = config.userAgent;
  }

  //fixme
  if (def.method === 'POST' || def.method === 'PUT' || def.method === 'PATCH') {
    if (def.jsonBody !== undefined)
      allHeaders['Content-Type'] = 'application/json';
  }

  return allHeaders;
}

function buildRequestBody<A, R>(def: RequestDefinition<A, R>, args: A) {
  //fixme
  if (def.method === 'POST' || def.method === 'PUT' || def.method === 'PATCH') {
    if (def.jsonBody !== undefined) {
      const data =
        typeof def.jsonBody === 'function' ? def.jsonBody(args) : def.jsonBody;
      return JSON.stringify(data);
    }

    if (def.formBody !== undefined) {
      const body =
        typeof def.formBody === 'function' ? def.formBody(args) : def.formBody;
      if (body instanceof URLSearchParams) {
        return body;
      } else {
        // fixme
        // @ts-ignore
        return new URLSearchParams(body);
      }
      // return body instanceof URLSearchParams ? body : new URLSearchParams(body);
    }
  } else {
    return undefined;
  }
}

export function makeDef<A extends undefined, R>(
  arg: RequestDefinition<A, R>
): <T>(config: Config<T>) => Promise<R>;
export function makeDef<A, R>(
  arg: RequestDefinition<A, R>
): <T>(config: Config<T>, a: A) => Promise<R>;
export function makeDef<A, R>(def: RequestDefinition<A, R>) {
  const ret = async <C>(config: Config<C>, args: A) => {
    if (isRuntype(def.args)) {
      def.args.check(args);
    }

    const url = buildUrl(def, args);
    const method = def.method;
    const headers = buildHeaders(def, args, config);
    const body = buildRequestBody(def, args);
    // let beforeRet: C | undefined = undefined;

    // const startTimeMs = Date.now();
    // if (config.onBefore !== undefined) {
    // beforeRet = config.onBefore({ startTimeMs });
    // }

    const res = await nodeFetch(url, { method, headers, body });

    // if (config.onAfter) {
    //   config.onAfter({ startTimeMs, beforeState: beforeRet });
    // }

    if (res.status === 204) {
      if (def.runtype !== rt.Void) {
        throw new ApiError(
          `Got HTTP status ${res.status} but call requires response body`,
          res
        );
      } else {
        return void 0;
      }
    } else if (res.ok) {
      const json = await res.json();

      // fixme: why is this allowed when runtype is optional?
      const ret = def.runtype?.check(json) ?? json;
      return def.map ? def.map(ret, args) : ret;
    } else {
      throw new ApiError(`Got HTTP status ${res.status}`, res);
    }
  };
  return ret as any;
}

// const lal = makeDef({
//   method: 'GET',
//   path: '/foo',
//   runtype: rt.Boolean,
//   args: argType<{ name: string }>(),
// });

// lal({
//   rootUrl: '',
//   onBefore: () => ({
//     age: 32,
//   }),
//   onAfter: a => a.beforeState,
// });
