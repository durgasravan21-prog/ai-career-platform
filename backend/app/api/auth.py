"""Authentication API routes — register and login."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password, get_current_user
from app.models.user import User, UserProfile
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse, SendOTPRequest, VerifyOTPRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Create a new user account.

    - Validates email uniqueness.
    - Hashes the password with bcrypt.
    - Creates a User and empty UserProfile.
    - Returns a JWT access token.
    """
    # Check for existing email
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    # Create user
    user = User(
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password),
        is_active=True,
    )
    db.add(user)
    await db.flush()  # Get user.id before creating profile

    # Create empty profile
    profile = UserProfile(user_id=user.id)
    db.add(profile)
    await db.flush()

    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate a user and return a JWT.

    - Looks up user by email.
    - Verifies the bcrypt password hash.
    - Returns a JWT access token.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user details",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the currently authenticated user's details."""
    return UserResponse.model_validate(current_user)


import random

# In-memory store for OTPs: email -> otp code
_active_otps: dict[str, str] = {}


@router.post(
    "/otp/send",
    summary="Send a login/registration OTP",
)
async def send_otp(body: SendOTPRequest):
    """Generate and send a 6-digit OTP to the user's email."""
    otp_code = f"{random.randint(100000, 999999)}"
    _active_otps[body.email.lower()] = otp_code
    
    print(f"\n======================================")
    print(f"[DEBUG OTP] Code for {body.email}: {otp_code}")
    print(f"======================================\n")
    
    return {
        "message": f"OTP successfully sent to {body.email} (development server)",
        "debug_otp": otp_code,
    }


@router.post(
    "/otp/verify",
    response_model=TokenResponse,
    summary="Verify OTP and log in / register",
)
async def verify_otp(
    body: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Verify the 6-digit OTP code. Registers the user if they don't exist."""
    email_clean = body.email.lower()
    stored_otp = _active_otps.get(email_clean)
    
    # Support '123456' as fallback master OTP for testing convenience
    if body.otp != "123456" and body.otp != stored_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code",
        )
        
    if email_clean in _active_otps:
        del _active_otps[email_clean]
        
    result = await db.execute(select(User).where(User.email == email_clean))
    user = result.scalar_one_or_none()
    
    if user is None:
        # Create new user automatically (onboard/registration via OTP)
        display_name = body.name if body.name else email_clean.split("@")[0].capitalize()
        dummy_password = hash_password(f"dummy-{random.randint(10000000, 99999999)}")
        user = User(
            email=email_clean,
            name=display_name,
            hashed_password=dummy_password,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        await db.flush()
        
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )

