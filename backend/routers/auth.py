from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from .. import schemas, database
from ..core import security

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/signup", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db = Depends(database.get_db)):
    db_user = db.users.find_one({"username": user.username})
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.users.find_one({"email": user.email})
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(user.password)
    last_user = list(db.users.find().sort("id", -1).limit(1))
    new_id = 1
    if last_user:
        new_id = last_user[0]["id"] + 1

    new_user = {
        "id": new_id,
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "is_active": True
    }
    db.users.insert_one(new_user)
    return new_user

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(database.get_db)):
    user = db.users.find_one({"username": form_data.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not security.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: dict = Depends(security.get_current_user)):
    return current_user
