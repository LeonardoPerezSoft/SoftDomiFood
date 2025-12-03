# services/schedule_service.py
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo
import os

LOCAL_TZ = ZoneInfo(os.getenv("LOCAL_TZ", "America/Bogota"))

# Máximo para programar (default 48h)
MAX_HOURS = int(os.getenv("SCHEDULE_MAX_HOURS", "48"))

# Horario simple (default 10:00 - 22:00)
OPEN_TIME_STR = os.getenv("RESTAURANT_OPEN_TIME", "10:00")
CLOSE_TIME_STR = os.getenv("RESTAURANT_CLOSE_TIME", "22:00")

def _parse_hhmm(s: str) -> time:
    hh, mm = s.split(":")
    return time(int(hh), int(mm))

OPEN_TIME = _parse_hhmm(OPEN_TIME_STR)
CLOSE_TIME = _parse_hhmm(CLOSE_TIME_STR)

def parse_client_datetime(dt_str: str) -> datetime:
    """
    Acepta ISO 8601. Si viene sin tz (ej datetime-local), asumimos LOCAL_TZ.
    Ej:
      - "2025-12-02T21:30"
      - "2025-12-02T21:30:00-05:00"
      - "2025-12-03T02:30:00Z"
    """
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=LOCAL_TZ)
    return dt.astimezone(LOCAL_TZ)

def validate_schedule(scheduled_local: datetime) -> None:
    now = datetime.now(LOCAL_TZ)

    if scheduled_local <= now:
        raise ValueError("La fecha/hora programada debe estar en el futuro.")

    if scheduled_local > now + timedelta(hours=MAX_HOURS):
        raise ValueError(f"No puedes programar pedidos a más de {MAX_HOURS} horas.")

    t = scheduled_local.time()
    # Simple: mismo horario todos los días
    if not (OPEN_TIME <= t <= CLOSE_TIME):
        raise ValueError("El restaurante no está disponible en ese horario.")
