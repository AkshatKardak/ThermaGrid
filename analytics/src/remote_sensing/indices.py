"""
Remote Sensing Spectral Indices: NDVI, NDBI, NDWI.
"""

import numpy as np


def compute_ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
    """Normalized Difference Vegetation Index: (NIR - Red) / (NIR + Red)."""
    denom = nir + red
    denom = np.where(denom == 0, 1e-6, denom)
    return np.clip((nir - red) / denom, -1.0, 1.0)


def compute_ndbi(swir: np.ndarray, nir: np.ndarray) -> np.ndarray:
    """Normalized Difference Built-up Index: (SWIR - NIR) / (SWIR + NIR)."""
    denom = swir + nir
    denom = np.where(denom == 0, 1e-6, denom)
    return np.clip((swir - nir) / denom, -1.0, 1.0)
