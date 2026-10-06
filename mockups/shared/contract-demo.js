(function () {
  const demo = window.VLDemo;
  const original = demo.handle;
  const learning = {mucTieu:'goal',trinhDo:'level',chuDeIds:'topicIds',phutMoiNgay:'minutesPerDay',tuMoiMoiNgay:'newCardsPerDay',daHoanTatKhoiDau:'onboardingDone'};
  const notification = {nhanTrongUngDung:'inApp',nhanEmail:'email',nhacHoc:'studyReminder',gioNhac:'reminderTime'};
  const deckFields = {ten:'name',moTa:'description',chuDeId:'topicId',trinhDo:'level',quyenTruyCap:'visibility',chuSoHuuId:'ownerId',boNguonId:'sourceDeckId',yeuThich:'favorite',trangThaiKiemDuyet:'trangThaiKiemDuyet'};
  function mapped(value, fields, reverse) {
    const out={id:value.id,version:value.version ?? 0,createdAt:value.createdAt,updatedAt:value.updatedAt};
    Object.entries(fields).forEach(([api,internal])=>{out[reverse?internal:api]=value[reverse?api:internal];});
    if(fields===deckFields && !reverse)out.trangThaiKiemDuyet=value.trangThaiKiemDuyet || 'BINH_THUONG';
    return Object.fromEntries(Object.entries(out).filter(([,value])=>value!==undefined));
  }
  function legacy(method,path,body,headers,fields) {
    try {return original(method,path,body,headers);}
    catch(error) {
      if(error.fieldErrors)error.fieldErrors=error.fieldErrors.map(item=>({...item,field:Object.keys(fields).find(key=>fields[key]===item.field) || item.field}));
      throw error;
    }
  }
  function page(items,query) {
    const size=Math.min(100,Math.max(1,Number(query.get('size') || 20)));
    const number=Math.max(0,Number(query.get('page') || 0));
    return {items:items.slice(number*size,(number+1)*size),page:number,size,totalElements:items.length,totalPages:Math.ceil(items.length/size)};
  }
  function fail(status,code,message,field) {throw new demo.ApiError(status,code,message,field?[{field,message}]:[]);}
  demo.handle=function(method,url,body,headers) {
    const [path,search]=url.split('?');
    const query=new URLSearchParams(search || '');
    const db=demo.db;
    let fields;
    if(path==='/me/learning-settings')fields=learning;
    if(path==='/me/notification-settings')fields=notification;
    if(fields) {
      const current=original('GET',path,null,headers).body;
      if(method==='PUT') {
        if(body?.version===undefined)fail(400,'VALIDATION_FAILED','Thiếu phiên bản','version');
        if(body.version!==(current.version ?? 0))fail(409,'VERSION_CONFLICT','Thiết lập đã thay đổi, vui lòng tải lại');
        if(fields===learning && (!Array.isArray(body.chuDeIds) || body.chuDeIds.length>5 || new Set(body.chuDeIds).size!==body.chuDeIds.length || body.chuDeIds.some(id=>!db.topics.some(topic=>topic.id===id))))fail(400,'VALIDATION_FAILED','Chọn tối đa 5 chủ đề tồn tại và không trùng','chuDeIds');
        const input=mapped(body,fields,true);
        if(fields===learning)input.onboardingDone=true;
        if(fields===notification) {
          const user=original('GET','/me',null,headers).body;
          if((input.studyReminder && !input.reminderTime) || (input.reminderTime && !/^\d{2}:\d{2}$/.test(input.reminderTime)))fail(400,'VALIDATION_FAILED','Giờ nhắc không hợp lệ','gioNhac');
          const value={inApp:!!input.inApp,email:!!input.email,studyReminder:!!input.studyReminder,reminderTime:input.reminderTime || null,version:(current.version ?? 0)+1};
          db.notify[user.id]=value;
          original('GET','/me/notification-settings',null,headers);
          return {status:200,body:mapped(value,fields,false)};
        }
        const user=original('GET','/me',null,headers).body;
        if(!db.learning[user.id])db.learning[user.id]=current;
        const result=legacy(method,path,input,headers,fields);
        return {...result,body:mapped(result.body,fields,false)};
      }
      return {status:200,body:mapped(current,fields,false)};
    }
    const catalog=/^\/(public|admin)\/(topics|tags)(?:\/(\d+))?$/.exec(path);
    if(catalog) {
      const list=db[catalog[2]];
      if(catalog[1]==='admin')original('GET','/admin/'+catalog[2],null,headers);
      const item=catalog[3]&&list.find(value=>value.id===catalog[3]);
      if(method==='GET') {
        if(catalog[3]&&!item)fail(404,'NOT_FOUND','Không tìm thấy');
        const dto=value=>({id:value.id,ten:value.name,...(catalog[2]==='topics'?{moTa:value.description || null}:{}),version:value.version ?? 0});
        return {status:200,body:catalog[3]?dto(item):page(list.map(dto),query)};
      }
      if(method==='POST'||method==='PUT') {
        const ten=(body?.ten || '').trim();
        if(catalog[2]==='topics' && body?.moTa?.length>500)fail(400,'VALIDATION_FAILED','Mô tả tối đa 500 ký tự','moTa');
        if(!ten || ten.length>(catalog[2]==='topics'?100:50))fail(400,'VALIDATION_FAILED','Tên không hợp lệ','ten');
        if(list.some(value=>value.id!==item?.id&&value.name.toLocaleLowerCase('vi')===ten.toLocaleLowerCase('vi')))fail(409,'CONFLICT','Tên đã tồn tại');
        if(method==='PUT') {
          if(!item)fail(404,'NOT_FOUND','Không tìm thấy');
          if(body.version===undefined)fail(400,'VALIDATION_FAILED','Thiếu phiên bản','version');
          if(body.version!==(item.version ?? 0))fail(409,'VERSION_CONFLICT','Phiên bản đã thay đổi');
          item.name=ten;if(catalog[2]==='topics' && body.moTa!==undefined)item.description=body.moTa;item.version=(item.version ?? 0)+1;
        } else {
          const result=original('POST',path,{name:ten},headers);
          result.body.version=0;const created=list.find(value=>value.id===result.body.id);if(catalog[2]==='topics')created.description=body.moTa || null;original('GET','/admin/'+catalog[2],null,headers);
          return {...result,body:{id:result.body.id,ten,...(catalog[2]==='topics'?{moTa:created.description || null}:{}),version:0}};
        }
        original('GET','/admin/'+catalog[2],null,headers);
        return {status:200,body:{id:item.id,ten:item.name,...(catalog[2]==='topics'?{moTa:item.description || null}:{}),version:item.version}};
      }
      if(method==='DELETE') {
        if(!item)fail(404,'NOT_FOUND','Không tìm thấy');
        const used=catalog[2]==='topics' ? db.decks.some(value=>value.topicId===item.id)||Object.values(db.learning).some(value=>value.topicIds?.includes(item.id)) : db.cards.some(value=>value.tagIds?.includes(item.id));
        if(used)fail(409,'CONFLICT','Mục đang được sử dụng');
        return original(method,path,body,headers);
      }
    }
    if(/^\/decks(?:\/\d+)?$/.test(path)) {
      const id=path.split('/')[2];
      if(body && method==='POST' && !body.chuDeId)body.chuDeId=null;
      if(method==='DELETE' && !query.has('version'))fail(400,'VALIDATION_FAILED','Thiếu phiên bản','version');
      if(id && ['PATCH','DELETE'].includes(method)) {
        const current=original('GET',path,null,headers).body;
        const version=method==='DELETE'?Number(query.get('version')):body?.version;
        if(version===undefined)fail(400,'VALIDATION_FAILED','Thiếu phiên bản','version');
        if(version!==current.version)fail(409,'VERSION_CONFLICT','Bộ thẻ đã thay đổi');
      }
      let input=body;
      if(body) {
        input=mapped(body,deckFields,true);
        input.version=body.version;
        Object.keys(input).forEach(key=>{if(input[key]===undefined)delete input[key];});
        if(method==='POST')input.goal='GIAO_TIEP';
        if(body.boChuDe)input.topicId=null;
      }
      const result=legacy(method,path+(id?'':'?tab=mine&size=100'),input,headers,deckFields);
      if(!result.body)return result;
      if(result.body.items)return {...result,body:page(result.body.items.map(value=>mapped(value,deckFields,false)),query)};
      return {...result,body:mapped(result.body,deckFields,false)};
    }
    return original(method,url,body,headers);
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const notice=document.createElement('p');
    notice.className='alert';
    notice.textContent='Bản demo giao diện. Dữ liệu này không xác nhận API thật đã được kiểm thử. Mở ứng dụng Next.js để dùng backend.';
    document.querySelector('main')?.prepend(notice);
  });
})();
