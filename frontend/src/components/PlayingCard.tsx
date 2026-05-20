import type { Card, Suit } from "../lib/pokerHands";

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const RED: Suit[] = ["hearts", "diamonds"];

interface Props {
  card: Card;
  selected?: boolean;
  popping?: boolean;
}

export function PlayingCard({ card, selected, popping }: Props) {
  const red = RED.includes(card.suit);
  return (
    <div
      className={`card ${red ? "red" : "black"} ${selected ? "selected" : ""} ${popping ? "pop" : ""}`}
    >
      <span className="rank">{card.rank}</span>
      <span className="suit">{SUIT_SYMBOL[card.suit]}</span>
    </div>
  );
}
