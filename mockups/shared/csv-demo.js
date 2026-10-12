(function () {
  const demo = window.VLDemo;
  const original = demo.handle;
  const fields = ['tu','tuLoai','nghiaVi','phienAm','viDuEn','dichVi','doKho','nguon','nhanIds'];
  const imports = new Map(Object.entries(demo.db.csvImports || {})), attempts = new Map(Object.entries(demo.db.csvAttempts || {}));
  function persist() { demo.db.csvImports=Object.fromEntries(imports); demo.db.csvAttempts=Object.fromEntries(attempts); demo.persist(); }
  function fail(status, code, message) { throw new demo.ApiError(status, code, message); }
  function parse(text) {
    const rows = [], row = [];
    let cell = '', quoted = false, closed = false;
    const input = text.replace(/^\uFEFF/, '');
    for (let index = 0; index < input.length; index++) {
      const char = input[index];
      if (quoted) {
        if (char === '"' && input[index + 1] === '"') { cell += '"'; index++; }
        else if (char === '"') { quoted = false; closed = true; }
        else cell += char;
      } else if (char === ',') { row.push(cell); cell = ''; closed = false; }
      else if (char === '\r' || char === '\n') {
        row.push(cell); rows.push(row.splice(0)); cell = ''; closed = false;
        if (char === '\r' && input[index + 1] === '\n') index++;
      } else if (char === '"' && !cell && !closed) quoted = true;
      else if (closed || char === '"') fail(400,'VALIDATION_FAILED','CSV sai dấu ngoặc kép');
      else cell += char;
    }
    if (quoted) fail(400,'VALIDATION_FAILED','CSV chưa đóng dấu ngoặc kép');
    if (cell || row.length || closed) { row.push(cell); rows.push(row); }
    return rows;
  }
  const key = row => [row.tu, row.tuLoai].map(value => String(value || '').normalize('NFC').trim().replace(/\s+/gu,' ').toLowerCase()).join('\0');
  function owned(deckId, user) {
    const deck = demo.db.decks.find(value => value.id === deckId && value.ownerId === user.id && !value.deleted);
    if (!deck) fail(404,'NOT_FOUND','Không tìm thấy bộ thẻ');
    return deck;
  }
  async function preview(deckId, body, headers) {
    const user = original('GET','/me',null,headers).body;
    owned(deckId,user);
    const file = body instanceof FormData && body.get('file');
    if (!file || !file.size || file.size > 1048576) fail(400,'VALIDATION_FAILED','Tệp CSV tối đa 1 MB');
    const records = parse(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()));
    const header = records.shift() || [];
    if (!header.length || header.some(value => !value.trim() || value.length > 200) || new Set(header).size !== header.length) fail(400,'VALIDATION_FAILED','Header không hợp lệ');
    let mapping = Object.fromEntries(header.map(name => [name,name]));
    if (body.get('mapping')) mapping = JSON.parse(await body.get('mapping').text());
    if (!mapping.tu || !mapping.nghiaVi || Object.keys(mapping).some(field => !fields.includes(field)) || Object.values(mapping).some(source => !header.includes(source)) || new Set(Object.values(mapping)).size !== Object.values(mapping).length) fail(400,'VALIDATION_FAILED','Ánh xạ cột không hợp lệ');
    if (!records.length || records.length > 1000) fail(400,'VALIDATION_FAILED','CSV phải có từ 1 đến 1000 dòng');
    const rows = records.map((record,index) => {
      const rawValues = Object.fromEntries(fields.map(field => [field,record[header.indexOf(mapping[field])] || '']));
      const data = Object.fromEntries(fields.map(field => [field,rawValues[field].normalize('NFC').trim()]));
      data.tu = data.tu.replace(/\s+/gu,' '); data.tuLoai = data.tuLoai.replace(/\s+/gu,' ');
      data.doKho = data.doKho ? (/^[+-]?\d+$/.test(data.doKho) ? Number(data.doKho) : null) : 1;
      data.nhanIds = data.nhanIds ? data.nhanIds.split(';').map(value=>value.trim()) : [];
      const errors = [];
      const add = (field,message) => errors.push({field,message});
      if (record.length !== header.length) add('row','Số ô không khớp header');
      for (const [field,max] of Object.entries({tu:100,tuLoai:30,nghiaVi:500,phienAm:100,viDuEn:300,dichVi:300,nguon:500})) {
        if (['tu','nghiaVi'].includes(field) && !data[field]) add(field,'Không được bỏ trống');
        if (data[field].length > max) add(field,`Tối đa ${max} ký tự`);
        if (data[field].includes('\0')) add(field,'Không được chứa NUL');
      }
      if (!Number.isInteger(data.doKho) || data.doKho < 1 || data.doKho > 5) add('doKho','Độ khó từ 1 đến 5');
      if (data.nhanIds.length > 100 || new Set(data.nhanIds).size !== data.nhanIds.length) add('nhanIds','Tối đa 100 ID không trùng');
      data.nhanIds.forEach((id,index) => { if (!/^[1-9][0-9]{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n || !demo.db.tags.some(tag=>tag.id===id)) add(`nhanIds[${index}]`,'ID nhãn không hợp lệ hoặc không tồn tại'); });
      return {rowNumber:index+1,rawValues,data,valid:!errors.length,fieldErrors:errors,trung:false,theTrungIds:[],dongTrungNumbers:[]};
    });
    for (const row of rows.filter(value=>value.valid)) {
      row.theTrungIds = demo.db.cards.filter(card=>card.deckId===deckId && !card.deleted && key({tu:card.word,tuLoai:card.pos})===key(row.data)).map(card=>card.id);
      row.dongTrungNumbers = rows.filter(other=>other.valid && other.rowNumber!==row.rowNumber && key(other.data)===key(row.data)).map(other=>other.rowNumber);
      row.trung = !!(row.theTrungIds.length || row.dongTrungNumbers.length);
    }
    const response = {importId:crypto.randomUUID(),boTheId:deckId,expiresAt:new Date(Date.now()+1800000).toISOString(),totalRows:rows.length,validRows:rows.filter(row=>row.valid).length,invalidRows:rows.filter(row=>!row.valid).length,ignoredColumns:header.filter(name=>!Object.values(mapping).includes(name)),rows};
    imports.set(response.importId,{ownerId:user.id,response});
    persist();
    return {status:200,body:response};
  }
  demo.handle = function(method,path,body,headers={}) {
    const match = /^\/decks\/(\d+)\/imports\/preview$/.exec(path);
    if (method==='POST' && match) return preview(match[1],body,headers);
    const commit = /^\/imports\/([^/]+)\/commit$/.exec(path);
    if (method==='POST' && commit) {
      const user=original('GET','/me',null,headers).body, id=commit[1], token=headers['Idempotency-Key'];
      if (!token || !/^[A-Za-z0-9._:-]{1,128}$/.test(token)) fail(400,'VALIDATION_FAILED','Thiếu Idempotency-Key');
      const selected=body?.rowNumbers;
      if (!Array.isArray(selected) || !selected.length || selected.length>1000 || new Set(selected).size!==selected.length || selected.some(n=>!Number.isInteger(n)||n<1||n>1000)) fail(400,'VALIDATION_FAILED','Số dòng không hợp lệ');
      const signature=JSON.stringify([...selected].sort((a,b)=>a-b));
      const previous=attempts.get(user.id+':'+token);
      if(previous) { if(previous.id!==id || previous.signature!==signature) fail(409,'CONFLICT','Key đã dùng cho yêu cầu khác'); return {status:200,body:previous.result}; }
      const stored=imports.get(id);
      if(!stored || stored.ownerId!==user.id || Date.parse(stored.response.expiresAt)<=Date.now()) fail(404,'NOT_FOUND','Bản xem trước đã hết hạn');
      if(stored.committed) fail(409,'CONFLICT','Bản xem trước đã được nhập');
      owned(stored.response.boTheId,user);
      const chosen=[...selected].sort((a,b)=>a-b).map(number=>stored.response.rows.find(row=>row.rowNumber===number));
      if(chosen.some(row=>!row?.valid)) fail(400,'VALIDATION_FAILED','Chỉ chọn dòng hợp lệ');
      if(chosen.some(row=>row.data.nhanIds.some(id=>!demo.db.tags.some(tag=>tag.id===id)))) fail(409,'CONFLICT','Nhãn đã thay đổi');
      const items=chosen.map(row=>{
        const data=row.data, cardId=String(++demo.db.seq);
        demo.db.cards.push({id:cardId,deckId:stored.response.boTheId,word:data.tu,pos:data.tuLoai,meaningVi:data.nghiaVi,ipa:data.phienAm,exampleEn:data.viDuEn,exampleVi:data.dichVi,difficulty:data.doKho,source:data.nguon,tagIds:data.nhanIds,version:0,createdAt:new Date().toISOString()});
        return {rowNumber:row.rowNumber,theId:cardId,trung:row.trung,theTrungIds:row.theTrungIds,dongTrungNumbers:row.dongTrungNumbers.filter(number=>selected.includes(number))};
      });
      const result={importId:id,boTheId:stored.response.boTheId,importedCount:items.length,items};
      stored.committed=true;attempts.set(user.id+':'+token,{id,signature,result});persist();
      return {status:200,body:result};
    }
    const exporting=/^\/decks\/(\d+)\/export$/.exec(path);
    if(method==='GET' && exporting) {
      const user=original('GET','/me',null,headers).body;owned(exporting[1],user);
      const escape=value=>{
        let text=String(value ?? '');
        if(/^[\s\uFEFF]*[=+\-@＝＋－＠]/u.test(text) || /^[\t\r\n]/.test(text)) text="'"+text;
        return /[,"\r\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;
      };
      const records=demo.db.cards.filter(card=>card.deckId===exporting[1] && !card.deleted).sort((a,b)=>Number(b.id)-Number(a.id)).map(card=>[card.word,card.pos,card.meaningVi,card.ipa,card.exampleEn,card.exampleVi,card.difficulty||1,card.source,(card.tagIds||[]).join(';')].map(escape).join(','));
      return {status:200,body:new Blob(['\uFEFF'+[fields.join(','),...records].join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'})};
    }
    return original(method,path,body,headers);
  };
  window.VLCsv={parse,fields};
})();
