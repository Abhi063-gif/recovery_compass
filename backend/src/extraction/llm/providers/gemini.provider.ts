import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import { RootExtractionSchema, RootExtraction } from '../../schemas/extraction.schema';
import { LoggerService } from '../../../common/logger/logger.service';
import { ZodError } from 'zod';

/**
 * Gemini Extraction Provider
 *
 * Uses Google Gemini Pro for structured document extraction.
 *
 * Safety contract (same as OpenAI provider):
 * - System prompt constrains LLM to extract only — never advise
 * - Output validated against Zod schema before returning
 * - Malformed or unsafe output throws — never silently passes
 * - API key is SERVER-SIDE only — never sent to browser
 */
@Injectable()
export class GeminiExtractionProvider {
  private readonly genai: GoogleGenerativeAI;
  private readonly modelName: string;
  private readonly maxTokens: number;
  private readonly timeoutMs: number;

  constructor(
    private readonly cfg: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(GeminiExtractionProvider.name);

    const apiKey = cfg.get<string>('GEMINI_API_KEY', '');
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      this.logger.warn(
        'GEMINI_API_KEY is not configured. Set it in backend/.env to enable AI extraction.',
      );
    }

    this.genai = new GoogleGenerativeAI(apiKey);
    this.modelName = cfg.get<string>('GEMINI_MODEL', 'gemini-1.5-pro');
    this.maxTokens = cfg.get<number>('GEMINI_MAX_TOKENS', 8192);
    this.timeoutMs = cfg.get<number>('GEMINI_TIMEOUT_MS', 60000);
  }

  async extract(documentText: string, documentId: string): Promise<RootExtraction> {
    const start = Date.now();
    this.logger.log(`[Gemini] Starting extraction for document ${documentId}`);

    const apiKey = this.cfg.get<string>('GEMINI_API_KEY', '');
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      throw new Error(
        'GEMINI_API_KEY is not configured. Cannot run AI extraction. ' +
        'Set GEMINI_API_KEY in backend/.env.',
      );
    }

    const model = this.genai.getGenerativeModel({
      model: this.modelName,
      systemInstruction: this.buildSystemPrompt(),
      generationConfig: {
        temperature: 0, // Deterministic output for medical data
        maxOutputTokens: this.maxTokens,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE, // Allow medical content in document text
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    let rawOutput: string;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini extraction timeout after ${this.timeoutMs}ms`)),
          this.timeoutMs,
        ),
      );

      const result = await Promise.race([
        model.generateContent(this.buildUserPrompt(documentText)),
        timeoutPromise,
      ]);

      rawOutput = result.response.text();
    } catch (error) {
      this.logger.error(`[Gemini] Extraction failed for ${documentId}`, error as Error);
      throw new Error(`Gemini extraction failed: ${(error as Error).message}`);
    }

    this.logger.log(
      `[Gemini] Response received for ${documentId} in ${Date.now() - start}ms`,
    );

    return this.validateAndParse(rawOutput, documentId);
  }

  private validateAndParse(rawOutput: string, documentId: string): RootExtraction {
    let parsed: unknown;

    try {
      // Gemini sometimes wraps JSON in code fences — strip them
      const cleaned = rawOutput
        .replace(/^```json\s*/m, '')
        .replace(/^```\s*/m, '')
        .replace(/\s*```$/m, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(
        `Gemini returned non-JSON output for document ${documentId}. Extraction rejected.`,
      );
    }

    try {
      return RootExtractionSchema.parse(parsed);
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(
          `Gemini output failed schema validation for document ${documentId}: ${issues}`,
        );
      }
      throw error;
    }
  }

  private buildSystemPrompt(): string {
    return `You are a structured data extraction assistant specialized in hospital discharge documents.

CRITICAL SAFETY RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
1. You are extracting information FROM clinician-provided discharge instructions ONLY.
2. DO NOT provide medical advice.
3. DO NOT recommend medications.
4. DO NOT infer or invent doses, frequencies, or durations not explicitly stated in the document.
5. DO NOT normalize away clinically meaningful uncertainty.
6. If a value is unclear, ambiguous, or missing: set value to null, isUncertain to true, and explain uncertaintyReason.
7. PRESERVE original source wording in the sourceText field.
8. INCLUDE page numbers where information was found.
9. DO NOT add instructions that are not in the document.
10. DO NOT translate medical abbreviations into instructions (e.g., do not expand "PRN" into "take when needed").
11. Return ONLY the JSON matching the provided schema. No prose, no explanations outside the JSON.
12. NEVER hallucinate clinical values. Missing information must be null.
13. ONLY extract what is explicitly stated. General medical knowledge must NOT fill gaps.

You are extracting, not advising. Every field must cite its source in the document.`;
  }

  private buildUserPrompt(documentText: string): string {
    return `Extract structured information from the following discharge document text.

Return a JSON object matching this exact schema:

{
  "schemaVersion": "1.0",
  "extractionConfidence": <0.0-1.0 overall confidence>,
  "documentType": "<type or null>",
  "surgeryType": "<type or null>",
  "surgeryDate": { "value": "<ISO date or null>", "sourceText": "<exact text>", "page": <n>, "boundingBox": null, "confidence": <0-1>, "isUncertain": false },
  "dischargeDate": { ... same structure ... },
  "clinicianName": { ... },
  "hospitalName": { ... },
  "medicines": [
    {
      "name": { "value": "<name>", "sourceText": "<exact>", "page": <n>, "boundingBox": null, "confidence": <0-1>, "isUncertain": false },
      "dose": { ... },
      "doseUnit": { "value": "<mg/ml/etc or null>", ... },
      "frequency": { "value": "<frequency or null>", ... },
      "timing": { "value": "<timing or null>", ... },
      "duration": { "value": "<duration or null>", ... },
      "instructions": { "value": "<instructions or null>", ... },
      "asNeeded": false
    }
  ],
  "followUps": [
    { "type": { ... }, "date": { ... }, "clinician": { ... }, "purpose": { ... } }
  ],
  "tests": [
    { "name": { ... }, "timing": { ... } }
  ],
  "restrictions": [
    { "restriction": { ... } }
  ],
  "diet": [
    { "instruction": { ... } }
  ],
  "hydration": [
    { "instruction": { ... } }
  ],
  "tasks": [
    { "task": { ... } }
  ],
  "symptoms": [
    { "symptom": { ... }, "threshold": { ... } }
  ],
  "redFlags": [
    { "sign": { ... }, "action": { ... } }
  ],
  "conditionalInstructions": [
    { "instruction": { ... } }
  ],
  "extractionNotes": "<any notes about document quality, ambiguity, or missing information>"
}

IMPORTANT: Use null for any value not explicitly stated in the document.
Set isUncertain=true and explain uncertaintyReason for any ambiguous value.
NEVER use general medical knowledge to fill in missing values.

DISCHARGE DOCUMENT TEXT:
${documentText}`;
  }
}
