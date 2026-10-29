<template>
  <section
    aria-labelledby="conversation-title"
    class="flex flex-col gap-4.5 p-6 rounded-2xl bg-default border border-default min-w-0"
  >
    <h2 id="conversation-title" class="font-display font-bold text-[22px] text-highlighted">
      Conversation
    </h2>

    <ol class="flex flex-col gap-3.5" aria-live="polite">
      <li
        v-for="(message, index) in trip.messages"
        :key="message.id"
        class="flex flex-col"
      >
        <ChatBubble
          :from="message.author"
          :failed="message.kind === EMessageKind.FAILED"
        >
          <p class="whitespace-pre-line break-words">
            {{ message.body }}
          </p>

          <template v-if="index === trip.messages.length - 1">
            <UButton
              v-if="trip.status === ETripStatus.READY && message.kind === EMessageKind.READY"
              :to="{ name: 'trips-tripId-plan', params: { tripId: trip.id } }"
            >
              Open the plan
            </UButton>
            <UButton
              v-else-if="trip.status === ETripStatus.FAILED && message.kind === EMessageKind.FAILED"
              color="error"
              variant="outline"
              :loading="replanning"
              @click="replanNow"
            >
              Try again
            </UButton>
          </template>
        </ChatBubble>
      </li>
    </ol>

    <div v-if="trip.status === ETripStatus.PLANNING" role="status" class="flex flex-col">
      <ChatBubble from="agent">
        <PlanningTrail compact class="my-1.5 ml-1.5" />
        <p>Planning in the background. You can close this page.</p>
      </ChatBubble>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { TTripRes } from '~~/shared/schemas/trips/TripResSchema'
import { EMessageKind } from '~~/shared/schemas/trips/MessageKind'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

defineProps<{
  trip: TTripRes
}>()

const { replanning, replanNow } = useReplan()
</script>
