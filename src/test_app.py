from fastapi.testclient import TestClient
from app import app, activities


def test_signup_and_unregister():
    client = TestClient(app)
    activity = "Tennis Club"
    email = "autotest@mergington.edu"

    # Ensure the email is not already registered
    if email in activities[activity]['participants']:
        activities[activity]['participants'].remove(email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]['participants']

    # Now unregister
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert email not in activities[activity]['participants']


def test_activities_cache_control():
    client = TestClient(app)
    resp = client.get('/activities')
    assert resp.status_code == 200
    assert resp.headers.get('cache-control', '').lower() == 'no-store'
