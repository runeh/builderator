# TSDX Bootstrap

## Todo

- 204 and other bodyless responses
- Partial record with type guard
  - Throw when incomplete object
- Support all types from BodyInit
- typing stuff for body type. Disallow when not post
- join the withType to support runtype or generic?
- exceptions
- before/after handlers
- Throw if no runtype for response?
- error mapper?
- Prevent combining head with response stuff
- More error classes or `kind` on API error?
- Custom error when input runtype fails
- ditto mapper?
- Other fetch errors than 404. Like no network, no dns etc.

## tests

- ua and content type works together with user supplied headers
- smoke / everything
- error handling
- before / after
- something in mapper throws

## misc

- Type that matches union of features ?
  - Can do with lots of feat1_feat2_feat3_feat4 things?
