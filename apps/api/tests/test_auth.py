from fastapi.testclient import TestClient


def test_register_and_login(client: TestClient) -> None:
    register_response = client.post(
        "/auth/register",
        json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
    )

    assert register_response.status_code == 201
    register_data = register_response.json()
    assert register_data["token_type"] == "bearer"
    assert register_data["user"]["email"] == "alice@example.com"
    assert register_data["access_token"]

    login_response = client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "secret123"},
    )

    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["user"]["email"] == "alice@example.com"
    assert login_data["access_token"]


def test_v1_auth_routes_match_current_contract(client: TestClient) -> None:
    register_response = client.post(
        "/v1/auth/register",
        json={"name": "Bob", "email": "bob@example.com", "password": "secret123"},
    )

    assert register_response.status_code == 201
    assert register_response.json()["user"]["email"] == "bob@example.com"

    login_response = client.post(
        "/v1/auth/login",
        json={"email": "bob@example.com", "password": "secret123"},
    )

    assert login_response.status_code == 200
    assert login_response.json()["user"]["email"] == "bob@example.com"
