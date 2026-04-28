from datetime import date, timedelta


def calculate_next_review(
    ease_factor: float, interval: int, quality: int
) -> tuple[float, int, str]:
    """
    SM-2 알고리즘. quality 0~5 (0~2: 실패, 3~5: 성공)
    반환: (새 ease_factor, 새 interval_days, next_review_at ISO 날짜)
    """
    if quality < 3:
        interval = 1
        ease_factor = max(1.3, ease_factor - 0.2)
    else:
        if interval == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)
        ease_factor = max(1.3, ease_factor + 0.1 - (5 - quality) * 0.08)

    next_review_at = (date.today() + timedelta(days=interval)).isoformat()
    return round(ease_factor, 3), interval, next_review_at


def interval_to_stage(interval: int) -> str:
    if interval <= 1:
        return "study"
    elif interval <= 7:
        return "retrieval"
    elif interval <= 21:
        return "spacing"
    else:
        return "mastered"
