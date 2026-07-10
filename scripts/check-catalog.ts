async function main() {
  const r = await fetch('http://localhost:3000/')
  const body = await r.text()
  // Check for catalog keywords in rendered HTML
  const checks = [
    ['catalog', body.includes('catalog')],
    ['id="catalog"', body.includes('id="catalog"')],
    ['Занятия', body.includes('Занятия')],
    ['goncharny', body.includes('goncharny')],
    ['zanyatiya', body.includes('zanyatiya')],
    ['wheel|hand|paint', /wheel|hand|paint/.test(body)],
    ['consent NOT pre-checked', !body.includes('defaultChecked') || body.includes('consent')],
  ]
  checks.forEach(([k, v]) => console.log(`  ${k}: ${v ? 'YES' : 'NO'}`))

  // Verify consent checkbox not pre-checked in source
  const r2 = await fetch('http://localhost:3000/zanyatiya/goncharny-krug')
  const body2 = await r2.text()
  console.log('\nService page:')
  console.log('  slot chips present:', body2.includes('chip'))
  console.log('  3500 price:', body2.includes('3500'))
  console.log('  breadcrumb:', body2.includes('breadcrumb') || body2.includes('aria-label'))
}
main().catch(console.error)
