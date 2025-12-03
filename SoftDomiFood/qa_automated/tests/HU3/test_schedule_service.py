import pytest
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from services.schedule_service import parse_client_datetime, validate_schedule

LOCAL_TZ = ZoneInfo("America/Bogota")


def test_parse_client_datetime_without_tz_assumes_local():
    dt = parse_client_datetime("2025-12-02T15:30:00")
    assert dt.tzinfo is not None
    assert dt.tzinfo == LOCAL_TZ
    assert dt.year == 2025 and dt.month == 12 and dt.day == 2


def test_parse_client_datetime_with_tz_keeps_tz():
    dt = parse_client_datetime("2025-12-02T15:30:00-05:00")
    assert dt.tzinfo is not None


def test_validate_schedule_future_inside_hours_ok():
    now_local = datetime.now(LOCAL_TZ)

    # mañana a las 12:00 (normalmente dentro de horario)
    dt = (now_local + timedelta(days=1)).replace(hour=12, minute=0, second=0, microsecond=0)
    validate_schedule(dt)  # no debe lanzar error


def test_validate_schedule_rejects_past():
    now_local = datetime.now(LOCAL_TZ)
    dt = now_local - timedelta(minutes=10)
    with pytest.raises(ValueError):
        validate_schedule(dt)


def test_validate_schedule_rejects_outside_hours():
    now_local = datetime.now(LOCAL_TZ)

    # mañana 03:00 am (normalmente fuera de horario)
    dt = (now_local + timedelta(days=1)).replace(hour=3, minute=0, second=0, microsecond=0)
    with pytest.raises(ValueError):
        validate_schedule(dt)
