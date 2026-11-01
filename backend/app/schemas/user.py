"""
Pydantic schemas for authentication and user profiles.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "citizen"
    city_preference: str = "Mumbai"
    phone_number: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
