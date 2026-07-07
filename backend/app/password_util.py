import bcrypt
import secrets
import string


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def generate_temp_password(length: int = 10) -> str:
    alphabet = "".join(ch for ch in (string.ascii_uppercase + string.digits) if ch not in "O0IL1")
    return "".join(secrets.choice(alphabet) for _ in range(length))
