import { URL, URLSearchParams } from 'url';
import { CallRecord, PathPart, Query, Config } from './types';
import fetch from 'node-fetch';

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
function buildUrl<A, R>(record: CallRecord<A, R>, args: A): URL {
  const pathFun = record.pathBuilder ?? (() => '/');
  const path: string = pathToString(pathFun(args));

  const queryFun = record.queryBuilder ?? (() => undefined);
  const query = queryToSearchParams(queryFun(args));

  const url = new URL('http://example.org');
  url.pathname = path;
  for (const [key, value] of query) {
    url.searchParams.set(key, value);
  }

  return url;
}

function buildHeaders<A, R>(
  record: CallRecord<A, R>,
  args: A,
  config: Config
): Record<string, string> {
  const headers: Record<string, string> = record.headersBuilder
    ? record.headersBuilder(args)
    : {};

  if (config.userAgent) {
    headers['User-Agent'] = config.userAgent;
  }

  if (record.bodyBuilder?.kind === 'json') {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export function makeFetchFunction<A, R>(
  record: CallRecord<A, R>
): (config: Config, args: A) => Promise<R> {
  return async (config: Config, args: A) => {
    const url = buildUrl(record, args);

    const headers = buildHeaders(record, args, config);

    const res = await fetch(url, {
      method: record.httpMethod ?? 'GET',
      headers,
    });

    const json = await res.json();

    return record.outputRuntype.check(json);
  };
}
