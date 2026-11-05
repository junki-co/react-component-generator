export const MAX_PROMPT_LENGTH = 500;

export interface PromptValidation {
  valid: boolean;
  length: number;
  error?: string;
}

/** 프롬프트 길이를 검증한다. 앞뒤 공백은 제외하고 센다. */
export function validatePrompt(prompt: string): PromptValidation {
  const length = prompt.trim().length;
  if (length > MAX_PROMPT_LENGTH) {
    return { valid: false, length, error: `프롬프트는 ${MAX_PROMPT_LENGTH}자 이하여야 합니다.` };
  }
  return { valid: true, length };
}
