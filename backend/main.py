from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, EmailStr
from pwdlib import PasswordHash
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, create_engine, func, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.types import TypeDecorator


ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://foodhub:foodhub@localhost:5432/foodhub")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
EMAIL_HASH_SECRET = os.getenv("EMAIL_HASH_SECRET", "")
TOKEN_TTL_HOURS = int(os.getenv("TOKEN_TTL_HOURS", "24"))
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
password_hasher = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)


class Base(DeclarativeBase):
    pass


class FlexibleJSON(TypeDecorator):
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(JSONB() if dialect.name == "postgresql" else JSON())


class User(Base):
    __tablename__ = "users"
    email_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


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
    vendor_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cart_id: Mapped[str] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"), index=True)
    author_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Anonymous Foodie")
    overall: Mapped[float] = mapped_column(Float, nullable=False)
    hygiene: Mapped[float] = mapped_column(Float, nullable=False)
    comment: Mapped[str] = mapped_column(String(2000), nullable=False, default="")
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(default="", max_length=100)


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


class ReviewPayload(BaseModel):
    cart_id: str
    author_name: str = Field(default="Anonymous Foodie", max_length=100)
    overall: float = Field(ge=1, le=5)
    hygiene: float = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)


def normalized_email(email: str) -> str:
    return email.strip().casefold()


def email_digest(email: str) -> str:
    if len(EMAIL_HASH_SECRET) < 32:
        raise RuntimeError("EMAIL_HASH_SECRET must contain at least 32 characters")
    return hmac.new(EMAIL_HASH_SECRET.encode(), normalized_email(email).encode(), hashlib.sha256).hexdigest()


def token_for(user: User) -> str:
    return jwt.encode({"sub": user.email_hash, "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS)}, JWT_SECRET_KEY, algorithm="HS256")


def get_db():
    with SessionLocal() as db:
        yield db


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials or len(JWT_SECRET_KEY) < 32:
        raise HTTPException(401, "Please sign in")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired. Please sign in again.") from None
    user = db.get(User, user_id) if user_id else None
    if not user:
        raise HTTPException(401, "Account not found")
    return user


def optional_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User | None:
    if not credentials or len(JWT_SECRET_KEY) < 32:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=["HS256"])
        return db.get(User, payload.get("sub"))
    except jwt.PyJWTError:
        return None


def cart_json(cart: Cart, user: User | None = None) -> dict[str, Any]:
    return {
        "id": cart.id, "name": cart.name, "description": cart.description, "type": cart.type,
        "cuisines": cart.cuisines, "lat": cart.lat, "lng": cart.lng, "address": cart.address,
        "phone": cart.phone, "price": cart.price, "photos": cart.photos, "status": cart.status,
        "rating": cart.rating, "review_count": cart.review_count, "hygiene_rating": cart.hygiene_rating,
        "delivery": cart.delivery, "has_booking": cart.has_booking,
        "has_vendor": bool(cart.vendor_user_id), "is_mine": bool(user and cart.vendor_user_id == user.email_hash),
        "created_at": cart.created_at.isoformat() if cart.created_at else None,
        "updated_at": cart.updated_at.isoformat() if cart.updated_at else None,
    }


def review_json(review: Review) -> dict[str, Any]:
    return {"id": review.id, "cart_id": review.cart_id, "author_name": review.author_name,
            "overall": review.overall, "hygiene": review.hygiene, "comment": review.comment,
            "created_at": review.created_at.isoformat() if review.created_at else None}


def migrate_legacy_emails():
    if engine.dialect.name != "postgresql":
        return
    with engine.begin() as connection:
        cart_columns = {row["name"] for row in connection.execute(text("SELECT column_name AS name FROM information_schema.columns WHERE table_name='carts'" )).mappings()}
        review_columns = {row["name"] for row in connection.execute(text("SELECT column_name AS name FROM information_schema.columns WHERE table_name='reviews'" )).mappings()}
        if "vendor_user_id" not in cart_columns:
            connection.execute(text("ALTER TABLE carts ADD COLUMN vendor_user_id VARCHAR(64)"))
        if "author_user_id" not in review_columns:
            connection.execute(text("ALTER TABLE reviews ADD COLUMN author_user_id VARCHAR(64)"))
        if "vendor_email" in cart_columns:
            rows = connection.execute(text("SELECT id, vendor_email FROM carts WHERE vendor_email IS NOT NULL")).all()
            for cart_id, email in rows:
                connection.execute(text("UPDATE carts SET vendor_user_id=:digest WHERE id=:id"), {"digest": email_digest(email), "id": cart_id})
            connection.execute(text("ALTER TABLE carts DROP COLUMN vendor_email"))
        if "author_email" in review_columns:
            rows = connection.execute(text("SELECT id, author_email FROM reviews WHERE author_email IS NOT NULL")).all()
            for review_id, email in rows:
                connection.execute(text("UPDATE reviews SET author_user_id=:digest WHERE id=:id"), {"digest": email_digest(email), "id": review_id})
            connection.execute(text("ALTER TABLE reviews DROP COLUMN author_email"))


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
    migrate_legacy_emails()
    with SessionLocal() as db:
        path = ROOT / "data" / "spots.json"
        if not path.exists():
            return
        existing_carts = {c.id: c for c in db.scalars(select(Cart)).all()}
        for spot in json.loads(path.read_text(encoding="utf-8")):
            spot_id = str(spot["id"])
            if spot_id not in existing_carts:
                db.add(Cart(
                    id=spot_id,
                    name=spot.get("name", "Unnamed cart"),
                    description=spot.get("about", ""),
                    type=spot.get("type", "Food Cart"),
                    cuisines=spot.get("food", []),
                    lat=spot["lat"],
                    lng=spot["lng"],
                    address=spot.get("address", ""),
                    phone=spot.get("phone", ""),
                    price=spot.get("price", "৳"),
                    photos=spot.get("photos", []),
                    status=spot.get("status", "open"),
                    rating=spot.get("rating", 0),
                    review_count=spot.get("reviews", 0),
                    hygiene_rating=spot.get("hygiene"),
                    delivery=spot.get("delivery", "none"),
                    has_booking=spot.get("hasBooking", False),
                ))
            else:
                c = existing_carts[spot_id]
                if not c.vendor_user_id:
                    c.name = spot.get("name", c.name)
                    c.description = spot.get("about", c.description)
                    c.type = spot.get("type", c.type)
                    c.cuisines = spot.get("food", c.cuisines)
                    c.lat = spot.get("lat", c.lat)
                    c.lng = spot.get("lng", c.lng)
                    c.address = spot.get("address", c.address)
                    c.phone = spot.get("phone", c.phone)
                    c.price = spot.get("price", c.price)
                    c.photos = spot.get("photos", c.photos)
                    c.rating = spot.get("rating", c.rating)
                    c.review_count = spot.get("reviews", c.review_count)
                    c.hygiene_rating = spot.get("hygiene", c.hygiene_rating)
                    c.has_booking = spot.get("hasBooking", c.has_booking)
        db.commit()

        # Seed sample reviews if empty
        if not db.scalar(select(func.count()).select_from(Review)):
            sample_reviews = [
                ("s1", "Tanvir Ahmed", 5.0, 5.0, "Sultan's Dine mutton kacchi is unmatched in Dhaka! Meat was melting off the bone, aromatic rice and the borhani was chilled and thick."),
                ("s1", "Farhana Islam", 4.5, 4.5, "Best wedding style kacchi in town. Great hygiene and polite staff."),
                ("s3", "Sabbir Hossain", 5.0, 4.0, "Star Kabab's mutton leg roast and fresh butter naan is pure comfort food. Always a pleasure visiting here."),
                ("s4", "Nafis Fuad", 4.5, 5.0, "Takeout's Beef Cheese Delight is still the standard for gourmet burgers in Dhaka. Super juicy patty!"),
                ("s10", "Ayesha Siddiqua", 5.0, 5.0, "Peri-Peri chicken at Nando's was full of flavor and the place is spotless!"),
                ("s23", "Rakibul Hasan", 5.0, 4.0, "Haji Biryani is an emotion. Mustard oil tehari with fresh green chilies in Nazira Bazar."),
                ("s25", "Mahmudul Haque", 5.0, 4.5, "Beauty Lassi and royal faluda are legendary since 1922. A must-visit in Old Dhaka!"),
                ("s30", "Zubair Rahman", 4.5, 4.0, "Star Kabab Uttara is our family go-to for weekend dinner. Delicious seekh kababs."),
                ("s40", "Kamrul Islam", 5.0, 4.0, "Neel Pori duck curry at 300 feet is bursting with chui jhal flavors. Great open-air highway experience.")
            ]
            for cid, author, overall, hygiene, comment in sample_reviews:
                db.add(Review(cart_id=cid, author_name=author, overall=overall, hygiene=hygiene, comment=comment))
            db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if len(JWT_SECRET_KEY) < 32 or len(EMAIL_HASH_SECRET) < 32:
        raise RuntimeError("Set JWT_SECRET_KEY and EMAIL_HASH_SECRET to random values of at least 32 characters in .env")
    seed_database()
    yield


app = FastAPI(title="Kha-LaS API", version="1.0.0", docs_url="/api/docs", redoc_url="/api/redoc", openapi_url="/api/openapi.json", lifespan=lifespan)


@app.get("/", include_in_schema=False)
def home(): return FileResponse(ROOT / "index.html")


@app.get("/admin", include_in_schema=False)
def admin(): return FileResponse(ROOT / "index.html")


@app.get("/manifest.json", include_in_schema=False)
def manifest(): return FileResponse(ROOT / "manifest.json")


@app.get("/sw.js", include_in_schema=False)
def service_worker(): return FileResponse(ROOT / "sw.js", media_type="application/javascript")


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {"status": "ok", "database": "postgresql"}


@app.post("/api/auth/signup")
def signup(payload: Credentials, db: Session = Depends(get_db)):
    digest = email_digest(str(payload.email))
    if db.get(User, digest):
        raise HTTPException(409, "An account with this email already exists. Please sign in.")
    user = User(email_hash=digest, password_hash=password_hasher.hash(payload.password), name=payload.name.strip() or normalized_email(str(payload.email)).split("@")[0])
    db.add(user)
    db.commit()
    return {"access_token": token_for(user), "token_type": "bearer", "name": user.name, "email": normalized_email(str(payload.email))}


@app.post("/api/auth/login")
def login(payload: Credentials, db: Session = Depends(get_db)):
    user = db.get(User, email_digest(str(payload.email)))
    if not user or not password_hasher.verify(payload.password, user.password_hash):
        raise HTTPException(401, "Email or password is incorrect")
    return {"access_token": token_for(user), "token_type": "bearer", "name": user.name, "email": normalized_email(str(payload.email))}


@app.get("/api/carts")
def list_carts(db: Session = Depends(get_db), user: User | None = Depends(optional_user)):
    return [cart_json(cart, user) for cart in db.scalars(select(Cart).order_by(Cart.created_at, Cart.id)).all()]


@app.put("/api/carts/{cart_id}")
def save_cart(cart_id: str, payload: CartPayload, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if cart_id != payload.id:
        raise HTTPException(400, "Path id must match cart id")
    cart = db.get(Cart, cart_id)
    data = payload.model_dump()
    if cart is None:
        cart = Cart(**data, vendor_user_id=user.email_hash)
        db.add(cart)
    else:
        if cart.vendor_user_id != user.email_hash:
            raise HTTPException(403, "Only the cart owner can update it")
        for key, value in data.items():
            setattr(cart, key, value)
    db.commit()
    db.refresh(cart)
    return cart_json(cart, user)


@app.delete("/api/carts/{cart_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart(cart_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    cart = db.get(Cart, cart_id)
    if cart is None:
        raise HTTPException(404, "Cart not found")
    if cart.vendor_user_id != user.email_hash:
        raise HTTPException(403, "Only the cart owner can delete it")
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
def add_review(cart_id: str, payload: ReviewPayload, user: User | None = Depends(optional_user), db: Session = Depends(get_db)):
    if cart_id != payload.cart_id:
        raise HTTPException(400, "Path id must match review cart id")
    cart = db.get(Cart, cart_id)
    if not cart:
        raise HTTPException(404, "Cart not found")
    review = Review(cart_id=cart_id, author_user_id=user.email_hash if user else None, **payload.model_dump(exclude={"cart_id"}))
    old_count = cart.review_count
    cart.rating = round((cart.rating * old_count + payload.overall * 2) / (old_count + 1), 1)
    cart.review_count = old_count + 1
    cart.hygiene_rating = round(((cart.hygiene_rating or 0) * old_count + payload.hygiene) / (old_count + 1), 1)
    db.add(review)
    db.commit()
    db.refresh(review)
    return review_json(review)


app.mount("/assets", StaticFiles(directory=ROOT / "assets"), name="assets")
app.mount("/data", StaticFiles(directory=ROOT / "data"), name="data")
