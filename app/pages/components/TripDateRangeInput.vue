<template>
  <UPopover v-model:open="open" :content="{ align: 'start' }">
    <UButton
      color="neutral"
      variant="outline"
      size="xl"
      icon="icon:calendar"
      block
      class="justify-start font-normal"
      :ui="{ leadingIcon: 'text-dimmed' }"
      :aria-label="label ? `Trip dates: ${label}` : 'Choose trip dates'"
    >
      <span v-if="label" class="truncate text-highlighted">{{ label }}</span>
      <span v-else class="truncate text-dimmed">Start date — End date</span>
    </UButton>

    <template #content>
      <UCalendar
        v-model="range"
        range
        :numberOfMonths="isWide ? 2 : 1"
        :minValue="minValue"
        :maxValue="maxValue"
        class="p-2"
        @update:model-value="onPick"
      />
    </template>
  </UPopover>
</template>

<script lang="ts" setup>
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import dayjs from 'dayjs'

import { MAX_TRIP_DAYS } from '~~/shared/constants/trips'

interface IRange {
  start: DateValue | undefined
  end: DateValue | undefined
}

// ISO dates (YYYY-MM-DD), '' when empty — the shape the request schema takes
const start = defineModel<string>('start', { required: true })
const end = defineModel<string>('end', { required: true })

const open = ref(false)
const isWide = useMediaQuery('(min-width: 640px)')
const minValue = today(getLocalTimeZone())

// The calendar's own selection: the first click picks a start, the second the end, then the form gets both
const range = shallowRef<IRange | null>(null)

// While only a start is picked, days past the longest trip can't be the end
const maxValue = computed(() => range.value?.start && !range.value.end
  ? range.value.start.add({ days: MAX_TRIP_DAYS - 1 })
  : undefined)

const label = computed(() => {
  if (!start.value || !end.value) return ''
  const days = dayjs(end.value).diff(start.value, 'day') + 1

  return `${dayjs(start.value).format('ddd D MMM')} — ${dayjs(end.value).format('ddd D MMM YYYY')} · ${days} ${days === 1 ? 'day' : 'days'}`
})

watch(open, (isOpen) => {
  if (isOpen) range.value = start.value && end.value ? { start: parseDate(start.value), end: parseDate(end.value) } : null
})

// The calendar's own event, not a watch on `range`: opening the popover loads the saved dates into `range`,
// and a watch would take that for a pick and close the popover straight away
function onPick (value: IRange | null | undefined) {
  if (!value?.start || !value.end) return
  start.value = value.start.toString()
  end.value = value.end.toString()
  open.value = false
}
</script>
