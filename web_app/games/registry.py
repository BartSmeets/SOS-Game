from dataclasses import dataclass
from pathlib import Path

from fastapi import APIRouter

from .black_body.router import router as bb_router
from .colour.router import router as colour_router
from .einstein.router import router as einstein_router


@dataclass
class GameEntry:
    slug: str  # used in URLs: /games/<slug> and /games/<slug>/ws
    title: str  # shown on the home page card
    description: str  # shown on the home page card
    router: APIRouter
    static_dir: Path  # mounted at /games/<slug>/static


GAMES: list[GameEntry] = [
    GameEntry(
        slug="colour",
        title="Colour Converter",
        description="Play with the representation of the light quantum.",
        router=colour_router,
        static_dir=Path(__file__).resolve().parent / "colour" / "static",
    ),
    GameEntry(
            slug="black_body",
            title="Black Body",
            description="Play with Planck's radiation law. Assuming the Sun is a black body, how hot is the exterior of the Sun?",
            router=bb_router,
            static_dir=Path(__file__).resolve().parent / "black_body" / "static",
        ),
    GameEntry(
        slug="einstein",
        title="Einstein Coefficients",
        description="Tune the A and BW coefficients and find a stable laser gain.",
        router=einstein_router,
        static_dir=Path(__file__).resolve().parent / "einstein" / "static",
    ),
]
