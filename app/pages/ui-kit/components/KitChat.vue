<template>
  <KitSection title="Conversation">
    <template #description>
      The planner answers straight away, then works in the background. A failed run says it failed and names
      nothing it couldn't confirm.
    </template>

    <div class="flex flex-col gap-3.5 p-6 rounded-2xl bg-default border border-default">
      <ChatBubble from="traveller">
        Plan a trip from Warsaw to Lisbon, 12 Nov 2026 to 15 Nov 2026, for Olena and Taras.
      </ChatBubble>

      <ChatBubble from="agent">
        <p>Got it. I'm planning your trip to Lisbon now and will message you on WhatsApp when it's ready.</p>
        <p class="font-semibold">
          I won't book or pay for anything while you're away.
        </p>
      </ChatBubble>

      <PlanningStatus />

      <ChatBubble from="agent">
        <PlanningTrail compact class="my-1.5 ml-1.5" />
        <p>Planning in the background. You can close this page.</p>
      </ChatBubble>

      <PlanningTrail class="self-center my-6" />

      <ChatBubble from="agent">
        <p>Your plan is ready. It uses only places from the catalogue and respects the rules in your profile.</p>
        <UButton>Open the plan</UButton>
      </ChatBubble>

      <ChatBubble from="agent" failed>
        <p class="font-semibold text-error">
          Planning failed.
        </p>
        <p>
          The catalogue has no stays in Lisbon for these dates that meet your rules, so I didn't write a plan.
          Nothing was booked or charged.
        </p>
        <UButton color="error" variant="outline">
          Try again
        </UButton>
      </ChatBubble>
    </div>
  </KitSection>
</template>
