async function main() {
  for (const path of ['/', '/admin/login', '/zanyatiya/goncharny-krug']) {
    const r = await fetch(`http://localhost:3000${path}`)
    const body = await r.text()
    console.log(`\n=== ${path} -> ${r.status} ===`)
    // find error text
    const match = body.match(/"message":"([^"]{0,300})"/)
    if (match) console.log('message:', match[1])
    const match2 = body.match(/Error: ([^\n<]{0,300})/)
    if (match2) console.log('Error:', match2[1])
    if (!match && !match2) console.log('body[:400]:', body.slice(0, 400))
  }
}
main().catch(console.error)
