/**
 * Fails `pnpm typecheck` when frontend/src/api/types.ts stops mirroring the server's contract:
 * each type the two sides exchange must be identical, field for field, including nullability.
 * Types only, nothing runs; the frontend keeps its own copy so the two folders share no code.
 */
import type * as Web from '../../../frontend/src/api/types.js';
import type * as Server from '../../src/api/contract.js';
import type { ErrorBody } from '../../src/infra/http/api-error.js';
import type { AssetSymbol, Exchange, Side, ValidationIssue } from '../../src/portfolio/index.js';

type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type ContractMirror = [
  Expect<Same<Server.DatasetInfo, Web.DatasetInfo>>,
  Expect<Same<Server.HoldingDto, Web.Holding>>,
  Expect<Same<Server.PortfolioResponse, Web.PortfolioResponse>>,
  Expect<Same<Server.TransactionDto, Web.Transaction>>,
  Expect<Same<Server.TransactionsResponse, Web.TransactionsResponse>>,
  Expect<Same<Server.ImportResponse, Web.ImportResponse>>,
  Expect<Same<ValidationIssue, Web.ValidationIssue>>,
  Expect<Same<ErrorBody, Web.ErrorBody>>,
  Expect<Same<AssetSymbol, Web.AssetSymbol>>,
  Expect<Same<Exchange, Web.Exchange>>,
  Expect<Same<Side, Web.Side>>,
];
