import * as rt from 'runtypes';
import {
  Headers,
  HeadersBuilder,
  Query,
  QueryBuilder,
  VoidMethod,
  BodyMethod,
  Config,
} from './types';

function argType<T>() {
  return (t: T) => ({ payload: t });
}

type ArgTypeSentinel<P> = (...args: any[]) => { payload: P };

interface BaseRequest<Arg, Ret> {
  path: string;
  headers?: Headers | HeadersBuilder<Arg>;
  query?: Query | QueryBuilder<Arg>;
  runtype?: rt.Runtype<Ret>;
  args?: rt.Runtype<Arg> | ArgTypeSentinel<Arg>;
}

interface BodyRequest<Arg, Ret> extends BaseRequest<Arg, Ret> {
  method: BodyMethod;
  body: string;
}

interface HeadRequest<Arg, Ret> extends BaseRequest<Arg, Ret> {
  method: VoidMethod;
}

type RequestDefinition<Arg = any, Ret = any> =
  | BodyRequest<Arg, Ret>
  | HeadRequest<Arg, Ret>;

function makeDef<A extends undefined, R>(
  arg: RequestDefinition<A, R>
): <T>(config: Config<T>) => Promise<R>;
function makeDef<A, R>(
  arg: RequestDefinition<A, R>
): <T>(config: Config<T>, a: A) => Promise<R>;
function makeDef<A, R>(arg: RequestDefinition<A, R>) {
  return {} as any;
}

const lal = makeDef({
  method: 'GET',
  path: '/foo',
  runtype: rt.Boolean,
  // args: argType<{ name: string }>(),
});

lal({
  rootUrl: '',
  onBefore: () => ({
    age: 32,
  }),
  onAfter: a => a.beforeState,
});
