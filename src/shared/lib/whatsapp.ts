/** Builds a wa.me deep link with a prefilled message. Digits only for the phone. */
export function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
