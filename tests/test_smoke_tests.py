from fastapi.testclient import TestClient

from investment_discovery_engine.main import app

client = TestClient(app)


def test_healthcheck() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_opportunities_payload_has_multipliers() -> None:
    response = client.get("/api/users/demo/opportunities")
    assert response.status_code == 200
    payload = response.json()
    assert payload["opportunities"]
    first = payload["opportunities"][0]
    assert first["buy_label"]
    assert first["sell_label"]
    assert first["multipliers"]
