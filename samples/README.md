# Sample imports

Trade files for trying **Import trades.csv**.
Expected results assume the supplied `prices.csv`.

| File | What it shows | Expected result |
| --- | --- | --- |
| [`story-14-trades.csv`](story-14-trades.csv) | BTC partly sold, ETH sold out then bought again, SOL closed, DOGE held, no CKB | Value $16,055.00, realized +$2,853.86, unrealized +$2,405.65, total +$5,259.51, fees $45.49 |
| [`invalid-12-rows.csv`](invalid-12-rows.csv) | One of each validation error | Rejected with 10 issues |
| [`short-sale-4-rows.csv`](short-sale-4-rows.csv) | Two sales above what is held | Rejected with 2 issues |

`invalid-12-rows.csv` also has a short sale (`BAD-11`) that is not reported: holdings are only judged once every row is valid.

On the live app, press **Reset to sample data** afterwards.
