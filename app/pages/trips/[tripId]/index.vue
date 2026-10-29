<script lang="ts" setup>
const { tripId } = useRoute('trips-tripId').params
const tripStore = useTripStore()

// Rendered only once the trip page has loaded the trip: planning → conversation, ready/failed → plan
await navigateTo({
  name: tripStore.isPlanning ? 'trips-tripId-conversation' : 'trips-tripId-plan',
  params: { tripId }
}, { replace: true })
</script>
