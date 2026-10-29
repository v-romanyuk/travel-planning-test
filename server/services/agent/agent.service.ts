import { ChatAnthropic } from '@langchain/anthropic'
import type { BaseMessage } from '@langchain/core/messages'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { createDeepAgent, registerHarnessProfile } from 'deepagents'
import type { z } from 'zod'

interface IRunAgentArgs {
  threadId: string
  message: string
  systemPrompt: string
  tools: StructuredToolInterface[]
  signal: AbortSignal
  // Continue the thread from its last checkpoint (after a crash) instead of starting it with `message`
  resume: boolean
}

interface ICompileRuleArgs<T extends z.ZodType> {
  systemPrompt: string
  message: string
  schema: T
  name: string
}

// Checkpoint tables live in their own schema so they never collide with Drizzle-managed tables/migrations.
const CHECKPOINT_SCHEMA = 'langgraph'

// The planner only gets our tools: no virtual filesystem (it could stash invented facts there) and no sub-agents
// (they would get the same tools without the run's bookkeeping). Exclusions apply to the profile of the model in use.
const BUILT_IN_TOOLS_OFF = ['ls', 'read_file', 'write_file', 'edit_file', 'delete', 'glob', 'grep', 'execute', 'task']

const MAX_AGENT_STEPS = 60

let checkpointerPromise: Promise<PostgresSaver> | undefined
const profiledModels = new Set<string>()

const getCheckpointer = () => {
  checkpointerPromise ??= (async () => {
    // Shares the Drizzle pool instead of opening its own
    const checkpointer = new PostgresSaver(useDrizzle().$client, undefined, { schema: CHECKPOINT_SCHEMA })
    await checkpointer.setup()

    return checkpointer
  })().catch((error: unknown) => {
    checkpointerPromise = undefined
    throw error
  })

  return checkpointerPromise
}

const restrictHarness = (model: string) => {
  if (profiledModels.has(model)) return

  registerHarnessProfile(`anthropic:${model}`, {
    excludedTools: BUILT_IN_TOOLS_OFF,
    generalPurposeSubagent: { enabled: false }
  })
  profiledModels.add(model)
}

const buildAgent = async ({ systemPrompt, tools }: Pick<IRunAgentArgs, 'systemPrompt' | 'tools'>) => {
  const { anthropicApiKey, agentModel } = useRuntimeConfig()
  restrictHarness(agentModel)

  return createDeepAgent({
    model: new ChatAnthropic({ apiKey: anthropicApiKey, model: agentModel }),
    tools,
    systemPrompt,
    checkpointer: await getCheckpointer()
  })
}

export function useAgentService () {
  async function runAgent ({ threadId, message, systemPrompt, tools, signal, resume }: IRunAgentArgs): Promise<BaseMessage[]> {
    const config = { configurable: { thread_id: threadId }, signal, recursionLimit: MAX_AGENT_STEPS }
    const [agent, checkpoint] = await Promise.all([
      buildAgent({ systemPrompt, tools }),
      resume ? getCheckpointer().then(c => c.getTuple(config)) : undefined
    ])

    // `null` input continues the graph from the thread's last checkpoint
    const result = checkpoint
      ? await agent.invoke(null, config)
      : await agent.invoke({ messages: [{ role: 'user', content: message }] }, config)

    return result.messages
  }

  // One structured-output call on the fast model; no tools, no checkpoint
  async function compileRule<T extends z.ZodType> (args: ICompileRuleArgs<T>): Promise<z.infer<T>> {
    const { systemPrompt, message, schema, name } = args
    const { anthropicApiKey, ruleModel } = useRuntimeConfig()
    const model = new ChatAnthropic({ apiKey: anthropicApiKey, model: ruleModel, maxRetries: 1 })
      .withStructuredOutput(schema, { name })

    return await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ], { signal: AbortSignal.timeout(20_000) }) as z.infer<T>
  }

  return { runAgent, compileRule }
}
