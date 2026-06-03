import { getMigrations } from 'better-auth/db/migration'
import { auth, authOptions } from './auth'
import { getPool } from './db'

// Run once per process, on the first DB-touching request. Idempotent:
// better-auth creates only missing tables; app tables use IF NOT EXISTS.
let done: Promise<void> | null = null

export function ensureDb(): Promise<void> {
  if (!done) {
    done = run().catch((e) => {
      done = null // allow retry on a later request if the DB was briefly down
      throw e
    })
  }
  return done
}

async function run() {
  const { runMigrations } = await getMigrations(authOptions)
  await runMigrations()

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `)
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_name text NOT NULL,
      email text NOT NULL,
      items jsonb NOT NULL,
      total integer NOT NULL,
      currency text NOT NULL DEFAULT 'CZK',
      status text NOT NULL DEFAULT 'pending',
      payment_provider text,
      payment_reference text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `)

  // Journal / blog posts. Admin-authored editorial content (Tiptap HTML).
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL DEFAULT 'Untitled',
      slug text UNIQUE NOT NULL,
      excerpt text NOT NULL DEFAULT '',
      content_html text NOT NULL DEFAULT '',
      cover_image_url text,
      status text NOT NULL DEFAULT 'draft',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      published_at timestamptz
    );
  `)

  await seedAdmin()
  await seedSamplePost()
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return
  const res = await getPool().query('SELECT 1 FROM "user" WHERE email = $1 LIMIT 1', [email])
  if (res.rowCount) return
  try {
    await auth.api.signUpEmail({ body: { email, password, name: 'ZRNO Admin' } })
    console.log('[seed] admin user created:', email)
  } catch (e) {
    console.error('[seed] admin create failed:', e)
  }
}

// One published sample post so the Journal isn't empty on a fresh DB.
// Guard: only inserts when the posts table has no rows.
async function seedSamplePost() {
  const res = await getPool().query('SELECT 1 FROM posts LIMIT 1')
  if (res.rowCount) return
  const content = `
    <p>There's a particular hour in Žižkov — just before the city fully wakes — when the
    roastery is at its most honest. The drum is up to temperature, the green beans are
    weighed, and the only thing left to do is listen.</p>
    <h2>Roasting is listening</h2>
    <p>We roast in small batches because small batches let us hear the coffee. First crack
    arrives like distant rain; second crack, if we ever let it come, like a fire taking
    hold. Most of our coffees we pull long before that — we want the fruit, the structure,
    the clarity of the origin, not the char of the roast.</p>
    <blockquote>Dark doesn't have to mean burnt. For us it means depth — a roast with a spine.</blockquote>
    <h3>What ends up in the bag</h3>
    <p>Every bag carries a date, a process, and a name. We think you deserve to know when
    your coffee was roasted, how it was grown, and who grew it. Anything less is just
    marketing.</p>
    <ul>
      <li>Roasted in Žižkov, Prague</li>
      <li>Small batches, every week</li>
      <li>Single origins and one stubborn house blend</li>
    </ul>
    <hr>
    <p>Pull up a stool. The next batch is nearly ready.</p>
  `
    .trim()
    .replace(/\s+/g, ' ')
  try {
    await getPool().query(
      `INSERT INTO posts(title, slug, excerpt, content_html, status, published_at)
       VALUES($1,$2,$3,$4,'published', now())`,
      [
        'On Roasting in the Dark',
        'on-roasting-in-the-dark',
        'A note from the drum, just before the city wakes — why we roast small, listen hard, and put a date on every bag.',
        content,
      ],
    )
    console.log('[seed] sample journal post created')
  } catch (e) {
    console.error('[seed] sample post create failed:', e)
  }
}
