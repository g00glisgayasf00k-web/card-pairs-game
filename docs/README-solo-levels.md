# Solo Campaign Levels

Full list of all **1000** Solo levels: goals, point targets, and hand budgets for 3★ / 2★ / 1★.

**Source of truth:** `frontend/src/lib/levels.ts`

## How to read this table

- **Target pts** — total score required to clear (plus all milestone goals).
- **3★ / 2★ / 1★ hands** — maximum hands used for each star tier. The **1★** column is the fail limit (`moveLimit`).
- **Goals** — milestone hands required. From level 40+ these often need specific ranks/suits.
- **Avg pts/hand** (pacing math): ~120 early → ~230 late worlds.
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
| 501 | Beginner 6 1 | 6472 | 28 | 38 | 48 | 2× 555; 1× 33355; 1× 4444 |
| 502 | Beginner 6 2 | 6472 | 28 | 38 | 48 | 4× Pair of 2's; 2× JJ+99; 2× ♥ Flush |
| 503 | Beginner 6 3 | 6472 | 28 | 38 | 48 | 2× JJJ; 2× 23456; 1× KKKK |
| 504 | Beginner 6 4 | 6472 | 28 | 38 | 48 | 5× Pair of 7's; 3× 99+44; 1× ♠ Flush; 1× QQQ22 |
| 505 | Beginner 6 5 | 6472 | 28 | 38 | 48 | 2× 444; 1× A2345; 1× ♠ 6789T; 1× Royal Flush |
| 506 | Beginner 6 6 | 6472 | 28 | 38 | 48 | 3× KK+88; 1× ♠ Flush; 1× AAA44 |
| 507 | Beginner 6 7 | 6472 | 28 | 38 | 48 | 5× Pair of 10's; 2× 222; 1× 5555 |
| 508 | Beginner 6 8 | 6472 | 28 | 38 | 48 | 2× 99+66; 1× 9TJQK; 1× ♦ Flush; 1× Royal Flush |
| 509 | Beginner 6 9 | 6472 | 28 | 38 | 48 | 4× Pair of 3's; 1× 222; 1× 222JJ; 1× ♥ A2345 |
| 510 | Beginner 6 10 | 6472 | 28 | 38 | 48 | 2× QQ+88; 1× 56789; 1× ♣ Flush |
| 511 | Amateur 6 1 | 6472 | 28 | 38 | 48 | 1× 888; 1× 222QQ; 1× Royal Flush |
| 512 | Amateur 6 2 | 6472 | 28 | 38 | 48 | 4× Pair of 5's; 1× 6789T; 2× ♥ Flush |
| 513 | Amateur 6 3 | 6472 | 28 | 38 | 48 | 3× AA+22; 2× 777; 1× TTTT |
| 514 | Amateur 6 4 | 6472 | 28 | 38 | 48 | 5× Pair of J's; 1× ♣ Flush; 2× QQQJJ |
| 515 | Amateur 6 5 | 6472 | 28 | 38 | 48 | 2× AA+77; 2× 777; 2× A2345; 1× Royal Flush |
| 516 | Amateur 6 6 | 6472 | 28 | 38 | 48 | 4× Pair of 4's; 1× ♦ Flush; 2× 99977; 1× ♣ 23456 |
| 517 | Amateur 6 7 | 6472 | 28 | 38 | 48 | 3× AA+KK; 1× TJQKA; 1× 9999 |
| 518 | Amateur 6 8 | 6472 | 28 | 38 | 48 | 5× Pair of 10's; 1× 888; 1× 77766 |
| 519 | Amateur 6 9 | 6472 | 28 | 38 | 48 | 1× ♦ Flush; 1× AAAA; 1× ♦ 789TJ; 1× Royal Flush |
| 520 | Amateur 6 10 | 6472 | 28 | 38 | 48 | 4× Pair of 2's; 1× 777; 1× A2345; 1× 777AA |
| 521 | Regular 6 1 | 6504 | 28 | 38 | 48 | 2× AA+QQ; 1× ♣ Flush; 1× 3333 |
| 522 | Regular 6 2 | 6504 | 28 | 38 | 48 | 4× Pair of 8's; 1× 777; 1× Royal Flush |
| 523 | Regular 6 3 | 6504 | 28 | 38 | 48 | 2× AA+55; 1× 45678; 1× ♠ Flush; 2× JJJ77 |
| 524 | Regular 6 4 | 6504 | 28 | 38 | 48 | 4× Pair of A's; 2× 777; 1× ♦ 56789 |
| 525 | Regular 6 5 | 6504 | 28 | 38 | 48 | 3× KK+JJ; 1× TJQKA; 2× ♥ Flush |
| 526 | Regular 6 6 | 6504 | 28 | 38 | 48 | 4× Pair of 7's; 2× 777; 1× 66633; 1× ♥ 9TJQK |
| 527 | Regular 6 7 | 6504 | 28 | 38 | 48 | 3× KK+33; 1× 789TJ; 2× ♥ Flush; 1× TTTT |
| 528 | Regular 6 8 | 6504 | 28 | 38 | 48 | 1× KKK; 1× 66622; 1× ♦ 34567 |
| 529 | Regular 6 9 | 6504 | 28 | 38 | 48 | 5× Pair of 9's; 2× KK+66; 2× 9TJQK |
| 530 | Regular 6 10 | 6504 | 28 | 38 | 48 | 1× 666; 1× ♦ Flush; 1× KKKTT; 1× ♠ 89TJQ |
| 531 | Pro 6 1 | 6504 | 28 | 38 | 48 | 4× Pair of 2's; 2× KK+33; 1× 789TJ |
| 532 | Pro 6 2 | 6504 | 28 | 38 | 48 | 2× QQQ; 1× ♦ Flush; 1× ♠ 6789T |
| 533 | Pro 6 3 | 6504 | 28 | 38 | 48 | 5× Pair of 8's; 2× KK+QQ; 2× 77755; 1× 8888 |
| 534 | Pro 6 4 | 6504 | 28 | 38 | 48 | 1× 555; 1× 45678; 1× ♦ Flush; 1× ♦ 9TJQK |
| 535 | Pro 6 5 | 6504 | 28 | 38 | 48 | 5× Pair of A's; 2× QQ+99; 1× Royal Flush |
| 536 | Pro 6 6 | 6504 | 28 | 38 | 48 | 2× TTT; 1× 45678; 1× AAA22 |
| 537 | Pro 6 7 | 6504 | 28 | 38 | 48 | 4× Pair of 7's; 2× QQ+77; 1× ♠ Flush; 1× ♠ A2345 |
| 538 | Pro 6 8 | 6504 | 28 | 38 | 48 | 2× 333; 1× 34567; 1× JJJAA; 1× JJJJ |
| 539 | Pro 6 9 | 6504 | 28 | 38 | 48 | 4× Pair of K's; 3× QQ+33; 2× ♥ Flush |
| 540 | Pro 6 10 | 6504 | 28 | 38 | 48 | 1× 9999; 1× ♣ 34567; 1× Royal Flush |
| 541 | Shark 6 1 | 6536 | 28 | 38 | 48 | 5× Pair of 6's; 2× JJJ; 1× ♠ Flush |
| 542 | Shark 6 2 | 6536 | 28 | 38 | 48 | 2× 66+22; 1× 23456; 2× QQQTT |
| 543 | Shark 6 3 | 6536 | 28 | 38 | 48 | 1× QQQ; 1× ♣ Flush; 1× ♥ 6789T |
| 544 | Shark 6 4 | 6536 | 28 | 38 | 48 | 4× Pair of 8's; 2× KK+55; 2× KKKTT; 1× 5555 |
| 545 | Shark 6 5 | 6536 | 28 | 38 | 48 | 2× 444; 1× 89TJQ; 1× ♦ Flush; 1× ♣ 34567 |
| 546 | Shark 6 6 | 6536 | 28 | 38 | 48 | 4× Pair of A's; 2× TT+44; 2× TTT55 |
| 547 | Shark 6 7 | 6536 | 28 | 38 | 48 | 1× TTT; 2× 89TJQ; 1× Royal Flush |
| 548 | Shark 6 8 | 6536 | 28 | 38 | 48 | 4× Pair of 7's; 3× 88+44; 1× ♦ Flush; 1× ♦ 23456 |
| 549 | Shark 6 9 | 6536 | 28 | 38 | 48 | 1× 333; 2× 789TJ; 1× JJJJ; 1× Royal Flush |
| 550 | Shark 6 10 | 6536 | 28 | 38 | 48 | 4× Pair of K's; 2× 55+44; 1× ♠ 34567 |
| 551 | High Roller 6 1 | 6568 | 28 | 38 | 48 | 1× 999; 1× ♣ Flush; 1× 77733 |
| 552 | High Roller 6 2 | 6568 | 28 | 38 | 48 | 4× Pair of 5's; 2× 44+22; 1× A2345 |
| 553 | High Roller 6 3 | 6568 | 28 | 38 | 48 | 1× ♥ Flush; 1× ♥ 6789T; 1× Royal Flush |
| 554 | High Roller 6 4 | 6568 | 28 | 38 | 48 | 4× Pair of J's; 3× JJ+33; 1× 444 |
| 555 | High Roller 6 5 | 6568 | 28 | 38 | 48 | 1× 56789; 1× ♣ Flush; 1× ♣ A2345; 1× Royal Flush |
| 556 | High Roller 6 6 | 6568 | 28 | 38 | 48 | 5× Pair of 4's; 2× 77+33; 1× 555; 1× 8888 |
| 557 | High Roller 6 7 | 6568 | 28 | 38 | 48 | 1× TJQKA; 1× TTTJJ; 1× ♠ 89TJQ |
| 558 | High Roller 6 8 | 6568 | 28 | 38 | 48 | 5× Pair of 10's; 2× 33+22; 1× QQQ |
| 559 | High Roller 6 9 | 6568 | 28 | 38 | 48 | 1× 45678; 1× ♣ Flush; 1× 99955; 1× 8888 |
| 560 | High Roller 6 10 | 6568 | 28 | 38 | 48 | 4× Pair of 3's; 3× QQ+33; 1× TTT; 1× Royal Flush |
| 561 | Ace 6 1 | 6568 | 28 | 38 | 48 | 1× 9TJQK; 1× 99955; 1× 7777 |
| 562 | Ace 6 2 | 6568 | 28 | 38 | 48 | 4× Pair of 9's; 3× TT+22; 1× 777 |
| 563 | Ace 6 3 | 6568 | 28 | 38 | 48 | 2× 34567; 1× ♣ Flush; 1× AAAA; 1× ♠ 56789 |
| 564 | Ace 6 4 | 6568 | 28 | 38 | 48 | 5× Pair of 2's; 2× 77+22; 1× 99966 |
| 565 | Ace 6 5 | 6568 | 28 | 38 | 48 | 1× JJJ; 2× 6789T; 1× TTTT |
| 566 | Ace 6 6 | 6568 | 28 | 38 | 48 | 5× Pair of 8's; 2× AA+22; 1× TTTAA; 1× ♥ 89TJQ |
| 567 | Ace 6 7 | 6568 | 28 | 38 | 48 | 1× 444; 1× 6789T; 1× ♦ Flush; 1× Royal Flush |
| 568 | Ace 6 8 | 6568 | 28 | 38 | 48 | 2× KK+22; 2× JJJ77; 1× TTTT |
| 569 | Ace 6 9 | 6568 | 28 | 38 | 48 | 5× Pair of 10's; 2× 888; 1× ♥ Flush |
| 570 | Ace 6 10 | 6568 | 28 | 38 | 48 | 2× 66+22; 1× 6789T; 1× 44433; 1× ♠ 9TJQK |
| 571 | Veteran 6 1 | 6600 | 28 | 38 | 48 | 5× Pair of 3's; 1× 888; 1× ♠ Flush |
| 572 | Veteran 6 2 | 6600 | 28 | 38 | 48 | 2× AA+QQ; 1× 666AA; 1× ♠ 9TJQK |
| 573 | Veteran 6 3 | 6600 | 28 | 38 | 48 | 2× 999; 1× ♦ Flush; 1× 9999 |
| 574 | Veteran 6 4 | 6600 | 28 | 38 | 48 | 2× AA+55; 2× 333QQ; 1× ♣ 89TJQ; 1× Royal Flush |
| 575 | Veteran 6 5 | 6600 | 28 | 38 | 48 | 5× Pair of 2's; 1× 777; 1× 45678 |
| 576 | Veteran 6 6 | 6600 | 28 | 38 | 48 | 3× AA+JJ; 1× ♠ Flush; 1× AAAA |
| 577 | Veteran 6 7 | 6600 | 28 | 38 | 48 | 5× Pair of 7's; 1× 777; 1× 23456; 1× Royal Flush |
| 578 | Veteran 6 8 | 6600 | 28 | 38 | 48 | 2× AA+44; 1× ♦ Flush; 1× 2222; 1× ♦ 9TJQK |
| 579 | Veteran 6 9 | 6600 | 28 | 38 | 48 | 4× Pair of K's; 2× 777; 2× QQQ33 |
| 580 | Veteran 6 10 | 6600 | 28 | 38 | 48 | 1× 789TJ; 1× ♠ Flush; 1× 3333 |
| 581 | Expert 6 1 | 6600 | 28 | 38 | 48 | 5× Pair of 6's; 2× 777; 1× JJJ99 |
| 582 | Expert 6 2 | 6600 | 28 | 38 | 48 | 1× A2345; 1× KKKK; 1× ♠ 9TJQK |
| 583 | Expert 6 3 | 6600 | 28 | 38 | 48 | 4× Pair of Q's; 2× 777; 1× Royal Flush |
| 584 | Expert 6 4 | 6600 | 28 | 38 | 48 | 2× KK+99; 1× 89TJQ; 1× JJJJ; 1× ♥ 34567 |
| 585 | Expert 6 5 | 6600 | 28 | 38 | 48 | 4× Pair of 5's; 2× 666; 1× ♥ Flush; 1× KKK22 |
| 586 | Expert 6 6 | 6600 | 28 | 38 | 48 | 2× AA+QQ; 1× 6666; 1× ♥ 45678 |
| 587 | Expert 6 7 | 6600 | 28 | 38 | 48 | 5× Pair of J's; 2× 666; 1× Royal Flush |
| 588 | Expert 6 8 | 6600 | 28 | 38 | 48 | 2× KK+77; 1× A2345; 1× ♣ Flush; 1× 88855 |
| 589 | Expert 6 9 | 6600 | 28 | 38 | 48 | 5× Pair of 4's; 2× 666; 1× 8888; 1× ♠ 89TJQ |
| 590 | Expert 6 10 | 6600 | 28 | 38 | 48 | 1× 9TJQK; 1× ♠ Flush; 1× QQQ55 |
| 591 | Elite 6 1 | 6633 | 28 | 38 | 48 | 5× Pair of 10's; 3× 66+55; 2× 999 |
| 592 | Elite 6 2 | 6633 | 28 | 38 | 48 | 2× 45678; 1× ♠ Flush; 1× TTTT |
| 593 | Elite 6 3 | 6633 | 28 | 38 | 48 | 5× Pair of 2's; 3× AA+55; 1× TTT; 1× 777TT |
| 594 | Elite 6 4 | 6633 | 28 | 38 | 48 | 1× 89TJQ; 1× ♠ Flush; 1× 7777 |
| 595 | Elite 6 5 | 6633 | 28 | 38 | 48 | 4× Pair of 8's; 1× 555; 1× TTTQQ; 1× Royal Flush |
| 596 | Elite 6 6 | 6633 | 28 | 38 | 48 | 2× QQ+55; 1× 34567; 1× ♣ Flush; 1× ♥ 9TJQK |
| 597 | Elite 6 7 | 6633 | 28 | 38 | 48 | 5× Pair of A's; 1× 555; 1× Royal Flush |
| 598 | Elite 6 8 | 6633 | 28 | 38 | 48 | 2× 89TJQ; 1× ♠ Flush; 2× KKKJJ |
| 599 | Elite 6 9 | 6633 | 28 | 38 | 48 | 5× Pair of 7's; 2× 55+44; 1× 666; 1× ♣ 45678 |
| 600 | Elite 6 10 | 6633 | 28 | 38 | 48 | 1× 23456; 1× ♣ Flush; 1× 999AA; 1× KKKK |
| 601 | Beginner 7 1 | 6665 | 28 | 38 | 48 | 4× Pair of K's; 2× KK+44; 1× 888 |
| 602 | Beginner 7 2 | 6665 | 28 | 38 | 48 | 1× 789TJ; 1× JJJ44; 1× 2222 |
| 603 | Beginner 7 3 | 6665 | 28 | 38 | 48 | 2× 66+44; 1× ♠ Flush; 1× ♠ 9TJQK; 1× Royal Flush |
| 604 | Beginner 7 4 | 6665 | 28 | 38 | 48 | 5× Pair of 2's; 2× JJJ; 2× 34567; 1× AAA55 |
| 605 | Beginner 7 5 | 6665 | 28 | 38 | 48 | 3× QQ+44; 2× ♦ Flush; 1× ♠ A2345 |
| 606 | Beginner 7 6 | 6665 | 28 | 38 | 48 | 5× Pair of 8's; 1× TTT; 1× 6789T; 1× 555QQ |
| 607 | Beginner 7 7 | 6665 | 28 | 38 | 48 | 2× 55+44; 1× ♥ Flush; 1× 4444; 1× ♣ 789TJ |
| 608 | Beginner 7 8 | 6665 | 28 | 38 | 48 | 5× Pair of A's; 2× TTT; 1× 888JJ |
| 609 | Beginner 7 9 | 6665 | 28 | 38 | 48 | 2× TT+33; 2× 9TJQK; 1× ♣ 34567 |
| 610 | Beginner 7 10 | 6665 | 28 | 38 | 48 | 4× Pair of 7's; 1× TTT; 1× ♦ Flush; 1× 4444 |
| 611 | Amateur 7 1 | 6665 | 28 | 38 | 48 | 1× 23456; 1× 333TT; 1× ♦ A2345 |
| 612 | Amateur 7 2 | 6665 | 28 | 38 | 48 | 5× Pair of K's; 3× TT+22; 1× ♦ Flush |
| 613 | Amateur 7 3 | 6665 | 28 | 38 | 48 | 1× 999; 1× 23456; 1× ♦ 45678 |
| 614 | Amateur 7 4 | 6665 | 28 | 38 | 48 | 5× Pair of 6's; 3× JJ+99; 2× ♦ Flush; 1× Royal Flush |
| 615 | Amateur 7 5 | 6665 | 28 | 38 | 48 | 1× 222; 1× 23456; 1× 55599; 1× AAAA |
| 616 | Amateur 7 6 | 6665 | 28 | 38 | 48 | 4× Pair of Q's; 2× 99+88; 1× Royal Flush |
| 617 | Amateur 7 7 | 6665 | 28 | 38 | 48 | 2× 888; 1× A2345; 1× AAAQQ; 1× JJJJ |
| 618 | Amateur 7 8 | 6665 | 28 | 38 | 48 | 5× Pair of 4's; 2× 99+44; 1× ♥ Flush; 1× ♦ 6789T |
| 619 | Amateur 7 9 | 6665 | 28 | 38 | 48 | 1× TJQKA; 1× 22299; 1× 6666 |
| 620 | Amateur 7 10 | 6665 | 28 | 38 | 48 | 4× Pair of 10's; 2× 999; 1× ♠ Flush |
| 621 | Regular 7 1 | 6697 | 28 | 38 | 48 | 3× 77+22; 1× 6666; 1× ♠ 23456 |
| 622 | Regular 7 2 | 6697 | 28 | 38 | 48 | 2× 333; 2× 6789T; 1× ♣ Flush |
| 623 | Regular 7 3 | 6697 | 28 | 38 | 48 | 4× Pair of K's; 2× 44+22; 2× AAA66 |
| 624 | Regular 7 4 | 6697 | 28 | 38 | 48 | 1× 999; 1× 8888; 1× ♦ 34567 |
| 625 | Regular 7 5 | 6697 | 28 | 38 | 48 | 4× Pair of 6's; 3× KK+22; 1× 789TJ; 1× Royal Flush |
| 626 | Regular 7 6 | 6697 | 28 | 38 | 48 | 1× 222; 1× ♣ Flush; 1× 3333 |
| 627 | Regular 7 7 | 6697 | 28 | 38 | 48 | 2× AA+JJ; 1× 6789T; 1× QQQJJ |
| 628 | Regular 7 8 | 6697 | 28 | 38 | 48 | 1× 888; 1× ♦ Flush; 1× ♠ 9TJQK; 1× Royal Flush |
| 629 | Regular 7 9 | 6697 | 28 | 38 | 48 | 2× AA+44; 1× 34567; 1× AAA33; 1× TTTT |
| 630 | Regular 7 10 | 6697 | 28 | 38 | 48 | 1× AAA; 1× ♦ Flush; 1× ♥ 6789T |
| 631 | Pro 7 1 | 6697 | 28 | 38 | 48 | 4× Pair of 10's; 2× AA+KK; 1× 222AA |
| 632 | Pro 7 2 | 6697 | 28 | 38 | 48 | 1× 7777; 1× ♦ 56789; 1× Royal Flush |
| 633 | Pro 7 3 | 6697 | 28 | 38 | 48 | 5× Pair of 3's; 3× AA+TT; 1× QQQ; 1× 89TJQ |
| 634 | Pro 7 4 | 6697 | 28 | 38 | 48 | 1× ♠ Flush; 1× 77733; 1× TTTT |
| 635 | Pro 7 5 | 6697 | 28 | 38 | 48 | 3× AA+99; 1× 888; 1× ♦ 6789T |
| 636 | Pro 7 6 | 6697 | 28 | 38 | 48 | 5× Pair of 5's; 1× 9TJQK; 2× ♣ Flush; 1× 5555 |
| 637 | Pro 7 7 | 6697 | 28 | 38 | 48 | 2× 44+22; 1× QQQ55; 1× ♦ 789TJ |
| 638 | Pro 7 8 | 6697 | 28 | 38 | 48 | 4× Pair of J's; 2× 777; 1× 6789T |
| 639 | Pro 7 9 | 6697 | 28 | 38 | 48 | 2× TT+88; 1× ♦ Flush; 1× 33399; 1× QQQQ |
| 640 | Pro 7 10 | 6697 | 28 | 38 | 48 | 4× Pair of 4's; 2× KKK; 2× A2345; 1× ♠ 789TJ |
| 641 | Shark 7 1 | 6729 | 28 | 38 | 48 | 3× AA+33; 1× ♦ Flush; 1× 44488 |
| 642 | Shark 7 2 | 6729 | 28 | 38 | 48 | 4× Pair of 10's; 2× 666; 1× ♦ A2345 |
| 643 | Shark 7 3 | 6729 | 28 | 38 | 48 | 1× 45678; 2× ♣ Flush; 2× TTT66; 1× 8888 |
| 644 | Shark 7 4 | 6729 | 28 | 38 | 48 | 4× Pair of 3's; 3× AA+QQ; 2× KKK; 1× ♥ 23456 |
| 645 | Shark 7 5 | 6729 | 28 | 38 | 48 | 1× 9TJQK; 1× ♥ Flush; 1× KKKK |
| 646 | Shark 7 6 | 6729 | 28 | 38 | 48 | 2× 99+55; 1× 777JJ; 1× Royal Flush |
| 647 | Shark 7 7 | 6729 | 28 | 38 | 48 | 4× Pair of 5's; 2× 999; 1× 34567; 1× AAAA |
| 648 | Shark 7 8 | 6729 | 28 | 38 | 48 | 2× QQ+22; 1× 555TT; 1× ♠ 45678 |
| 649 | Shark 7 9 | 6729 | 28 | 38 | 48 | 4× Pair of J's; 1× 222; 1× 4444 |
| 650 | Shark 7 10 | 6729 | 28 | 38 | 48 | 2× 77+55; 1× A2345; 2× ♦ Flush; 2× 222QQ |
| 651 | High Roller 7 1 | 6761 | 28 | 38 | 48 | 4× Pair of 4's; 1× 888; 1× ♠ 789TJ |
| 652 | High Roller 7 2 | 6761 | 28 | 38 | 48 | 3× KK+JJ; 1× 9TJQK; 1× TTT33 |
| 653 | High Roller 7 3 | 6761 | 28 | 38 | 48 | 4× Pair of 10's; 1× 222; 1× QQQQ |
| 654 | High Roller 7 4 | 6761 | 28 | 38 | 48 | 2× 66+55; 2× ♣ Flush; 1× KKK22; 1× ♣ 45678 |
| 655 | High Roller 7 5 | 6761 | 28 | 38 | 48 | 4× Pair of 3's; 1× 888; 1× 789TJ; 1× AAAA |
| 656 | High Roller 7 6 | 6761 | 28 | 38 | 48 | 1× ♠ Flush; 1× JJJKK; 1× ♣ 34567 |
| 657 | High Roller 7 7 | 6761 | 28 | 38 | 48 | 4× Pair of 9's; 2× AA+33; 1× 34567; 1× Royal Flush |
| 658 | High Roller 7 8 | 6761 | 28 | 38 | 48 | 1× 555; 2× ♥ Flush; 1× AAAA; 1× ♦ A2345 |
| 659 | High Roller 7 9 | 6761 | 28 | 38 | 48 | 4× Pair of A's; 3× QQ+77; 1× 56789 |
| 660 | High Roller 7 10 | 6761 | 28 | 38 | 48 | 2× JJJ; 1× ♣ Flush; 1× 66655 |
| 661 | Ace 7 1 | 6761 | 28 | 38 | 48 | 5× Pair of 7's; 1× AAAA; 1× ♠ 789TJ |
| 662 | Ace 7 2 | 6761 | 28 | 38 | 48 | 2× 55+44; 1× 777; 1× TJQKA |
| 663 | Ace 7 3 | 6761 | 28 | 38 | 48 | 4× Pair of K's; 1× ♦ Flush; 1× Royal Flush |
| 664 | Ace 7 4 | 6761 | 28 | 38 | 48 | 1× 789TJ; 2× TTTKK; 1× ♠ 89TJQ |
| 665 | Ace 7 5 | 6761 | 28 | 38 | 48 | 4× Pair of 6's; 2× KKK; 1× ♦ Flush; 1× 7777 |
| 666 | Ace 7 6 | 6761 | 28 | 38 | 48 | 2× 44+22; 1× 9TJQK; 1× KKK66; 1× ♣ 45678 |
| 667 | Ace 7 7 | 6761 | 28 | 38 | 48 | 4× Pair of Q's; 1× 666; 2× ♣ Flush |
| 668 | Ace 7 8 | 6761 | 28 | 38 | 48 | 2× TT+88; 2× 34567; 1× 33377; 1× KKKK |
| 669 | Ace 7 9 | 6761 | 28 | 38 | 48 | 4× Pair of 5's; 2× KKK; 1× ♣ Flush; 1× ♥ 23456 |
| 670 | Ace 7 10 | 6761 | 28 | 38 | 48 | 3× AA+33; 1× 56789; 2× 55588 |
| 671 | Veteran 7 1 | 6794 | 28 | 38 | 48 | 5× Pair of J's; 1× 666; 1× ♦ A2345 |
| 672 | Veteran 7 2 | 6794 | 28 | 38 | 48 | 1× 56789; 2× ♣ Flush; 1× QQQQ |
| 673 | Veteran 7 3 | 6794 | 28 | 38 | 48 | 4× Pair of 4's; 2× QQ+33; 1× 333; 1× 444TT |
| 674 | Veteran 7 4 | 6794 | 28 | 38 | 48 | 2× 9TJQK; 1× 2222; 1× Royal Flush |
| 675 | Veteran 7 5 | 6794 | 28 | 38 | 48 | 4× Pair of 9's; 3× TT+55; 1× AAA |
| 676 | Veteran 7 6 | 6794 | 28 | 38 | 48 | 2× 45678; 1× ♣ Flush; 2× 444KK; 1× QQQQ |
| 677 | Veteran 7 7 | 6794 | 28 | 38 | 48 | 5× Pair of 2's; 2× QQ+88; 1× AAA; 1× ♦ 45678 |
| 678 | Veteran 7 8 | 6794 | 28 | 38 | 48 | 1× 89TJQ; 1× ♥ Flush; 1× 6666 |
| 679 | Veteran 7 9 | 6794 | 28 | 38 | 48 | 4× Pair of 8's; 2× AA+55; 2× 444; 1× ♠ 9TJQK |
| 680 | Veteran 7 10 | 6794 | 28 | 38 | 48 | 1× 34567; 1× ♣ Flush; 1× JJJ77; 1× 5555 |
| 681 | Expert 7 1 | 6794 | 28 | 38 | 48 | 5× Pair of A's; 2× JJ+22; 1× KKK |
| 682 | Expert 7 2 | 6794 | 28 | 38 | 48 | 1× 789TJ; 2× ♠ Flush; 1× JJJJ |
| 683 | Expert 7 3 | 6794 | 28 | 38 | 48 | 5× Pair of 7's; 2× 99+55; 2× QQQ; 1× KKK22 |
| 684 | Expert 7 4 | 6794 | 28 | 38 | 48 | 1× ♥ Flush; 1× 8888; 1× ♦ 23456; 1× Royal Flush |
| 685 | Expert 7 5 | 6794 | 28 | 38 | 48 | 2× KK+TT; 1× 999; 2× 45678 |
| 686 | Expert 7 6 | 6794 | 28 | 38 | 48 | 4× Pair of 9's; 1× AAAA; 1× Royal Flush |
| 687 | Expert 7 7 | 6794 | 28 | 38 | 48 | 2× 66+44; 2× 9TJQK; 1× ♥ Flush; 1× KKKAA |
| 688 | Expert 7 8 | 6794 | 28 | 38 | 48 | 5× Pair of 2's; 1× 777; 1× 3333; 1× Royal Flush |
| 689 | Expert 7 9 | 6794 | 28 | 38 | 48 | 3× QQ+TT; 1× ♥ Flush; 1× ♣ 45678 |
| 690 | Expert 7 10 | 6794 | 28 | 38 | 48 | 4× Pair of 8's; 2× AAA; 2× 789TJ; 1× JJJJ |
| 691 | Elite 7 1 | 6826 | 28 | 38 | 48 | 2× 44+33; 1× ♦ Flush; 1× 99955 |
| 692 | Elite 7 2 | 6826 | 28 | 38 | 48 | 4× Pair of A's; 1× 777; 1× 6789T |
| 693 | Elite 7 3 | 6826 | 28 | 38 | 48 | 3× TT+99; 2× ♦ Flush; 1× 99944 |
| 694 | Elite 7 4 | 6826 | 28 | 38 | 48 | 4× Pair of 7's; 2× KKK; 1× 34567; 1× ♥ 45678 |
| 695 | Elite 7 5 | 6826 | 28 | 38 | 48 | 3× 44+33; 1× ♠ Flush; 2× 88877; 1× QQQQ |
| 696 | Elite 7 6 | 6826 | 28 | 38 | 48 | 1× KKK; 2× 45678; 1× Royal Flush |
| 697 | Elite 7 7 | 6826 | 28 | 38 | 48 | 4× Pair of 9's; 3× AA+TT; 1× ♥ Flush |
| 698 | Elite 7 8 | 6826 | 28 | 38 | 48 | 1× 45678; 2× KKKJJ; 1× 8888; 1× ♣ 45678 |
| 699 | Elite 7 9 | 6826 | 28 | 38 | 48 | 5× Pair of 2's; 2× TT+33; 2× ♠ Flush |
| 700 | Elite 7 10 | 6826 | 28 | 38 | 48 | 2× 89TJQ; 1× ♥ 34567; 1× Royal Flush |
| 701 | Beginner 8 1 | 6858 | 28 | 38 | 48 | 2× 888; 1× ♣ Flush; 1× 6666 |
| 702 | Beginner 8 2 | 6858 | 28 | 38 | 48 | 4× Pair of 4's; 1× 9TJQK; 2× 333JJ |
| 703 | Beginner 8 3 | 6858 | 28 | 38 | 48 | 2× AA+22; 1× 222; 1× 3333 |
| 704 | Beginner 8 4 | 6858 | 28 | 38 | 48 | 1× 789TJ; 1× ♦ Flush; 1× 888AA |
| 705 | Beginner 8 5 | 6858 | 28 | 38 | 48 | 5× Pair of 7's; 3× KK+99; 1× 222; 1× 7777 |
| 706 | Beginner 8 6 | 6858 | 28 | 38 | 48 | 1× 23456; 1× ♠ Flush; 2× 222JJ; 1× ♣ 34567 |
| 707 | Beginner 8 7 | 6858 | 28 | 38 | 48 | 4× Pair of Q's; 2× 66+22; 1× TTT |
| 708 | Beginner 8 8 | 6858 | 28 | 38 | 48 | 2× 6789T; 2× 55533; 1× ♦ 56789 |
| 709 | Beginner 8 9 | 6858 | 28 | 38 | 48 | 2× 99+55; 1× 888; 1× ♣ Flush; 1× 8888 |
| 710 | Beginner 8 10 | 6858 | 28 | 38 | 48 | 4× Pair of 2's; 1× JJJ44; 1× Royal Flush |
| 711 | Amateur 8 1 | 6858 | 28 | 38 | 48 | 2× AA+JJ; 1× KKK; 1× ♦ Flush |
| 712 | Amateur 8 2 | 6858 | 28 | 38 | 48 | 4× Pair of 8's; 2× 34567; 1× ♣ 56789 |
| 713 | Amateur 8 3 | 6858 | 28 | 38 | 48 | 3× 88+44; 1× QQQ; 1× ♠ Flush; 1× 77755 |
| 714 | Amateur 8 4 | 6858 | 28 | 38 | 48 | 1× TJQKA; 1× JJJJ; 1× Royal Flush |
| 715 | Amateur 8 5 | 6858 | 28 | 38 | 48 | 4× Pair of 10's; 3× AA+44; 1× ♣ 56789 |
| 716 | Amateur 8 6 | 6858 | 28 | 38 | 48 | 1× 666; 1× 23456; 1× 22266; 1× TTTT |
| 717 | Amateur 8 7 | 6858 | 28 | 38 | 48 | 4× Pair of 3's; 3× 77+55; 1× ♣ Flush; 1× ♥ 45678 |
| 718 | Amateur 8 8 | 6858 | 28 | 38 | 48 | 1× QQQ; 1× TTT33; 1× KKKK |
| 719 | Amateur 8 9 | 6858 | 28 | 38 | 48 | 5× Pair of 9's; 3× KK+JJ; 1× ♥ A2345 |
| 720 | Amateur 8 10 | 6858 | 28 | 38 | 48 | 2× 555; 1× 23456; 1× ♦ Flush; 1× 99933 |
| 721 | Regular 8 1 | 6890 | 28 | 38 | 48 | 5× Pair of 2's; 2× JJ+77; 1× ♠ 34567 |
| 722 | Regular 8 2 | 6890 | 28 | 38 | 48 | 1× JJJ; 2× ♣ Flush; 1× 999AA |
| 723 | Regular 8 3 | 6890 | 28 | 38 | 48 | 5× Pair of 8's; 2× KK+33; 2× 9TJQK; 1× QQQQ |
| 724 | Regular 8 4 | 6890 | 28 | 38 | 48 | 2× 444; 2× 333AA; 1× ♣ 6789T; 1× Royal Flush |
| 725 | Regular 8 5 | 6890 | 28 | 38 | 48 | 4× Pair of K's; 2× 66+44; 1× 789TJ |
| 726 | Regular 8 6 | 6890 | 28 | 38 | 48 | 1× TTT99; 1× KKKK; 1× Royal Flush |
| 727 | Regular 8 7 | 6890 | 28 | 38 | 48 | 2× KK+66; 2× JJJ; 1× 56789; 1× ♦ Flush |
| 728 | Regular 8 8 | 6890 | 28 | 38 | 48 | 4× Pair of 3's; 1× 222KK; 1× ♥ 23456; 1× Royal Flush |
| 729 | Regular 8 9 | 6890 | 28 | 38 | 48 | 3× QQ+66; 1× QQQ; 1× A2345 |
| 730 | Regular 8 10 | 6890 | 28 | 38 | 48 | 1× 99988; 1× 8888; 1× Royal Flush |
| 731 | Pro 8 1 | 6890 | 28 | 38 | 48 | 1× 34567; 1× ♠ Flush; 1× ♣ A2345 |
| 732 | Pro 8 2 | 6890 | 28 | 38 | 48 | 4× Pair of A's; 3× 55+22; 1× AAAA |
| 733 | Pro 8 3 | 6890 | 28 | 38 | 48 | 2× JJJ; 1× 34567; 1× ♥ 34567 |
| 734 | Pro 8 4 | 6890 | 28 | 38 | 48 | 5× Pair of 7's; 3× KK+88; 1× AAAQQ; 1× 7777 |
| 735 | Pro 8 5 | 6890 | 28 | 38 | 48 | 2× 444; 1× 89TJQ; 1× ♣ Flush; 1× Royal Flush |
| 736 | Pro 8 6 | 6890 | 28 | 38 | 48 | 4× Pair of K's; 2× QQ+22; 1× ♠ 23456 |
| 737 | Pro 8 7 | 6890 | 28 | 38 | 48 | 1× TTT; 1× 34567; 1× 9999 |
| 738 | Pro 8 8 | 6890 | 28 | 38 | 48 | 4× Pair of 6's; 3× 88+66; 1× ♠ Flush; 2× TTTAA |
| 739 | Pro 8 9 | 6890 | 28 | 38 | 48 | 1× 333; 1× 89TJQ; 1× 9999; 1× Royal Flush |
| 740 | Pro 8 10 | 6890 | 28 | 38 | 48 | 4× Pair of Q's; 1× ♠ Flush; 1× ♥ 89TJQ |
| 741 | Shark 8 1 | 6922 | 28 | 38 | 48 | 2× 88+44; 1× 23456; 1× Royal Flush |
| 742 | Shark 8 2 | 6922 | 28 | 38 | 48 | 2× 555; 1× 777AA; 1× 3333 |
| 743 | Shark 8 3 | 6922 | 28 | 38 | 48 | 3× AA+TT; 1× 89TJQ; 1× ♥ A2345 |
| 744 | Shark 8 4 | 6922 | 28 | 38 | 48 | 4× Pair of J's; 1× AAA66; 1× QQQQ |
| 745 | Shark 8 5 | 6922 | 28 | 38 | 48 | 2× 77+44; 2× JJJ; 2× ♦ Flush; 1× Royal Flush |
| 746 | Shark 8 6 | 6922 | 28 | 38 | 48 | 4× Pair of 4's; 1× 56789; 1× 66677; 1× ♦ 789TJ |
| 747 | Shark 8 7 | 6922 | 28 | 38 | 48 | 2× KK+99; 1× 222; 2× ♥ Flush |
| 748 | Shark 8 8 | 6922 | 28 | 38 | 48 | 2× 999KK; 1× JJJJ; 1× ♠ A2345 |
| 749 | Shark 8 9 | 6922 | 28 | 38 | 48 | 5× Pair of 6's; 2× 44+33; 1× TTT; 1× Royal Flush |
| 750 | Shark 8 10 | 6922 | 28 | 38 | 48 | 1× A2345; 1× ♦ Flush; 1× QQQ33; 1× JJJJ |
| 751 | High Roller 8 1 | 6955 | 28 | 38 | 48 | 4× Pair of Q's; 2× TT+77; 1× KKK |
| 752 | High Roller 8 2 | 6955 | 28 | 38 | 48 | 1× 6789T; 1× KKKK; 1× Royal Flush |
| 753 | High Roller 8 3 | 6955 | 28 | 38 | 48 | 5× Pair of 5's; 2× JJ+33; 1× TTT; 1× ♥ Flush |
| 754 | High Roller 8 4 | 6955 | 28 | 38 | 48 | 1× TJQKA; 1× 66677; 1× TTTT |
| 755 | High Roller 8 5 | 6955 | 28 | 38 | 48 | 2× JJ+99; 2× 222; 1× ♦ Flush |
| 756 | High Roller 8 6 | 6955 | 28 | 38 | 48 | 4× Pair of 7's; 1× 9TJQK; 1× TTT66; 1× 3333 |
| 757 | High Roller 8 7 | 6955 | 28 | 38 | 48 | 3× 33+22; 1× 222; 1× ♠ Flush; 1× ♠ 89TJQ |
| 758 | High Roller 8 8 | 6955 | 28 | 38 | 48 | 4× Pair of K's; 1× 45678; 1× JJJ44 |
| 759 | High Roller 8 9 | 6955 | 28 | 38 | 48 | 2× 99+88; 2× 777; 1× TTTT |
| 760 | High Roller 8 10 | 6955 | 28 | 38 | 48 | 5× Pair of 6's; 1× 89TJQ; 1× ♥ Flush; 2× AAA88 |
| 761 | Ace 8 1 | 6955 | 28 | 38 | 48 | 2× 33+22; 2× 888; 1× QQQQ |
| 762 | Ace 8 2 | 6955 | 28 | 38 | 48 | 4× Pair of Q's; 2× 34567; 1× ♦ Flush |
| 763 | Ace 8 3 | 6955 | 28 | 38 | 48 | 2× 99+88; 1× AAA; 1× 555TT; 1× Royal Flush |
| 764 | Ace 8 4 | 6955 | 28 | 38 | 48 | 4× Pair of 4's; 1× 89TJQ; 1× ♣ Flush; 1× ♠ 9TJQK |
| 765 | Ace 8 5 | 6955 | 28 | 38 | 48 | 2× AA+22; 1× AAA; 1× TTTT |
| 766 | Ace 8 6 | 6955 | 28 | 38 | 48 | 5× Pair of 10's; 1× 34567; 1× JJJ88 |
| 767 | Ace 8 7 | 6955 | 28 | 38 | 48 | 3× 88+77; 1× 666; 1× ♦ Flush; 1× Royal Flush |
| 768 | Ace 8 8 | 6955 | 28 | 38 | 48 | 4× Pair of 3's; 1× 89TJQ; 2× 333QQ; 1× AAAA |
| 769 | Ace 8 9 | 6955 | 28 | 38 | 48 | 2× AA+KK; 1× 888; 1× Royal Flush |
| 770 | Ace 8 10 | 6955 | 28 | 38 | 48 | 4× Pair of 9's; 1× ♥ Flush; 1× 3333 |
| 771 | Veteran 8 1 | 6987 | 28 | 38 | 48 | 1× 666; 1× 56789; 1× KKK22 |
| 772 | Veteran 8 2 | 6987 | 28 | 38 | 48 | 3× JJ+22; 1× ♥ Flush; 1× QQQQ |
| 773 | Veteran 8 3 | 6987 | 28 | 38 | 48 | 5× Pair of J's; 1× AAAKK; 1× ♦ 23456 |
| 774 | Veteran 8 4 | 6987 | 28 | 38 | 48 | 2× 88+44; 2× TTT; 1× 45678; 1× ♦ Flush |
| 775 | Veteran 8 5 | 6987 | 28 | 38 | 48 | 4× Pair of 4's; 1× 77766; 1× 3333; 1× Royal Flush |
| 776 | Veteran 8 6 | 6987 | 28 | 38 | 48 | 3× AA+99; 2× 6789T; 1× ♠ 89TJQ |
| 777 | Veteran 8 7 | 6987 | 28 | 38 | 48 | 1× TTT; 1× KKKK; 1× Royal Flush |
| 778 | Veteran 8 8 | 6987 | 28 | 38 | 48 | 4× Pair of 7's; 2× 33+22; 1× 6789T; 1× TTT77 |
| 779 | Veteran 8 9 | 6987 | 28 | 38 | 48 | 2× 333; 1× ♦ Flush; 1× QQQQ; 1× ♠ 89TJQ |
| 780 | Veteran 8 10 | 6987 | 28 | 38 | 48 | 4× Pair of K's; 2× 99+88; 2× 789TJ |
| 781 | Expert 8 1 | 6987 | 28 | 38 | 48 | 1× 999; 1× ♠ Flush; 1× ♠ 89TJQ |
| 782 | Expert 8 2 | 6987 | 28 | 38 | 48 | 4× Pair of 5's; 3× TT+33; 1× TTTKK |
| 783 | Expert 8 3 | 6987 | 28 | 38 | 48 | 1× 222; 1× 45678; 2× ♣ Flush |
| 784 | Expert 8 4 | 6987 | 28 | 38 | 48 | 5× Pair of J's; 3× 99+22; 1× ♥ 45678 |
| 785 | Expert 8 5 | 6987 | 28 | 38 | 48 | 1× 888; 1× 9TJQK; 2× ♦ Flush; 1× 88855 |
| 786 | Expert 8 6 | 6987 | 28 | 38 | 48 | 4× Pair of 4's; 3× 33+22; 1× 8888; 1× ♠ 56789 |
| 787 | Expert 8 7 | 6987 | 28 | 38 | 48 | 1× AAA; 2× 45678; 2× ♥ Flush |
| 788 | Expert 8 8 | 6987 | 28 | 38 | 48 | 5× Pair of 10's; 3× 99+88; 1× AAA33 |
| 789 | Expert 8 9 | 6987 | 28 | 38 | 48 | 2× 666; 1× 89TJQ; 1× ♠ Flush; 1× 2222 |
| 790 | Expert 8 10 | 6987 | 28 | 38 | 48 | 4× Pair of 3's; 2× AA+22; 2× 33366; 1× ♣ 45678 |
| 791 | Elite 8 1 | 7019 | 28 | 38 | 48 | 2× QQQ; 2× 34567; 1× ♥ Flush |
| 792 | Elite 8 2 | 7019 | 28 | 38 | 48 | 5× Pair of 9's; 1× 888AA; 1× AAAA |
| 793 | Elite 8 3 | 7019 | 28 | 38 | 48 | 3× QQ+55; 1× 555; 1× ♦ Flush; 1× Royal Flush |
| 794 | Elite 8 4 | 7019 | 28 | 38 | 48 | 4× Pair of 2's; 1× TJQKA; 1× ♦ 23456 |
| 795 | Elite 8 5 | 7019 | 28 | 38 | 48 | 3× JJ+44; 1× JJJ; 1× ♣ Flush |
| 796 | Elite 8 6 | 7019 | 28 | 38 | 48 | 4× Pair of 8's; 1× 56789; 2× 888QQ; 1× ♣ 56789 |
| 797 | Elite 8 7 | 7019 | 28 | 38 | 48 | 2× JJ+44; 1× JJJ; 1× ♦ Flush; 1× 3333 |
| 798 | Elite 8 8 | 7019 | 28 | 38 | 48 | 4× Pair of K's; 2× TJQKA; 1× Royal Flush |
| 799 | Elite 8 9 | 7019 | 28 | 38 | 48 | 3× TT+44; 1× 555; 1× ♥ Flush |
| 800 | Elite 8 10 | 7019 | 28 | 38 | 48 | 5× Pair of 6's; 1× 56789; 1× KKK22; 1× ♣ 56789 |
| 801 | Beginner 9 1 | 7051 | 28 | 38 | 48 | 2× JJ+33; 1× 555; 1× ♥ Flush |
| 802 | Beginner 9 2 | 7051 | 28 | 38 | 48 | 4× Pair of Q's; 1× KKKK; 1× ♠ A2345 |
| 803 | Beginner 9 3 | 7051 | 28 | 38 | 48 | 3× 99+33; 2× 789TJ; 1× Royal Flush |
| 804 | Beginner 9 4 | 7051 | 28 | 38 | 48 | 4× Pair of 5's; 2× 777; 1× ♦ Flush; 1× 999KK |
| 805 | Beginner 9 5 | 7051 | 28 | 38 | 48 | 2× AA+99; 1× TJQKA; 1× 2222 |
| 806 | Beginner 9 6 | 7051 | 28 | 38 | 48 | 1× JJJ; 1× ♠ Flush; 1× ♥ 45678 |
| 807 | Beginner 9 7 | 7051 | 28 | 38 | 48 | 4× Pair of 7's; 2× 55+33; 1× 666QQ; 1× Royal Flush |
| 808 | Beginner 9 8 | 7051 | 28 | 38 | 48 | 1× 444; 1× 45678; 1× ♠ Flush; 1× TTTT |
| 809 | Beginner 9 9 | 7051 | 28 | 38 | 48 | 4× Pair of K's; 3× TT+33; 1× ♦ 9TJQK |
| 810 | Beginner 9 10 | 7051 | 28 | 38 | 48 | 2× TTT; 1× ♠ Flush; 1× AAAA |
| 811 | Amateur 9 1 | 7051 | 28 | 38 | 48 | 4× Pair of 6's; 2× A2345; 2× 99988 |
| 812 | Amateur 9 2 | 7051 | 28 | 38 | 48 | 2× 66+33; 2× QQQ; 2× ♣ Flush |
| 813 | Amateur 9 3 | 7051 | 28 | 38 | 48 | 4× Pair of Q's; 1× 6789T; 2× JJJ77 |
| 814 | Amateur 9 4 | 7051 | 28 | 38 | 48 | 2× 888; 2× ♠ Flush; 1× 6666; 1× ♥ 45678 |
| 815 | Amateur 9 5 | 7051 | 28 | 38 | 48 | 4× Pair of 5's; 3× 44+22; 2× 23456; 2× 44466 |
| 816 | Amateur 9 6 | 7051 | 28 | 38 | 48 | 1× AAA; 1× 5555; 1× ♦ 23456 |
| 817 | Amateur 9 7 | 7051 | 28 | 38 | 48 | 5× Pair of J's; 2× 99+22; 1× 89TJQ |
| 818 | Amateur 9 8 | 7051 | 28 | 38 | 48 | 1× 777; 1× ♠ Flush; 1× KKK22; 1× 2222 |
| 819 | Amateur 9 9 | 7051 | 28 | 38 | 48 | 5× Pair of 4's; 2× TT+22; 1× A2345; 1× ♠ 6789T |
| 820 | Amateur 9 10 | 7051 | 28 | 38 | 48 | 1× KKK; 1× ♥ Flush; 1× JJJ77 |
| 821 | Regular 9 1 | 7083 | 28 | 38 | 48 | 4× Pair of 10's; 1× 6789T; 1× Royal Flush |
| 822 | Regular 9 2 | 7083 | 28 | 38 | 48 | 3× JJ+66; 1× ♥ Flush; 1× 44499 |
| 823 | Regular 9 3 | 7083 | 28 | 38 | 48 | 1× 222; 1× TJQKA; 1× ♣ 56789; 1× Royal Flush |
| 824 | Regular 9 4 | 7083 | 28 | 38 | 48 | 4× Pair of Q's; 1× ♥ Flush; 1× JJJ33 |
| 825 | Regular 9 5 | 7083 | 28 | 38 | 48 | 2× 88+77; 1× 222; 1× 6789T; 1× TTTT |
| 826 | Regular 9 6 | 7083 | 28 | 38 | 48 | 5× Pair of 5's; 2× ♣ Flush; 1× QQQJJ; 1× ♠ A2345 |
| 827 | Regular 9 7 | 7083 | 28 | 38 | 48 | 2× AA+KK; 2× JJJ; 1× 4444 |
| 828 | Regular 9 8 | 7083 | 28 | 38 | 48 | 4× Pair of J's; 2× 23456; 1× ♥ 23456 |
| 829 | Regular 9 9 | 7083 | 28 | 38 | 48 | 3× 88+77; 2× 999; 1× 333JJ; 1× 9999 |
| 830 | Regular 9 10 | 7083 | 28 | 38 | 48 | 4× Pair of 3's; 1× 789TJ; 1× ♦ Flush; 1× Royal Flush |
| 831 | Pro 9 1 | 7083 | 28 | 38 | 48 | 2× KK+QQ; 1× AAAA; 1× ♠ 789TJ |
| 832 | Pro 9 2 | 7083 | 28 | 38 | 48 | 4× Pair of 9's; 2× 333; 2× ♠ Flush |
| 833 | Pro 9 3 | 7083 | 28 | 38 | 48 | 2× 45678; 2× 77733; 1× ♥ 789TJ; 1× Royal Flush |
| 834 | Pro 9 4 | 7083 | 28 | 38 | 48 | 4× Pair of 2's; 2× AA+TT; 1× TTT; 1× ♠ Flush |
| 835 | Pro 9 5 | 7083 | 28 | 38 | 48 | 1× 89TJQ; 1× KKKK; 1× ♥ 45678 |
| 836 | Pro 9 6 | 7083 | 28 | 38 | 48 | 5× Pair of 8's; 2× 77+33; 1× TTT; 1× ♥ Flush |
| 837 | Pro 9 7 | 7083 | 28 | 38 | 48 | 1× 34567; 1× 66699; 1× AAAA; 1× ♠ 34567 |
| 838 | Pro 9 8 | 7083 | 28 | 38 | 48 | 4× Pair of A's; 2× 99+77; 2× TTT |
| 839 | Pro 9 9 | 7083 | 28 | 38 | 48 | 1× TTTKK; 1× KKKK; 1× Royal Flush |
| 840 | Pro 9 10 | 7083 | 28 | 38 | 48 | 4× Pair of 7's; 3× JJ+22; 2× KKK; 2× A2345 |
| 841 | Shark 9 1 | 7116 | 28 | 38 | 48 | 2× ♥ Flush; 1× 666AA; 1× Royal Flush |
| 842 | Shark 9 2 | 7116 | 28 | 38 | 48 | 3× KK+88; 1× TTT; 2× 56789 |
| 843 | Shark 9 3 | 7116 | 28 | 38 | 48 | 5× Pair of 9's; 1× QQQQ; 1× ♣ 56789 |
| 844 | Shark 9 4 | 7116 | 28 | 38 | 48 | 2× 66+22; 1× 222; 1× ♥ Flush; 2× KKKTT |
| 845 | Shark 9 5 | 7116 | 28 | 38 | 48 | 5× Pair of 2's; 1× 5555; 1× Royal Flush |
| 846 | Shark 9 6 | 7116 | 28 | 38 | 48 | 2× JJ+88; 1× 34567; 2× 22255 |
| 847 | Shark 9 7 | 7116 | 28 | 38 | 48 | 1× 888; 2× ♠ Flush; 1× 2222; 1× ♦ 34567 |
| 848 | Shark 9 8 | 7116 | 28 | 38 | 48 | 4× Pair of 4's; 3× AA+99; 2× 789TJ; 1× 33388 |
| 849 | Shark 9 9 | 7116 | 28 | 38 | 48 | 1× AAA; 1× ♦ Flush; 1× ♣ 9TJQK |
| 850 | Shark 9 10 | 7116 | 28 | 38 | 48 | 2× TT+77; 1× 6789T; 1× 5555 |
| 851 | High Roller 9 1 | 7148 | 28 | 38 | 48 | 4× Pair of 7's; 2× ♣ Flush; 1× 77799 |
| 852 | High Roller 9 2 | 7148 | 28 | 38 | 48 | 1× 333; 1× AAAA; 1× Royal Flush |
| 853 | High Roller 9 3 | 7148 | 28 | 38 | 48 | 4× Pair of K's; 3× 88+44; 1× ♥ Flush |
| 854 | High Roller 9 4 | 7148 | 28 | 38 | 48 | 1× 6789T; 1× 7777; 1× ♠ 23456 |
| 855 | High Roller 9 5 | 7148 | 28 | 38 | 48 | 4× Pair of 5's; 2× JJ+TT; 1× JJJ; 1× ♠ Flush |
| 856 | High Roller 9 6 | 7148 | 28 | 38 | 48 | 1× A2345; 2× AAA22; 1× ♥ 23456 |
| 857 | High Roller 9 7 | 7148 | 28 | 38 | 48 | 2× JJ+44; 1× ♠ Flush; 1× Royal Flush |
| 858 | High Roller 9 8 | 7148 | 28 | 38 | 48 | 2× 888; 1× 56789; 1× 88822; 1× ♥ 56789 |
| 859 | High Roller 9 9 | 7148 | 28 | 38 | 48 | 4× Pair of 4's; 2× TT+55; 1× ♦ Flush; 1× 5555 |
| 860 | High Roller 9 10 | 7148 | 28 | 38 | 48 | 1× AAA; 1× ♦ 89TJQ; 1× Royal Flush |
| 861 | Ace 9 1 | 7148 | 28 | 38 | 48 | 4× Pair of 10's; 2× 66+33; 1× 66644 |
| 862 | Ace 9 2 | 7148 | 28 | 38 | 48 | 1× 45678; 1× 6666; 1× Royal Flush |
| 863 | Ace 9 3 | 7148 | 28 | 38 | 48 | 4× Pair of 3's; 2× TT+44; 2× 666; 1× ♠ Flush |
| 864 | Ace 9 4 | 7148 | 28 | 38 | 48 | 1× 9TJQK; 1× KKKK; 1× ♠ 56789 |
| 865 | Ace 9 5 | 7148 | 28 | 38 | 48 | 4× Pair of 9's; 3× KK+33; 1× ♦ Flush |
| 866 | Ace 9 6 | 7148 | 28 | 38 | 48 | 1× 555; 1× 45678; 2× 777KK; 1× KKKK |
| 867 | Ace 9 7 | 7148 | 28 | 38 | 48 | 4× Pair of 2's; 2× 99+88; 1× ♠ Flush |
| 868 | Ace 9 8 | 7148 | 28 | 38 | 48 | 1× 89TJQ; 1× QQQ22; 1× 7777 |
| 869 | Ace 9 9 | 7148 | 28 | 38 | 48 | 5× Pair of 8's; 3× 55+33; 1× 999; 1× ♠ Flush |
| 870 | Ace 9 10 | 7148 | 28 | 38 | 48 | 1× 23456; 2× 66622; 1× 7777; 1× ♦ 89TJQ |
| 871 | Veteran 9 1 | 7180 | 28 | 38 | 48 | 2× KK+88; 1× 444; 2× ♥ Flush |
| 872 | Veteran 9 2 | 7180 | 28 | 38 | 48 | 4× Pair of 10's; 1× 89TJQ; 1× 7777 |
| 873 | Veteran 9 3 | 7180 | 28 | 38 | 48 | 2× 66+22; 1× QQQ; 1× ♥ Flush; 1× 555KK |
| 874 | Veteran 9 4 | 7180 | 28 | 38 | 48 | 4× Pair of 3's; 1× 34567; 1× KKKK; 1× Royal Flush |
| 875 | Veteran 9 5 | 7180 | 28 | 38 | 48 | 2× QQ+88; 1× 444; 1× 44488 |
| 876 | Veteran 9 6 | 7180 | 28 | 38 | 48 | 4× Pair of 9's; 1× ♣ Flush; 1× AAAA |
| 877 | Veteran 9 7 | 7180 | 28 | 38 | 48 | 2× 55+22; 1× 666; 1× JJJ55; 1× Royal Flush |
| 878 | Veteran 9 8 | 7180 | 28 | 38 | 48 | 4× Pair of 2's; 2× 34567; 1× 3333 |
| 879 | Veteran 9 9 | 7180 | 28 | 38 | 48 | 2× JJJ; 2× ♦ Flush; 1× JJJ88 |
| 880 | Veteran 9 10 | 7180 | 28 | 38 | 48 | 4× Pair of 7's; 2× JJ+55; 1× 56789; 1× QQQQ |
| 881 | Expert 9 1 | 7180 | 28 | 38 | 48 | 1× ♥ Flush; 1× AAATT; 1× Royal Flush |
| 882 | Expert 9 2 | 7180 | 28 | 38 | 48 | 4× Pair of K's; 2× 77+44; 2× 444 |
| 883 | Expert 9 3 | 7180 | 28 | 38 | 48 | 2× ♣ Flush; 1× 77733; 1× Royal Flush |
| 884 | Expert 9 4 | 7180 | 28 | 38 | 48 | 2× JJ+66; 2× KKK; 2× A2345; 1× TTTT |
| 885 | Expert 9 5 | 7180 | 28 | 38 | 48 | 4× Pair of 3's; 1× ♠ Flush; 1× 444KK; 1× ♥ 23456 |
| 886 | Expert 9 6 | 7180 | 28 | 38 | 48 | 3× QQ+44; 2× 9TJQK; 1× 3333 |
| 887 | Expert 9 7 | 7180 | 28 | 38 | 48 | 4× Pair of 8's; 1× 777; 1× ♣ Flush; 1× ♠ 45678 |
| 888 | Expert 9 8 | 7180 | 28 | 38 | 48 | 2× TT+55; 2× 34567; 1× 55533; 1× JJJJ |
| 889 | Expert 9 9 | 7180 | 28 | 38 | 48 | 2× AAA; 1× ♠ Flush; 1× ♠ 6789T |
| 890 | Expert 9 10 | 7180 | 28 | 38 | 48 | 4× Pair of J's; 3× 88+33; 1× TTT88 |
| 891 | Elite 9 1 | 7212 | 28 | 38 | 48 | 1× 56789; 1× 6666; 1× ♣ A2345 |
| 892 | Elite 9 2 | 7212 | 28 | 38 | 48 | 2× TT+44; 1× QQQ; 1× KKK99 |
| 893 | Elite 9 3 | 7212 | 28 | 38 | 48 | 4× Pair of K's; 1× 9TJQK; 1× 3333 |
| 894 | Elite 9 4 | 7212 | 28 | 38 | 48 | 2× TT+33; 2× QQQ; 2× 666JJ |
| 895 | Elite 9 5 | 7212 | 28 | 38 | 48 | 4× Pair of 6's; 1× 45678; 2× ♣ Flush; 1× 4444 |
| 896 | Elite 9 6 | 7212 | 28 | 38 | 48 | 2× 99+22; 2× JJJ; 2× KKK22; 1× Royal Flush |
| 897 | Elite 9 7 | 7212 | 28 | 38 | 48 | 5× Pair of Q's; 1× 9TJQK; 1× TTTT |
| 898 | Elite 9 8 | 7212 | 28 | 38 | 48 | 2× 88+22; 1× 666AA; 1× ♦ 23456; 1× Royal Flush |
| 899 | Elite 9 9 | 7212 | 28 | 38 | 48 | 4× Pair of 5's; 1× 555; 2× TJQKA; 1× ♦ Flush |
| 900 | Elite 9 10 | 7212 | 28 | 38 | 48 | 2× AA+88; 2× 444KK; 1× 7777 |
| 901 | Beginner 10 1 | 7245 | 28 | 38 | 48 | 4× Pair of J's; 1× QQQ; 1× ♥ Flush |
| 902 | Beginner 10 2 | 7245 | 28 | 38 | 48 | 3× 77+22; 1× 89TJQ; 1× 3333 |
| 903 | Beginner 10 3 | 7245 | 28 | 38 | 48 | 1× 333; 2× ♦ Flush; 1× 888AA; 1× ♣ 6789T |
| 904 | Beginner 10 4 | 7245 | 28 | 38 | 48 | 5× Pair of K's; 2× TT+88; 1× TJQKA |
| 905 | Beginner 10 5 | 7245 | 28 | 38 | 48 | 1× ♣ Flush; 1× JJJJ; 1× ♠ 56789 |
| 906 | Beginner 10 6 | 7245 | 28 | 38 | 48 | 4× Pair of 6's; 3× AA+55; 1× TTT; 2× 23456 |
| 907 | Beginner 10 7 | 7245 | 28 | 38 | 48 | 2× ♥ Flush; 1× 44488; 1× ♥ 9TJQK; 1× Royal Flush |
| 908 | Beginner 10 8 | 7245 | 28 | 38 | 48 | 4× Pair of Q's; 2× JJ+77; 1× 888 |
| 909 | Beginner 10 9 | 7245 | 28 | 38 | 48 | 1× ♣ Flush; 1× JJJKK; 1× 4444; 1× ♣ 56789 |
| 910 | Beginner 10 10 | 7245 | 28 | 38 | 48 | 5× Pair of 5's; 3× AA+JJ; 1× TTT; 1× 23456 |
| 911 | Amateur 10 1 | 7245 | 28 | 38 | 48 | 1× ♠ Flush; 1× 444JJ; 1× KKKK |
| 912 | Amateur 10 2 | 7245 | 28 | 38 | 48 | 5× Pair of 10's; 2× 77+55; 2× 333 |
| 913 | Amateur 10 3 | 7245 | 28 | 38 | 48 | 1× 56789; 1× ♣ Flush; 1× TTT44; 1× 7777 |
| 914 | Amateur 10 4 | 7245 | 28 | 38 | 48 | 4× Pair of 3's; 2× KK+44; 1× 999; 1× ♠ 9TJQK |
| 915 | Amateur 10 5 | 7245 | 28 | 38 | 48 | 2× 9TJQK; 1× ♥ Flush; 1× KKKK |
| 916 | Amateur 10 6 | 7245 | 28 | 38 | 48 | 4× Pair of 9's; 3× TT+77; 1× 666JJ |
| 917 | Amateur 10 7 | 7245 | 28 | 38 | 48 | 1× 666; 2× ♣ Flush; 1× AAAA; 1× ♠ 45678 |
| 918 | Amateur 10 8 | 7245 | 28 | 38 | 48 | 5× Pair of 2's; 3× KK+QQ; 2× 6789T; 1× 44466 |
| 919 | Amateur 10 9 | 7245 | 28 | 38 | 48 | 1× QQQ; 1× ♥ Flush; 1× 6666 |
| 920 | Amateur 10 10 | 7245 | 28 | 38 | 48 | 4× Pair of 8's; 3× AA+66; 1× 88833; 1× Royal Flush |
| 921 | Regular 10 1 | 7277 | 28 | 38 | 48 | 1× 444; 2× 789TJ; 1× ♦ Flush |
| 922 | Regular 10 2 | 7277 | 28 | 38 | 48 | 4× Pair of A's; 2× QQ+66; 1× ♣ A2345 |
| 923 | Regular 10 3 | 7277 | 28 | 38 | 48 | 1× TTT; 2× 333AA; 1× TTTT |
| 924 | Regular 10 4 | 7277 | 28 | 38 | 48 | 5× Pair of 7's; 2× 99+66; 1× 23456; 2× ♥ Flush |
| 925 | Regular 10 5 | 7277 | 28 | 38 | 48 | 1× 333; 1× 999KK; 1× 4444; 1× ♠ 23456 |
| 926 | Regular 10 6 | 7277 | 28 | 38 | 48 | 5× Pair of K's; 2× QQ+99; 1× ♠ Flush |
| 927 | Regular 10 7 | 7277 | 28 | 38 | 48 | 2× 999; 2× A2345; 1× 5555 |
| 928 | Regular 10 8 | 7277 | 28 | 38 | 48 | 5× Pair of 5's; 2× 55+33; 1× ♣ Flush; 1× 222JJ |
| 929 | Regular 10 9 | 7277 | 28 | 38 | 48 | 1× 222; 1× 6789T; 1× 6666 |
| 930 | Regular 10 10 | 7277 | 28 | 38 | 48 | 3× QQ+JJ; 2× 222JJ; 1× ♣ 9TJQK |
| 931 | Pro 10 1 | 7277 | 28 | 38 | 48 | 4× Pair of 8's; 1× A2345; 1× KKKK |
| 932 | Pro 10 2 | 7277 | 28 | 38 | 48 | 2× 55+44; 1× 999; 1× ♣ Flush |
| 933 | Pro 10 3 | 7277 | 28 | 38 | 48 | 1× TJQKA; 1× 8888; 1× ♥ 89TJQ |
| 934 | Pro 10 4 | 7277 | 28 | 38 | 48 | 2× JJ+TT; 2× TTT; 1× ♦ Flush |
| 935 | Pro 10 5 | 7277 | 28 | 38 | 48 | 5× Pair of 7's; 1× TJQKA; 1× 444JJ; 1× Royal Flush |
| 936 | Pro 10 6 | 7277 | 28 | 38 | 48 | 3× 55+33; 1× 888; 1× JJJJ; 1× ♠ 45678 |
| 937 | Pro 10 7 | 7277 | 28 | 38 | 48 | 4× Pair of Q's; 1× 56789; 1× ♦ Flush |
| 938 | Pro 10 8 | 7277 | 28 | 38 | 48 | 1× 999JJ; 1× AAAA; 1× ♥ 56789 |
| 939 | Pro 10 9 | 7277 | 28 | 38 | 48 | 5× Pair of 5's; 3× AA+JJ; 1× 555; 2× ♠ Flush |
| 940 | Pro 10 10 | 7277 | 28 | 38 | 48 | 2× A2345; 1× 444AA; 1× ♠ 56789 |
| 941 | Shark 10 1 | 7309 | 28 | 38 | 48 | 5× Pair of J's; 1× 777; 1× ♠ Flush |
| 942 | Shark 10 2 | 7309 | 28 | 38 | 48 | 2× 888TT; 1× 9999; 1× ♦ 23456 |
| 943 | Shark 10 3 | 7309 | 28 | 38 | 48 | 5× Pair of 4's; 2× KK+55; 1× 23456; 1× ♦ Flush |
| 944 | Shark 10 4 | 7309 | 28 | 38 | 48 | 1× KKK; 1× 33377; 1× ♠ 56789 |
| 945 | Shark 10 5 | 7309 | 28 | 38 | 48 | 4× Pair of 10's; 3× 77+66; 1× ♦ Flush |
| 946 | Shark 10 6 | 7309 | 28 | 38 | 48 | 1× 45678; 1× TTTAA; 1× ♣ 45678; 1× Royal Flush |
| 947 | Shark 10 7 | 7309 | 28 | 38 | 48 | 2× KK+33; 1× 444; 2× ♠ Flush; 1× 8888 |
| 948 | Shark 10 8 | 7309 | 28 | 38 | 48 | 5× Pair of Q's; 1× A2345; 1× 777JJ |
| 949 | Shark 10 9 | 7309 | 28 | 38 | 48 | 2× 99+66; 2× TTT; 1× ♠ 6789T |
| 950 | Shark 10 10 | 7309 | 28 | 38 | 48 | 1× 34567; 1× ♣ Flush; 1× 888AA; 1× TTTT |
| 951 | High Roller 10 1 | 7341 | 28 | 38 | 48 | 5× Pair of 2's; 3× QQ+77; 1× 999 |
| 952 | High Roller 10 2 | 7341 | 28 | 38 | 48 | 1× 89TJQ; 2× ♥ Flush; 1× ♣ 89TJQ |
| 953 | High Roller 10 3 | 7341 | 28 | 38 | 48 | 4× Pair of 7's; 2× 66+55; 2× 444; 1× 666AA |
| 954 | High Roller 10 4 | 7341 | 28 | 38 | 48 | 1× 23456; 1× ♣ Flush; 1× ♣ 9TJQK; 1× Royal Flush |
| 955 | High Roller 10 5 | 7341 | 28 | 38 | 48 | 5× Pair of K's; 3× QQ+33; 1× TTT55 |
| 956 | High Roller 10 6 | 7341 | 28 | 38 | 48 | 1× TTT; 2× A2345; 1× ♦ Flush |
| 957 | High Roller 10 7 | 7341 | 28 | 38 | 48 | 4× Pair of 6's; 3× KK+55; 1× QQQJJ; 1× ♠ 45678 |
| 958 | High Roller 10 8 | 7341 | 28 | 38 | 48 | 1× 333; 2× 6789T; 1× ♠ Flush; 1× AAAA |
| 959 | High Roller 10 9 | 7341 | 28 | 38 | 48 | 4× Pair of Q's; 1× JJJ33; 1× ♣ 45678 |
| 960 | High Roller 10 10 | 7341 | 28 | 38 | 48 | 3× AA+99; 1× QQQ; 1× ♦ Flush; 1× AAAA |
| 961 | Ace 10 1 | 7341 | 28 | 38 | 48 | 4× Pair of 5's; 1× 34567; 1× 44422 |
| 962 | Ace 10 2 | 7341 | 28 | 38 | 48 | 1× AAA; 1× ♦ Flush; 1× ♣ A2345 |
| 963 | Ace 10 3 | 7341 | 28 | 38 | 48 | 4× Pair of J's; 2× JJ+88; 2× 34567 |
| 964 | Ace 10 4 | 7341 | 28 | 38 | 48 | 2× 777; 2× ♠ Flush; 1× 777AA; 1× Royal Flush |
| 965 | Ace 10 5 | 7341 | 28 | 38 | 48 | 4× Pair of 4's; 3× TT+44; 2× TJQKA; 1× 5555 |
| 966 | Ace 10 6 | 7341 | 28 | 38 | 48 | 2× KKK; 1× ♦ Flush; 1× 66699 |
| 967 | Ace 10 7 | 7341 | 28 | 38 | 48 | 1× 789TJ; 1× TTTT; 1× ♠ 23456 |
| 968 | Ace 10 8 | 7341 | 28 | 38 | 48 | 2× AA+66; 1× JJJ; 1× ♥ Flush; 1× TTTJJ |
| 969 | Ace 10 9 | 7341 | 28 | 38 | 48 | 5× Pair of 2's; 1× 23456; 1× 3333; 1× ♣ 89TJQ |
| 970 | Ace 10 10 | 7341 | 28 | 38 | 48 | 2× QQQ; 2× 777QQ; 1× Royal Flush |
| 971 | Veteran 10 1 | 7373 | 28 | 38 | 48 | 3× TT+88; 1× 6789T; 1× ♥ A2345 |
| 972 | Veteran 10 2 | 7373 | 28 | 38 | 48 | 4× Pair of 5's; 1× KKK55; 1× QQQQ |
| 973 | Veteran 10 3 | 7373 | 28 | 38 | 48 | 2× AA+33; 1× TTT; 1× 34567 |
| 974 | Veteran 10 4 | 7373 | 28 | 38 | 48 | 5× Pair of J's; 2× ♦ Flush; 1× 55577 |
| 975 | Veteran 10 5 | 7373 | 28 | 38 | 48 | 2× 777; 1× 789TJ; 1× 3333; 1× ♥ 6789T |
| 976 | Veteran 10 6 | 7373 | 28 | 38 | 48 | 5× Pair of 4's; 2× KK+JJ; 1× ♦ Flush; 1× 99922 |
| 977 | Veteran 10 7 | 7373 | 28 | 38 | 48 | 2× KKK; 1× 23456; 1× Royal Flush |
| 978 | Veteran 10 8 | 7373 | 28 | 38 | 48 | 3× 99+66; 1× KKKAA; 1× ♣ 34567 |
| 979 | Veteran 10 9 | 7373 | 28 | 38 | 48 | 4× Pair of 6's; 1× 999; 2× 56789; 1× KKKK |
| 980 | Veteran 10 10 | 7373 | 28 | 38 | 48 | 3× QQ+22; 2× ♣ Flush; 1× 666QQ; 1× ♠ A2345 |
| 981 | Expert 10 1 | 7373 | 28 | 38 | 48 | 4× Pair of Q's; 2× 222; 1× 789TJ |
| 982 | Expert 10 2 | 7373 | 28 | 38 | 48 | 3× 88+55; 1× 4444; 1× Royal Flush |
| 983 | Expert 10 3 | 7373 | 28 | 38 | 48 | 5× Pair of 5's; 1× 6789T; 1× ♥ Flush; 2× 77766 |
| 984 | Expert 10 4 | 7373 | 28 | 38 | 48 | 2× AA+JJ; 1× 333; 1× 4444 |
| 985 | Expert 10 5 | 7373 | 28 | 38 | 48 | 4× Pair of 10's; 2× ♥ Flush; 1× Royal Flush |
| 986 | Expert 10 6 | 7373 | 28 | 38 | 48 | 2× 77+55; 1× 89TJQ; 1× JJJ99; 1× ♥ A2345 |
| 987 | Expert 10 7 | 7373 | 28 | 38 | 48 | 4× Pair of 3's; 1× 888; 1× ♦ Flush; 1× 5555 |
| 988 | Expert 10 8 | 7373 | 28 | 38 | 48 | 3× KK+TT; 1× 444AA; 1× ♥ 789TJ |
| 989 | Expert 10 9 | 7373 | 28 | 38 | 48 | 4× Pair of 9's; 1× 222; 1× 6789T |
| 990 | Expert 10 10 | 7373 | 28 | 38 | 48 | 3× 66+44; 1× ♥ Flush; 1× AAA22; 1× Royal Flush |
| 991 | Elite 10 1 | 7406 | 28 | 38 | 48 | 2× 222; 1× 56789; 1× 6666 |
| 992 | Elite 10 2 | 7406 | 28 | 38 | 48 | 4× Pair of Q's; 3× JJ+99; 1× JJJTT |
| 993 | Elite 10 3 | 7406 | 28 | 38 | 48 | 1× 888; 1× TJQKA; 1× ♣ 89TJQ; 1× Royal Flush |
| 994 | Elite 10 4 | 7406 | 28 | 38 | 48 | 4× Pair of 4's; 3× JJ+44; 2× ♣ Flush; 1× 22233 |
| 995 | Elite 10 5 | 7406 | 28 | 38 | 48 | 1× AAA; 2× 56789; 1× ♦ 89TJQ |
| 996 | Elite 10 6 | 7406 | 28 | 38 | 48 | 3× JJ+TT; 1× ♥ Flush; 1× Royal Flush |
| 997 | Elite 10 7 | 7406 | 28 | 38 | 48 | 4× Pair of 7's; 2× AAA; 1× 56789; 1× ♠ 34567 |
| 998 | Elite 10 8 | 7406 | 28 | 38 | 48 | 2× 44+33; 2× ♥ Flush; 1× 8888; 1× Royal Flush |
| 999 | Elite 10 9 | 7406 | 28 | 38 | 48 | 1× KKK; 1× 777KK; 1× ♣ A2345 |
| 1000 | Elite 10 10 | 7406 | 28 | 38 | 48 | 2× TT+99; 1× 789TJ; 1× ♦ Flush |

---

Regenerate: `cd frontend && npx tsx scripts/generate-solo-levels.ts`
