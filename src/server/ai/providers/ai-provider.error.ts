export type AiProviderErrorKind =
  | 'authentication'
  | 'invalid_request'
  | 'invalid_response'
  | 'model_unavailable'
  | 'rate_limited'
  | 'temporarily_unavailable'
  | 'unknown';

export class AiProviderError extends Error {
  constructor(
    readonly providerId: string,
    readonly kind: AiProviderErrorKind,
  ) {
    super('The AI provider request failed.');
    this.name = 'AiProviderError';
  }
}
