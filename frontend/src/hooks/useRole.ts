import { useAuth } from '@clerk/clerk-react';

export interface UseRoleReturn {
  role: string;
  isAuthority: boolean;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
}

/**
 * Derives user role strictly from Clerk's signed session token claims.
 * Role defaults to 'citizen' (least privilege) if unspecified.
 */
export function useRole(): UseRoleReturn {
  const { sessionClaims, isLoaded, isSignedIn } = useAuth();

  const role =
    ((sessionClaims as any)?.role as string) ??
    ((sessionClaims as any)?.public_metadata as any)?.role ??
    'citizen';

  return {
    role,
    isAuthority: role === 'authority' || role === 'admin',
    isLoaded,
    isSignedIn,
  };
}
