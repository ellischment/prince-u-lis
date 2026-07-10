/**
 * Full verification script for stages 2+3 checklist
 */
import { db } from '../src/lib/db'

const BASE = 'http://localhost:3000'

async function get(path: string) {
  const r = await fetch(`${BASE}${path}`)
  return { status: r.status, body: await r.text() }
}

async function main() {
  console.log('\n=== PUNKT 2: CLIENT PATH ===\n')

  // Homepage
  const home = await get('/')
  console.log(`GET / -> ${home.status}`)
  console.log(
    `  Fox scene:      ${home.body.includes('f3-') || home.body.includes('FoxScene') ? 'YES' : 'NO'}`,
  )
  console.log(
    `  Stars (.sky):   ${home.body.includes('sky') || home.body.includes('fx-star') ? 'YES' : 'NO'}`,
  )
  console.log(`  Hero section:   ${home.body.includes('hero') ? 'YES' : 'NO'}`)
  console.log(`  Catalog:        ${home.body.includes('catalog') ? 'YES' : 'NO'}`)
  console.log(`  Booking form:   ${home.body.includes('booking') ? 'YES' : 'NO'}`)
  console.log(`  JSON-LD:        ${home.body.includes('LocalBusiness') ? 'YES' : 'NO'}`)
  console.log(`  FAQ schema:     ${home.body.includes('FAQPage') ? 'YES' : 'NO'}`)

  // Service page
  const svc = await get('/zanyatiya/goncharny-krug')
  console.log(`\nGET /zanyatiya/goncharny-krug -> ${svc.status}`)
  console.log(`  Price 3500:     ${svc.body.includes('3500') ? 'YES' : 'NO'}`)
  console.log(`  Chip (slot):    ${svc.body.includes('chip') ? 'YES' : 'NO'}`)
  console.log(`  Booking form:   ${svc.body.includes('booking') ? 'YES' : 'NO'}`)

  // Slots API
  const slots = await get('/api/slots?serviceId=all')
  console.log(`\nGET /api/slots?serviceId=all -> ${slots.status}`)
  if (slots.status === 200) {
    const data = JSON.parse(slots.body)
    console.log(`  Slots returned: ${Array.isArray(data) ? data.length : 'N/A'}`)
  }

  // Services API
  const svcs = await get('/api/services')
  console.log(`\nGET /api/services -> ${svcs.status}`)
  if (svcs.status === 200) {
    const data = JSON.parse(svcs.body)
    console.log(`  Services count: ${Array.isArray(data) ? data.length : 'N/A'}`)
  }

  console.log('\n=== PUNKT 3: ADMIN PANEL ===\n')

  // Admin login page
  const login = await get('/admin/login')
  console.log(`GET /admin/login -> ${login.status}`)
  console.log(
    `  Form present:   ${login.body.includes('form') || login.body.includes('email') ? 'YES' : 'NO'}`,
  )

  // Admin redirect without auth
  const bookingsResp = await fetch(`${BASE}/admin/bookings`, { redirect: 'manual' })
  console.log(`GET /admin/bookings (no auth) -> ${bookingsResp.status} (expected 307)`)
  console.log(`  Redirect to:    ${bookingsResp.headers.get('location') || 'none'}`)

  // Admin dashboard via API (no auth, should 401)
  const adminApi = await fetch(`${BASE}/api/admin/bookings`, { redirect: 'manual' })
  console.log(`GET /api/admin/bookings (no auth) -> ${adminApi.status} (expected 307 or 401)`)

  console.log('\n=== PUNKT 5: LEGAL (consent + booking API) ===\n')

  // Clean up previous test data
  await db.consent.deleteMany({ where: { client: { phone: '+79998887766' } } })
  await db.booking.deleteMany({ where: { client: { phone: '+79998887766' } } })
  await db.client.deleteMany({ where: { phone: '+79998887766' } })

  // Get a real future slot
  const futureSlot = await db.slot.findFirst({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
  })
  console.log(
    `Future slot found: ${futureSlot ? `${futureSlot.id} @ ${futureSlot.startsAt.toISOString()}` : 'NONE'}`,
  )

  if (futureSlot) {
    const bookingPayload = {
      slotId: futureSlot.id,
      name: 'Test Vasilisa',
      phone: '+79998887766',
      contactChannel: 'tg',
      tgUsername: 'testuser',
      consentVersion: '1.0',
    }

    const bookResp = await fetch(`${BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload),
    })
    const bookData = await bookResp.json()
    console.log(`POST /api/bookings -> ${bookResp.status}`)
    console.log(`  Response: ${JSON.stringify(bookData).slice(0, 120)}`)

    if (bookResp.status === 201 || bookResp.status === 200) {
      // Check consent record in DB
      const consent = await db.consent.findFirst({
        where: { client: { phone: '+79998887766' } },
        include: { client: true },
      })
      console.log(`\nConsent record in DB:`)
      if (consent) {
        console.log(`  clientId:      ${consent.clientId}`)
        console.log(`  docVersion:    ${consent.docVersion}`)
        console.log(`  acceptedAt:    ${consent.acceptedAt.toISOString()}`)
        console.log(`  ip recorded:   ${consent.ip ? `YES (${consent.ip})` : 'NO (null)'}`)
      } else {
        console.log('  NOT FOUND')
      }
    }
  }

  // Consent checkbox check (code-level, can't click)
  console.log(`\nConsent checkbox (code review):`)
  console.log(
    `  Pre-checked: NO (verified in BookingForm: defaultChecked not set, controlled by state)`,
  )

  console.log('\n=== PUNKT 4: INTEGRATIONS ===\n')
  console.log('  Google Sheets:     NOT CONNECTED (stage 4+)')
  console.log('  Telegram bot:      NOT CONFIGURED (stage 4+)')
  console.log('  Email (SMTP):      NOT CONFIGURED (stage 3+)')

  console.log('\n=== DB STATS ===\n')
  const userCount = await db.user.count()
  const serviceCount = await db.service.count()
  const slotCount = await db.slot.count({ where: { startsAt: { gte: new Date() } } })
  const bookingCount = await db.booking.count()
  console.log(`  Users:    ${userCount}`)
  console.log(`  Services: ${serviceCount}`)
  console.log(`  Slots (future): ${slotCount}`)
  console.log(`  Bookings: ${bookingCount}`)

  // Cleanup test data
  await db.consent.deleteMany({ where: { client: { phone: '+79998887766' } } })
  await db.booking.deleteMany({ where: { client: { phone: '+79998887766' } } })
  await db.client.deleteMany({ where: { phone: '+79998887766' } })
  console.log('\nTest data cleaned up.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
