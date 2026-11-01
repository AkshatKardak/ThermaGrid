import * as THREE from 'three';

/**
 * Converts geographic coordinates (latitude, longitude in degrees) to a 3D Cartesian vector on a sphere of radius R.
 * Matches standard spherical mapping where:
 * - phi = colatitude = (90 - lat) in radians
 * - theta = longitude + 180 in radians
 */
export function latLngToVec3(lat: number, lng: number, R: number = 1.0): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -R * Math.sin(phi) * Math.cos(theta),
    R * Math.cos(phi),
    R * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Computes an orientation Quaternion that rotates the UP vector (0, 1, 0)
 * to align with the surface normal vector at (lat, lng).
 */
export function getSurfaceOrientation(lat: number, lng: number, R: number = 1.0): { position: THREE.Vector3; quaternion: THREE.Quaternion } {
  const pos = latLngToVec3(lat, lng, R);
  const normal = pos.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
  return { position: pos, quaternion };
}

/**
 * Computes rotation angle around Y axis (in radians) needed to point a specific longitude directly towards the camera (facing +Z).
 * For India (lng ~78°E): ≈ 3.35 rad.
 */
export function getFacingYRotation(targetLng: number = 78.5): number {
  return ((180 - targetLng) * Math.PI) / 180;
}
