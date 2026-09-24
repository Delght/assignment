"""Writes the trades.csv files in samples/ for trying the import.

Usage: python3 scripts/generate_samples.py [output folder, default samples]
The output is deterministic (fixed data and a seeded generator), so running it again gives the same files.
"""
import csv, random, sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal as D, ROUND_HALF_EVEN

OUT = sys.argv[1] if len(sys.argv) > 1 else 'samples'
HEADER = ['trade_id', 'timestamp', 'exchange', 'symbol', 'side', 'quantity', 'price_usd', 'fee_usd']
PRICE_DP = {'BTC': 2, 'ETH': 2, 'SOL': 3, 'CKB': 8, 'DOGE': 6}
QTY_DP = {'BTC': 8, 'ETH': 6, 'SOL': 4, 'CKB': 2, 'DOGE': 2}
SNAPSHOT = {'BTC': D('111500'), 'ETH': D('4025'), 'SOL': D('208.5'), 'CKB': D('0.00715'), 'DOGE': D('0.242')}

def q(x, dp): return D(x).quantize(D(1).scaleb(-dp), ROUND_HALF_EVEN)
def ts(t): return t.strftime('%Y-%m-%dT%H:%M:%SZ')
def fee(gross): return q(gross * D('0.001'), 2)  # 0.1 %

def write(name, rows):
    with open(f'{OUT}/{name}', 'w', newline='') as f:
        w = csv.writer(f, lineterminator='\n'); w.writerow(HEADER); w.writerows(rows)

# 1. A short story: open, partially sold, fully closed then rebought, closed for good; no CKB at all.
story = [
    ('2026-01-05T09:00:00Z', 'Binance',  'BTC',  'BUY',  '0.05',     '92000.00'),
    ('2026-01-06T10:30:00Z', 'Coinbase', 'ETH',  'BUY',  '1.5',      '3300.00'),
    ('2026-01-08T14:00:00Z', 'Binance',  'SOL',  'BUY',  '20',       '150.000'),
    ('2026-01-12T08:15:00Z', 'Coinbase', 'DOGE', 'BUY',  '20000',    '0.180000'),
    ('2026-01-20T16:45:00Z', 'Binance',  'BTC',  'BUY',  '0.03',     '98000.00'),
    ('2026-02-02T11:00:00Z', 'Coinbase', 'ETH',  'BUY',  '0.5',      '3600.00'),
    ('2026-02-10T13:20:00Z', 'Binance',  'SOL',  'SELL', '8',        '185.000'),
    ('2026-02-14T09:40:00Z', 'Coinbase', 'ETH',  'SELL', '2',        '3900.00'),   # full close
    ('2026-02-20T18:05:00Z', 'Binance',  'DOGE', 'BUY',  '15000',    '0.210000'),
    ('2026-02-25T07:30:00Z', 'Coinbase', 'BTC',  'SELL', '0.04',     '105000.00'),
    ('2026-03-03T12:00:00Z', 'Binance',  'SOL',  'SELL', '12',       '220.000'),   # closed for good
    ('2026-03-10T15:10:00Z', 'Coinbase', 'ETH',  'BUY',  '0.8',      '3750.00'),   # fresh average
    ('2026-03-18T10:00:00Z', 'Binance',  'BTC',  'BUY',  '0.01',     '108000.00'),
    ('2026-03-25T20:30:00Z', 'Coinbase', 'DOGE', 'SELL', '5000',     '0.250000'),
]
rows = []
for i, (t, ex, sym, side, qty, price) in enumerate(story, 1):
    rows.append([f'ST-{i:03d}', t, ex, sym, side, qty, price, fee(D(qty) * D(price))])
write('story-14-trades.csv', rows)

# 2. A long history: 1,500 trades over three years, prices drifting towards the snapshot, never short.
rng = random.Random(42)
start, end = datetime(2023, 4, 1, tzinfo=timezone.utc), datetime(2026, 3, 30, tzinfo=timezone.utc)
times = sorted(start + timedelta(seconds=rng.randrange(int((end - start).total_seconds()))) for _ in range(1500))
held = {s: D(0) for s in SNAPSHOT}
rows = []
for i, t in enumerate(times, 1):
    sym = rng.choice(list(SNAPSHOT))
    progress = D(str((t - start) / (end - start)))
    base = SNAPSHOT[sym] * (D('0.35') + D('0.65') * progress)          # rises towards the snapshot
    price = q(base * D(str(rng.uniform(0.85, 1.15))), PRICE_DP[sym])
    budget = D(str(rng.uniform(150, 2500)))
    selling = held[sym] > 0 and rng.random() < 0.4
    if selling:
        qty = held[sym] if rng.random() < 0.15 else q(held[sym] * D(str(rng.uniform(0.1, 0.6))), QTY_DP[sym])
        if qty <= 0: qty = held[sym]
        held[sym] -= qty; side = 'SELL'
    else:
        qty = q(budget / price, QTY_DP[sym]); held[sym] += qty; side = 'BUY'
    rows.append([f'H-{i:05d}', ts(t), rng.choice(['Binance', 'Coinbase']), sym, side, qty, price, fee(qty * price)])
write('history-1500-trades.csv', rows)

# 3. A broken file: one of each validation error, plus two valid rows around them.
write('invalid-12-rows.csv', [
    ['BAD-01', '2026-01-05T09:00:00Z', 'Binance',  'BTC',  'BUY',  '0.1',   '95000.00', '9.50'],
    ['BAD-01', '2026-01-06T09:00:00Z', 'Binance',  'ETH',  'BUY',  '1',     '3300.00',  '3.30'],   # duplicate id
    ['BAD-03', '2026-01-07 09:00:00',  'Coinbase', 'ETH',  'BUY',  '1',     '3300.00',  '3.30'],   # not ISO-8601 UTC
    ['BAD-04', '2026-02-30T09:00:00Z', 'Coinbase', 'SOL',  'BUY',  '5',     '150.000',  '0.75'],   # impossible date
    ['BAD-05', '2026-01-09T09:00:00Z', 'Kraken',   'BTC',  'BUY',  '0.1',   '95000.00', '9.50'],   # exchange
    ['BAD-06', '2026-01-10T09:00:00Z', 'Binance',  'ADA',  'BUY',  '100',   '0.90',     '0.09'],   # symbol
    ['BAD-07', '2026-01-11T09:00:00Z', 'Binance',  'BTC',  'HOLD', '0.1',   '95000.00', '9.50'],   # side
    ['BAD-08', '2026-01-12T09:00:00Z', 'Coinbase', 'DOGE', 'BUY',  '0',     '0.180000', '0.00'],   # quantity 0
    ['BAD-09', '2026-01-13T09:00:00Z', 'Coinbase', 'DOGE', 'BUY',  '1000',  '-0.18',    '0.18'],   # negative price
    ['BAD-10', '2026-01-14T09:00:00Z', 'Binance',  'CKB',  'BUY',  '1e5',   '0.00700',  '0.70'],   # exponent
    ['BAD-11', '2026-01-15T09:00:00Z', 'Binance',  'BTC',  'SELL', '0.5',   '99000.00', '49.50'],  # short: holds 0.1
    ['BAD-12', '2026-01-16T09:00:00Z', 'Coinbase', 'ETH',  'BUY',  '1',     '3300.00',  ''],       # missing fee
])

# 4. Valid rows except for two short sales, which are only checked once every row is valid.
write('short-sale-4-rows.csv', [
    ['SS-1', '2026-01-05T09:00:00Z', 'Binance',  'ETH', 'BUY',  '1',    '3300.00',  '3.30'],
    ['SS-2', '2026-01-20T09:00:00Z', 'Coinbase', 'ETH', 'SELL', '0.6',  '3500.00',  '2.10'],
    ['SS-3', '2026-02-10T09:00:00Z', 'Binance',  'ETH', 'SELL', '0.6',  '3600.00',  '2.16'],   # holds 0.4
    ['SS-4', '2026-02-12T09:00:00Z', 'Coinbase', 'BTC', 'SELL', '0.01', '97000.00', '0.97'],   # holds none
])
