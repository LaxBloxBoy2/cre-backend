import os
import requests
import json
from typing import Dict, Any, Optional, Tuple
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def geocode_address(address: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Geocode an address using OpenCage API
    
    Args:
        address: Address to geocode
        
    Returns:
        Tuple of (geocode_result, error_message)
        geocode_result is a dictionary with lat, lng, and formatted_address
        error_message is None if successful, otherwise contains the error message
    """
    # Get API key from environment
    api_key = os.getenv("OPENCAGE_API_KEY")
    if not api_key:
        logger.error("OPENCAGE_API_KEY environment variable not set")
        return None, "Geocoding API key not configured"
    
    # Prepare request
    url = "https://api.opencagedata.com/geocode/v1/json"
    params = {
        "q": address,
        "key": api_key,
        "limit": 1,
        "no_annotations": 1
    }
    
    try:
        # Make request
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        
        # Check if results were found
        if len(data["results"]) == 0:
            logger.warning(f"No geocoding results found for address: {address}")
            return None, "No results found for this address"
        
        # Extract coordinates
        result = data["results"][0]
        lat = result["geometry"]["lat"]
        lng = result["geometry"]["lng"]
        formatted_address = result["formatted"]
        
        return {
            "lat": lat,
            "lng": lng,
            "formatted_address": formatted_address
        }, None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error geocoding address: {address} - {str(e)}")
        return None, f"Error communicating with geocoding service: {str(e)}"
    
    except (KeyError, json.JSONDecodeError) as e:
        logger.error(f"Error parsing geocoding response for address: {address} - {str(e)}")
        return None, f"Error parsing geocoding response: {str(e)}"
    
    except Exception as e:
        logger.error(f"Unexpected error geocoding address: {address} - {str(e)}")
        return None, f"Unexpected error: {str(e)}"


def geocode_address_google(address: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Geocode an address using Google Maps API
    
    Args:
        address: Address to geocode
        
    Returns:
        Tuple of (geocode_result, error_message)
        geocode_result is a dictionary with lat, lng, and formatted_address
        error_message is None if successful, otherwise contains the error message
    """
    # Get API key from environment
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        logger.error("GOOGLE_MAPS_API_KEY environment variable not set")
        return None, "Geocoding API key not configured"
    
    # Prepare request
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": api_key
    }
    
    try:
        # Make request
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        
        # Check if results were found
        if data["status"] != "OK":
            logger.warning(f"No geocoding results found for address: {address} - Status: {data['status']}")
            return None, f"No results found for this address: {data.get('error_message', data['status'])}"
        
        # Extract coordinates
        result = data["results"][0]
        lat = result["geometry"]["location"]["lat"]
        lng = result["geometry"]["location"]["lng"]
        formatted_address = result["formatted_address"]
        
        return {
            "lat": lat,
            "lng": lng,
            "formatted_address": formatted_address
        }, None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error geocoding address: {address} - {str(e)}")
        return None, f"Error communicating with geocoding service: {str(e)}"
    
    except (KeyError, json.JSONDecodeError) as e:
        logger.error(f"Error parsing geocoding response for address: {address} - {str(e)}")
        return None, f"Error parsing geocoding response: {str(e)}"
    
    except Exception as e:
        logger.error(f"Unexpected error geocoding address: {address} - {str(e)}")
        return None, f"Unexpected error: {str(e)}"
