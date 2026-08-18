import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.location_engine import LocationEngine

def test_explicit_state_extraction():
    ctx_rj = LocationEngine.extract_location("I live in Rajasthan and want scholarship")
    assert ctx_rj.state_name == "Rajasthan"
    assert ctx_rj.state_code == "RJ"

    ctx_gj = LocationEngine.extract_location("What schemes are available in Gujarat?")
    assert ctx_gj.state_name == "Gujarat"
    assert ctx_gj.state_code == "GJ"

    ctx_tn = LocationEngine.extract_location("Pudhumai penn scheme in Tamil Nadu")
    assert ctx_tn.state_name == "Tamil Nadu"
    assert ctx_tn.state_code == "TN"

def test_city_alias_extraction():
    ctx_jaipur = LocationEngine.extract_location("I am looking for student hostel in Jaipur")
    assert ctx_jaipur.state_name == "Rajasthan"
    assert ctx_jaipur.city == "Jaipur"

    ctx_blore = LocationEngine.extract_location("How to register small business in Bangalore")
    assert ctx_blore.state_name == "Karnataka"

    ctx_ahmedabad = LocationEngine.extract_location("MYSY scheme in Ahmedabad")
    assert ctx_ahmedabad.state_name == "Gujarat"

def test_all_36_states_and_uts_list():
    all_regions = LocationEngine.get_all_states_and_uts()
    assert len(all_regions) == 36
    uts = [r for r in all_regions if r["is_ut"]]
    states = [r for r in all_regions if not r["is_ut"]]
    assert len(states) == 28
    assert len(uts) == 8
