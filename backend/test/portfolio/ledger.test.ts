import { describe, expect, it } from 'vitest';
import { buildLedger } from '../../src/portfolio/calculation/ledger.js';
import { InsufficientQuantityError, parseTrades } from '../../src/portfolio/index.js';
import { text, trades, tradesCsv } from './helpers.js';

// Expected values are worked out by hand in the comments, never read back from the engine.

const btc = (ledger: ReturnType<typeof buildLedger>) => {
  const position = ledger.positions.find((p) => p.symbol === 'BTC');
  if (!position) throw new Error('no BTC position');
  return position;
};

describe('BUY', () => {
  it('averages several buys at different prices', () => {
    // 1 @ 100 + 3 @ 200 = 700 for 4 → average 175
    const ledger = buildLedger(
      trades(
        'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,1,100,0',
        'T2,2025-10-02T00:00:00Z,Binance,BTC,BUY,3,200,0',
      ),
    );
    expect(text(btc(ledger).quantity)).toBe('4');
    expect(text(btc(ledger).costBasis)).toBe('700');
    expect(text(btc(ledger).averageCost)).toBe('175');
  });

  it('capitalizes the BUY fee into cost basis and average cost', () => {
    // 2 @ 100 + fee 2 = 202; 2 @ 110 + fee 2 = 222 → 424 for 4 → average 106
    const ledger = buildLedger(
      trades(
        'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,2,100,2',
        'T2,2025-10-02T00:00:00Z,Coinbase,BTC,BUY,2,110,2',
      ),
    );
    expect(text(btc(ledger).costBasis)).toBe('424');
    expect(text(btc(ledger).averageCost)).toBe('106');
    expect(text(btc(ledger).feesPaid)).toBe('4');
  });
});

describe('SELL', () => {
  const opening = [
    'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,1,100,0',
    'T2,2025-10-02T00:00:00Z,Binance,BTC,BUY,3,200,0',
  ]; // 4 held, cost 700, average 175

  it('realizes P&L on a partial sell and keeps the average of what remains', () => {
    // proceeds 1 × 300 = 300; cost removed 175 × 1 = 175 → realized 125; 3 left at 525
    const ledger = buildLedger(
      trades(...opening, 'T3,2025-10-03T00:00:00Z,Binance,BTC,SELL,1,300,0'),
    );
    expect(text(btc(ledger).realizedPnl)).toBe('125');
    expect(text(btc(ledger).quantity)).toBe('3');
    expect(text(btc(ledger).costBasis)).toBe('525');
    expect(text(btc(ledger).averageCost)).toBe('175');
  });

  it('deducts the SELL fee from proceeds', () => {
    // net proceeds 300 − 5 = 295; realized 295 − 175 = 120
    const ledger = buildLedger(
      trades(...opening, 'T3,2025-10-03T00:00:00Z,Binance,BTC,SELL,1,300,5'),
    );
    const effect = ledger.effects.find((e) => e.tradeId === 'T3');
    expect(text(effect?.netProceeds ?? null)).toBe('295');
    expect(text(effect?.costRemoved ?? null)).toBe('175');
    expect(text(btc(ledger).realizedPnl)).toBe('120');
    expect(text(btc(ledger).averageCost)).toBe('175');
    expect(text(btc(ledger).feesPaid)).toBe('5');
  });
});

describe('full close', () => {
  it('resets to exactly zero, so the next BUY starts a fresh average', () => {
    // BUY 3 @ 10 + 1 = 31 (average 10.333…); SELL 3 @ 20 − 0.5 = 59.5 → realized 28.5
    // then BUY 2 @ 50 + 1 = 101 → average 50.5, with nothing left over from the first round
    const ledger = buildLedger(
      trades(
        'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,3,10,1',
        'T2,2025-10-02T00:00:00Z,Binance,BTC,SELL,3,20,0.5',
        'T3,2025-10-03T00:00:00Z,Coinbase,BTC,BUY,2,50,1',
      ),
    );
    const closing = ledger.effects.find((e) => e.tradeId === 'T2');
    expect(text(closing?.quantityAfter ?? null)).toBe('0');
    expect(text(closing?.costBasisAfter ?? null)).toBe('0');
    expect(text(closing?.averageCostAfter ?? null)).toBe('0');
    expect(text(closing?.realizedPnl ?? null)).toBe('28.5');
    expect(text(btc(ledger).averageCost)).toBe('50.5');
    expect(text(btc(ledger).costBasis)).toBe('101');
  });

  it('realizes exactly proceeds minus cost over a round trip with a repeating average', () => {
    // cost 31 for 3 (average 10.333…); sell 1 @ 20 then 2 @ 20: total 60 − 31 = 29 exactly.
    // The closing sale removes the whole remaining cost basis, so no rounding residue survives.
    const ledger = buildLedger(
      trades(
        'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,3,10,1',
        'T2,2025-10-02T00:00:00Z,Binance,BTC,SELL,1,20,0',
        'T3,2025-10-03T00:00:00Z,Binance,BTC,SELL,2,20,0',
      ),
    );
    expect(text(btc(ledger).realizedPnl)).toBe('29');
    expect(text(btc(ledger).costBasis)).toBe('0');
  });

  it('treats selling exactly what remains as a close, not a short (binary floats would not)', () => {
    // In floats 0.3 − 0.1 = 0.19999999999999998 < 0.2, which would reject T3 as a short sale.
    const ledger = buildLedger(
      trades(
        'T1,2025-10-01T00:00:00Z,Binance,ETH,BUY,0.3,1000,0',
        'T2,2025-10-02T00:00:00Z,Binance,ETH,SELL,0.1,1000,0',
        'T3,2025-10-03T00:00:00Z,Binance,ETH,SELL,0.2,1000,0',
      ),
    );
    const eth = ledger.positions.find((p) => p.symbol === 'ETH');
    expect(eth?.quantity.isZero()).toBe(true);
    expect(eth?.costBasis.isZero()).toBe(true);
  });
});

describe('ordering', () => {
  it('replays in timestamp order whatever the file order', () => {
    // The SELL is first in the file but last in time.
    const ledger = buildLedger(
      trades(
        'T3,2025-10-03T00:00:00Z,Binance,BTC,SELL,1,300,0',
        'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,1,100,0',
        'T2,2025-10-02T00:00:00Z,Binance,BTC,BUY,3,200,0',
      ),
    );
    expect(ledger.effects.map((e) => e.tradeId)).toEqual(['T1', 'T2', 'T3']);
    expect(text(btc(ledger).realizedPnl)).toBe('125');
  });

  it('breaks timestamp ties by trade_id', () => {
    const rows = [
      'T2,2025-10-01T00:00:00Z,Binance,BTC,BUY,1,200,0',
      'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,1,100,0',
    ];
    expect(buildLedger(trades(...rows)).effects.map((e) => e.tradeId)).toEqual(['T1', 'T2']);
    expect(buildLedger(trades(...rows.reverse())).effects.map((e) => e.tradeId)).toEqual([
      'T1',
      'T2',
    ]);
  });
});

describe('short sales', () => {
  it('are rejected at import with the line and the quantity held', () => {
    const result = parseTrades(
      tradesCsv(
        'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,1,100,0',
        'T2,2025-10-02T00:00:00Z,Binance,BTC,SELL,1.5,120,0',
      ),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ line: 3, code: 'insufficient_quantity' });
    expect(result.issues[0]?.message).toContain('exceeds the 1 BTC held');
  });

  it('are refused by the engine too if validation is ever bypassed', () => {
    const [buy, sell] = trades(
      'T1,2025-10-01T00:00:00Z,Binance,BTC,BUY,2,100,0',
      'T2,2025-10-02T00:00:00Z,Binance,BTC,SELL,2,120,0',
    );
    if (!buy || !sell) throw new Error('fixture');
    const oversized = { ...sell, quantity: sell.quantity.plus(1) };
    expect(() => buildLedger([buy, oversized])).toThrow(InsufficientQuantityError);
  });
});
