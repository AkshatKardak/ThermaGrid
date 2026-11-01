"""
Land Surface Temperature (LST) Calculation from Thermal Radiance.
"""

import numpy as np


def compute_lst_from_brightness_temp(
    bt_kelvin: np.ndarray,
    emissivity: np.ndarray,
    wavelength_um: float = 10.895,  # Landsat-8 Band 10 effective wavelength
) -> np.ndarray:
    """
    Computes Land Surface Temperature using Planck inversion with surface emissivity:
    LST = BT / (1 + (lambda * BT / rho) * ln(epsilon))
    where rho = h * c / sigma = 1.438 * 10^-2 m K
    Returns LST in Celsius.
    """
    rho = 1.438e-2
    denom = 1.0 + (wavelength_um * 1e-6 * bt_kelvin / rho) * np.log(np.clip(emissivity, 0.85, 0.99))
    lst_k = bt_kelvin / denom
    return lst_k - 273.15
