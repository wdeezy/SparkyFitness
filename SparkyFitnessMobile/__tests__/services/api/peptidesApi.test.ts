import {
  createPeptide,
  deleteInjection,
  deletePeptide,
  fetchInjections,
  fetchPeptideLevels,
  fetchPeptideSeries,
  fetchPeptides,
  logInjection,
} from '../../../src/services/api/peptidesApi';
import { getActiveServerConfig, type ServerConfig } from '../../../src/services/storage';

jest.mock('../../../src/services/storage', () => ({
  getActiveServerConfig: jest.fn(),
  proxyHeadersToRecord: jest.requireActual('../../../src/services/storage').proxyHeadersToRecord,
}));

jest.mock('../../../src/services/LogService', () => ({
  addLog: jest.fn(),
}));

const mockGetActiveServerConfig = getActiveServerConfig as jest.MockedFunction<
  typeof getActiveServerConfig
>;

describe('peptidesApi', () => {
  const mockFetch = jest.fn();

  const testConfig: ServerConfig = {
    id: 'test-id',
    url: 'https://example.com',
    apiKey: 'test-api-key-12345',
  };

  const okJson = (data: unknown) => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: () => Promise.resolve(data),
  });

  beforeEach(() => {
    jest.resetAllMocks();
    (globalThis as any).fetch = mockFetch;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetActiveServerConfig.mockResolvedValue(testConfig);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetchPeptides GETs /api/peptides', async () => {
    mockFetch.mockResolvedValue(okJson([]));
    await fetchPeptides();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/peptides',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('fetchPeptideLevels GETs /api/peptides/levels', async () => {
    mockFetch.mockResolvedValue(okJson([]));
    await fetchPeptideLevels();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/peptides/levels',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('fetchPeptideSeries builds a query string from params', async () => {
    mockFetch.mockResolvedValue(okJson({ series: [] }));
    await fetchPeptideSeries('pep-1', { resolutionMinutes: 60 });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/api/peptides/pep-1/series?');
    expect(url).toContain('resolutionMinutes=60');
  });

  it('fetchPeptideSeries omits the query string when no params', async () => {
    mockFetch.mockResolvedValue(okJson({ series: [] }));
    await fetchPeptideSeries('pep-1');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/peptides/pep-1/series',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('fetchInjections GETs the per-peptide injections path', async () => {
    mockFetch.mockResolvedValue(okJson([]));
    await fetchInjections('pep-1');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/peptides/pep-1/injections',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('createPeptide POSTs the payload', async () => {
    mockFetch.mockResolvedValue(okJson({ id: 'pep-1' }));
    await createPeptide({ name: 'Test', half_life_hours: 100, dose_unit: 'mg' });
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://example.com/api/peptides');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      name: 'Test',
      half_life_hours: 100,
      dose_unit: 'mg',
    });
  });

  it('logInjection POSTs to the per-peptide injections path', async () => {
    mockFetch.mockResolvedValue(okJson({ id: 'inj-1' }));
    await logInjection('pep-1', { dose: 2.5, injection_site: 'left' });
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://example.com/api/peptides/pep-1/injections');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ dose: 2.5, injection_site: 'left' });
  });

  it('deletePeptide DELETEs /api/peptides/:id', async () => {
    mockFetch.mockResolvedValue(okJson({ deleted: true }));
    await deletePeptide('pep-1');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/peptides/pep-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('deleteInjection DELETEs the flat injections path', async () => {
    mockFetch.mockResolvedValue(okJson({ deleted: true }));
    await deleteInjection('inj-1');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/peptides/injections/inj-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('throws when no server config exists', async () => {
    mockGetActiveServerConfig.mockResolvedValue(null);
    await expect(fetchPeptides()).rejects.toThrow('Server configuration not found.');
  });
});
