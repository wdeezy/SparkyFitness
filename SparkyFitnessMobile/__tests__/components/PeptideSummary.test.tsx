import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PeptideSummary from '../../src/components/PeptideSummary';
import { usePeptideLevels } from '../../src/hooks/usePeptides';
import type { PeptideLevel } from '../../src/types/peptides';

jest.mock('../../src/hooks/usePeptides', () => ({
  usePeptideLevels: jest.fn(),
}));

const mockUsePeptideLevels = usePeptideLevels as jest.MockedFunction<
  typeof usePeptideLevels
>;

const makeLevel = (overrides: Partial<PeptideLevel> = {}): PeptideLevel => ({
  peptide_id: 'pep-1',
  name: 'Semaglutide',
  dose_unit: 'mg',
  half_life_hours: 165,
  color: null,
  is_active: true,
  currentLevel: 1.2,
  lastDose: 2,
  lastDoseAtMs: Date.now(),
  hoursSinceLastDose: 24,
  percentOfLastDoseRemaining: 60,
  ...overrides,
});

const asQueryResult = (data: PeptideLevel[] | undefined, isLoading = false) =>
  ({ data, isLoading } as unknown as ReturnType<typeof usePeptideLevels>);

describe('PeptideSummary', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders nothing while loading', () => {
    mockUsePeptideLevels.mockReturnValue(asQueryResult(undefined, true));
    const { toJSON } = render(<PeptideSummary />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when there are no active peptides', () => {
    mockUsePeptideLevels.mockReturnValue(
      asQueryResult([makeLevel({ is_active: false })]),
    );
    const { toJSON } = render(<PeptideSummary />);
    expect(toJSON()).toBeNull();
  });

  it('renders active peptide name, level, and percent remaining', () => {
    mockUsePeptideLevels.mockReturnValue(asQueryResult([makeLevel()]));
    const { getByText } = render(<PeptideSummary />);
    expect(getByText('Peptides')).toBeTruthy();
    expect(getByText('Semaglutide')).toBeTruthy();
    expect(getByText('1.2 mg')).toBeTruthy();
    expect(getByText('60% of last dose')).toBeTruthy();
  });

  it('shows a fallback when no injections have been logged', () => {
    mockUsePeptideLevels.mockReturnValue(
      asQueryResult([
        makeLevel({ percentOfLastDoseRemaining: null, currentLevel: 0 }),
      ]),
    );
    const { getByText } = render(<PeptideSummary />);
    expect(getByText('No injections logged')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    mockUsePeptideLevels.mockReturnValue(asQueryResult([makeLevel()]));
    const onPress = jest.fn();
    const { getByText } = render(<PeptideSummary onPress={onPress} />);
    fireEvent.press(getByText('Peptides'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
