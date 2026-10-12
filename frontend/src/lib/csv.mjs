export const CSV_FIELDS = ['tu', 'tuLoai', 'nghiaVi', 'phienAm', 'viDuEn', 'dichVi', 'doKho', 'nguon', 'nhanIds'];
export const CSV_LABELS = { tu: 'Từ tiếng Anh', tuLoai: 'Từ loại', nghiaVi: 'Nghĩa tiếng Việt', phienAm: 'Phiên âm', viDuEn: 'Câu ví dụ', dichVi: 'Dịch ví dụ', doKho: 'Độ khó', nguon: 'Nguồn', nhanIds: 'ID nhãn' };
export const CSV_TEMPLATE = '\uFEFF' + CSV_FIELDS.join(',') + '\r\napple,noun,quả táo,/ˈæpəl/,An apple.,Một quả táo.,1,,\r\n';

export function csvHeaders(text) {
  const input = text.replace(/^\uFEFF/, '');
  const cells = [];
  let value = '', quoted = false, closed = false;
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { value += '"'; index++; }
      else if (char === '"') { quoted = false; closed = true; }
      else value += char;
    } else if (char === ',') { cells.push(value); value = ''; closed = false; }
    else if (char === '\r' || char === '\n') { cells.push(value); return checked(cells); }
    else if (char === '"' && value === '' && !closed) quoted = true;
    else if (closed || char === '"') throw new Error('Header CSV sai dấu ngoặc kép.');
    else value += char;
  }
  if (quoted) throw new Error('Header CSV chưa đóng dấu ngoặc kép.');
  cells.push(value);
  return checked(cells);
}

function checked(cells) {
  if (cells.some(value => !value.trim() || value.length > 200) || new Set(cells).size !== cells.length) throw new Error('Header phải có tên duy nhất, tối đa 200 ký tự mỗi cột.');
  return cells;
}

export function saveDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
