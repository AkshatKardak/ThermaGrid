"""
ThermaGrid Core Application Exceptions.
"""


class DataSourceUnavailable(Exception):
    """Raised when upstream observations are missing, stale, incomplete or synthetic."""
    pass


class WeatherUnavailableError(DataSourceUnavailable):
    """Raised when upstream weather service or API is experiencing an outage."""
    pass
