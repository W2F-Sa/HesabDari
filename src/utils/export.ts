import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { downloadFile } from './helpers'

/**
 * خروجی PDF از یک عنصر DOM (مناسب متن فارسی چون به‌صورت تصویر رندر می‌شود).
 */
export async function exportElementToPDF(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })
  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }
  pdf.save(filename)
}

/**
 * خروجی Word از HTML (فایل .doc که توسط Word باز می‌شود و فارسی را پشتیبانی می‌کند).
 */
export function exportHTMLToWord(innerHTML: string, filename: string) {
  const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40" lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>فاکتور</title>
  <style>
    @page { size: A4; margin: 1.5cm; }
    body { font-family: 'Tahoma', 'Vazirmatn', sans-serif; direction: rtl; color: #111; font-size: 12pt; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #888; padding: 6px 8px; text-align: right; font-size: 10pt; }
    th { background: #eef2ff; }
    h1, h2, h3 { margin: 4px 0; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .totals td { border: none; }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .muted { color: #555; font-size: 9pt; }
  </style>
</head>
<body dir="rtl">${innerHTML}</body>
</html>`
  downloadFile('\ufeff' + html, filename, 'application/msword')
}

export function printElement() {
  window.print()
}
