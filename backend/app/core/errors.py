"""
ThermaGrid Core Application Exceptions.
"""


class DataSourceUnavailable(Exception):
    """Raised when upstream observations are missing, stale, incomplete or synthetic."""
    pass
