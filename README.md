# TSDX Bootstrap

## Todo

- 204 and other bodyless responses
- Partial record with type guard
- Throw when incomplete object
- Allow 1 or 2 args to builder
- skip "with" in methods?
- Support all types from BodiInit
- typing stuff for body type. Disallow when not post
- join the withType to support runtype or generic?
- exceptions
- before/after handlers

## tests

- ua and content type works together with user supplied headers
- smoke / everything

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
