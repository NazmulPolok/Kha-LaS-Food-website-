from __future__ import annotations

import json
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, create_engine, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.types import TypeDecorator


ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://foodhub:foodhub@localhost:5432/foodhub")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class FlexibleJSON(TypeDecorator):
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(JSONB() if dialect.name == "postgresql" else JSON())


class Cart(Base):
    __tablename__ = "carts"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(String(4000), nullable=False, default="")
    type: Mapped[str] = mapped_column(String(40), nullable=False, default="Food Cart")
    cuisines: Mapped[list[str]] = mapped_column(FlexibleJSON, nullable=False, default=list)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    phone: Mapped[str] = mapped_column(String(60), nullable=False, default="")
    price: Mapped[str] = mapped_column(String(20), nullable=False, default="৳")
    photos: Mapped[list[str]] = mapped_column(FlexibleJSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hygiene_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    delivery: Mapped[str] = mapped_column(String(30), nullable=False, default="none")
    has_booking: Mapped[bool] = mapped_column(nullable=False, default=False)
    vendor_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cart_id: Mapped[str] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"), index=True)
    author_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Anonymous Foodie")
    overall: Mapped[float] = mapped_column(Float, nullable=False)
    hygiene: Mapped[float] = mapped_column(Float, nullable=False)
    comment: Mapped[str] = mapped_column(String(2000), nullable=False, default="")
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class CartPayload(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=180)
    description: str = Field(default="", max_length=4000)
    type: str = Field(default="Food Cart", max_length=40)
    cuisines: list[str] = Field(default_factory=list)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    address: str = Field(default="", max_length=300)
    phone: str = Field(default="", max_length=60)
    price: str = Field(default="৳", max_length=20)
    photos: list[str] = Field(default_factory=list)
    status: str = Field(default="open", max_length=20)
    rating: float = Field(default=0, ge=0, le=10)
    review_count: int = Field(default=0, ge=0)
    hygiene_rating: float | None = Field(default=None, ge=0, le=5)
    delivery: str = Field(default="none", max_length=30)
    has_booking: bool = False
    vendor_email: str | None = Field(default=None, max_length=320)


class ReviewPayload(BaseModel):
    cart_id: str
    author_email: str | None = Field(default=None, max_length=320)
    author_name: str = Field(default="Anonymous Foodie", max_length=100)
    overall: float = Field(ge=1, le=5)
    hygiene: float = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)


def get_db():
    with SessionLocal() as db:
        yield db


def cart_json(cart: Cart) -> dict[str, Any]:
    return {
        "id": cart.id,
        "name": cart.name,
        "description": cart.description,
        "type": cart.type,
        "cuisines": cart.cuisines,
        "lat": cart.lat,
        "lng": cart.lng,
        "address": cart.address,
        "phone": cart.phone,
        "price": cart.price,
        "photos": cart.photos,
        "status": cart.status,
        "rating": cart.rating,
        "review_count": cart.review_count,
        "hygiene_rating": cart.hygiene_rating,
        "delivery": cart.delivery,
        "has_booking": cart.has_booking,
        "vendor_email": cart.vendor_email,
        "created_at": cart.created_at.isoformat() if cart.created_at else None,
        "updated_at": cart.updated_at.isoformat() if cart.updated_at else None,
    }


def review_json(review: Review) -> dict[str, Any]:
    return {
        "id": review.id,
        "cart_id": review.cart_id,
        "author_email": review.author_email,
        "author_name": review.author_name,
        "overall": review.overall,
        "hygiene": review.hygiene,
        "comment": review.comment,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


def seed_database():
    for attempt in range(30):
        try:
            with engine.connect() as connection:
                connection.execute(select(1))
            break
        except OperationalError:
            if attempt == 29:
                raise
            time.sleep(1)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Cart)):
            return
        path = ROOT / "data" / "spots.json"
        if not path.exists():
            return
        for spot in json.loads(path.read_text(encoding="utf-8")):
            db.add(Cart(
                id=str(spot["id"]),
                name=spot.get("name", "Unnamed cart"),
                description=spot.get("about", ""),
                type=spot.get("type", "Food Cart"),
                cuisines=spot.get("food", []),
                lat=spot["lat"], lng=spot["lng"],
                address=spot.get("address", ""), phone=spot.get("phone", ""),
                price=spot.get("price", "৳"), photos=spot.get("photos", []),
                status=spot.get("status", "open"), rating=spot.get("rating", 0),
                review_count=spot.get("reviews", 0), hygiene_rating=spot.get("hygiene"),
                delivery=spot.get("delivery", "none"), has_booking=spot.get("hasBooking", False),
                vendor_email=None if spot.get("creator", "system") == "system" else spot.get("creator"),
            ))
        db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    seed_database()
    yield


app = FastAPI(
    title="Kha-LaS API", version="1.0.0",
    docs_url="/api/docs", redoc_url="/api/redoc", openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(ROOT / "index.html")


@app.get("/manifest.json", include_in_schema=False)
def manifest():
    return FileResponse(ROOT / "manifest.json")


@app.get("/sw.js", include_in_schema=False)
def service_worker():
    return FileResponse(ROOT / "sw.js", media_type="application/javascript")


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {"status": "ok", "database": "postgresql"}


@app.get("/api/carts")
def list_carts(db: Session = Depends(get_db)):
    return [cart_json(cart) for cart in db.scalars(select(Cart).order_by(Cart.created_at, Cart.id)).all()]


@app.put("/api/carts/{cart_id}")
def save_cart(cart_id: str, payload: CartPayload, db: Session = Depends(get_db)):
    if cart_id != payload.id:
        raise HTTPException(400, "Path id must match cart id")
    cart = db.get(Cart, cart_id)
    data = payload.model_dump()
    if cart is None:
        cart = Cart(**data)
        db.add(cart)
    else:
        for key, value in data.items():
            setattr(cart, key, value)
    db.commit()
    db.refresh(cart)
    return cart_json(cart)


@app.delete("/api/carts/{cart_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart(cart_id: str, db: Session = Depends(get_db)):
    cart = db.get(Cart, cart_id)
    if cart is None:
        raise HTTPException(404, "Cart not found")
    db.delete(cart)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/carts/{cart_id}/reviews")
def list_reviews(cart_id: str, db: Session = Depends(get_db)):
    if not db.get(Cart, cart_id):
        raise HTTPException(404, "Cart not found")
    rows = db.scalars(select(Review).where(Review.cart_id == cart_id).order_by(Review.created_at.desc()).limit(60)).all()
    return [review_json(review) for review in rows]


@app.post("/api/carts/{cart_id}/reviews", status_code=status.HTTP_201_CREATED)
def add_review(cart_id: str, payload: ReviewPayload, db: Session = Depends(get_db)):
    if cart_id != payload.cart_id:
        raise HTTPException(400, "Path id must match review cart id")
    if not db.get(Cart, cart_id):
        raise HTTPException(404, "Cart not found")
    review = Review(**payload.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review_json(review)


app.mount("/assets", StaticFiles(directory=ROOT / "assets"), name="assets")
app.mount("/data", StaticFiles(directory=ROOT / "data"), name="data")
