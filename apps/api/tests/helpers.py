from fastapi.testclient import TestClient


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def register_user(
    client: TestClient,
    *,
    name: str,
    email: str,
    password: str = "secret123",
) -> dict:
    response = client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    assert response.status_code == 201, response.text
    return response.json()


def create_group(client: TestClient, token: str, name: str = "Pelada de Sabado") -> dict:
    response = client.post("/groups", json={"name": name}, headers=auth_headers(token))
    assert response.status_code == 201, response.text
    return response.json()
