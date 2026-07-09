"""Authoritative gem pack catalog for Square checkout."""

GEM_PACKS: dict[str, dict] = {
    "handful": {"gems": 100, "label": "Handful", "price_cents": 99, "currency": "USD"},
    "pouch": {"gems": 300, "label": "Pouch", "price_cents": 279, "currency": "USD"},
    "vault": {"gems": 500, "label": "Vault", "price_cents": 449, "currency": "USD"},
    "treasure": {"gems": 1000, "label": "Treasure", "price_cents": 899, "currency": "USD"},
}


def get_gem_pack(pack_id: str) -> dict | None:
    return GEM_PACKS.get(pack_id)


def pack_list_public() -> list[dict]:
    return [
        {
            "id": pack_id,
            "gems": pack["gems"],
            "label": pack["label"],
            "price_cents": pack["price_cents"],
            "currency": pack["currency"],
            "price_label": f"${pack['price_cents'] / 100:.2f}",
        }
        for pack_id, pack in GEM_PACKS.items()
    ]
