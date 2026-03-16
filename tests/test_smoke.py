"""Basic smoke tests for the project skeleton."""

from fastapi.testclient import TestClient

from investment_discovery_engine.main import app

client = TestClient(app)


def test_healthcheck() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_homepage() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert "Investment Discovery Engine" in response.text
    assert "Explorar inversiones" in response.text
    assert "Saldo total" in response.text
    assert "Deck de oportunidades" in response.text
    assert "Entraste directo al deck" in response.text
    assert "Volver al deck" in response.text
    assert "Simulacion de inversion" in response.text
    assert "Por que aparecio esta carta" in response.text
    assert "Ver grafico completo" in response.text
    assert "Personaliza tu feed" in response.text
    assert "Perfil de riesgo" in response.text
    assert "SPDR S&amp;P 500 ETF" in response.text or "SPDR S&P 500 ETF" in response.text
