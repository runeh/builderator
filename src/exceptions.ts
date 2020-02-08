import { Response } from 'node-fetch';
import * as rt from 'runtypes';
export { ValidationError } from 'runtypes';

export const ErrorResponseRt = rt.Record({
  Message: rt.String,
  StackTrace: rt.String.Or(rt.Null),
  Source: rt.String.Or(rt.Null),
  InnerException: rt.Unknown.Or(rt.Null),
  ErrorReference: rt.String.Or(rt.Null),
});

type ErrorResponse = rt.Static<typeof ErrorResponseRt>;

export class ApiError extends Error {
  status: number;
  statusText: string;
  error?: ErrorResponse;

  constructor(message: string, res: Response, error?: ErrorResponse) {
    super(message);
    this.status = res.status;
    this.statusText = res.statusText;
    this.error = error;
    this.name = 'ApiError';
  }
}
