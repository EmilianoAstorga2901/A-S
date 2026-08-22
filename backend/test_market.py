import os
import unittest
from unittest.mock import patch

from backend.market import MarketProviderError, _validated_symbol, global_asset_snapshot, market_status, search_global_assets


class MarketAdapterTests(unittest.TestCase):
    def test_status_does_not_claim_live_without_credentials(self):
        with patch.dict(os.environ, {}, clear=True):
            status = market_status()
        self.assertEqual(status["mode"], "reference")
        self.assertFalse(status["global"]["configured"])
        self.assertFalse(status["argentina"]["configured"])

    def test_search_without_key_returns_an_explicit_reference_mode(self):
        with patch.dict(os.environ, {}, clear=True):
            result = search_global_assets("Apple")
        self.assertEqual(result["mode"], "reference")
        self.assertEqual(result["assets"], [])

    def test_symbol_validation_rejects_urls_and_paths(self):
        self.assertEqual(_validated_symbol("aapl"), "AAPL")
        with self.assertRaises(ValueError):
            _validated_symbol("../../secret")
        with self.assertRaises(ValueError):
            _validated_symbol("https://example.com")

    def test_snapshot_normalizes_quote_metrics_profile_and_news(self):
        responses = [
            {"c": 210.5, "dp": 1.2},
            {"name": "Apple Inc", "currency": "USD", "logo": "https://example.test/logo.png"},
            {"metric": {"peBasicExclExtraTTM": 28.4}},
            [{"id": 7, "headline": "Results", "summary": "Summary", "source": "Issuer", "url": "https://example.test/news", "image": "https://example.test/news.jpg", "datetime": 1_700_000_000}],
        ]
        with patch.dict(os.environ, {"FINNHUB_API_KEY": "test-key"}, clear=True), patch("backend.market._get_json", side_effect=responses):
            snapshot = global_asset_snapshot("AAPL")
        self.assertEqual(snapshot["mode"], "live")
        self.assertEqual(snapshot["quote"]["c"], 210.5)
        self.assertEqual(snapshot["metrics"]["peBasicExclExtraTTM"], 28.4)
        self.assertEqual(snapshot["news"][0]["symbol"], "AAPL")
        self.assertEqual(snapshot["news"][0]["image"], "https://example.test/news.jpg")

    def test_snapshot_requires_a_server_side_key(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(MarketProviderError):
                global_asset_snapshot("AAPL")


if __name__ == "__main__":
    unittest.main()
