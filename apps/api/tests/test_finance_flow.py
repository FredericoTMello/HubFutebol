from fastapi.testclient import TestClient

from .helpers import auth_headers, create_group, register_user


def test_ledger_entries_update_group_balance(client: TestClient) -> None:
    owner = register_user(client, name="Owner", email="owner@example.com")
    token = owner["access_token"]
    group = create_group(client, token)

    initial_ledger = client.get(f"/groups/{group['id']}/ledger", headers=auth_headers(token))
    assert initial_ledger.status_code == 200
    assert initial_ledger.json()["balance"] == "0.00"

    income_response = client.post(
        f"/groups/{group['id']}/ledger/entries",
        json={"amount": "120.00", "kind": "IN", "description": "Caixa inicial"},
        headers=auth_headers(token),
    )
    assert income_response.status_code == 201
    income_ledger = income_response.json()
    assert income_ledger["balance"] == "120.00"
    assert len(income_ledger["entries"]) == 1

    expense_response = client.post(
        f"/groups/{group['id']}/ledger/entries",
        json={"amount": "20.00", "kind": "EXPENSE", "description": "Bolas"},
        headers=auth_headers(token),
    )
    assert expense_response.status_code == 201
    expense_ledger = expense_response.json()
    assert expense_ledger["balance"] == "100.00"
    assert [entry["kind"] for entry in expense_ledger["entries"]] == ["EXPENSE", "IN"]
