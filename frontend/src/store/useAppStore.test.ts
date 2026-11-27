import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('Selection Store Cascade Reducer', () => {
  beforeEach(() => {
    // Reset to Maharashtra / Mumbai / 1 baseline
    useAppStore.getState().setSelection({
      stateCode: 'MH',
      cityCode: 'Mumbai',
      wardId: 1,
    });
  });

  it('sets Telangana city and clears Maharashtra ward on setState("TS")', () => {
    const { setSelection } = useAppStore.getState();

    // User selects Telangana via 2-letter state code 'TS'
    setSelection({ stateCode: 'TS' });

    const state = useAppStore.getState();
    expect(state.selection.cityCode).toBe('Hyderabad');
    // Crucial requirement: wardId must be a Telangana ward or null — NEVER leave a Maharashtra ward (like 1)
    expect(state.selection.wardId).toBeNull();
    expect(state.selection.wardId).not.toBe(1);
  });

  it('sets Telangana city and clears Maharashtra ward on setState("TG")', () => {
    const { setSelection } = useAppStore.getState();

    setSelection({ stateCode: 'TG' });

    const state = useAppStore.getState();
    expect(state.selection.cityCode).toBe('Hyderabad');
    expect(state.selection.wardId).toBeNull();
    expect(state.selection.wardId).not.toBe(1);
  });

  it('sets Telangana city and clears Maharashtra ward on setState("Telangana")', () => {
    const { setSelection } = useAppStore.getState();

    setSelection({ stateCode: 'Telangana' });

    const state = useAppStore.getState();
    expect(state.selection.cityCode).toBe('Hyderabad');
    expect(state.selection.wardId).toBeNull();
  });

  it('switches back to Maharashtra and resets ward to null for data-driven resolution', () => {
    const { setSelection } = useAppStore.getState();

    setSelection({ stateCode: 'TS' });
    expect(useAppStore.getState().selection.cityCode).toBe('Hyderabad');

    setSelection({ stateCode: 'MH' });
    const state = useAppStore.getState();
    expect(state.selection.cityCode).toBe('Mumbai');
    expect(state.selection.wardId).toBeNull();
    expect(state.selectedLocationId).toBeNull();
  });

  it('updates state and resets ward to null when city is set to Delhi', () => {
    const { setSelection } = useAppStore.getState();

    setSelection({ cityCode: 'Delhi' });

    const state = useAppStore.getState();
    expect(state.selection.stateCode).toBe('DL');
    expect(state.selection.cityCode).toBe('Delhi');
    expect(state.selection.wardId).toBeNull();
    expect(state.selectedLocationId).toBeNull();
  });

  it('accepts setting a ward when explicitly selected', () => {
    const { setSelection } = useAppStore.getState();

    setSelection({ cityCode: 'Mumbai' });
    setSelection({ wardId: 4 });

    expect(useAppStore.getState().selection.wardId).toBe(4);
    expect(useAppStore.getState().selectedLocationId).toBe(4);
  });

  it('clears ward to null and never coerces to 0', () => {
    const { setSelection } = useAppStore.getState();

    setSelection({ wardId: null });

    expect(useAppStore.getState().selection.wardId).toBeNull();
    expect(useAppStore.getState().selectedLocationId).toBeNull();
  });
});
