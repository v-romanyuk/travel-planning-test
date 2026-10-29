# Services

Services wrap external providers (Twilio, Deep Agents + the model provider, Supabase Auth admin, geocoding) behind small adapters. Provider-agnostic params, no business logic inside.

## Folder Structure

```
server/services/
├── drizzle/
│   └── schema.ts                # DB schema (Drizzle table definitions)
├── twilio/
│   └── twilio.service.ts        # isConfigured, sendWhatsAppMessage (plain REST via $fetch, no SDK)
├── queue/
│   └── queue.service.ts         # pg-boss: plan-trip queue + dead-letter queue, boot-recovery helpers
└── agent/
    └── agent.service.ts         # runAgent (Deep Agent) + compileRule (structured output on the fast model)
```

## Pattern

```ts
// server/services/agent/agent.service.ts (illustrative — planned)
import { createDeepAgent } from 'deepagents'

export function useAgentService () {
  async function runPlanningAgent ({ tools, systemPrompt, messages }: IRunPlanningAgentArgs) {
    const agent = createDeepAgent({ model, tools, systemPrompt })
    return agent.invoke({ messages })
  }

  return { runPlanningAgent }
}
```

`server/services/agent/agent.service.ts`: `runAgent` builds a Deep Agent on `ChatAnthropic` (`agentModel`) with a `PostgresSaver` checkpointer keyed by `thread_id`, takes an abort signal, can resume a thread from its checkpoint, and registers a harness profile that removes the built-in filesystem and `task` (sub-agent) tools — the agent sees only the tools the controller passes. `compileRule` is one structured-output call on `ruleModel`. The checkpointer owns its tables in the `langgraph` schema and creates them itself via `setup()` on first use — they are not Drizzle-managed and get no migrations. Look up the `deepagents` and Twilio APIs via Context7 before changing either service.

## Rules

- Services own the 3rd-party SDK / HTTP details. Consumers (controllers) never see the underlying API shape
- Services accept and return plain typed objects, not framework objects (no H3 `event`, no Drizzle results). One exception: `supabase-auth-admin` takes the `event`, because `serverSupabaseServiceRole(event)` needs it — it still returns plain objects and maps provider errors (`email_exists` → 409)
- Services are stateless. Read config via `useRuntimeConfig()` inside the factory
- DB operations belong in repos, not services. The Drizzle schema is the one exception — it lives under `services/drizzle/` because it's "infrastructure config" rather than business logic
- **The agent service never touches the DB.** Its tools (read knowledge graph, search catalogue, write plan) are built by the controller over repos and passed in. That keeps every fact the agent cites traceable to a repo read
- No tool may book, reserve, pay, or contact a provider — the catalogue is fixture data and nothing leaves the system except the WhatsApp message
- No business logic — the Twilio service sends a message, but it does NOT decide whether the traveller opted in or what the text says. The agent service runs the agent, but the system prompt's rules (grounding, constraints vs preferences, no invented preferences) and the decision of `ready` vs `failed` belong to the controller
- Never log prompts, model output, phone numbers or message bodies — log trip ids and provider ids/status codes only
- If an inbound webhook is ever added, its signature verification belongs in the provider's service, not in the route handler

## Twilio

`server/services/twilio/twilio.service.ts` is one form-encoded `POST` to the Messages API (Basic auth, 10 s timeout,
`retry: false`, `whatsapp:` prefixes added). It throws `TwilioSendError` whose `ref` is the Twilio error code, `timeout`,
`network` or `http_<status>` — never the provider message, which can echo the number. `isConfigured()` is false unless
SID, token and sender are all set, so local dev runs without an account. Opt-in, text and retries are the caller's
(`server/controllers/shared/planning/onRunFinished.ts`).

## Geocoding

`server/services/geocoding/geocoding.service.ts` wraps the Open-Meteo Geocoding API (GeoNames data, free, no key). `searchCities` returns `TCity` (`shared/schemas/cities/CitySchema.ts`) — populated places only, with a ready `label` ("Lisbon, Lisbon District, Portugal"). Exposed as public `GET /api/cities?query=` because signup needs it before a session exists. Store the whole `TCity` (jsonb) rather than just the name: the agent needs country and coordinates for transport.
