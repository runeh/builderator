import nock from 'nock';
import { ApiError, makeDef, argType } from '../src';
import * as rt from 'runtypes';

const rootUrl = 'http://example.org';

describe('fetch call builder', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    // if a test fails, make sure it doesn't affect other tests
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('respects the url from rootUrl', async () => {
    nock('http://lol.com')
      .get('/boop')
      .reply(200, {});

    const call = makeDef({
      method: 'GET',
      path: '/boop',
    });

    await call({ rootUrl: 'http://lol.com/boop' });
  });

  describe('path building', () => {
    it('can take value', async () => {
      nock(rootUrl)
        .get('/')
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
      });
      await call({ rootUrl });
    });

    it('can take factory', async () => {
      nock(rootUrl)
        .get('/root')
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: () => '/root',
      });

      await call({ rootUrl });
    });

    it('can take factory with array', async () => {
      nock(rootUrl)
        .get('/root/1/false/42')
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: () => ['root', 1, false, 42],
      });

      await call({ rootUrl });
    });

    it('can take factory with args', async () => {
      nock(rootUrl)
        .get('/root/bar')
        .reply(200, {});

      const call = makeDef({
        args: argType<{ val: string }>(),
        method: 'GET',
        path: e => ['root', e.val],
      });

      await call({ rootUrl }, { val: 'bar' });
    });

    it('can take factory with args new', async () => {
      nock(rootUrl)
        .get('/root/bar')
        .reply(200, {});

      const call = makeDef({
        args: argType<{ val: string }>(),
        method: 'GET',
        path: e => ['root', e.val],
      });

      await call({ rootUrl }, { val: 'bar' });
    });
  });

  describe('method building', () => {
    it('can build GET requests', async () => {
      nock(rootUrl)
        .get('/')
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
      });

      await call({ rootUrl });
    });

    it('can build POST requests', async () => {
      nock(rootUrl)
        .post('/')
        .reply(200, {});

      const call = makeDef({
        method: 'POST',
        path: '/',
      });

      await call({ rootUrl });
    });

    it('can build PUT requests', async () => {
      nock(rootUrl)
        .put('/')
        .reply(200, {});

      const call = makeDef({
        method: 'PUT',
        path: '/',
      });

      await call({ rootUrl });
    });

    it('can build HEAD requests', async () => {
      nock(rootUrl)
        .head('/')
        .reply(200, {});

      const call = makeDef({
        method: 'HEAD',
        path: '/',
      });

      await call({ rootUrl });
    });

    it('can build DELETE requests', async () => {
      nock(rootUrl)
        .delete('/')
        .reply(200, {});

      const call = makeDef({
        method: 'DELETE',
        path: '/',
      });

      await call({ rootUrl });
    });
  });

  describe('header building', () => {
    it('can take value', async () => {
      nock(rootUrl, { reqheaders: { foo: 'bar' } })
        .get('/')
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
        headers: { foo: 'bar' },
      });

      await call({ rootUrl });
    });

    it('can take factory', async () => {
      nock(rootUrl, { reqheaders: { foo: 'bar' } })
        .get('/')
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
        headers: () => ({ foo: 'bar' }),
      });

      await call({ rootUrl });
    });

    it('can take factory with args', async () => {
      nock(rootUrl, { reqheaders: { foo: 'bar' } })
        .get('/')
        .reply(200, {});

      const call = makeDef({
        args: argType<{ val: string }>(),
        method: 'GET',
        path: '/',
        headers: e => ({ foo: e.val }),
      });

      await call({ rootUrl }, { val: 'bar' });
    });

    it('multiple headers', async () => {
      nock(rootUrl, { reqheaders: { foo: 'bar', 'Cache-Control': 'no-cache' } })
        .get('/')
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
        headers: { foo: 'bar', 'Cache-Control': 'no-cache' },
      });

      await call({ rootUrl });
    });

    it('coexists with UA', async () => {
      nock(rootUrl, {
        reqheaders: { foo: 'bar', 'user-agent': 'test-client' },
      })
        .get('/')
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
        headers: { foo: 'bar' },
      });

      await call({ rootUrl, userAgent: 'test-client' });
    });
  });

  describe('query building', () => {
    it('can value', async () => {
      nock(rootUrl)
        .get('/')
        .query({ foo: 'bar' })
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
        query: { foo: 'bar' },
      });

      await call({ rootUrl });
    });

    it('can take factory', async () => {
      nock(rootUrl)
        .get('/')
        .query({ foo: 'bar' })
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
        query: () => ({ foo: 'bar' }),
      });

      await call({ rootUrl });
    });

    it('can take factory with args', async () => {
      nock(rootUrl)
        .get('/')
        .query({ foo: 'bar' })
        .reply(200, {});

      const call = makeDef({
        args: argType<{ val: string }>(),
        method: 'GET',
        path: '/',
        query: e => ({ foo: e.val }),
      });

      await call({ rootUrl }, { val: 'bar' });
    });

    it('multiple queries variables', async () => {
      const query = { foo: 'bar', baz: 'phlebotinum' };

      nock(rootUrl)
        .get('/')
        .query(query)
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
        query: query,
      });

      await call({ rootUrl });
    });

    it('as URLSearchParams', async () => {
      const query = { foo: 'bar', baz: 'phlebotinum' };

      nock(rootUrl)
        .get('/')
        .query(query)
        .reply(200, {});

      const call = makeDef({
        path: '/',
        method: 'GET',
        query: new URLSearchParams(query),
      });

      await call({ rootUrl });
    });

    it('escaping', async () => {
      const query = { 'Stupid name!': 'with space', baz: '!@#$%^&*()_=$' };

      nock(rootUrl)
        .get('/')
        .query(query)
        .reply(200, {});

      const call = makeDef({
        method: 'GET',
        path: '/',
        query: query,
      });

      await call({ rootUrl });
    });
  });

  describe('JSON body building', () => {
    const testBody = { foo: { bar: [1, 'lol', false] } };

    it('can take value', async () => {
      nock(rootUrl, { reqheaders: { 'content-type': 'application/json' } })
        .post('/', testBody)
        .reply(200, {});

      const call = makeDef({
        method: 'POST',
        path: '/',
        jsonBody: testBody,
      });

      await call({ rootUrl });
    });

    it('can take factory', async () => {
      nock(rootUrl, { reqheaders: { 'content-type': 'application/json' } })
        .post('/', testBody)
        .reply(200, {});

      const call = makeDef({
        method: 'POST',
        path: '/',
        jsonBody: () => testBody,
      });

      await call({ rootUrl });
    });

    it('can take factory with args', async () => {
      const body = { ...testBody, test: 'bar' };

      nock(rootUrl, { reqheaders: { 'content-type': 'application/json' } })
        .post('/', body)
        .reply(200, {});

      const call = makeDef({
        args: argType<{ val: string }>(),
        method: 'POST',
        path: '/',
        jsonBody: e => ({ ...testBody, test: e.val }),
      });

      await call({ rootUrl }, { val: 'bar' });
    });

    it.todo('can take FormBody');
    it.todo('can take stream');
  });

  describe('form body building', () => {
    const body = { foo: 'bar' };
    it('can take value', async () => {
      nock(rootUrl, {
        reqheaders: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
      })
        .post('/', 'foo=bar')
        .reply(200, {});

      const call = makeDef({
        method: 'POST',
        path: '/',
        formBody: body,
      });

      await call({ rootUrl });
    });

    it.todo('can take urlsearchparams');
    it.todo('can take builder');
    it.todo('can take args');
  });

  describe('response runtype', () => {
    it('validates type', async () => {
      const body = { name: 'Rune', age: 40 };

      nock(rootUrl)
        .get('/')
        .reply(200, body);

      const call = makeDef({
        method: 'GET',
        path: '/',
        runtype: rt.Record({ name: rt.String, age: rt.Number }),
      });

      const ret = await call({ rootUrl });
      expect(ret.name).toEqual(body.name);
      expect(ret.age).toEqual(body.age);
    });

    it('throw on not matching type', async () => {
      const body = { name: 'Rune', age: 40 };

      nock(rootUrl)
        .get('/')
        .reply(200, body);

      const call = makeDef({
        method: 'GET',
        path: '/',
        runtype: rt.Record({ name: rt.String, oldness: rt.Number }),
      });

      const response = call({ rootUrl });

      await expect(response).rejects.toThrowError(rt.ValidationError);
      await expect(response).rejects.toHaveProperty(
        'message',
        'Expected number, but was undefined'
      );
    });
  });

  describe('error handling', () => {
    it('should throw on not OK status', async () => {
      nock(rootUrl)
        .get('/')
        .reply(404);

      const call = makeDef({
        method: 'GET',
        path: '/',
      });

      const response = call({ rootUrl });

      await expect(response).rejects.toThrowError(ApiError);
      await expect(response).rejects.toMatchObject({
        status: 404,
        statusText: 'Not Found',
      });
    });

    it('should throw when error in mapper', async () => {
      nock(rootUrl)
        .get('/')
        .reply(200, { name: 'foo' });

      const call = makeDef({
        method: 'GET',
        path: '/',
        map: () => {
          throw new Error('Morradi');
        },
      });

      const response = call({ rootUrl });
      await expect(response).rejects.toThrowError(Error);
      await expect(response).rejects.toMatchObject({
        message: 'Morradi',
      });
    });

    it('should throw when runtype input cond fails', async () => {
      nock(rootUrl)
        .get('/')
        .reply(204);

      const call = makeDef({
        method: 'GET',
        path: '/',
        args: rt.String.withConstraint(
          e => e.length === 4 || 'String must be 4 characters long'
        ),
      });

      const response = call({ rootUrl }, 'foo');

      await expect(response).rejects.toThrowError(rt.ValidationError);
    });

    it.todo('Get data for body on errors');
  });

  describe('Empty responses', () => {
    it('should return undefined when no rt and no response body', async () => {
      nock(rootUrl)
        .get('/')
        .reply(204);

      const call = makeDef({
        method: 'GET',
        path: '/',
      });

      const response = call({ rootUrl });
      await expect(response).resolves.toEqual(undefined);
    });

    it('should throw when runtype but no response body', async () => {
      nock(rootUrl)
        .get('/')
        .reply(204);

      const call = makeDef({
        method: 'GET',
        path: '/',
        runtype: rt.String,
      });

      const response = call({ rootUrl });
      await expect(response).rejects.toThrowError(ApiError);
      await expect(response).rejects.toMatchObject({
        message: 'Got HTTP status 204 but call requires response body',
      });
    });
  });

  describe('runtype arguments', () => {
    it('should accept runtype as argument type', async () => {
      nock(rootUrl)
        .get('/')
        .reply(204);

      const call = makeDef({
        args: rt.Record({ name: rt.String, age: rt.Number }),
        method: 'GET',
        path: '/',
      });

      await call({ rootUrl }, { age: 12, name: 'blargh' });
    });
  });

  it('should accept mapper with using runtype', async () => {
    nock(rootUrl)
      .get('/')
      .reply(200, { name: 'test' });

    const call = makeDef({
      method: 'GET',
      path: '/',
      runtype: rt.Record({ name: rt.String }),
      map: e => e.name,
    });

    const response = await call({ rootUrl });
    expect(response).toEqual('test');
  });

  describe('response map', () => {
    it('can map', async () => {
      nock(rootUrl)
        .post('/')
        .reply(200, { name: 'Rune', age: 40 });

      const call = makeDef({
        args: argType<string>(),
        runtype: rt.Record({ name: rt.String, age: rt.Number }),
        method: 'POST',
        path: '/',
        map: e => ({ info: `${e.name} (${e.age})` }),
      });

      const res = await call({ rootUrl }, 'asdf');
      expect(res.info).toEqual('Rune (40)');
    });
  });

  describe('before/after handlers', () => {
    it('should invoke handlers', async () => {
      nock(rootUrl)
        .get('/')
        .reply(204);

      const call = makeDef({
        path: '/',
        method: 'GET',
      });

      const onBefore = jest.fn<any, { startTimeMs: number }[]>(() => ({
        foo: 'test',
      }));
      const onAfter = jest.fn();

      await call({ rootUrl, onBefore, onAfter });

      expect(onBefore).toHaveBeenCalled();
      expect(onAfter).toHaveBeenCalled();

      const onBeforeArg = onBefore.mock.calls[0][0];
      const onAfterArg = onAfter.mock.calls[0][0];

      expect(typeof onBeforeArg.startTimeMs).toEqual('number');

      expect(onAfterArg.startTimeMs).toEqual(onAfterArg.startTimeMs);
      expect(onAfterArg.beforeState.foo).toEqual('test');
    });
  });
});
