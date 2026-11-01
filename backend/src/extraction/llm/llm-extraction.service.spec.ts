import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LlmExtractionService } from './llm-extraction.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logger/logger.service';
import { GeminiExtractionProvider } from './providers/gemini.provider';

describe('LlmExtractionService - Fallback Resilience', () => {
  let service: LlmExtractionService;
  let mockConfig: Partial<ConfigService>;
  let mockLogger: Partial<LoggerService>;
  let mockGeminiProvider: Partial<GeminiExtractionProvider>;

  const mockExtraction = {
    schemaVersion: '1.0',
    extractionConfidence: 0.95,
    documentType: 'DISCHARGE_SUMMARY',
    surgeryType: 'Laparoscopic Cholecystectomy',
    surgeryDate: null,
    dischargeDate: null,
    clinicianName: null,
    hospitalName: null,
    medicines: [],
    followUps: [],
    tests: [],
    restrictions: [],
    diet: [],
    hydration: [],
    tasks: [],
    symptoms: [],
    redFlags: [],
    conditionalInstructions: [],
    extractionNotes: 'Test extraction',
  };

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string, defaultVal?: any) => {
        if (key === 'LLM_PROVIDER') return 'gemini';
        if (key === 'OPENAI_API_KEY') return 'sk-test-valid-key-123';
        if (key === 'OPENAI_MODEL') return 'gpt-4o';
        if (key === 'OPENAI_MAX_TOKENS') return 4096;
        if (key === 'GEMINI_TIMEOUT_MS') return 60000;
        return defaultVal;
      }),
    };

    mockLogger = {
      setContext: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    mockGeminiProvider = {
      extract: vi.fn(),
    };

    service = new LlmExtractionService(
      mockConfig as ConfigService,
      mockLogger as LoggerService,
      mockGeminiProvider as GeminiExtractionProvider,
    );
  });

  it('uses Gemini directly when it succeeds', async () => {
    (mockGeminiProvider.extract as any).mockResolvedValue(mockExtraction);

    const result = await service.extract('discharge text', 'doc-1');
    expect(result).toEqual(mockExtraction);
    expect(mockGeminiProvider.extract).toHaveBeenCalledWith('discharge text', 'doc-1');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('automatically falls back to OpenAI when Gemini throws a 429 rate limit error', async () => {
    const rateLimitError = new Error('ResourceExhausted: 429 Quota exceeded');
    (mockGeminiProvider.extract as any).mockRejectedValue(rateLimitError);

    const spyOpenAi = vi.spyOn(service as any, 'extractWithOpenAI').mockResolvedValue(mockExtraction);

    const result = await service.extract('discharge text', 'doc-1');
    expect(result).toEqual(mockExtraction);
    expect(spyOpenAi).toHaveBeenCalledWith('discharge text', 'doc-1');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('[Gemini] Rate-limit (429) or transient 503 error encountered'),
    );
  });

  it('automatically falls back to OpenAI when Gemini throws a 503 service unavailable error', async () => {
    const error503 = new Error('503 Service Unavailable: Model is overloaded');
    (mockGeminiProvider.extract as any).mockRejectedValue(error503);

    const spyOpenAi = vi.spyOn(service as any, 'extractWithOpenAI').mockResolvedValue(mockExtraction);

    const result = await service.extract('discharge text', 'doc-1');
    expect(result).toEqual(mockExtraction);
    expect(spyOpenAi).toHaveBeenCalledWith('discharge text', 'doc-1');
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('rethrows error if Gemini fails with 429 but OPENAI_API_KEY is not configured', async () => {
    mockConfig.get = vi.fn((key: string, defaultVal?: any) => {
      if (key === 'LLM_PROVIDER') return 'gemini';
      if (key === 'OPENAI_API_KEY') return '';
      return defaultVal;
    });

    service = new LlmExtractionService(
      mockConfig as ConfigService,
      mockLogger as LoggerService,
      mockGeminiProvider as GeminiExtractionProvider,
    );

    const rateLimitError = new Error('429 Rate limit exceeded');
    (mockGeminiProvider.extract as any).mockRejectedValue(rateLimitError);

    await expect(service.extract('discharge text', 'doc-1')).rejects.toThrow('429 Rate limit exceeded');
  });

  it('rethrows non-transient Gemini error without calling OpenAI fallback', async () => {
    const nonTransientError = new Error('400 Invalid argument: documentText cannot be empty');
    (mockGeminiProvider.extract as any).mockRejectedValue(nonTransientError);

    const spyOpenAi = vi.spyOn(service as any, 'extractWithOpenAI');

    await expect(service.extract('discharge text', 'doc-1')).rejects.toThrow('400 Invalid argument');
    expect(spyOpenAi).not.toHaveBeenCalled();
  });
});

