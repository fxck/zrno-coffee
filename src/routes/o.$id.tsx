import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getOrderPublic,
  markOrderDelivered,
  type PublicOrder,
} from '../lib/server/orders'
import { Wordmark } from '../components/bean-mark'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { OrderStatus, fmtDateTime } from '../components/admin-bits'

export const Route = createFileRoute('/o/$id')({
  loader: async ({ params }) => getOrderPublic({ data: params.id }),
  component: OrderView,
})

function OrderView() {
  const data = Route.useLoaderData()
  const { id } = Route.useParams()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function deliver() {
    setBusy(true)
    await markOrderDelivered({ data: { id } })
    setBusy(false)
    router.invalidate()
  }

  return (
    <div className="min-h-screen bg-espresso text-cream font-body flex flex-col">
      <header className="px-6 md:px-14 py-5 border-b border-muted/15">
        <Link to="/" aria-label="ZRNO home">
          <Wordmark className="text-2xl text-cream" />
        </Link>
      </header>

      <main className="flex-1 px-6 md:px-14 py-12 md:py-16 max-w-2xl w-full mx-auto">
        {!data.found ? (
          <div>
            <div className="font-mono text-xs tracking-[0.2em] text-amber">ORDER</div>
            <h1 className="font-display t-md mt-3">NOT FOUND</h1>
            <p className="text-taupe mt-5 leading-relaxed">
              We couldn’t find an order with this reference. Check the link and
              try again.
            </p>
            <Link to="/" className="inline-block mt-8">
              <Button variant="outline">Back to site</Button>
            </Link>
          </div>
        ) : (
          <Receipt
            order={data.order}
            isAdmin={data.isAdmin}
            busy={busy}
            onDeliver={deliver}
          />
        )}
      </main>
    </div>
  )
}

function Receipt({
  order,
  isAdmin,
  busy,
  onDeliver,
}: {
  order: PublicOrder
  isAdmin: boolean
  busy: boolean
  onDeliver: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-xs tracking-[0.2em] text-amber">
          ORDER #{order.id.slice(0, 8)}
        </div>
        <OrderStatus status={order.status} deliveredAt={order.delivered_at} />
      </div>

      <h1 className="font-display t-md mt-3">
        {order.delivered_at ? 'DELIVERED.' : 'YOUR ORDER.'}
      </h1>

      <p className="text-taupe mt-4 leading-relaxed">
        Placed by{' '}
        <span className="text-cream">{order.customer_name}</span> on{' '}
        {fmtDateTime(order.created_at)}.
        {order.delivered_at && (
          <>
            {' '}
            Marked delivered {fmtDateTime(order.delivered_at)}.
          </>
        )}
      </p>

      {/* Line items */}
      <div className="mt-10 border-t border-muted/20">
        {order.items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between gap-4 border-b border-muted/10 py-4"
          >
            <div className="min-w-0">
              <div className="text-cream">{it.name}</div>
              <div className="text-[11px] text-muted mt-0.5 tabular-nums">
                {it.qty} × {it.price} Kč
              </div>
            </div>
            <div className="font-mono text-sm text-taupe tabular-nums whitespace-nowrap">
              {it.qty * it.price} Kč
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between mt-6">
        <span className="font-mono text-[11px] tracking-[0.2em] text-taupe">TOTAL</span>
        <span className="font-display text-3xl text-amber tabular-nums">
          {order.total} Kč
        </span>
      </div>

      {/* Admin-only fulfilment control (shown when a logged-in admin opens
          this link — e.g. by scanning the QR on the customer's receipt). */}
      {isAdmin && (
        <div className="mt-12 border border-amber/25 bg-elevated/50 p-5 md:p-6">
          <div className="font-mono text-[11px] tracking-[0.2em] text-amber">
            BACK OFFICE
          </div>
          {order.delivered_at ? (
            <div className="mt-3 flex items-center gap-3">
              <Badge variant="delivered">delivered</Badge>
              <span className="text-sm text-taupe">
                {fmtDateTime(order.delivered_at)}
              </span>
            </div>
          ) : (
            <>
              <p className="text-taupe text-sm mt-2 leading-relaxed">
                Mark this order as handed to the customer.
              </p>
              <Button className="mt-4" disabled={busy} onClick={onDeliver}>
                {busy ? 'Marking…' : 'Mark delivered'}
              </Button>
            </>
          )}
        </div>
      )}

      <Link to="/" className="inline-block mt-10">
        <Button variant="outline">Back to site</Button>
      </Link>
    </div>
  )
}
