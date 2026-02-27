from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

from .db import get_db
from .settings import settings


router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _create_access_token(subject: str) -> str:
    expire_minutes = settings.jwt_access_token_exp_minutes
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expire_minutes)
    payload = {"sub": subject, "exp": expire}
    token = jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    return token


async def _get_user_by_email(email: str):
    db = get_db()
    return await db.users.find_one({"email": email})


async def _get_user_by_id(user_id: str):
    db = get_db()
    return await db.users.find_one({"_id": user_id})


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        subject: str | None = payload.get("sub")
        if subject is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # We store user id as the subject
    user = await _get_user_by_id(subject)
    if not user:
        raise credentials_exception

    return user


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    db = get_db()

    existing = await _get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    now = datetime.utcnow()
    user_doc = {
        "_id": payload.email.lower(),  # simple string id
        "email": payload.email.lower(),
        "password_hash": _hash_password(payload.password),
        "created_at": now,
    }

    await db.users.insert_one(user_doc)

    access_token = _create_access_token(subject=user_doc["_id"])
    return TokenOut(access_token=access_token)


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin):
    user = await _get_user_by_email(payload.email.lower())
    if not user or not _verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = _create_access_token(subject=user["_id"])
    return TokenOut(access_token=access_token)


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return UserOut(
        id=current_user["_id"],
        email=current_user["email"],
        created_at=current_user["created_at"],
    )
