# TSDX Bootstrap

## Todo

- 204 and other bodyless responses
- Partial record with type guard
- Throw when incomplete object
- Allow 1 or 2 args to builder

## tests

- ua and content type works together with user supplied headers

createCall()
.withRuntypeArguments
.withArguments<{foo: string}>()
.withHeaders(e => {})
.withRuntype(rt)
.withQuery
.withPath()
.withMethod
.withMapper
.withFormBody()
.withJsonBody()
