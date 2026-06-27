import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']

function buildTitle(trips, selectedWeek) {
    const dates = trips.map(t => t.Start_Date).filter(Boolean).sort()
    if (dates.length === 0) return `SEMANA #${selectedWeek}`

    const parseDate = (str) => {
        // Format: "2026-03-16 22:04"
        const parts = str.split(' ')[0].split('-')
        return { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) }
    }

    const first = parseDate(dates[0])
    const last  = parseDate(dates[dates.length - 1])
    const mes   = MESES[last.month - 1]

    return `SEMANA #${selectedWeek} PERIODO DEL ${first.day} AL ${last.day} de ${mes} DEL ${last.year}`
}

export async function exportToExcel(trips, selectedWeek) {
    // ── Filtrar trips válidos ──
    const validTrips = trips.filter(trip => {
        const driver = (trip.Driver || '').trim()
        const boleta = String(trip.Boleta || '').trim()
        return driver !== '' && boleta !== '' && boleta !== 'SIN_BOLETA'
    })

    // ── Agrupar por conductor ──
    const driverMap = {}
    validTrips.forEach(trip => {
        const driver = trip.Driver.trim().toUpperCase()
        if (!driverMap[driver]) driverMap[driver] = { totalPay: 0, boletas: [] }
        driverMap[driver].totalPay += parseFloat(trip.Total_Pay) || 0
        const boleta = trip.Boleta
        if (boleta && !driverMap[driver].boletas.includes(boleta)) {
            driverMap[driver].boletas.push(boleta)
        }
    })

    const drivers = Object.keys(driverMap).sort()
    const maxBoletas = Math.max(...drivers.map(d => driverMap[d].boletas.length), 8)
    const totalCols = 2 + maxBoletas

    // ── Workbook ──
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(`Semana ${selectedWeek}`)

    // Anchos de columna
    ws.getColumn(1).width = 38   // EMPLEADO
    ws.getColumn(2).width = 16   // VIAJES FORANEOS
    for (let c = 3; c <= totalCols; c++) ws.getColumn(c).width = 9

    // ─────────────────────────────────────────
    // FILA 1: Título
    // ─────────────────────────────────────────
    const title = buildTitle(validTrips, selectedWeek)
    ws.addRow([title])
    ws.mergeCells(1, 1, 1, totalCols)
    const titleCell = ws.getCell(1, 1)
    titleCell.value = title
    titleCell.style = {
        font: { bold: true, size: 13, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    }
    ws.getRow(1).height = 26

    // ─────────────────────────────────────────
    // FILA 2: Encabezados de columna
    // ─────────────────────────────────────────
    // Fila 2a: segunda fila de encabezado (EMPLEADO | VIAJES FORANEOS | NO. DE REPORTE...)
    // Usamos dos filas mergeadas verticalmente para EMPLEADO y VIAJES FORANEOS
    // y la fila 2 horizontal para NO. DE REPORTE

    // Fila 2 — labels superiores
    const hRow1Data = ['EMPLEADO', 'VIAJES\nFORANEOS', 'NO. DE REPORTE', ...Array(maxBoletas - 1).fill('')]
    ws.addRow(hRow1Data)
    ws.getRow(2).height = 30

    // Mergear NO. DE REPORTE sobre todas las columnas de boletas
    if (maxBoletas > 1) ws.mergeCells(2, 3, 2, totalCols)

    // Estilo encabezados fila 2
    for (let c = 1; c <= totalCols; c++) {
        const cell = ws.getCell(2, c)
        cell.style = {
            font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            border: { bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } } }
        }
    }

    // ─────────────────────────────────────────
    // FILAS DE DATOS
    // ─────────────────────────────────────────
    let grandTotalPay = 0

    drivers.forEach((driver, idx) => {
        const { totalPay, boletas } = driverMap[driver]
        const isOdd  = idx % 2 !== 0
        const bgArgb = isOdd ? 'FFD9D9D9' : 'FFFFFFFF'

        const hasPay = totalPay > 0
        grandTotalPay += totalPay

        const boletaCols = Array(maxBoletas).fill(0).map((_, i) => boletas[i] || 0)
        const rowValues  = [driver, hasPay ? totalPay : null, ...boletaCols]

        const row = ws.addRow(rowValues)
        row.height = 18

        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
            const isMoneyCol = colNum === 2
            const isBoleta   = colNum >= 3
            const val        = cell.value

            cell.style = {
                font: {
                    size: 10,
                    bold: colNum === 1,
                    color: { argb: (isBoleta && val === 0) ? 'FF999999' : 'FF000000' }
                },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } },
                alignment: {
                    horizontal: isMoneyCol ? 'right' : isBoleta ? 'center' : 'left',
                    vertical: 'middle'
                }
            }

            if (isMoneyCol) {
                if (val === null) {
                    cell.value = '#N/D'
                } else {
                    cell.numFmt = '"$"#,##0.00'
                }
            }
        })
    })

    // ─────────────────────────────────────────
    // FILA TOTAL
    // ─────────────────────────────────────────
    const totalRowValues = ['TOTAL', grandTotalPay, ...Array(maxBoletas).fill('')]
    const totalRow = ws.addRow(totalRowValues)
    totalRow.height = 20

    totalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.style = {
            font: { bold: true, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
            alignment: {
                horizontal: colNum === 1 ? 'right' : colNum === 2 ? 'right' : 'center',
                vertical: 'middle'
            },
            border: { top: { style: 'medium', color: { argb: 'FF000000' } } }
        }
        if (colNum === 2 && cell.value) {
            cell.numFmt = '"$"#,##0.00'
        }
    })

    // ── Descargar ──
    const buffer = await wb.xlsx.writeBuffer()
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `nomina_semana_${selectedWeek}.xlsx`)
}
