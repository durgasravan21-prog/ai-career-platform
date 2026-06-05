"""Pydantic v2 schemas for authentication endpoints."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator


class RegisterRequest(BaseModel):
    """Request body for user registration."""

    email: str = Field(..., min_length=5, max_length=320, description="User email address")
    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    password: str = Field(..., min_length=8, max_length=128, description="Plain-text password")

    @model_validator(mode="after")
    def validate_email_format(self) -> "RegisterRequest":
        """Basic email validation without requiring email-validator package."""
        if "@" not in self.email or "." not in self.email.split("@")[-1]:
            raise ValueError("Invalid email format")
        return self


class LoginRequest(BaseModel):
    """Request body for user login."""

    email: str = Field(..., min_length=5, max_length=320)
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    """JWT token response returned on successful auth."""

    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    """Public user information returned in API responses."""

    model_config = {"from_attributes": True}

    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SendOTPRequest(BaseModel):
    """Request body to request a login/register OTP."""
    email: str = Field(..., min_length=5, max_length=320)

    @model_validator(mode="after")
    def validate_email_format(self) -> "SendOTPRequest":
        if "@" not in self.email or "." not in self.email.split("@")[-1]:
            raise ValueError("Invalid email format")
        return self


class VerifyOTPRequest(BaseModel):
    """Request body to verify the OTP and log in."""
    email: str = Field(..., min_length=5, max_length=320)
    otp: str = Field(..., min_length=6, max_length=6)
    name: str | None = Field(None, min_length=1, max_length=255)
