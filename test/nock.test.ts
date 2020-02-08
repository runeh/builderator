import nock from 'nock';
import { createApiCall } from '../src';

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

  describe('path building', () => {
    it('can take value', async () => {
      nock(rootUrl)
        .get('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .build();

      await call({ rootUrl }, undefined);
    });

    it('can take factory', async () => {
      nock(rootUrl)
        .get('/root')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath(() => '/root')
        .build();

      await call({ rootUrl }, undefined);
    });

    it('can take factory with array', async () => {
      nock(rootUrl)
        .get('/root/1/false/42')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath(() => ['root', 1, false, 42])
        .build();

      await call({ rootUrl }, undefined);
    });

    it('can take factory with args', async () => {
      nock(rootUrl)
        .get('/root/test')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withArgs<string>()
        .withPath(e => ['root', e])
        .build();

      await call({ rootUrl }, 'test');
    });
  });

  describe('method building', () => {
    it('can build GET requests', async () => {
      nock(rootUrl)
        .get('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .build();

      await call({ rootUrl }, 'test');
    });

    it('can build POST requests', async () => {
      nock(rootUrl)
        .post('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('POST')
        .withPath('/')
        .build();

      await call({ rootUrl }, 'test');
    });

    it('can build PUT requests', async () => {
      nock(rootUrl)
        .put('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('PUT')
        .withPath('/')
        .build();

      await call({ rootUrl }, 'test');
    });

    it('can build HEAD requests', async () => {
      nock(rootUrl)
        .head('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('HEAD')
        .withPath('/')
        .build();

      await call({ rootUrl }, 'test');
    });

    it('can build DELETE requests', async () => {
      nock(rootUrl)
        .delete('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('DELETE')
        .withPath('/')
        .build();

      await call({ rootUrl }, 'test');
    });
  });

  describe('header building', () => {
    it('can take value', async () => {
      nock(rootUrl, { reqheaders: { foo: 'bar' } })
        .get('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withHeaders({ foo: 'bar' })
        .build();

      await call({ rootUrl }, undefined);
    });

    it('can take factory', async () => {
      nock(rootUrl, { reqheaders: { foo: 'bar' } })
        .get('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withHeaders(() => ({ foo: 'bar' }))
        .build();

      await call({ rootUrl }, undefined);
    });

    it('can take factory with args', async () => {
      nock(rootUrl, { reqheaders: { foo: 'bar' } })
        .get('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withArgs<string>()
        .withHeaders(e => ({ foo: e }))
        .build();

      await call({ rootUrl }, 'bar');
    });

    it('multiple headers', async () => {
      nock(rootUrl, { reqheaders: { foo: 'bar', 'Cache-Control': 'no-cache' } })
        .get('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withHeaders({ foo: 'bar', 'Cache-Control': 'no-cache' })
        .build();

      await call({ rootUrl }, undefined);
    });

    it('coexists with UA', async () => {
      nock(rootUrl, {
        reqheaders: { foo: 'bar', 'user-agent': 'test-client' },
      })
        .get('/')
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withHeaders({ foo: 'bar' })
        .build();

      await call({ rootUrl, userAgent: 'test-client' }, undefined);
    });
  });

  describe('query building', () => {
    it('can value', async () => {
      nock(rootUrl)
        .get('/')
        .query({ foo: 'bar' })
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withQuery({ foo: 'bar' })
        .build();

      await call({ rootUrl }, undefined);
    });

    it('can take factory', async () => {
      nock(rootUrl)
        .get('/')
        .query({ foo: 'bar' })
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withQuery(() => ({ foo: 'bar' }))
        .build();

      await call({ rootUrl }, undefined);
    });

    it('can take factory with args', async () => {
      nock(rootUrl)
        .get('/')
        .query({ foo: 'bar' })
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withArgs<string>()
        .withQuery(e => ({ foo: e }))
        .build();

      await call({ rootUrl }, 'bar');
    });

    it('multiple queries variables', async () => {
      const query = { foo: 'bar', baz: 'phlebotinum' };

      nock(rootUrl)
        .get('/')
        .query(query)
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withQuery(query)
        .build();

      await call({ rootUrl }, undefined);
    });

    it('as URLSearchParams', async () => {
      const query = { foo: 'bar', baz: 'phlebotinum' };

      nock(rootUrl)
        .get('/')
        .query(query)
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withQuery(new URLSearchParams(query))
        .build();

      await call({ rootUrl }, undefined);
    });

    it('escaping', async () => {
      const query = { 'Stupid name!': 'with space', baz: '!@#$%^&*()_=$' };

      nock(rootUrl)
        .get('/')
        .query(query)
        .reply(200, {});

      const call = createApiCall()
        .withMethod('GET')
        .withPath('/')
        .withQuery(query)
        .build();

      await call({ rootUrl }, undefined);
    });
  });

  describe('JSON body building', () => {
    const testBody = { foo: { bar: [1, 'lol', false] } };

    it('can take value', async () => {
      nock(rootUrl, { reqheaders: { 'content-type': 'application/json' } })
        .post('/', testBody)
        .reply(200, {});

      const call = createApiCall()
        .withMethod('POST')
        .withPath('/')
        .withJsonBody(testBody)
        .build();

      await call({ rootUrl }, undefined);
    });

    it('can take factory', async () => {
      nock(rootUrl, { reqheaders: { 'content-type': 'application/json' } })
        .post('/', testBody)
        .reply(200, {});

      const call = createApiCall()
        .withMethod('POST')
        .withPath('/')
        .withJsonBody(() => testBody)
        .build();

      await call({ rootUrl }, undefined);
    });

    it('can take factory with args', async () => {
      const body = { ...testBody, test: 'foo' };

      nock(rootUrl, { reqheaders: { 'content-type': 'application/json' } })
        .post('/', body)
        .reply(200, {});

      const call = createApiCall()
        .withMethod('POST')
        .withPath('/')
        .withArgs<string>()
        .withJsonBody(e => ({ ...testBody, test: e }))
        .build();

      await call({ rootUrl }, 'foo');
    });

    it.todo('can take FormBody');
  });
});
