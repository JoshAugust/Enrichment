import ExcelJS from "exceljs";

const INPUT = '/Users/corgi12/.eragon-joshua_augustine/media/inbound/DealScope_GPU_Operators_v3---812d4146-5cb5-4a40-8b83-d14c45521e68.xlsx';
const OUTPUT = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/gpu-operator-expansion/DealScope_GPU_Operators_v3.xlsx';

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(INPUT);
const ws = wb.getWorksheet('Enriched Leads');

// Grade colors
const COLORS = {
    A: { fill: '22C55E', font: 'FFFFFF' },  // Green
    B: { fill: 'F59E0B', font: '000000' },  // Amber
    C: { fill: 'EF4444', font: 'FFFFFF' },  // Red
};

// Find Grade column index
const headerRow = ws.getRow(1);
let gradeCol = null;
headerRow.eachCell((cell, colNum) => {
    if (cell.value === 'Grade') gradeCol = colNum;
});

if (!gradeCol) { console.error('Grade column not found'); process.exit(1); }
console.log(`Grade column: ${gradeCol}`);

// Style header row
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
headerRow.eachCell(cell => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
    };
});
headerRow.height = 30;

// Set column widths
const COL_WIDTHS = {
    'RVG Score': 10, 'Grade': 8, 'Stage': 18, 'Score Breakdown': 45,
    'Company': 25, 'Description': 50, 'Description Source': 18, 'Industry': 22,
    'Website': 18, 'HQ': 20, 'Founded': 9, 'Employees': 12,
    'Employee Source': 15, 'Total Raised': 22, 'Last Round': 25,
    'GPU Fleet': 12, 'Hardware': 22, 'Est. GPU Value ($M)': 16,
    'Financing Profile': 35, 'Contact Name': 20, 'Contact Title': 22,
    'Email': 28, 'Email Type': 12, 'Email Source': 18,
    'Company LinkedIn': 30, 'Direct Phone': 18,
};

headerRow.eachCell((cell, colNum) => {
    const colName = cell.value;
    if (COL_WIDTHS[colName]) {
        ws.getColumn(colNum).width = COL_WIDTHS[colName];
    }
});

// Color-code rows by grade
let counts = { A: 0, B: 0, C: 0 };
for (let rowNum = 2; rowNum <= ws.rowCount; rowNum++) {
    const row = ws.getRow(rowNum);
    const grade = row.getCell(gradeCol).value;
    const color = COLORS[grade];

    if (color) {
        counts[grade]++;
        // Color the entire row with light tint based on grade
        const TINTS = {
            A: 'FFECFDF5',  // light green bg
            B: 'FFFFFBEB',  // light amber bg
            C: 'FFFEF2F2',  // light red bg
        };

        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
            if (colNum > Object.keys(COL_WIDTHS).length) return;
            
            cell.fill = {
                type: 'pattern', pattern: 'solid',
                fgColor: { argb: TINTS[grade] },
            };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            };
        });

        // Grade cell gets the strong color
        const gradeCell = row.getCell(gradeCol);
        gradeCell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: `FF${color.fill}` },
        };
        gradeCell.font = { bold: true, color: { argb: `FF${color.font}` }, size: 12 };
        gradeCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Score cell bold
        const scoreCell = row.getCell(1);
        scoreCell.font = { bold: true, size: 11 };
        scoreCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
}

// Freeze top row + auto-filter
ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: ws.rowCount, column: Object.keys(COL_WIDTHS).length } };

await wb.xlsx.writeFile(OUTPUT);
console.log(`\n✅ Color-coded v3 saved: ${OUTPUT}`);
console.log(`   A: ${counts.A} | B: ${counts.B} | C: ${counts.C} | Total: ${ws.rowCount - 1}`);
