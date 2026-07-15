from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User
from app.services.auth_service import (
    auth_cookie_name,
    create_access_token,
    get_current_user,
    get_user_by_email,
    hash_password,
    normalize_email,
    verify_password,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"],
)


class AuthUser(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    onboarding_completed: bool
    job_title: str | None
    preferred_topics: list[str]
    preferred_content_types: list[str]


class AuthResponse(BaseModel):
    user: AuthUser
    access_token: str | None = None


class SignupRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class SigninRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class OnboardingRequest(BaseModel):
    job_title: str = Field(min_length=1, max_length=80)
    preferred_topics: list[str] = Field(min_length=1, max_length=12)
    preferred_content_types: list[str] = Field(min_length=1, max_length=8)


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    job_title: str = Field(min_length=1, max_length=80)
    preferred_topics: list[str] = Field(min_length=1, max_length=24)
    preferred_content_types: list[str] = Field(min_length=1, max_length=8)


def serialize_user(user: User) -> AuthUser:
    return AuthUser(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        onboarding_completed=user.onboarding_completed,
        job_title=user.job_title,
        preferred_topics=user.preferred_topics,
        preferred_content_types=user.preferred_content_types,
    )


def set_auth_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    max_age = int(timedelta(minutes=settings.auth_token_expire_minutes).total_seconds())

    response.set_cookie(
        key=auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=max_age,
        path="/",
    )


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    payload: SignupRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    email = normalize_email(payload.email)

    if get_user_by_email(db, email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user)
    set_auth_cookie(response, access_token)

    return AuthResponse(
        user=serialize_user(user),
        access_token=access_token,
    )


@router.post("/signin", response_model=AuthResponse)
def signin(
    payload: SigninRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    user = get_user_by_email(db, payload.email)

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )

    access_token = create_access_token(user)
    set_auth_cookie(response, access_token)

    return AuthResponse(
        user=serialize_user(user),
        access_token=access_token,
    )


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(
        key=auth_cookie_name,
        path="/",
        samesite="lax",
    )

    return {
        "status": "ok",
    }


@router.get("/me", response_model=AuthResponse)
def get_me(
    current_user: User = Depends(get_current_user),
) -> AuthResponse:
    return AuthResponse(user=serialize_user(current_user))


@router.post("/onboarding", response_model=AuthResponse)
def complete_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuthResponse:
    current_user.job_title = payload.job_title.strip()
    current_user.preferred_topics = [
        topic.strip().upper()
        for topic in payload.preferred_topics
        if topic.strip()
    ]
    current_user.preferred_content_types = [
        content_type.strip().upper()
        for content_type in payload.preferred_content_types
        if content_type.strip()
    ]
    current_user.onboarding_completed = True

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return AuthResponse(user=serialize_user(current_user))


@router.put("/profile", response_model=AuthResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuthResponse:
    current_user.full_name = payload.full_name.strip()
    current_user.job_title = payload.job_title.strip()
    current_user.preferred_topics = [
        topic.strip().upper()
        for topic in payload.preferred_topics
        if topic.strip()
    ]
    current_user.preferred_content_types = [
        content_type.strip().upper()
        for content_type in payload.preferred_content_types
        if content_type.strip()
    ]
    current_user.onboarding_completed = True

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return AuthResponse(user=serialize_user(current_user))
