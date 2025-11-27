import random
import string
from fastapi.testclient import TestClient
from src.app import app, activities


def random_activity_name():
    return "Test Activity " + "".join(random.choice(string.ascii_letters) for _ in range(6))


def create_test_activity(name, max_participants=2):
    activities[name] = {
        "description": "Temporary activity for testing",
        "schedule": "Now",
        "max_participants": max_participants,
        "participants": [],
    }
    return name


def remove_test_activity(name):
    if name in activities:
        del activities[name]


def test_signup_and_unregister_cycle():
    client = TestClient(app)
    activity = create_test_activity(random_activity_name(), max_participants=2)
    try:
        email = "user1@example.com"

        # Sign up
        resp = client.post(f"/activities/{activity}/signup?email={email}")
        assert resp.status_code == 200
        assert email in activities[activity]["participants"]

        # Duplicate sign up should return 400
        resp = client.post(f"/activities/{activity}/signup?email={email}")
        assert resp.status_code == 400

        # Unregister
        resp = client.delete(f"/activities/{activity}/participants?email={email}")
        assert resp.status_code == 200
        assert email not in activities[activity]["participants"]
    finally:
        remove_test_activity(activity)


def test_capacity_limit():
    client = TestClient(app)
    activity = create_test_activity(random_activity_name(), max_participants=1)
    try:
        email1 = "capacity1@example.com"
        email2 = "capacity2@example.com"

        resp1 = client.post(f"/activities/{activity}/signup?email={email1}")
        assert resp1.status_code == 200

        # capacity reached so second signup is rejected
        resp2 = client.post(f"/activities/{activity}/signup?email={email2}")
        assert resp2.status_code == 400
    finally:
        remove_test_activity(activity)


def test_unregister_not_found_returns_404():
    client = TestClient(app)
    activity = create_test_activity(random_activity_name(), max_participants=2)
    try:
        resp = client.delete(f"/activities/{activity}/participants?email=notfound@example.com")
        assert resp.status_code == 404
    finally:
        remove_test_activity(activity)
