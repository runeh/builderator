# TSDX Bootstrap

## Todo

- 204 and other bodyless responses
- Partial record with type guard
- Throw when incomplete object
- Support all types from BodiInit
- typing stuff for body type. Disallow when not post
- join the withType to support runtype or generic?
- exceptions
- before/after handlers

## tests

- ua and content type works together with user supplied headers
- smoke / everything

## misc

- Type that matches union of features ?
  - Can do with lots of feat1_feat2_feat3_feat4 things?

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
