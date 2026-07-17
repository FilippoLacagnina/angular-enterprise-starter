import { defineSummaryStreamFlow, type SummaryStreamFlow } from './summary-stream.flow';
import { defineSummaryFlow, type SummaryFlow } from './summary.flow';
import { createAiRuntime, type AiRuntime } from '../../ai.runtime';
import type { EnabledAiServerConfig } from '../../config/ai-server.config';

export interface AiSummaryRuntime extends AiRuntime {
  summarizeFlow: SummaryFlow;
  summarizeStreamFlow: SummaryStreamFlow;
}

export function createAiSummaryRuntime(config: EnabledAiServerConfig): AiSummaryRuntime {
  const runtime = createAiRuntime(config);

  return {
    ...runtime,
    summarizeFlow: defineSummaryFlow(runtime.ai, runtime.providers.getDefault('structuredOutput')),
    summarizeStreamFlow: defineSummaryStreamFlow(
      runtime.ai,
      runtime.providers.getDefault('textStreaming'),
    ),
  };
}
