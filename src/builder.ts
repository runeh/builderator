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

interface BaseRequest<Arg, Ret, MapRet> {
  path: string | PathBuilder<Arg>;
  headers?: Headers | HeadersBuilder<Arg>;
  query?: Query | QueryBuilder<Arg>;
  runtype?: rt.Runtype<Ret>;
  args?: rt.Runtype<Arg> | ArgTypeSentinel<Arg>;
  map?: (response: Ret, arg: Arg) => MapRet;
}

interface PayloadRequest<Arg, Ret, MapRet>
  extends BaseRequest<Arg, Ret, MapRet> {
  method: PayloadMethod;
  jsonBody?: JsonBody | JsonBodyBuilder<Arg>;
  formBody?: FormBody | FormBodyBuilder<Arg>;
}

interface EmptyRequest<Arg, Ret, MapRet> extends BaseRequest<Arg, Ret, MapRet> {
  method: EmptyMethod;
}

type RequestDefinition<Arg, Ret, MapRet> =
  | PayloadRequest<Arg, Ret, MapRet>
  | EmptyRequest<Arg, Ret, MapRet>;

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
function buildUrl<A, R, X>(def: RequestDefinition<A, R, X>, args: A): URL {
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

function buildHeaders<A, R, X>(
  def: RequestDefinition<A, R, X>,
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

function buildRequestBody<A, R, X>(def: RequestDefinition<A, R, X>, args: A) {
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

// export function makeDef<A, R, X extends number>(
//   arg: RequestDefinition<A, R, X>
// ): 23;
export function makeDef<A extends undefined, R, X>(
  arg: RequestDefinition<A, R, X>
): <T>(config: Config<T>) => Promise<R>;
export function makeDef<A, R, X>(
  arg: RequestDefinition<A, R, X>
): <T>(config: Config<T>, a: A) => Promise<R>;
export function makeDef<A, R, X>(def: RequestDefinition<A, R, X>) {
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
      if (def.runtype !== undefined) {
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
