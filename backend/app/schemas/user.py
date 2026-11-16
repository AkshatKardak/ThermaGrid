"""
Pydantic schemas for authentication and user profiles.
"""

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    role: str = "citizen"
    city_preference: str = "Mumbai"
    phone_number: str | None = None


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
    sub: str | None = None
    role: str | None = None
