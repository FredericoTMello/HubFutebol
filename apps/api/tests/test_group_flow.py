from fastapi.testclient import TestClient

from .helpers import auth_headers, create_group, register_user


def test_owner_can_create_group_player_and_season(client: TestClient) -> None:
    owner = register_user(client, name="Owner", email="owner@example.com")
    token = owner["access_token"]
    group = create_group(client, token)

    player_response = client.post(
        f"/groups/{group['id']}/players",
        json={"name": "Joao", "nickname": "J", "position": "MID", "skill_rating": 7},
        headers=auth_headers(token),
    )
    assert player_response.status_code == 201
    player = player_response.json()
    assert player["group_id"] == group["id"]
    assert player["name"] == "Joao"

    season_response = client.post(
        f"/groups/{group['id']}/seasons",
        json={"name": "Temporada 2026"},
        headers=auth_headers(token),
    )
    assert season_response.status_code == 200
    season = season_response.json()
    assert season["group_id"] == group["id"]
    assert season["is_active"] is True

    group_response = client.get(f"/groups/{group['id']}", headers=auth_headers(token))
    assert group_response.status_code == 200
    group_data = group_response.json()
    assert group_data["active_season_id"] == season["id"]

    players_response = client.get(f"/groups/{group['id']}/players", headers=auth_headers(token))
    assert players_response.status_code == 200
    assert [item["name"] for item in players_response.json()] == ["Joao"]
