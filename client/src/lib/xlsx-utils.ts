import * as XLSX from 'xlsx';

/**
 * Exports data to Excel file
 * @param headers Array of column headers
 * @param rows Array of data rows (each row is an array of values)
 * @param filename Base name for the exported file (without extension)
 * @param sheetName Optional sheet name (defaults to "Sheet1")
 */
export function exportTableToExcel(
  headers: string[],
  rows: any[][],
  filename: string = "export",
  sheetName: string = "Sheet1"
): void {
  // Create worksheet with headers
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Apply header styling
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  headerRange.e.r = 0; // Only first row (headers)
  
  // Set column widths based on content
  const colWidths = calculateColumnWidths(headers, rows);
  worksheet['!cols'] = colWidths.map(width => ({ wch: width }));
  
  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fullFilename = `${filename}_${timestamp}.xlsx`;
  
  // Export the file
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Calculates appropriate column widths based on content
 */
function calculateColumnWidths(headers: string[], rows: any[][]): number[] {
  const widths: number[] = headers.map(header => Math.min(50, header.length + 2));
  
  rows.forEach(row => {
    row.forEach((cell, i) => {
      if (i < widths.length) {
        const cellStr = cell === null || cell === undefined ? '' : String(cell);
        const cellWidth = Math.min(50, cellStr.length + 2);
        widths[i] = Math.max(widths[i], cellWidth);
      }
    });
  });
  
  return widths;
}

/**
 * Imports data from an Excel file
 * @param file Excel file to import
 * @returns Promise resolving to array of rows with header keys
 */
export function importExcelData(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extract headers and data rows
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        // Convert to objects with header keys
        const result = rows.map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exports data to CSV file
 * @param headers Array of column headers
 * @param rows Array of data rows
 * @param filename Base name for the exported file (without extension)
 */
export function exportTableToCsv(
  headers: string[],
  rows: any[][],
  filename: string = "export"
): void {
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => 
        // Quote strings containing commas or quotes
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    )
  ].join('\n');
  
  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fullFilename = `${filename}_${timestamp}.csv`;
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
