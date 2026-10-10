/** A4 in millimetres, with a small page margin. */
const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const MARGIN_MM = 8
/** Sharper text in the PDF than the on-screen pixel ratio. */
const RENDER_SCALE = 2

/**
 * Renders the printed invoice (`.print-area`) to an A4 PDF. The browser lays
 * the text out (Arabic shaping, right-to-left) and the result is placed on
 * the page as an image, split over pages when it is taller than one. The
 * libraries load only when someone saves a PDF.
 */
export async function renderInvoicePdf(element: HTMLElement): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])
  await document.fonts.ready
  const canvas = await html2canvas(element, {
    scale: RENDER_SCALE,
    backgroundColor: '#ffffff',
    // html2canvas draws text with letter-spacing one glyph at a time, which
    // breaks Arabic joining; the copy used for drawing gets none.
    onclone: (clonedDocument) => {
      clonedDocument
        .querySelectorAll<HTMLElement>('.print-area, .print-area *')
        .forEach((el) => {
          el.style.letterSpacing = 'normal'
        })
    },
  })

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const contentWidth = PAGE_WIDTH_MM - MARGIN_MM * 2
  const contentHeight = PAGE_HEIGHT_MM - MARGIN_MM * 2
  // One page's worth of source pixels at the page's scale.
  const pxPerMm = canvas.width / contentWidth
  const sliceHeightPx = Math.floor(contentHeight * pxPerMm)

  for (let y = 0, page = 0; y < canvas.height; y += sliceHeightPx, page++) {
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = Math.min(sliceHeightPx, canvas.height - y)
    slice
      .getContext('2d')
      ?.drawImage(
        canvas,
        0,
        y,
        canvas.width,
        slice.height,
        0,
        0,
        canvas.width,
        slice.height
      )
    if (page > 0) pdf.addPage()
    pdf.addImage(
      slice.toDataURL('image/jpeg', 0.92),
      'JPEG',
      MARGIN_MM,
      MARGIN_MM,
      contentWidth,
      slice.height / pxPerMm
    )
  }
  return pdf.output('blob')
}
