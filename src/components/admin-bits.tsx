import { Badge } from './ui/badge'

/* Small shared bits used across the back-office pages. */

export function fmtDateTime(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/* Payment status + an extra "delivered" pill once an order is fulfilled. */
export function OrderStatus({
  status,
  deliveredAt,
}: {
  status: string
  deliveredAt: string | null
}) {
  const variant =
    status === 'paid' ? 'paid' : status === 'failed' ? 'failed' : 'pending'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={variant}>{status}</Badge>
      {deliveredAt && <Badge variant="delivered">delivered</Badge>}
    </div>
  )
}
