import type { EventStatus } from '~~/server/services/db'

type DisplayableStatus = Exclude<EventStatus, 'EventScheduled'>
type EventStatusDetails = { color: string, title: string, label: string, faded?: boolean }

/**
 * Theme color (configurable by admins), description and one word label of an event status,
 * `faded` when the shown date is not valid anymore, undefined for scheduled events
 */
export function useEventStatus() {
  const { t } = useI18n()

  const statusMap = computed<Record<DisplayableStatus, EventStatusDetails>>(() => ({
    EventCancelled: { color: 'error', title: t('event.cancelled'), label: t('event.status_cancelled'), faded: true },
    EventPostponed: { color: 'warning', title: t('event.postponed'), label: t('event.status_postponed'), faded: true },
    EventRescheduled: { color: 'warning', title: t('event.rescheduled'), label: t('event.status_rescheduled') },
    EventMovedOnline: { color: 'info', title: t('event.moved_online'), label: t('event.status_moved_online') },
    EventTentative: { color: 'info', title: t('event.tentative'), label: t('event.status_tentative') }
  }))

  return (status?: EventStatus) => status && status !== 'EventScheduled' ? statusMap.value[status] : undefined
}
