import { URL, URLSearchParams } from 'url';
import fetch, { BodyInit, Response } from 'node-fetch';
import normalizeUrl from 'normalize-url';
import * as rt from 'runtypes';
import { ApiError, ErrorResponseRt } from './exceptions';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

type TokenKind = 'Bearer' | 'Basic' | 'None';

type PathPart = string | number | boolean;
type PathBuilder<Args> = (args: Args) => PathPart | readonly PathPart[];

type Query = URLSearchParams | Record<string, string>;

type QueryBuilder<Args> = (args: Args) => Query;

type JsonBody = Record<string, unknown>;
type JsonBodyBuilder<Args> = (args: Args) => JsonBody;

type FormBody = Query;
type FormBodyBuilder<Args> = (args: Args) => FormBody;

export type BeforeHandler = (info: {
  args: unknown;
  body: unknown;
  url: URL;
  method: Method;
  startTime: number;
}) => void;

export type AfterHandler = (info: {
  response?: Response;
  result?: any;
  error?: any;
  startTime: number;
}) => void;

type Constrained<
  Args,
  ApiReturn,
  UsedMethods extends string,
  CurrentMethod extends string
> = Omit<
  ApiCallBuilder<Args, ApiReturn, CurrentMethod | UsedMethods>,
  CurrentMethod | UsedMethods
>;

export interface CommonOpts {
  apiRoot: string;
  token: string;
  userAgent?: string;
  onBefore?: BeforeHandler;
  onAfter?: AfterHandler;
}

class ApiCallBuilder<
  Args = undefined,
  ApiReturn = undefined,
  UsedMethods extends string = ''
> {
  private record: CallRecord<Args, any> = {
    mapper: data => data,
    method: 'GET',
    pathBuilder: () => [],
    outputRuntype: rt.Unknown,
    inputRuntype: rt.Unknown,
    tokenKind: 'Bearer',
  };

  withArgType<T>() {
    return this as Constrained<
      T,
      ApiReturn,
      UsedMethods,
      'withArgType' | 'withArgRuntype'
    >;
  }

  withArgRuntype<T>(rt: rt.Runtype<T>) {
    this.record.inputRuntype = rt;
    return this as Constrained<
      T,
      ApiReturn,
      UsedMethods,
      'withArgType' | 'withArgRuntype'
    >;
  }

  withRuntype<T>(rt: rt.Runtype<T>) {
    this.record.outputRuntype = rt;
    return (this as unknown) as Constrained<
      Args,
      T,
      UsedMethods,
      'withRuntype'
    >;
  }

  withMethod(method: Method) {
    this.record.method = method;
    return (this as unknown) as Constrained<
      Args,
      ApiReturn,
      UsedMethods,
      'withMethod'
    >;
  }

  withPath(
    builder: PathBuilder<Args>,
  ): Constrained<Args, ApiReturn, UsedMethods, 'withPath'>;
  withPath(
    ...parts: readonly PathPart[]
  ): Constrained<Args, ApiReturn, UsedMethods, 'withPath'>;
  withPath(
    ...args: readonly unknown[]
  ): Constrained<Args, ApiReturn, UsedMethods, 'withPath'> {
    this.record.pathBuilder =
      typeof args[0] === 'function'
        ? (args[0] as PathBuilder<Args>)
        : () => args as readonly PathPart[];

    return (this as unknown) as Constrained<
      Args,
      ApiReturn,
      UsedMethods,
      'withPath'
    >;
  }

  withQuery(query: Query | QueryBuilder<Args>) {
    this.record.queryBuilder =
      typeof query === 'function' ? query : () => query;
    return (this as unknown) as Constrained<
      Args,
      ApiReturn,
      UsedMethods,
      'withQuery'
    >;
  }

  withFormBody(arg: FormBodyBuilder<Args> | FormBody) {
    if (typeof arg === 'function') {
      this.record.formBodyBuilder = arg;
    } else {
      this.record.formBodyBuilder = () => arg;
    }

    return (this as unknown) as Constrained<
      Args,
      ApiReturn,
      UsedMethods,
      'withJsonBody' | 'withFormBody'
    >;
  }

  withJsonBody(arg: JsonBodyBuilder<Args> | JsonBody) {
    if (typeof arg === 'function') {
      this.record.jsonBodyBuilder = arg;
    } else {
      this.record.jsonBodyBuilder = () => arg;
    }
    return (this as unknown) as Constrained<
      Args,
      ApiReturn,
      UsedMethods,
      'withJsonBody' | 'withFormBody'
    >;
  }

  withMap<T>(mapper: (res: ApiReturn, args: Args) => T) {
    this.record.mapper = mapper;
    return (this as unknown) as Constrained<Args, T, UsedMethods, 'withMap'>;
  }

  withTokenKind(kind: TokenKind) {
    this.record.tokenKind = kind;
    return (this as unknown) as Constrained<
      Args,
      ApiReturn,
      UsedMethods,
      'withTokenKind'
    >;
  }

  build() {
    return buildCall<Args, ApiReturn>(this.record);
  }
}

export function createApiCall() {
  return new ApiCallBuilder();
}

type ApiCall<ApiReturn, Args> = Args extends void
  ? (opts: CommonOpts) => Promise<ApiReturn>
  : (opts: CommonOpts, args: Args) => Promise<ApiReturn>;

interface CallRecord<Args, ApiReturn> {
  inputRuntype: rt.Runtype;
  outputRuntype: rt.Runtype<ApiReturn>;
  method: Method;
  pathBuilder: PathBuilder<Args>;
  jsonBodyBuilder?: JsonBodyBuilder<Args>;
  formBodyBuilder?: FormBodyBuilder<Args>;
  queryBuilder?: QueryBuilder<Args>;
  mapper: (response: ApiReturn, args: Args) => any;
  tokenKind: TokenKind;
}

function buildUrl(
  root: string,
  parts: readonly PathPart[] | PathPart,
  query?: Query,
) {
  parts = Array.isArray(parts) ? parts : [parts];
  const url = new URL(normalizeUrl(`${root}/${parts.join('/')}`));
  if (query instanceof URLSearchParams) {
    query.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  } else if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

function buildCall<Args, ApiReturn>(record: CallRecord<Args, ApiReturn>) {
  const {
    mapper,
    method,
    pathBuilder,
    queryBuilder,
    inputRuntype,
    outputRuntype,
    jsonBodyBuilder,
    formBodyBuilder,
    tokenKind,
  } = record;
  const apiCallFun = async (opts: CommonOpts, args: Args) => {
    const url = buildUrl(
      opts.apiRoot,
      pathBuilder(args),
      queryBuilder ? queryBuilder(args) : undefined,
    );
    inputRuntype.check(args);

    const startTime = Date.now();
    if (opts.onBefore) {
      opts.onBefore({ method, args, body: '', url, startTime });
    }

    let result;
    let response;

    try {
      let fetchOpts: FetchOpts = {
        url,
        token: opts.token,
        method,
        kind: 'empty',
        tokenKind,
      };

      if (formBodyBuilder) {
        fetchOpts = {
          ...fetchOpts,
          kind: 'form',
          body: formBodyBuilder(args),
        } as FormBodyFetchOpts;
      } else if (jsonBodyBuilder) {
        fetchOpts = {
          ...fetchOpts,
          kind: 'json',
          body: jsonBodyBuilder(args),
        };
      }

      const ret = await doFetch(fetchOpts);
      response = ret.res;
      result = outputRuntype.check(ret.value);
      const mapped = mapper(result, args);
      if (opts.onAfter) {
        opts.onAfter({ startTime, response, result });
      }
      return mapped;
    } catch (error) {
      if (opts.onAfter) {
        opts.onAfter({ startTime, response, result });
      }

      if (error instanceof rt.ValidationError) {
        throw error;
      } else {
        throw error;
      }
    }
  };

  return apiCallFun as ApiCall<ApiReturn, Args>;
}

function parseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return undefined;
  }
}

async function unpackJson(res: Response) {
  try {
    const data = await res.json();
    return data;
  } catch (error) {
    return undefined;
  }
}

interface BaseFetchOpts {
  method: Method;
  token: string;
  url: URL;
  tokenKind: TokenKind;
  query?: Query;
  userAgent?: string;
}

interface EmptyBodyFetchOpts extends BaseFetchOpts {
  kind: 'empty';
}

interface JsonBodyFetchOpts extends BaseFetchOpts {
  kind: 'json';
  body: JsonBody;
}

interface FormBodyFetchOpts extends BaseFetchOpts {
  kind: 'form';
  body: FormBody;
}

type FetchOpts = EmptyBodyFetchOpts | JsonBodyFetchOpts | FormBodyFetchOpts;

function getBody(opts: FetchOpts): BodyInit | undefined {
  switch (opts.kind) {
    case 'empty':
      return undefined;
    case 'json':
      return JSON.stringify(opts.body);
    case 'form':
      return opts.body instanceof URLSearchParams
        ? opts.body
        : new URLSearchParams(opts.body);
  }
}

async function doFetch(
  opts: FetchOpts,
): Promise<{ res: Response; value?: any }> {
  const { tokenKind, token, method, url } = opts;
  const headers: Record<string, string> = {};

  if (tokenKind !== 'None') {
    headers.Authorization = `${tokenKind} ${token}`;
  }

  if (opts.userAgent) {
    headers['User-Agent'] = opts.userAgent;
  }

  if (opts.kind === 'json') {
    headers['Content-Type'] = 'application/json';
  }

  const body = getBody(opts);
  const res = await fetch(url.toString(), { method, headers, body });

  if (!res.ok) {
    const text = await res.text();
    const data = parseJson(text);
    const maybeError = ErrorResponseRt.validate(data);
    const msg = maybeError.success
      ? maybeError.value.Message
      : text || 'Unknown API error';

    throw new ApiError(
      msg,
      res,
      maybeError.success ? maybeError.value : undefined,
    );
  } else if (res.status === 200) {
    return { res, value: await unpackJson(res) };
  } else {
    return { res, value: undefined };
  }
}
