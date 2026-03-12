from fastapi.testclient import TestClient

from app.models import MatchDay, TeamPlayer
from app.routers.utils import serialize_matchday
from app.schemas import MatchDayOut

from .helpers import auth_headers, create_group, register_user


def test_serialize_matchday_returns_matchday_schema(client: TestClient, db_session) -> None:
    owner = register_user(client, name="Owner", email="owner+serialize@example.com")
    token = owner["access_token"]
    group = create_group(client, token, name="Pelada Serialize")

    player_response = client.post(
        f"/groups/{group['id']}/players",
        json={"name": "Ana", "position": "MID", "skill_rating": 8},
        headers=auth_headers(token),
    )
    assert player_response.status_code == 201, player_response.text
    player_id = player_response.json()["id"]

    season_response = client.post(
        f"/groups/{group['id']}/seasons",
        json={"name": "Temporada Serialize"},
        headers=auth_headers(token),
    )
    assert season_response.status_code == 200, season_response.text
    season_id = season_response.json()["id"]

    matchday_response = client.post(
        f"/seasons/{season_id}/matchdays",
        json={"title": "Rodada Serialize", "scheduled_for": "2026-03-11"},
        headers=auth_headers(token),
    )
    assert matchday_response.status_code == 201, matchday_response.text
    matchday_id = matchday_response.json()["id"]

    attendance_response = client.post(
        f"/matchdays/{matchday_id}/attendance",
        json={"player_id": player_id, "status": "CONFIRMED"},
        headers=auth_headers(token),
    )
    assert attendance_response.status_code == 200, attendance_response.text

    matchday = db_session.get(MatchDay, matchday_id)
    assert matchday is not None

    serialized = serialize_matchday(db_session, matchday)

    assert isinstance(serialized, MatchDayOut)
    assert serialized.id == matchday_id
    assert serialized.season_id == season_id
    assert len(serialized.attendance) == 1
    assert serialized.attendance[0].player_id == player_id
    assert serialized.teams == []
    assert serialized.matches == []


def test_matchday_result_recomputes_standings_and_stats(client: TestClient, db_session) -> None:
    owner = register_user(client, name="Owner", email="owner@example.com")
    token = owner["access_token"]
    group = create_group(client, token)

    player_ids = []
    for index, name in enumerate(["Ana", "Bia", "Caio", "Duda"], start=1):
        response = client.post(
            f"/groups/{group['id']}/players",
            json={"name": name, "position": "MID", "skill_rating": index + 4},
            headers=auth_headers(token),
        )
        assert response.status_code == 201, response.text
        player_ids.append(response.json()["id"])

    season_response = client.post(
        f"/groups/{group['id']}/seasons",
        json={"name": "Temporada 2026"},
        headers=auth_headers(token),
    )
    assert season_response.status_code == 200
    season_id = season_response.json()["id"]

    matchday_response = client.post(
        f"/seasons/{season_id}/matchdays",
        json={"title": "Rodada 1", "scheduled_for": "2026-03-10", "notes": "Abertura"},
        headers=auth_headers(token),
    )
    assert matchday_response.status_code == 201
    matchday_id = matchday_response.json()["id"]

    for player_id in player_ids:
        attendance_response = client.post(
            f"/matchdays/{matchday_id}/attendance",
            json={"player_id": player_id, "status": "CONFIRMED"},
            headers=auth_headers(token),
        )
        assert attendance_response.status_code == 200, attendance_response.text

    lock_response = client.post(f"/matchdays/{matchday_id}/lock", headers=auth_headers(token))
    assert lock_response.status_code == 200
    lock_data = lock_response.json()
    assert lock_data["locked"] is True
    assert len(lock_data["teams"]) == 2
    assert all(team["players"] for team in lock_data["teams"])
    persisted_slots = db_session.query(TeamPlayer.position_slot).all()
    assert persisted_slots
    assert {slot for (slot,) in persisted_slots} <= {"DEF", "MID", "FWD", "GK", None}

    home_team = lock_data["teams"][0]
    away_team = lock_data["teams"][1]
    home_scorer = home_team["players"][0]["player_id"]
    away_scorer = away_team["players"][0]["player_id"]

    result_response = client.post(
        f"/matches/{lock_data['match_id']}/result",
        json={
            "home_score": 2,
            "away_score": 1,
            "goals": [
                {"player_id": home_scorer, "quantity": 2},
                {"player_id": away_scorer, "quantity": 1},
            ],
        },
        headers=auth_headers(token),
    )
    assert result_response.status_code == 200, result_response.text

    standings_response = client.get(f"/seasons/{season_id}/standings", headers=auth_headers(token))
    assert standings_response.status_code == 200
    standings = {item["player_id"]: item for item in standings_response.json()["items"]}
    winning_ids = {player["player_id"] for player in home_team["players"]}
    losing_ids = {player["player_id"] for player in away_team["players"]}

    assert set(standings) == set(player_ids)
    for player_id in winning_ids:
        assert standings[player_id]["points"] == 3
        assert standings[player_id]["wins"] == 1
        assert standings[player_id]["games_played"] == 1
    for player_id in losing_ids:
        assert standings[player_id]["points"] == 0
        assert standings[player_id]["losses"] == 1
        assert standings[player_id]["games_played"] == 1

    stats_response = client.get(f"/seasons/{season_id}/player-stats", headers=auth_headers(token))
    assert stats_response.status_code == 200
    stats = {item["player_id"]: item for item in stats_response.json()["items"]}

    assert stats[home_scorer]["goals"] == 2
    assert stats[away_scorer]["goals"] == 1
    assert all(stats[player_id]["appearances"] == 1 for player_id in player_ids)

    second_matchday_response = client.post(
        f"/seasons/{season_id}/matchdays",
        json={"title": "Rodada 2", "scheduled_for": "2026-03-17"},
        headers=auth_headers(token),
    )
    assert second_matchday_response.status_code == 201, second_matchday_response.text

    matchdays_response = client.get(
        f"/seasons/{season_id}/matchdays?limit=1&offset=1",
        headers=auth_headers(token),
    )
    assert matchdays_response.status_code == 200
    assert matchdays_response.headers["X-Total-Count"] == "2"
    assert matchdays_response.headers["X-Limit"] == "1"
    assert matchdays_response.headers["X-Offset"] == "1"
    assert [item["title"] for item in matchdays_response.json()] == ["Rodada 1"]

    paginated_standings_response = client.get(
        f"/seasons/{season_id}/standings?limit=2&offset=1",
        headers=auth_headers(token),
    )
    assert paginated_standings_response.status_code == 200
    assert paginated_standings_response.headers["X-Total-Count"] == "4"
    assert paginated_standings_response.headers["X-Limit"] == "2"
    assert paginated_standings_response.headers["X-Offset"] == "1"
    assert len(paginated_standings_response.json()["items"]) == 2

    paginated_stats_response = client.get(
        f"/seasons/{season_id}/player-stats?limit=2&offset=1",
        headers=auth_headers(token),
    )
    assert paginated_stats_response.status_code == 200
    assert paginated_stats_response.headers["X-Total-Count"] == "4"
    assert paginated_stats_response.headers["X-Limit"] == "2"
    assert paginated_stats_response.headers["X-Offset"] == "1"
    assert len(paginated_stats_response.json()["items"]) == 2
