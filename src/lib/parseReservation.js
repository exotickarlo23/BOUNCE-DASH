export function parseReservationText(text) {
  const lines = text.trim().split('\n')
  const data = {}

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':')
    if (!key || valueParts.length === 0) continue
    const k = key.trim().toLowerCase()
    const v = valueParts.join(':').trim()

    if (k.includes('ime') && k.includes('prezime')) data.name = v
    else if (k.includes('ime') && !k.includes('prezime')) data.name = v
    else if (k.includes('email')) data.email = v
    else if (k.includes('telefon') || k.includes('tel') || k.includes('mob')) data.phone = v
    else if (k.includes('napuhanac') || k.includes('model')) data.bouncer = v.toLowerCase()
    else if (k.includes('datum') || k.includes('date')) data.date = v
  }

  return data
}
