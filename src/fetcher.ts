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
      queryBuilder ? queryBuilder(args) : undefined
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
  opts: FetchOpts
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
      maybeError.success ? maybeError.value : undefined
    );
  } else if (res.status === 200) {
    return { res, value: await unpackJson(res) };
  } else {
    return { res, value: undefined };
  }
}
