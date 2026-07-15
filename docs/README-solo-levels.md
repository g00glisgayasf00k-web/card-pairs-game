# Solo Campaign Levels

Full list of all **500** Solo levels: goals, point targets, and hand budgets for 3★ / 2★ / 1★.

**Source of truth:** `frontend/src/lib/levels.ts`

## How to read this table

- **Target pts** — total score required to clear (plus all milestone goals).
- **3★ / 2★ / 1★ hands** — maximum hands used for each star tier. The **1★** column is the fail limit (`moveLimit`).
- **Goals** — milestone hands required. From level 40+ these often need specific ranks/suits.
- **Avg pts/hand** (pacing math): ~120 early → ~200 late worlds.
- Solo hands pay **base poker values only** (no Quick Play ×10 goal bonus).

## All levels

| Level | Label | Target pts | 3★ hands | 2★ hands | 1★ hands | Goals |
|------:|-------|----------:|---------:|---------:|---------:|-------|
| 1 | Beginner 1 | 1080 | 13 | 16 | 22 | 2× Pair |
| 2 | Beginner 2 | 1166 | 14 | 18 | 23 | 1× Two Pair |
| 3 | Beginner 3 | 1260 | 15 | 19 | 25 | 2× Pair |
| 4 | Beginner 4 | 1361 | 16 | 20 | 27 | 1× Two Pair |
| 5 | Beginner 5 | 1469 | 17 | 22 | 29 | 2× Pair |
| 6 | Beginner 6 | 1586 | 18 | 24 | 32 | 1× Two Pair |
| 7 | Beginner 7 | 1714 | 20 | 25 | 34 | 2× Pair |
| 8 | Beginner 8 | 1850 | 21 | 27 | 37 | 2× Pair; 1× Two Pair |
| 9 | Beginner 9 | 1999 | 23 | 30 | 40 | 2× Pair; 1× Two Pair |
| 10 | Beginner 10 | 2159 | 25 | 32 | 43 | 3× Pair; 1× Two Pair |
| 11 | Amateur 1 | 2160 | 25 | 32 | 43 | 2× Pair |
| 12 | Amateur 2 | 2333 | 27 | 35 | 46 | 1× Three of a Kind |
| 13 | Amateur 3 | 2520 | 28 | 37 | 48 | 2× Pair |
| 14 | Amateur 4 | 2720 | 28 | 38 | 48 | 1× Two Pair; 1× Three of a Kind |
| 15 | Amateur 5 | 2939 | 28 | 38 | 48 | 2× Pair; 1× Two Pair |
| 16 | Amateur 6 | 3174 | 28 | 38 | 48 | 1× Two Pair; 1× Three of a Kind |
| 17 | Amateur 7 | 3427 | 28 | 38 | 48 | 2× Pair; 1× Two Pair |
| 18 | Amateur 8 | 3702 | 28 | 38 | 48 | 1× Two Pair; 1× Three of a Kind |
| 19 | Amateur 9 | 3864 | 28 | 38 | 48 | 2× Pair; 1× Two Pair |
| 20 | Amateur 10 | 3864 | 28 | 38 | 48 | 1× Two Pair; 1× Three of a Kind |
| 21 | Regular 1 | 3240 | 28 | 38 | 48 | 3× Pair; 1× Two Pair |
| 22 | Regular 2 | 3499 | 28 | 38 | 48 | 1× Straight |
| 23 | Regular 3 | 3779 | 28 | 38 | 48 | 1× Two Pair |
| 24 | Regular 4 | 4081 | 28 | 38 | 48 | 3× Pair; 1× Straight |
| 25 | Regular 5 | 4347 | 28 | 38 | 48 | 1× Two Pair; 1× Three of a Kind |
| 26 | Regular 6 | 4347 | 28 | 38 | 48 | 3× Pair; 1× Straight |
| 27 | Regular 7 | 4347 | 28 | 38 | 48 | 1× Two Pair; 1× Three of a Kind |
| 28 | Regular 8 | 4347 | 28 | 38 | 48 | 2× Pair; 1× Straight |
| 29 | Regular 9 | 4347 | 28 | 38 | 48 | 1× Two Pair; 1× Three of a Kind |
| 30 | Regular 10 | 4347 | 28 | 38 | 48 | 2× Pair; 1× Straight |
| 31 | Pro 1 | 4320 | 28 | 38 | 48 | 2× Pair; 1× Two Pair |
| 32 | Pro 2 | 4347 | 28 | 38 | 48 | 1× Three of a Kind; 1× Flush |
| 33 | Pro 3 | 4347 | 28 | 38 | 48 | 2× Pair; 1× Two Pair; 1× Straight |
| 34 | Pro 4 | 4347 | 28 | 38 | 48 | 2× Pair; 1× Three of a Kind; 1× Flush |
| 35 | Pro 5 | 4347 | 28 | 38 | 48 | 1× Two Pair; 1× Straight |
| 36 | Pro 6 | 4347 | 28 | 38 | 48 | 2× Pair; 1× Flush |
| 37 | Pro 7 | 4347 | 28 | 38 | 48 | 1× Two Pair; 1× Three of a Kind; 1× Straight |
| 38 | Pro 8 | 4347 | 28 | 38 | 48 | 2× Pair; 1× Two Pair; 1× Flush |
| 39 | Pro 9 | 4347 | 28 | 38 | 48 | 1× Two Pair; 1× Three of a Kind; 1× Straight |
| 40 | Pro 10 | 4347 | 28 | 38 | 48 | 2× Pair of 9's; 1× JJJ; 1× ♦ Flush |
| 41 | Shark 1 | 4347 | 28 | 38 | 48 | 2× Pair of 5's; 1× QQ+55 |
| 42 | Shark 2 | 4347 | 28 | 38 | 48 | 1× A2345; 1× JJJQQ |
| 43 | Shark 3 | 4347 | 28 | 38 | 48 | 2× Pair of J's; 1× 88+55 |
| 44 | Shark 4 | 4347 | 28 | 38 | 48 | 1× 888; 1× 89TJQ; 1× ♠ Flush |
| 45 | Shark 5 | 4347 | 28 | 38 | 48 | 3× Pair of 4's; 1× 55+44; 1× 88855 |
| 46 | Shark 6 | 4347 | 28 | 38 | 48 | 1× KKK; 1× 89TJQ |
| 47 | Shark 7 | 4347 | 28 | 38 | 48 | 2× Pair of 10's; 1× 44+22; 1× ♦ Flush |
| 48 | Shark 8 | 4347 | 28 | 38 | 48 | 1× 666; 1× 789TJ; 1× 666QQ |
| 49 | Shark 9 | 4347 | 28 | 38 | 48 | 3× Pair of 3's; 1× 99+44; 1× ♣ Flush |
| 50 | Shark 10 | 4347 | 28 | 38 | 48 | 1× QQQ; 1× 789TJ; 1× 222AA |
| 51 | High Roller 1 | 5312 | 28 | 38 | 48 | 3× Pair of 9's; 1× 77+44 |
| 52 | High Roller 2 | 5312 | 28 | 38 | 48 | 1× ♦ Flush; 1× TTTJJ |
| 53 | High Roller 3 | 5312 | 28 | 38 | 48 | 2× Pair of A's; 1× 3333 |
| 54 | High Roller 4 | 5312 | 28 | 38 | 48 | 1× JJJ; 1× 789TJ |
| 55 | High Roller 5 | 5312 | 28 | 38 | 48 | 2× Pair of 7's; 1× AA+33; 1× ♥ Flush |
| 56 | High Roller 6 | 5312 | 28 | 38 | 48 | 1× 444; 1× 789TJ; 1× 555TT |
| 57 | High Roller 7 | 5312 | 28 | 38 | 48 | 3× Pair of K's; 1× 33+22; 1× ♦ Flush |
| 58 | High Roller 8 | 5312 | 28 | 38 | 48 | 1× TTT; 1× 6789T; 1× AAATT |
| 59 | High Roller 9 | 5312 | 28 | 38 | 48 | 2× Pair of 6's; 1× 66+33; 1× ♣ Flush |
| 60 | High Roller 10 | 5312 | 28 | 38 | 48 | 1× 333; 1× 6789T; 1× TTTKK |
| 61 | Ace 1 | 5312 | 28 | 38 | 48 | 2× Pair of Q's; 1× 33+22 |
| 62 | Ace 2 | 5312 | 28 | 38 | 48 | 1× ♣ Flush; 1× ♣ 6789T |
| 63 | Ace 3 | 5312 | 28 | 38 | 48 | 3× Pair of 5's; 1× KK+22; 1× 45678 |
| 64 | Ace 4 | 5312 | 28 | 38 | 48 | 1× AAA; 1× ♣ Flush |
| 65 | Ace 5 | 5312 | 28 | 38 | 48 | 3× Pair of J's; 1× A2345 |
| 66 | Ace 6 | 5312 | 28 | 38 | 48 | 1× 99+77; 1× KKK; 1× 999JJ |
| 67 | Ace 7 | 5312 | 28 | 38 | 48 | 2× Pair of 4's; 1× A2345; 1× ♦ Flush |
| 68 | Ace 8 | 5312 | 28 | 38 | 48 | 1× KK+88; 1× 333; 1× 77744 |
| 69 | Ace 9 | 5312 | 28 | 38 | 48 | 2× Pair of 10's; 1× TJQKA; 1× ♥ Flush |
| 70 | Ace 10 | 5312 | 28 | 38 | 48 | 2× 88+66; 1× 777; 1× 333JJ |
| 71 | Veteran 1 | 5312 | 28 | 38 | 48 | 1× A2345; 1× Royal Flush |
| 72 | Veteran 2 | 5312 | 28 | 38 | 48 | 3× Pair of Q's; 1× 888 |
| 73 | Veteran 3 | 5312 | 28 | 38 | 48 | 1× 6789T; 1× ♠ Flush; 1× ♥ 56789 |
| 74 | Veteran 4 | 5312 | 28 | 38 | 48 | 2× Pair of 5's; 1× QQ+77; 1× 666 |
| 75 | Veteran 5 | 5312 | 28 | 38 | 48 | 1× TJQKA; 1× ♠ 9TJQK |
| 76 | Veteran 6 | 5312 | 28 | 38 | 48 | 2× JJ+77; 1× 888 |
| 77 | Veteran 7 | 5312 | 28 | 38 | 48 | 2× Pair of 7's; 1× AAAA; 1× ♠ A2345 |
| 78 | Veteran 8 | 5312 | 28 | 38 | 48 | 1× 88+33; 1× 666; 1× TJQKA |
| 79 | Veteran 9 | 5312 | 28 | 38 | 48 | 2× Pair of K's; 1× KKKTT; 1× ♠ 9TJQK |
| 80 | Veteran 10 | 5312 | 28 | 38 | 48 | 2× 99+66; 1× 222; 1× A2345 |
| 81 | Expert 1 | 5312 | 28 | 38 | 48 | 1× 666KK; 1× ♥ 45678 |
| 82 | Expert 2 | 5312 | 28 | 38 | 48 | 1× 77+22; 1× JJJ |
| 83 | Expert 3 | 5312 | 28 | 38 | 48 | 2× Pair of Q's; 1× 9TJQK; 1× 4444 |
| 84 | Expert 4 | 5312 | 28 | 38 | 48 | 1× 888; 1× ♦ Flush; 1× ♣ 6789T |
| 85 | Expert 5 | 5312 | 28 | 38 | 48 | 2× KK+55; 1× 9TJQK; 1× 88844 |
| 86 | Expert 6 | 5312 | 28 | 38 | 48 | 2× Pair of A's; 1× 666; 1× AAAA |
| 87 | Expert 7 | 5312 | 28 | 38 | 48 | 2× KK+TT; 1× 789TJ; 1× 666AA |
| 88 | Expert 8 | 5312 | 28 | 38 | 48 | 2× Pair of 7's; 1× 666; 1× ♠ Flush; 1× KKKK |
| 89 | Expert 9 | 5312 | 28 | 38 | 48 | 1× QQ+33; 1× 56789; 1× 333QQ; 1× ♦ 45678 |
| 90 | Expert 10 | 5312 | 28 | 38 | 48 | 2× Pair of K's; 1× ♦ Flush; 1× QQQQ |
| 91 | Elite 1 | 5312 | 28 | 38 | 48 | 1× QQ+99; 1× 444KK |
| 92 | Elite 2 | 5312 | 28 | 38 | 48 | 3× Pair of 6's; 1× ♦ Flush |
| 93 | Elite 3 | 5312 | 28 | 38 | 48 | 1× 222; 1× 89TJQ; 1× 9999 |
| 94 | Elite 4 | 5312 | 28 | 38 | 48 | 2× Pair of J's; 2× 55+44; 1× ♣ Flush |
| 95 | Elite 5 | 5312 | 28 | 38 | 48 | 1× 56789; 1× JJJ88; 1× ♦ 23456 |
| 96 | Elite 6 | 5312 | 28 | 38 | 48 | 2× Pair of 4's; 1× KK+55; 1× TTT; 1× ♦ Flush |
| 97 | Elite 7 | 5312 | 28 | 38 | 48 | 1× TJQKA; 1× JJJ22; 1× 5555 |
| 98 | Elite 8 | 5312 | 28 | 38 | 48 | 3× Pair of 10's; 2× QQ+55; 1× 444 |
| 99 | Elite 9 | 5312 | 28 | 38 | 48 | 1× 45678; 1× JJJ33; 1× ♠ 789TJ; 1× Royal Flush |
| 100 | Elite 10 | 5312 | 28 | 38 | 48 | 2× Pair of 3's; 1× 88+44; 1× 555; 1× ♦ Flush |
| 101 | Beginner 2 1 | 5312 | 28 | 38 | 48 | 1× 9TJQK; 1× JJJJ |
| 102 | Beginner 2 2 | 5312 | 28 | 38 | 48 | 2× Pair of 9's; 1× 44+33 |
| 103 | Beginner 2 3 | 5312 | 28 | 38 | 48 | 1× 555; 1× ♣ Flush; 1× 888AA |
| 104 | Beginner 2 4 | 5312 | 28 | 38 | 48 | 2× Pair of 2's; 2× JJ+44; 1× AAAA |
| 105 | Beginner 2 5 | 5312 | 28 | 38 | 48 | 1× JJJ; 1× 789TJ; 1× 44422 |
| 106 | Beginner 2 6 | 5312 | 28 | 38 | 48 | 2× Pair of 8's; 2× JJ+44; 1× ♠ Flush; 1× ♣ 789TJ |
| 107 | Beginner 2 7 | 5312 | 28 | 38 | 48 | 1× 444; 1× 789TJ; 1× AAAKK; 1× 8888 |
| 108 | Beginner 2 8 | 5312 | 28 | 38 | 48 | 2× Pair of A's; 1× 66+33; 1× ♠ 45678 |
| 109 | Beginner 2 9 | 5312 | 28 | 38 | 48 | 2× TTT; 1× ♣ Flush; 1× JJJ99 |
| 110 | Beginner 2 10 | 5312 | 28 | 38 | 48 | 3× Pair of 6's; 2× 44+33; 1× 23456; 1× ♠ A2345 |
| 111 | Amateur 2 1 | 5312 | 28 | 38 | 48 | 1× ♥ Flush; 1× TTT77 |
| 112 | Amateur 2 2 | 5312 | 28 | 38 | 48 | 3× Pair of Q's; 1× KK+33 |
| 113 | Amateur 2 3 | 5312 | 28 | 38 | 48 | 1× 999; 1× ♣ Flush; 1× 66644 |
| 114 | Amateur 2 4 | 5312 | 28 | 38 | 48 | 3× Pair of 5's; 1× TT+33; 1× 34567 |
| 115 | Amateur 2 5 | 5312 | 28 | 38 | 48 | 1× ♥ Flush; 1× 999JJ; 1× ♠ 9TJQK |
| 116 | Amateur 2 6 | 5312 | 28 | 38 | 48 | 2× Pair of J's; 1× 77+33; 1× 666 |
| 117 | Amateur 2 7 | 5312 | 28 | 38 | 48 | 1× 56789; 1× ♣ Flush; 1× TTT77; 1× 8888 |
| 118 | Amateur 2 8 | 5312 | 28 | 38 | 48 | 2× Pair of 4's; 2× 33+22; 1× 777; 1× ♥ A2345 |
| 119 | Amateur 2 9 | 5312 | 28 | 38 | 48 | 1× TJQKA; 1× ♣ Flush; 1× 66699 |
| 120 | Amateur 2 10 | 5312 | 28 | 38 | 48 | 2× Pair of 10's; 1× KK+22; 1× KKKK |
| 121 | Regular 2 1 | 6439 | 28 | 38 | 48 | 1× 45678; 1× 88844 |
| 122 | Regular 2 2 | 6439 | 28 | 38 | 48 | 2× Pair of 3's; 1× 222 |
| 123 | Regular 2 3 | 6439 | 28 | 38 | 48 | 1× QQ+88; 1× ♠ Flush; 1× 3333 |
| 124 | Regular 2 4 | 6439 | 28 | 38 | 48 | 2× Pair of 9's; 1× 222; 1× 55533 |
| 125 | Regular 2 5 | 6439 | 28 | 38 | 48 | 2× 88+55; 1× 6789T; 1× ♦ Flush |
| 126 | Regular 2 6 | 6439 | 28 | 38 | 48 | 2× Pair of 2's; 1× AAA; 1× AAA66; 1× 5555 |
| 127 | Regular 2 7 | 6439 | 28 | 38 | 48 | 1× JJ+77; 1× 34567; 1× ♦ Flush |
| 128 | Regular 2 8 | 6439 | 28 | 38 | 48 | 2× Pair of 7's; 1× AAA; 1× QQQTT; 1× Royal Flush |
| 129 | Regular 2 9 | 6439 | 28 | 38 | 48 | 1× 88+44; 1× A2345; 1× ♥ Flush; 1× 6666 |
| 130 | Regular 2 10 | 6439 | 28 | 38 | 48 | 2× KKK; 1× AAAKK; 1× ♥ 56789 |
| 131 | Pro 2 1 | 6439 | 28 | 38 | 48 | 3× Pair of 10's; 1× 56789 |
| 132 | Pro 2 2 | 6439 | 28 | 38 | 48 | 1× 666AA; 1× ♠ 23456 |
| 133 | Pro 2 3 | 6439 | 28 | 38 | 48 | 1× 88+33; 1× 888; 1× A2345 |
| 134 | Pro 2 4 | 6439 | 28 | 38 | 48 | 2× Pair of Q's; 1× KKKK; 1× ♣ 9TJQK |
| 135 | Pro 2 5 | 6439 | 28 | 38 | 48 | 1× 888; 1× 56789; 1× Royal Flush |
| 136 | Pro 2 6 | 6439 | 28 | 38 | 48 | 2× KK+55; 1× ♠ Flush; 1× 99977; 1× TTTT |
| 137 | Pro 2 7 | 6439 | 28 | 38 | 48 | 1× AAA; 1× 45678; 1× Royal Flush |
| 138 | Pro 2 8 | 6439 | 28 | 38 | 48 | 1× KK+JJ; 1× ♦ Flush; 1× TTTT |
| 139 | Pro 2 9 | 6439 | 28 | 38 | 48 | 2× Pair of 7's; 1× 666; 1× QQQJJ; 1× ♠ 789TJ |
| 140 | Pro 2 10 | 6439 | 28 | 38 | 48 | 2× KK+44; 1× 23456; 1× ♦ Flush; 1× 9999 |
| 141 | Shark 2 1 | 6439 | 28 | 38 | 48 | 3× Pair of K's; 2× 666 |
| 142 | Shark 2 2 | 6439 | 28 | 38 | 48 | 3× KK+TT; 1× 2222 |
| 143 | Shark 2 3 | 6439 | 28 | 38 | 48 | 4× Pair of 6's; 1× 666; 1× 66677 |
| 144 | Shark 2 4 | 6439 | 28 | 38 | 48 | 1× A2345; 1× ♠ Flush; 1× 9999 |
| 145 | Shark 2 5 | 6439 | 28 | 38 | 48 | 3× QQ+55; 1× 222; 1× ♣ 56789 |
| 146 | Shark 2 6 | 6439 | 28 | 38 | 48 | 1× 6789T; 1× ♠ Flush; 1× 66622; 1× Royal Flush |
| 147 | Shark 2 7 | 6439 | 28 | 38 | 48 | 4× Pair of 5's; 3× JJ+55; 1× 999; 1× 2222 |
| 148 | Shark 2 8 | 6439 | 28 | 38 | 48 | 1× AAAJJ; 1× ♣ 9TJQK; 1× Royal Flush |
| 149 | Shark 2 9 | 6439 | 28 | 38 | 48 | 3× Pair of J's; 3× 77+55; 1× TTT |
| 150 | Shark 2 10 | 6439 | 28 | 38 | 48 | 1× 56789; 1× ♠ Flush; 1× AAAA; 1× ♦ 6789T |
| 151 | High Roller 2 1 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 2× 555 |
| 152 | High Roller 2 2 | 6439 | 28 | 38 | 48 | 1× 9TJQK; 1× JJJ22 |
| 153 | High Roller 2 3 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 3× AA+55; 1× 555 |
| 154 | High Roller 2 4 | 6439 | 28 | 38 | 48 | 1× 45678; 1× JJJ55; 1× QQQQ |
| 155 | High Roller 2 5 | 6439 | 28 | 38 | 48 | 3× Pair of 2's; 3× TT+44; 1× ♦ Flush |
| 156 | High Roller 2 6 | 6439 | 28 | 38 | 48 | 1× QQQ; 1× JJJ22; 1× Royal Flush |
| 157 | High Roller 2 7 | 6439 | 28 | 38 | 48 | 3× Pair of 8's; 2× 66+44; 1× 56789; 1× ♦ Flush |
| 158 | High Roller 2 8 | 6439 | 28 | 38 | 48 | 1× 555; 1× JJJTT; 1× KKKK; 1× ♥ 34567 |
| 159 | High Roller 2 9 | 6439 | 28 | 38 | 48 | 3× Pair of A's; 2× KK+44; 1× ♥ Flush |
| 160 | High Roller 2 10 | 6439 | 28 | 38 | 48 | 1× TTT; 1× 789TJ; 1× 88899 |
| 161 | Ace 2 1 | 6439 | 28 | 38 | 48 | 3× Pair of 7's; 1× 4444 |
| 162 | Ace 2 2 | 6439 | 28 | 38 | 48 | 1× 23456; 1× ♣ Flush |
| 163 | Ace 2 3 | 6439 | 28 | 38 | 48 | 4× Pair of K's; 3× TT+44; 1× KKKTT |
| 164 | Ace 2 4 | 6439 | 28 | 38 | 48 | 1× 999; 1× 789TJ; 1× ♥ Flush |
| 165 | Ace 2 5 | 6439 | 28 | 38 | 48 | 3× Pair of 6's; 2× 88+33; 1× TTT55 |
| 166 | Ace 2 6 | 6439 | 28 | 38 | 48 | 2× 222; 1× 789TJ; 1× ♣ Flush; 1× 7777 |
| 167 | Ace 2 7 | 6439 | 28 | 38 | 48 | 3× Pair of Q's; 2× 44+33; 1× ♦ 34567 |
| 168 | Ace 2 8 | 6439 | 28 | 38 | 48 | 1× 888; 1× 789TJ; 1× ♣ Flush; 1× JJJ55 |
| 169 | Ace 2 9 | 6439 | 28 | 38 | 48 | 3× Pair of 4's; 3× QQ+33; 1× 6666; 1× Royal Flush |
| 170 | Ace 2 10 | 6439 | 28 | 38 | 48 | 1× AAA; 1× 6789T; 1× ♠ Flush |
| 171 | Veteran 2 1 | 6439 | 28 | 38 | 48 | 3× Pair of 10's; 2× 88+33 |
| 172 | Veteran 2 2 | 6439 | 28 | 38 | 48 | 1× ♦ Flush; 1× 9999 |
| 173 | Veteran 2 3 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 3× 77+22; 1× AAA |
| 174 | Veteran 2 4 | 6439 | 28 | 38 | 48 | 1× ♠ Flush; 1× 999JJ; 1× 2222 |
| 175 | Veteran 2 5 | 6439 | 28 | 38 | 48 | 3× Pair of 9's; 2× 33+22; 1× 222 |
| 176 | Veteran 2 6 | 6439 | 28 | 38 | 48 | 1× 45678; 1× ♣ Flush; 1× 77733; 1× Royal Flush |
| 177 | Veteran 2 7 | 6439 | 28 | 38 | 48 | 4× Pair of 2's; 3× JJ+22; 1× 333; 1× ♦ 89TJQ |
| 178 | Veteran 2 8 | 6439 | 28 | 38 | 48 | 2× 89TJQ; 2× ♣ Flush; 1× Royal Flush |
| 179 | Veteran 2 9 | 6439 | 28 | 38 | 48 | 3× Pair of 8's; 2× TT+22; 1× 999; 1× AAAA |
| 180 | Veteran 2 10 | 6439 | 28 | 38 | 48 | 2× 34567; 1× ♣ Flush; 1× KKKAA; 1× ♥ 23456 |
| 181 | Expert 2 1 | 6439 | 28 | 38 | 48 | 3× Pair of A's; 3× AA+44 |
| 182 | Expert 2 2 | 6439 | 28 | 38 | 48 | 1× TTT; 1× ♦ Flush |
| 183 | Expert 2 3 | 6439 | 28 | 38 | 48 | 1× 777AA; 1× AAAA; 1× Royal Flush |
| 184 | Expert 2 4 | 6439 | 28 | 38 | 48 | 3× Pair of 3's; 2× 88+55; 1× AAA |
| 185 | Expert 2 5 | 6439 | 28 | 38 | 48 | 1× ♠ Flush; 1× AAAJJ; 1× Royal Flush |
| 186 | Expert 2 6 | 6439 | 28 | 38 | 48 | 3× 99+77; 1× 444; 1× 56789 |
| 187 | Expert 2 7 | 6439 | 28 | 38 | 48 | 3× Pair of 5's; 1× ♠ Flush; 1× ♦ 56789; 1× Royal Flush |
| 188 | Expert 2 8 | 6439 | 28 | 38 | 48 | 2× 88+22; 1× TTT; 2× 34567; 1× AAA99 |
| 189 | Expert 2 9 | 6439 | 28 | 38 | 48 | 3× Pair of J's; 1× ♠ Flush; 1× ♣ 34567 |
| 190 | Expert 2 10 | 6439 | 28 | 38 | 48 | 2× 88+66; 2× 999; 1× 789TJ; 1× AAAA |
| 191 | Elite 2 1 | 6439 | 28 | 38 | 48 | 1× 444KK; 1× ♣ 9TJQK |
| 192 | Elite 2 2 | 6439 | 28 | 38 | 48 | 3× KK+66; 1× 555 |
| 193 | Elite 2 3 | 6439 | 28 | 38 | 48 | 4× Pair of 10's; 1× 9TJQK; 1× ♠ 6789T |
| 194 | Elite 2 4 | 6439 | 28 | 38 | 48 | 1× 666; 1× 66633; 1× 5555 |
| 195 | Elite 2 5 | 6439 | 28 | 38 | 48 | 2× KK+33; 2× 45678; 1× ♥ Flush |
| 196 | Elite 2 6 | 6439 | 28 | 38 | 48 | 4× Pair of Q's; 1× 666; 1× QQQQ |
| 197 | Elite 2 7 | 6439 | 28 | 38 | 48 | 2× KK+99; 1× 23456; 2× KKKJJ |
| 198 | Elite 2 8 | 6439 | 28 | 38 | 48 | 4× Pair of 5's; 1× 666; 1× ♦ Flush; 1× ♥ 56789 |
| 199 | Elite 2 9 | 6439 | 28 | 38 | 48 | 2× QQ+22; 1× 789TJ; 1× 44466; 1× JJJJ |
| 200 | Elite 2 10 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 1× 666; 1× Royal Flush |
| 201 | Beginner 3 1 | 6439 | 28 | 38 | 48 | 1× 777QQ; 1× JJJJ; 1× ♦ 56789 |
| 202 | Beginner 3 2 | 6439 | 28 | 38 | 48 | 2× 66+44; 1× AAA; 2× ♦ Flush |
| 203 | Beginner 3 3 | 6439 | 28 | 38 | 48 | 4× Pair of K's; 1× 89TJQ; 1× 5555 |
| 204 | Beginner 3 4 | 6439 | 28 | 38 | 48 | 2× TT+55; 1× JJJ; 1× ♥ Flush |
| 205 | Beginner 3 5 | 6439 | 28 | 38 | 48 | 1× 45678; 1× QQQQ; 1× ♣ A2345; 1× Royal Flush |
| 206 | Beginner 3 6 | 6439 | 28 | 38 | 48 | 5× Pair of 3's; 2× 77+55; 1× 555; 1× TTT22 |
| 207 | Beginner 3 7 | 6439 | 28 | 38 | 48 | 1× 9TJQK; 1× ♠ Flush; 1× KKKK |
| 208 | Beginner 3 8 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 3× 66+55; 2× JJJ; 1× ♠ 23456 |
| 209 | Beginner 3 9 | 6439 | 28 | 38 | 48 | 1× 34567; 1× ♣ Flush; 2× TTT55; 1× Royal Flush |
| 210 | Beginner 3 10 | 6439 | 28 | 38 | 48 | 2× AA+44; 2× JJJ; 1× 6666 |
| 211 | Amateur 3 1 | 6439 | 28 | 38 | 48 | 5× Pair of J's; 1× 89TJQ; 1× 66688 |
| 212 | Amateur 3 2 | 6439 | 28 | 38 | 48 | 3× 77+44; 1× TTTT; 1× Royal Flush |
| 213 | Amateur 3 3 | 6439 | 28 | 38 | 48 | 4× Pair of 4's; 1× JJJ; 1× ♥ Flush; 1× 888AA |
| 214 | Amateur 3 4 | 6439 | 28 | 38 | 48 | 3× KK+44; 1× 45678; 1× Royal Flush |
| 215 | Amateur 3 5 | 6439 | 28 | 38 | 48 | 5× Pair of 10's; 2× TTT; 1× TTT99 |
| 216 | Amateur 3 6 | 6439 | 28 | 38 | 48 | 3× 66+44; 2× 34567; 2× ♣ Flush; 1× 9999 |
| 217 | Amateur 3 7 | 6439 | 28 | 38 | 48 | 4× Pair of 2's; 1× TTT; 1× 88855; 1× Royal Flush |
| 218 | Amateur 3 8 | 6439 | 28 | 38 | 48 | 2× QQ+33; 1× ♠ Flush; 1× TTTT |
| 219 | Amateur 3 9 | 6439 | 28 | 38 | 48 | 4× Pair of 8's; 1× TTT; 2× 34567; 1× ♠ 34567 |
| 220 | Amateur 3 10 | 6439 | 28 | 38 | 48 | 2× 55+33; 1× ♣ Flush; 2× QQQ77; 1× 4444 |
| 221 | Regular 3 1 | 6439 | 28 | 38 | 48 | 2× AAA; 2× 789TJ; 1× ♠ 89TJQ |
| 222 | Regular 3 2 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 2× 66+33; 2× ♠ Flush |
| 223 | Regular 3 3 | 6439 | 28 | 38 | 48 | 1× 777; 1× 789TJ; 2× QQQJJ; 1× 7777 |
| 224 | Regular 3 4 | 6439 | 28 | 38 | 48 | 4× Pair of 4's; 3× 33+22; 2× ♥ Flush; 1× ♦ 34567 |
| 225 | Regular 3 5 | 6439 | 28 | 38 | 48 | 2× KKK; 1× 6789T; 1× 7777 |
| 226 | Regular 3 6 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 2× KK+33; 1× AAA33 |
| 227 | Regular 3 7 | 6439 | 28 | 38 | 48 | 1× 666; 2× 6789T; 1× ♥ Flush; 1× ♦ A2345 |
| 228 | Regular 3 8 | 6439 | 28 | 38 | 48 | 4× Pair of 2's; 3× 99+22; 1× 22233; 1× 2222 |
| 229 | Regular 3 9 | 6439 | 28 | 38 | 48 | 1× QQQ; 1× 6789T; 2× ♠ Flush |
| 230 | Regular 3 10 | 6439 | 28 | 38 | 48 | 5× Pair of 8's; 3× 77+22; 1× 88899; 1× ♠ 45678 |
| 231 | Pro 3 1 | 6439 | 28 | 38 | 48 | 2× 555; 2× 6789T; 1× ♣ Flush |
| 232 | Pro 3 2 | 6439 | 28 | 38 | 48 | 4× Pair of A's; 2× QQ+22; 1× Royal Flush |
| 233 | Pro 3 3 | 6439 | 28 | 38 | 48 | 2× TTT; 2× ♣ Flush; 1× 777JJ |
| 234 | Pro 3 4 | 6439 | 28 | 38 | 48 | 4× Pair of 7's; 3× QQ+22; 1× 89TJQ; 1× ♠ 56789 |
| 235 | Pro 3 5 | 6439 | 28 | 38 | 48 | 2× 333; 1× ♣ Flush; 2× 333TT; 1× Royal Flush |
| 236 | Pro 3 6 | 6439 | 28 | 38 | 48 | 4× Pair of K's; 3× 99+22; 1× JJJJ |
| 237 | Pro 3 7 | 6439 | 28 | 38 | 48 | 1× 999; 1× 56789; 1× ♦ A2345 |
| 238 | Pro 3 8 | 6439 | 28 | 38 | 48 | 4× Pair of 6's; 3× AA+66; 1× 666AA; 1× 5555 |
| 239 | Pro 3 9 | 6439 | 28 | 38 | 48 | 1× 222; 1× 56789; 1× ♠ 6789T; 1× Royal Flush |
| 240 | Pro 3 10 | 6439 | 28 | 38 | 48 | 4× Pair of Q's; 2× AAA22; 1× 7777 |
| 241 | Shark 3 1 | 6439 | 28 | 38 | 48 | 1× 888; 1× 56789; 1× ♣ 45678 |
| 242 | Shark 3 2 | 6439 | 28 | 38 | 48 | 3× AA+44; 1× ♣ Flush; 1× 9999 |
| 243 | Shark 3 3 | 6439 | 28 | 38 | 48 | 1× AAA; 1× 56789; 1× ♣ 89TJQ |
| 244 | Shark 3 4 | 6439 | 28 | 38 | 48 | 4× Pair of 10's; 2× AA+66; 1× TTTT |
| 245 | Shark 3 5 | 6439 | 28 | 38 | 48 | 2× 777; 2× 56789; 1× AAA33; 1× ♥ A2345 |
| 246 | Shark 3 6 | 6439 | 28 | 38 | 48 | 5× Pair of 3's; 3× KK+33; 1× 7777; 1× Royal Flush |
| 247 | Shark 3 7 | 6439 | 28 | 38 | 48 | 1× KKK; 1× 56789; 1× ♣ Flush |
| 248 | Shark 3 8 | 6439 | 28 | 38 | 48 | 3× KK+99; 1× AAAA; 1× ♥ 34567 |
| 249 | Shark 3 9 | 6439 | 28 | 38 | 48 | 4× Pair of 5's; 1× 666; 2× 34567; 1× 66699 |
| 250 | Shark 3 10 | 6439 | 28 | 38 | 48 | 3× KK+22; 2× ♣ Flush; 1× ♥ 9TJQK |
| 251 | High Roller 3 1 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 1× 45678; 1× Royal Flush |
| 252 | High Roller 3 2 | 6439 | 28 | 38 | 48 | 1× ♦ Flush; 1× KKK88; 1× 7777 |
| 253 | High Roller 3 3 | 6439 | 28 | 38 | 48 | 4× Pair of 4's; 2× JJ+66; 1× 666; 1× TJQKA |
| 254 | High Roller 3 4 | 6439 | 28 | 38 | 48 | 2× ♠ Flush; 1× QQQ22; 1× ♥ 89TJQ |
| 255 | High Roller 3 5 | 6439 | 28 | 38 | 48 | 4× Pair of 10's; 2× 99+66; 1× 2222 |
| 256 | High Roller 3 6 | 6439 | 28 | 38 | 48 | 1× 777; 2× ♠ Flush; 2× KKK99; 1× ♦ 56789 |
| 257 | High Roller 3 7 | 6439 | 28 | 38 | 48 | 5× Pair of 3's; 2× 66+44; 2× 23456; 1× AAAA |
| 258 | High Roller 3 8 | 6439 | 28 | 38 | 48 | 1× QQQ; 1× ♠ Flush; 1× TTT66 |
| 259 | High Roller 3 9 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 2× 55+33; 1× ♠ 6789T |
| 260 | High Roller 3 10 | 6439 | 28 | 38 | 48 | 1× 555; 1× 89TJQ; 2× ♦ Flush; 1× 444KK |
| 261 | Ace 3 1 | 6439 | 28 | 38 | 48 | 4× Pair of 2's; 2× 99+55; 1× ♦ 56789 |
| 262 | Ace 3 2 | 6439 | 28 | 38 | 48 | 2× JJJ; 2× 89TJQ; 1× 33366 |
| 263 | Ace 3 3 | 6439 | 28 | 38 | 48 | 4× Pair of 8's; 2× 88+55; 1× KKKK; 1× ♣ 45678 |
| 264 | Ace 3 4 | 6439 | 28 | 38 | 48 | 1× 444; 1× 89TJQ; 1× ♠ Flush; 2× 777QQ |
| 265 | Ace 3 5 | 6439 | 28 | 38 | 48 | 5× Pair of A's; 3× 55+33; 1× ♦ 9TJQK |
| 266 | Ace 3 6 | 6439 | 28 | 38 | 48 | 1× TTT; 2× JJJ77; 1× 9999 |
| 267 | Ace 3 7 | 6439 | 28 | 38 | 48 | 4× Pair of 6's; 2× 44+22; 1× 56789; 1× ♥ Flush |
| 268 | Ace 3 8 | 6439 | 28 | 38 | 48 | 1× 333; 1× JJJ55; 1× 4444; 1× ♥ 89TJQ |
| 269 | Ace 3 9 | 6439 | 28 | 38 | 48 | 5× Pair of Q's; 3× JJ+44; 1× 6789T |
| 270 | Ace 3 10 | 6439 | 28 | 38 | 48 | 2× 999; 2× JJJ22; 1× ♣ 23456 |
| 271 | Veteran 3 1 | 6439 | 28 | 38 | 48 | 4× Pair of 5's; 3× 77+44; 1× ♣ Flush |
| 272 | Veteran 3 2 | 6439 | 28 | 38 | 48 | 2× A2345; 1× TTT99; 1× JJJJ |
| 273 | Veteran 3 3 | 6439 | 28 | 38 | 48 | 5× Pair of J's; 2× 44+22; 1× QQQ |
| 274 | Veteran 3 4 | 6439 | 28 | 38 | 48 | 1× 777TT; 1× TTTT; 1× ♣ 789TJ; 1× Royal Flush |
| 275 | Veteran 3 5 | 6439 | 28 | 38 | 48 | 4× Pair of 4's; 3× KK+33; 1× 999; 2× ♦ Flush |
| 276 | Veteran 3 6 | 6439 | 28 | 38 | 48 | 1× TJQKA; 1× TTTT; 1× ♦ 23456 |
| 277 | Veteran 3 7 | 6439 | 28 | 38 | 48 | 5× Pair of 10's; 2× 333; 1× TTT66 |
| 278 | Veteran 3 8 | 6439 | 28 | 38 | 48 | 1× 45678; 2× ♣ Flush; 1× AAAA; 1× ♥ 9TJQK |
| 279 | Veteran 3 9 | 6439 | 28 | 38 | 48 | 5× Pair of 3's; 2× 66+33; 2× AAA; 1× 66677 |
| 280 | Veteran 3 10 | 6439 | 28 | 38 | 48 | 1× ♠ Flush; 1× 9999; 1× ♣ 789TJ |
| 281 | Expert 3 1 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 1× 333; 1× Royal Flush |
| 282 | Expert 3 2 | 6439 | 28 | 38 | 48 | 2× TT+55; 1× 6789T; 1× 88822 |
| 283 | Expert 3 3 | 6439 | 28 | 38 | 48 | 5× Pair of A's; 1× 333; 1× TTTT |
| 284 | Expert 3 4 | 6439 | 28 | 38 | 48 | 2× JJ+88; 1× ♥ Flush; 1× TTT22 |
| 285 | Expert 3 5 | 6439 | 28 | 38 | 48 | 4× Pair of 7's; 1× 222; 1× ♣ 56789; 1× Royal Flush |
| 286 | Expert 3 6 | 6439 | 28 | 38 | 48 | 2× 99+44; 1× 9TJQK; 2× ♣ Flush; 1× 777QQ |
| 287 | Expert 3 7 | 6439 | 28 | 38 | 48 | 4× Pair of K's; 1× 222; 1× ♣ 34567 |
| 288 | Expert 3 8 | 6439 | 28 | 38 | 48 | 2× TT+88; 2× ♣ Flush; 1× KKKAA |
| 289 | Expert 3 9 | 6439 | 28 | 38 | 48 | 4× Pair of 6's; 1× 222; 1× 23456; 1× ♥ 34567 |
| 290 | Expert 3 10 | 6439 | 28 | 38 | 48 | 3× 99+22; 1× ♦ Flush; 2× JJJ66; 1× QQQQ |
| 291 | Elite 3 1 | 6439 | 28 | 38 | 48 | 5× Pair of Q's; 1× 222; 1× 9TJQK |
| 292 | Elite 3 2 | 6439 | 28 | 38 | 48 | 3× 88+77; 2× ♥ Flush; 1× Royal Flush |
| 293 | Elite 3 3 | 6439 | 28 | 38 | 48 | 4× Pair of 5's; 2× AAA; 1× 56789; 2× 777QQ |
| 294 | Elite 3 4 | 6439 | 28 | 38 | 48 | 2× AA+77; 1× ♣ Flush; 1× 2222 |
| 295 | Elite 3 5 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 1× AAA; 1× Royal Flush |
| 296 | Elite 3 6 | 6439 | 28 | 38 | 48 | 2× 88+77; 1× 89TJQ; 1× 222KK; 1× ♦ 789TJ |
| 297 | Elite 3 7 | 6439 | 28 | 38 | 48 | 2× 444; 1× ♠ Flush; 1× AAAA; 1× Royal Flush |
| 298 | Elite 3 8 | 6439 | 28 | 38 | 48 | 4× Pair of K's; 3× 77+55; 1× ♦ 45678 |
| 299 | Elite 3 9 | 6439 | 28 | 38 | 48 | 1× 999; 2× ♠ Flush; 1× JJJJ |
| 300 | Elite 3 10 | 6439 | 28 | 38 | 48 | 4× Pair of 6's; 3× 77+22; 2× 34567; 1× Royal Flush |
| 301 | Beginner 4 1 | 6439 | 28 | 38 | 48 | 1× 222; 2× ♠ Flush; 1× ♦ 45678 |
| 302 | Beginner 4 2 | 6439 | 28 | 38 | 48 | 3× QQ+66; 2× 9TJQK; 2× 44455 |
| 303 | Beginner 4 3 | 6439 | 28 | 38 | 48 | 4× Pair of 8's; 1× KKK; 1× ♦ Flush; 1× ♠ 789TJ |
| 304 | Beginner 4 4 | 6439 | 28 | 38 | 48 | 2× 77+55; 1× 6789T; 1× 55544; 1× AAAA |
| 305 | Beginner 4 5 | 6439 | 28 | 38 | 48 | 2× AAA; 2× ♠ Flush; 1× ♥ 89TJQ |
| 306 | Beginner 4 6 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 2× 66+55; 1× AAAA |
| 307 | Beginner 4 7 | 6439 | 28 | 38 | 48 | 1× 777; 1× 9TJQK; 1× ♣ Flush; 1× 888JJ |
| 308 | Beginner 4 8 | 6439 | 28 | 38 | 48 | 5× Pair of 3's; 3× AA+66; 1× 2222; 1× ♣ 6789T |
| 309 | Beginner 4 9 | 6439 | 28 | 38 | 48 | 2× KKK; 2× 9TJQK; 1× 77755 |
| 310 | Beginner 4 10 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 3× JJ+66; 1× ♥ 23456 |
| 311 | Amateur 4 1 | 6439 | 28 | 38 | 48 | 2× 666; 1× QQQ44; 1× 3333 |
| 312 | Amateur 4 2 | 6439 | 28 | 38 | 48 | 4× Pair of 2's; 2× 88+66; 1× 9TJQK |
| 313 | Amateur 4 3 | 6439 | 28 | 38 | 48 | 2× QQQ; 1× QQQKK; 1× 4444 |
| 314 | Amateur 4 4 | 6439 | 28 | 38 | 48 | 5× Pair of 8's; 2× 88+55; 1× 23456; 1× ♠ A2345 |
| 315 | Amateur 4 5 | 6439 | 28 | 38 | 48 | 2× 444; 1× ♠ Flush; 1× 99955; 1× 2222 |
| 316 | Amateur 4 6 | 6439 | 28 | 38 | 48 | 4× Pair of A's; 2× AA+55; 2× 9TJQK |
| 317 | Amateur 4 7 | 6439 | 28 | 38 | 48 | 2× TTT; 1× QQQQ; 1× Royal Flush |
| 318 | Amateur 4 8 | 6439 | 28 | 38 | 48 | 3× 77+55; 1× 9TJQK; 1× ♦ Flush; 1× 22277 |
| 319 | Amateur 4 9 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 1× JJJ; 1× 2222; 1× ♣ 23456 |
| 320 | Amateur 4 10 | 6439 | 28 | 38 | 48 | 3× KK+44; 2× 56789; 1× ♦ Flush |
| 321 | Regular 4 1 | 6439 | 28 | 38 | 48 | 5× Pair of 9's; 2× JJJ; 1× QQQQ |
| 322 | Regular 4 2 | 6439 | 28 | 38 | 48 | 2× 66+44; 1× 23456; 1× 999AA |
| 323 | Regular 4 3 | 6439 | 28 | 38 | 48 | 1× 222; 1× ♣ Flush; 1× Royal Flush |
| 324 | Regular 4 4 | 6439 | 28 | 38 | 48 | 5× Pair of J's; 2× AA+44; 1× 6666 |
| 325 | Regular 4 5 | 6439 | 28 | 38 | 48 | 2× 888; 2× 89TJQ; 1× ♦ Flush; 1× ♠ 6789T |
| 326 | Regular 4 6 | 6439 | 28 | 38 | 48 | 5× Pair of 4's; 2× TT+44; 1× 88899; 1× TTTT |
| 327 | Regular 4 7 | 6439 | 28 | 38 | 48 | 1× TJQKA; 1× ♣ Flush; 1× Royal Flush |
| 328 | Regular 4 8 | 6439 | 28 | 38 | 48 | 4× Pair of 10's; 2× 88+44; 1× 555 |
| 329 | Regular 4 9 | 6439 | 28 | 38 | 48 | 2× 45678; 1× ♣ Flush; 1× JJJQQ; 1× KKKK |
| 330 | Regular 4 10 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 2× 44+33; 1× 777; 1× Royal Flush |
| 331 | Pro 4 1 | 6439 | 28 | 38 | 48 | 2× 9TJQK; 1× ♣ Flush; 2× 99988 |
| 332 | Pro 4 2 | 6439 | 28 | 38 | 48 | 5× Pair of 9's; 3× QQ+33; 1× 888 |
| 333 | Pro 4 3 | 6439 | 28 | 38 | 48 | 2× 34567; 1× ♣ Flush; 1× 66688; 1× ♦ 34567 |
| 334 | Pro 4 4 | 6439 | 28 | 38 | 48 | 5× Pair of 2's; 1× 333; 1× 9999 |
| 335 | Pro 4 5 | 6439 | 28 | 38 | 48 | 2× JJ+99; 1× ♥ Flush; 1× ♣ 56789 |
| 336 | Pro 4 6 | 6439 | 28 | 38 | 48 | 5× Pair of 8's; 1× 333; 2× 66699; 1× AAAA |
| 337 | Pro 4 7 | 6439 | 28 | 38 | 48 | 2× TT+44; 1× 789TJ; 2× ♣ Flush; 1× ♠ 34567 |
| 338 | Pro 4 8 | 6439 | 28 | 38 | 48 | 5× Pair of A's; 2× 333; 1× 2222 |
| 339 | Pro 4 9 | 6439 | 28 | 38 | 48 | 2× TT+88; 2× ♦ Flush; 1× JJJ44 |
| 340 | Pro 4 10 | 6439 | 28 | 38 | 48 | 4× Pair of 6's; 1× 222; 1× TJQKA; 1× ♦ 23456 |
| 341 | Shark 4 1 | 6439 | 28 | 38 | 48 | 3× 99+33; 2× ♥ Flush; 1× TTT99 |
| 342 | Shark 4 2 | 6439 | 28 | 38 | 48 | 4× Pair of Q's; 2× 222; 1× 6789T |
| 343 | Shark 4 3 | 6439 | 28 | 38 | 48 | 3× 99+88; 1× ♠ Flush; 1× 66633 |
| 344 | Shark 4 4 | 6439 | 28 | 38 | 48 | 4× Pair of 5's; 1× 222; 1× 34567; 1× ♦ 45678 |
| 345 | Shark 4 5 | 6439 | 28 | 38 | 48 | 3× 99+22; 1× ♦ Flush; 1× AAAQQ |
| 346 | Shark 4 6 | 6439 | 28 | 38 | 48 | 5× Pair of J's; 1× ♠ A2345; 1× Royal Flush |
| 347 | Shark 4 7 | 6439 | 28 | 38 | 48 | 2× 99+88; 2× 888; 1× 89TJQ; 1× ♣ Flush |
| 348 | Shark 4 8 | 6439 | 28 | 38 | 48 | 4× Pair of 4's; 1× AAATT; 1× 4444; 1× ♣ 89TJQ |
| 349 | Shark 4 9 | 6439 | 28 | 38 | 48 | 2× KK+77; 1× 222; 1× ♥ Flush |
| 350 | Shark 4 10 | 6439 | 28 | 38 | 48 | 1× 789TJ; 1× AAAA; 1× Royal Flush |
| 351 | High Roller 4 1 | 6439 | 28 | 38 | 48 | 3× 88+66; 1× ♠ Flush; 1× 33322 |
| 352 | High Roller 4 2 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 1× AAA; 1× Royal Flush |
| 353 | High Roller 4 3 | 6439 | 28 | 38 | 48 | 3× QQ+77; 1× 789TJ; 1× ♥ Flush |
| 354 | High Roller 4 4 | 6439 | 28 | 38 | 48 | 1× 999; 1× ♠ 9TJQK; 1× Royal Flush |
| 355 | High Roller 4 5 | 6439 | 28 | 38 | 48 | 3× 88+55; 1× 56789; 1× ♣ Flush; 1× 88899 |
| 356 | High Roller 4 6 | 6439 | 28 | 38 | 48 | 4× Pair of A's; 1× AAA; 1× ♥ 6789T |
| 357 | High Roller 4 7 | 6439 | 28 | 38 | 48 | 2× 89TJQ; 1× 77733; 1× Royal Flush |
| 358 | High Roller 4 8 | 6439 | 28 | 38 | 48 | 2× KK+77; 2× 777; 1× KKKK; 1× ♣ 23456 |
| 359 | High Roller 4 9 | 6439 | 28 | 38 | 48 | 5× Pair of 4's; 1× 45678; 1× ♠ Flush; 2× AAA77 |
| 360 | High Roller 4 10 | 6439 | 28 | 38 | 48 | 3× KK+QQ; 1× 3333; 1× ♥ 9TJQK |
| 361 | Ace 4 1 | 6439 | 28 | 38 | 48 | 4× Pair of 10's; 1× 45678; 2× 77722 |
| 362 | Ace 4 2 | 6439 | 28 | 38 | 48 | 1× 666; 1× ♠ Flush; 1× 2222 |
| 363 | Ace 4 3 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 3× 66+44; 2× 89TJQ; 2× 777QQ |
| 364 | Ace 4 4 | 6439 | 28 | 38 | 48 | 1× ♠ Flush; 1× ♣ 89TJQ; 1× Royal Flush |
| 365 | Ace 4 5 | 6439 | 28 | 38 | 48 | 2× 88+66; 2× 222; 1× 789TJ; 2× 55588 |
| 366 | Ace 4 6 | 6439 | 28 | 38 | 48 | 5× Pair of 5's; 2× ♠ Flush; 1× 6666; 1× ♦ 23456 |
| 367 | Ace 4 7 | 6439 | 28 | 38 | 48 | 3× AA+55; 1× 89TJQ; 1× QQQJJ |
| 368 | Ace 4 8 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 1× QQQQ; 1× ♦ A2345 |
| 369 | Ace 4 9 | 6439 | 28 | 38 | 48 | 2× 77+55; 1× 999; 2× 34567; 2× 555JJ |
| 370 | Ace 4 10 | 6439 | 28 | 38 | 48 | 4× Pair of 4's; 2× ♠ Flush; 1× QQQQ; 1× ♥ 23456 |
| 371 | Veteran 4 1 | 6439 | 28 | 38 | 48 | 3× KK+55; 1× 444; 1× 89TJQ |
| 372 | Veteran 4 2 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 1× QQQQ; 1× Royal Flush |
| 373 | Veteran 4 3 | 6439 | 28 | 38 | 48 | 2× 66+55; 1× AAA; 1× ♦ Flush; 1× TTT66 |
| 374 | Veteran 4 4 | 6439 | 28 | 38 | 48 | 4× Pair of 2's; 1× JJJJ; 1× ♥ 34567; 1× Royal Flush |
| 375 | Veteran 4 5 | 6439 | 28 | 38 | 48 | 2× QQ+55; 1× JJJ; 1× 23456 |
| 376 | Veteran 4 6 | 6439 | 28 | 38 | 48 | 4× Pair of 8's; 1× ♣ Flush; 1× 44499; 1× 4444 |
| 377 | Veteran 4 7 | 6439 | 28 | 38 | 48 | 2× 55+44; 1× 888; 1× ♣ A2345; 1× Royal Flush |
| 378 | Veteran 4 8 | 6439 | 28 | 38 | 48 | 1× TJQKA; 2× ♣ Flush; 1× JJJ22 |
| 379 | Veteran 4 9 | 6439 | 28 | 38 | 48 | 5× Pair of J's; 3× 55+44; 1× 444 |
| 380 | Veteran 4 10 | 6439 | 28 | 38 | 48 | 1× 56789; 1× JJJ88; 1× JJJJ; 1× ♦ 23456 |
| 381 | Expert 4 1 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 2× 444; 1× ♠ Flush |
| 382 | Expert 4 2 | 6439 | 28 | 38 | 48 | 2× KK+TT; 1× 45678; 1× 7777 |
| 383 | Expert 4 3 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 2× 444; 1× ♣ Flush |
| 384 | Expert 4 4 | 6439 | 28 | 38 | 48 | 2× JJ+66; 1× 23456; 1× 66699; 1× ♣ 789TJ |
| 385 | Expert 4 5 | 6439 | 28 | 38 | 48 | 5× Pair of 2's; 2× 444; 1× ♦ Flush; 1× Royal Flush |
| 386 | Expert 4 6 | 6439 | 28 | 38 | 48 | 2× QQ+99; 2× 89TJQ; 1× 77799 |
| 387 | Expert 4 7 | 6439 | 28 | 38 | 48 | 4× Pair of 8's; 2× 333; 1× ♥ Flush; 1× ♥ 9TJQK |
| 388 | Expert 4 8 | 6439 | 28 | 38 | 48 | 3× TT+44; 1× 56789; 2× 88877; 1× 5555 |
| 389 | Expert 4 9 | 6439 | 28 | 38 | 48 | 5× Pair of A's; 2× ♥ Flush; 1× Royal Flush |
| 390 | Expert 4 10 | 6439 | 28 | 38 | 48 | 3× TT+99; 2× 333; 1× 789TJ |
| 391 | Elite 4 1 | 6439 | 28 | 38 | 48 | 4× Pair of 7's; 2× 333JJ; 1× 2222 |
| 392 | Elite 4 2 | 6439 | 28 | 38 | 48 | 1× 333; 1× 789TJ; 1× ♣ 9TJQK |
| 393 | Elite 4 3 | 6439 | 28 | 38 | 48 | 4× Pair of K's; 3× 77+33; 1× Royal Flush |
| 394 | Elite 4 4 | 6439 | 28 | 38 | 48 | 1× 999; 1× 6789T; 2× ♣ Flush |
| 395 | Elite 4 5 | 6439 | 28 | 38 | 48 | 5× Pair of 6's; 3× 33+22; 1× 5555; 1× ♥ 56789 |
| 396 | Elite 4 6 | 6439 | 28 | 38 | 48 | 2× 222; 1× 6789T; 1× ♦ Flush |
| 397 | Elite 4 7 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 1× 2222; 1× ♥ 89TJQ |
| 398 | Elite 4 8 | 6439 | 28 | 38 | 48 | 3× 99+88; 2× 222; 1× 56789; 1× 55533 |
| 399 | Elite 4 9 | 6439 | 28 | 38 | 48 | 4× Pair of 4's; 2× ♥ Flush; 1× 8888; 1× ♥ 23456 |
| 400 | Elite 4 10 | 6439 | 28 | 38 | 48 | 1× AAA; 2× 6789T; 2× KKK33 |
| 401 | Beginner 5 1 | 6439 | 28 | 38 | 48 | 4× Pair of 10's; 3× 66+22; 1× ♠ Flush |
| 402 | Beginner 5 2 | 6439 | 28 | 38 | 48 | 1× 45678; 1× 888TT; 1× QQQQ |
| 403 | Beginner 5 3 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 2× AA+22; 1× ♠ Flush; 1× ♦ 789TJ |
| 404 | Beginner 5 4 | 6439 | 28 | 38 | 48 | 2× KKK; 1× 56789; 1× 777AA |
| 405 | Beginner 5 5 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 3× AA+99; 2× ♥ Flush |
| 406 | Beginner 5 6 | 6439 | 28 | 38 | 48 | 1× 555; 1× 56789; 1× 444TT; 1× JJJJ |
| 407 | Beginner 5 7 | 6439 | 28 | 38 | 48 | 4× Pair of 2's; 2× AA+77; 1× Royal Flush |
| 408 | Beginner 5 8 | 6439 | 28 | 38 | 48 | 1× 89TJQ; 2× ♦ Flush; 1× KKKK |
| 409 | Beginner 5 9 | 6439 | 28 | 38 | 48 | 4× Pair of 8's; 2× AA+44; 2× JJJ; 1× ♠ 45678 |
| 410 | Beginner 5 10 | 6439 | 28 | 38 | 48 | 1× ♥ Flush; 1× 77799; 1× KKKK; 1× Royal Flush |
| 411 | Amateur 5 1 | 6439 | 28 | 38 | 48 | 2× AA+KK; 1× TJQKA; 1× ♦ 89TJQ |
| 412 | Amateur 5 2 | 6439 | 28 | 38 | 48 | 4× Pair of 10's; 1× ♦ Flush; 1× 555AA |
| 413 | Amateur 5 3 | 6439 | 28 | 38 | 48 | 2× KK+66; 1× QQQ; 2× 45678; 1× ♦ 89TJQ |
| 414 | Amateur 5 4 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 1× ♦ Flush; 1× 222TT; 1× Royal Flush |
| 415 | Amateur 5 5 | 6439 | 28 | 38 | 48 | 3× KK+QQ; 1× 888; 1× 7777 |
| 416 | Amateur 5 6 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 1× 45678; 1× ♠ Flush |
| 417 | Amateur 5 7 | 6439 | 28 | 38 | 48 | 2× KK+55; 1× 444; 1× 3333; 1× Royal Flush |
| 418 | Amateur 5 8 | 6439 | 28 | 38 | 48 | 5× Pair of 2's; 1× 45678; 1× ♦ Flush |
| 419 | Amateur 5 9 | 6439 | 28 | 38 | 48 | 1× JJJ; 1× KKKQQ; 1× 4444 |
| 420 | Amateur 5 10 | 6439 | 28 | 38 | 48 | 4× Pair of 8's; 3× 77+66; 1× 23456; 1× ♥ 56789 |
| 421 | Regular 5 1 | 6439 | 28 | 38 | 48 | 1× ♥ Flush; 1× QQQ99; 1× 2222 |
| 422 | Regular 5 2 | 6439 | 28 | 38 | 48 | 3× KK+55; 2× AAA; 1× Royal Flush |
| 423 | Regular 5 3 | 6439 | 28 | 38 | 48 | 1× ♣ Flush; 1× QQQ66; 1× QQQQ |
| 424 | Regular 5 4 | 6439 | 28 | 38 | 48 | 4× Pair of 6's; 3× JJ+66; 2× 666; 2× 56789 |
| 425 | Regular 5 5 | 6439 | 28 | 38 | 48 | 1× ♥ Flush; 2× QQQ33; 1× KKKK; 1× Royal Flush |
| 426 | Regular 5 6 | 6439 | 28 | 38 | 48 | 4× Pair of Q's; 2× 99+55; 1× 222 |
| 427 | Regular 5 7 | 6439 | 28 | 38 | 48 | 1× 6789T; 1× QQQJJ; 1× 2222 |
| 428 | Regular 5 8 | 6439 | 28 | 38 | 48 | 4× Pair of 5's; 2× 66+55; 1× AAA; 2× ♠ Flush |
| 429 | Regular 5 9 | 6439 | 28 | 38 | 48 | 1× TJQKA; 1× JJJ77; 1× 9999 |
| 430 | Regular 5 10 | 6439 | 28 | 38 | 48 | 2× JJ+55; 1× ♠ Flush; 1× ♣ A2345 |
| 431 | Pro 5 1 | 6439 | 28 | 38 | 48 | 2× 777; 1× 89TJQ; 1× 6666 |
| 432 | Pro 5 2 | 6439 | 28 | 38 | 48 | 5× Pair of 4's; 2× JJ+55; 2× ♥ Flush |
| 433 | Pro 5 3 | 6439 | 28 | 38 | 48 | 2× TJQKA; 2× JJJ22; 1× ♣ 789TJ |
| 434 | Pro 5 4 | 6439 | 28 | 38 | 48 | 2× TT+44; 1× ♦ Flush; 1× 5555 |
| 435 | Pro 5 5 | 6439 | 28 | 38 | 48 | 1× 666; 1× 89TJQ; 1× KKK44; 1× Royal Flush |
| 436 | Pro 5 6 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 2× 44+33; 1× ♥ Flush; 1× 8888 |
| 437 | Pro 5 7 | 6439 | 28 | 38 | 48 | 1× QQQ; 1× 789TJ; 2× 99955 |
| 438 | Pro 5 8 | 6439 | 28 | 38 | 48 | 5× Pair of 8's; 2× AA+44; 1× ♣ 89TJQ; 1× Royal Flush |
| 439 | Pro 5 9 | 6439 | 28 | 38 | 48 | 1× 555; 2× 789TJ; 2× ♦ Flush; 1× 7777 |
| 440 | Pro 5 10 | 6439 | 28 | 38 | 48 | 4× Pair of A's; 3× 99+44; 1× ♥ 789TJ |
| 441 | Shark 5 1 | 6439 | 28 | 38 | 48 | 1× JJJ; 1× TTTAA; 1× 9999 |
| 442 | Shark 5 2 | 6439 | 28 | 38 | 48 | 4× Pair of 7's; 1× 23456; 1× ♦ Flush |
| 443 | Shark 5 3 | 6439 | 28 | 38 | 48 | 3× TT+44; 1× JJJ; 1× 77733; 1× ♦ 89TJQ |
| 444 | Shark 5 4 | 6439 | 28 | 38 | 48 | 4× Pair of K's; 1× 23456; 1× ♥ Flush |
| 445 | Shark 5 5 | 6439 | 28 | 38 | 48 | 3× TT+99; 1× 888; 1× 3333 |
| 446 | Shark 5 6 | 6439 | 28 | 38 | 48 | 5× Pair of 6's; 2× ♥ Flush; 2× KKK33; 1× ♥ 89TJQ |
| 447 | Shark 5 7 | 6439 | 28 | 38 | 48 | 2× TT+22; 1× 444; 1× 34567; 1× 3333 |
| 448 | Shark 5 8 | 6439 | 28 | 38 | 48 | 4× Pair of Q's; 1× ♥ Flush; 1× ♠ 6789T |
| 449 | Shark 5 9 | 6439 | 28 | 38 | 48 | 2× TT+88; 1× 9TJQK; 1× 66633; 1× 5555 |
| 450 | Shark 5 10 | 6439 | 28 | 38 | 48 | 5× Pair of 5's; 1× 333; 1× ♦ Flush; 1× ♦ 789TJ |
| 451 | High Roller 5 1 | 6439 | 28 | 38 | 48 | 3× AA+88; 2× 789TJ; 1× Royal Flush |
| 452 | High Roller 5 2 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 1× ♥ Flush; 1× 333QQ |
| 453 | High Roller 5 3 | 6439 | 28 | 38 | 48 | 2× 99+77; 1× 777; 1× TJQKA; 1× 8888 |
| 454 | High Roller 5 4 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 1× ♥ Flush; 1× QQQAA; 1× ♣ 34567 |
| 455 | High Roller 5 5 | 6439 | 28 | 38 | 48 | 3× KK+88; 1× 444; 1× 9TJQK |
| 456 | High Roller 5 6 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 1× ♥ Flush; 1× 7777 |
| 457 | High Roller 5 7 | 6439 | 28 | 38 | 48 | 1× 666; 1× 6789T; 1× 22299; 1× Royal Flush |
| 458 | High Roller 5 8 | 6439 | 28 | 38 | 48 | 5× Pair of 2's; 3× 55+22; 1× ♠ Flush; 1× ♣ 6789T |
| 459 | High Roller 5 9 | 6439 | 28 | 38 | 48 | 1× QQQ; 1× 888JJ; 1× TTTT |
| 460 | High Roller 5 10 | 6439 | 28 | 38 | 48 | 4× Pair of 8's; 2× AA+JJ; 1× 34567; 1× ♠ Flush |
| 461 | Ace 5 1 | 6439 | 28 | 38 | 48 | 1× 555; 2× 88866; 1× JJJJ |
| 462 | Ace 5 2 | 6439 | 28 | 38 | 48 | 2× AA+KK; 1× 789TJ; 1× Royal Flush |
| 463 | Ace 5 3 | 6439 | 28 | 38 | 48 | 4× Pair of 10's; 1× 888; 1× ♥ Flush |
| 464 | Ace 5 4 | 6439 | 28 | 38 | 48 | 2× AA+77; 1× 789TJ; 1× 44433; 1× ♥ 789TJ |
| 465 | Ace 5 5 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 1× 777; 1× ♠ Flush; 1× 9999 |
| 466 | Ace 5 6 | 6439 | 28 | 38 | 48 | 3× AA+KK; 2× 34567; 1× ♥ 45678 |
| 467 | Ace 5 7 | 6439 | 28 | 38 | 48 | 4× Pair of 9's; 1× ♦ Flush; 1× 99977 |
| 468 | Ace 5 8 | 6439 | 28 | 38 | 48 | 3× AA+66; 1× AAA; 1× 56789; 1× Royal Flush |
| 469 | Ace 5 9 | 6439 | 28 | 38 | 48 | 4× Pair of 2's; 2× 77755; 1× ♦ 6789T |
| 470 | Ace 5 10 | 6439 | 28 | 38 | 48 | 3× KK+JJ; 1× 89TJQ; 1× 5555 |
| 471 | Veteran 5 1 | 6439 | 28 | 38 | 48 | 4× Pair of 8's; 1× ♥ 45678; 1× Royal Flush |
| 472 | Veteran 5 2 | 6439 | 28 | 38 | 48 | 1× 444; 2× ♠ Flush; 1× 7777 |
| 473 | Veteran 5 3 | 6439 | 28 | 38 | 48 | 5× Pair of A's; 3× QQ+66; 1× 6789T |
| 474 | Veteran 5 4 | 6439 | 28 | 38 | 48 | 1× TTT; 1× KKKK; 1× Royal Flush |
| 475 | Veteran 5 5 | 6439 | 28 | 38 | 48 | 4× Pair of 7's; 3× 99+66; 1× 34567; 1× JJJKK |
| 476 | Veteran 5 6 | 6439 | 28 | 38 | 48 | 2× 333; 1× ♠ Flush; 1× KKKK; 1× ♥ 89TJQ |
| 477 | Veteran 5 7 | 6439 | 28 | 38 | 48 | 3× KK+66; 2× 45678; 1× AAATT |
| 478 | Veteran 5 8 | 6439 | 28 | 38 | 48 | 2× 999; 1× QQQQ; 1× Royal Flush |
| 479 | Veteran 5 9 | 6439 | 28 | 38 | 48 | 4× Pair of 5's; 3× 66+33; 1× 9TJQK; 2× ♣ Flush |
| 480 | Veteran 5 10 | 6439 | 28 | 38 | 48 | 1× 222; 1× QQQ66; 1× JJJJ |
| 481 | Expert 5 1 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 2× QQ+55; 1× TJQKA |
| 482 | Expert 5 2 | 6439 | 28 | 38 | 48 | 2× 888; 1× QQQ33; 1× ♣ 56789 |
| 483 | Expert 5 3 | 6439 | 28 | 38 | 48 | 4× Pair of 4's; 2× 88+55; 2× ♥ Flush; 1× 3333 |
| 484 | Expert 5 4 | 6439 | 28 | 38 | 48 | 1× AAA; 2× 89TJQ; 1× QQQ99 |
| 485 | Expert 5 5 | 6439 | 28 | 38 | 48 | 5× Pair of 10's; 2× 55+33; 1× ♥ 23456 |
| 486 | Expert 5 6 | 6439 | 28 | 38 | 48 | 1× 777; 1× 89TJQ; 1× JJJ33; 1× 2222 |
| 487 | Expert 5 7 | 6439 | 28 | 38 | 48 | 4× Pair of 3's; 2× AA+55; 1× ♥ Flush; 1× ♥ 9TJQK |
| 488 | Expert 5 8 | 6439 | 28 | 38 | 48 | 1× QQQ; 1× 89TJQ; 1× Royal Flush |
| 489 | Expert 5 9 | 6439 | 28 | 38 | 48 | 3× 99+44; 1× JJJQQ; 1× 8888 |
| 490 | Expert 5 10 | 6439 | 28 | 38 | 48 | 5× Pair of 5's; 2× 89TJQ; 1× ♥ Flush; 1× ♦ 34567 |
| 491 | Elite 5 1 | 6439 | 28 | 38 | 48 | 1× 222; 2× 44477; 1× Royal Flush |
| 492 | Elite 5 2 | 6439 | 28 | 38 | 48 | 4× Pair of J's; 3× JJ+TT; 2× 56789 |
| 493 | Elite 5 3 | 6439 | 28 | 38 | 48 | 1× 888; 2× ♥ Flush; 2× 55577; 1× AAAA |
| 494 | Elite 5 4 | 6439 | 28 | 38 | 48 | 5× Pair of 4's; 3× TT+88; 1× 45678; 1× ♥ 45678 |
| 495 | Elite 5 5 | 6439 | 28 | 38 | 48 | 2× KKK; 1× ♥ Flush; 1× KKKK |
| 496 | Elite 5 6 | 6439 | 28 | 38 | 48 | 4× Pair of 10's; 2× TT+55; 1× 22277 |
| 497 | Elite 5 7 | 6439 | 28 | 38 | 48 | 2× 666; 1× 23456; 1× ♣ Flush; 1× 9999 |
| 498 | Elite 5 8 | 6439 | 28 | 38 | 48 | 2× TT+33; 1× AAA33; 1× ♥ 89TJQ; 1× Royal Flush |
| 499 | Elite 5 9 | 6439 | 28 | 38 | 48 | 2× QQQ; 1× 23456; 1× 7777 |
| 500 | Elite 5 10 | 6439 | 28 | 38 | 48 | 5× Pair of 9's; 2× TT+99; 1× ♥ Flush |

---

Regenerate: `cd frontend && npx tsx scripts/generate-solo-levels.ts`
