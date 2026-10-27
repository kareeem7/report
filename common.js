/* ===== بلاغ الحملة القومية للتطعيم —  JavaScript مشترك ===== */

/* أسماء الوحدات الـ 34 (الإدارة الصحية / قويسنا — المنوفية) */
const UNITS = [
  "مكتب الصحة", "شبرابخوم", "ميت بره", "أبنهس", "ميت سراج", "أم خنان",
  "أجهور الرمل", "منشأة دملو", "شرانيس", "قويسنا البلد", "بجيرم", "كفر بني غريان",
  "بقسا", "كفر الأكرم", "كفر إبنهس", "الرمالي", "مصطاي", "كفر طه شبرا",
  "كفر أبو الحسن", "ميت أبو شيخه", "طه شبرا", "أشليم", "شبرا قبالة", "عرب الرمل",
  "كفر ميت سراج", "كفر أبشيش", "كفر ميت العبسي", "كفر وهب", "دمهوج", "كفر زين الدين",
  "عزبة أبو النصر", "شمنديل", "كفور الرمل", "منشأة أم خنان"
];

/* ---------- تطبيع أسماء الوحدات ----------
   الشيت بيكتب الأسماء بـ: تطويل (ـ) و ى بدل ي و ة بدل ه و مسافات مختلفة
   (شبرابخـــــوم / الرمــالى / شبرا قبالــه / ميت أبـوشيخه)
   الدالة دي بتوحّد الشكل عشان المطابقة تشتغل مهما اختلف الرسم. */
function normUnitName(s){
  return String(s==null?"":s)
    .replace(/[\u0640\u064B-\u065F\u0670\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,"") // تطويل + تشكيل + محارف اتجاه
    .replace(/[أإآٱ]/g,"ا")
    .replace(/[ىئ]/g,"ي").replace(/ؤ/g,"و")
    .replace(/ة/g,"ه")
    .replace(/[\s\u00A0\u2007\u202F]+/g,"")          // كل أنواع المسافات
    .replace(/[.،,\-–—_/\\]+/g,"")
    .trim();
}
/* مسافة تعديل بسيطة (Levenshtein) — للمطابقة التقريبية */
function editDistance(a,b){
  a=[...a]; b=[...b];
  if(!a.length) return b.length; if(!b.length) return a.length;
  let prev=Array.from({length:b.length+1},(_,i)=>i), cur=new Array(b.length+1);
  for(let i=1;i<=a.length;i++){
    cur[0]=i;
    for(let j=1;j<=b.length;j++){
      cur[j]=Math.min(prev[j]+1, cur[j-1]+1, prev[j-1]+(a[i-1]===b[j-1]?0:1));
    }
    [prev,cur]=[cur,prev];
  }
  return prev[b.length];
}

/* بيرجع اسم الوحدة الرسمي من قائمة UNITS، أو "" لو مش لاقيه.
   1) مطابقة حرفية → 2) مطابقة بعد التطبيع (تطويل/ى/ة/مسافات) → 3) مطابقة تقريبية (خطأ كتابة بسيط) */
function matchUnitName(raw){
  const rawTrim = String(raw==null?"":raw).trim();
  if(!rawTrim) return "";
  const exact = UNITS.find(u=>u===rawTrim);
  if(exact) return exact;
  const k = normUnitName(rawTrim);
  if(!k) return "";
  const hits = UNITS.filter(u=>normUnitName(u)===k);
  if(hits.length) return hits[0];

  // مطابقة تقريبية: أقرب اسم بفارق ≤ 2 حرف، وبشرط تكون أفضلية واحدة واضحة
  if(k.length>=5){
    let best=null, bestD=99, tie=false;
    UNITS.forEach(u=>{
      const d=editDistance(k, normUnitName(u));
      if(d<bestD){ bestD=d; best=u; tie=false; }
      else if(d===bestD){ tie=true; }
    });
    if(best && bestD>0 && bestD<=2 && !tie) return best;
  }
  return "";
}

/* ---------- مساعدة ---------- */
const $ = id => document.getElementById(id);
function num(id){ const v=$(id).value.trim(); const n=Number(v); return v==="" ? 0 : (isNaN(n)?0:n); }
/* تحويل مرن: بيشيل الفواصل والـ% وبيحوّل الأرقام العربية، وبيرجع NaN لو فاضي */
function numv(x){
  if(x===null||x===undefined) return NaN;
  let s=String(x).replace(/[\u0660-\u0669]/g,d=>String(d.charCodeAt(0)-0x0660))
                   .replace(/[\u06F0-\u06F9]/g,d=>String(d.charCodeAt(0)-0x06F0))
                   .replace(/[,،\s\u00A0]/g,"").replace(/%/g,"").trim();
  if(s===""||/^#/.test(s)) return NaN;
  const n=Number(s); return isNaN(n)?NaN:n;
}
function fmt(n){ return Number(n||0).toLocaleString("ar-EG"); }
function todayLocal(){
  const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10);
}
function prevDateStr(dateStr){
  if(!dateStr) return "";
  const p=dateStr.split("-").map(Number); const d=new Date(p[0],p[1]-1,p[2]); d.setDate(d.getDate()-1);
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

/* ---------- شيت اليوم السابق (الإدارة ترفعه) ---------- */
const BASELINE_KEY = "mr-prevday-baseline";
function getBaseline(){
  try{ return JSON.parse(localStorage.getItem(BASELINE_KEY) || "{}"); }catch(e){ return {}; }
}
function setBaseline(obj){
  try{ localStorage.setItem(BASELINE_KEY, JSON.stringify(obj)); }catch(e){}
}
function baselineDate(){ const b=getBaseline(); return b.date || ""; }
/* البحث بيشتغل حتى لو اسم الوحدة في الشيت مكتوب بشكل مختلف (تطويل/ى/ة/مسافات)
   وكمان بيدعم الشيتات القديمة المحفوظة بأسماء خام */
function baselineUnit(unit){
  const b=getBaseline(); const units=(b && b.units) || {};
  if(units[unit]) return units[unit];
  const k=normUnitName(unit);
  if(!k) return null;
  for(const name in units){ if(normUnitName(name)===k) return units[name]; }
  return null;
}

/* ---------- ثوابت الوحدة (تُحفظ أول مرة تُدخل) ---------- */
function unitBaseKey(unit){ return "mr-unit-base-" + unit; }
function getUnitBase(unit){
  try{ return JSON.parse(localStorage.getItem(unitBaseKey(unit)) || "{}"); }catch(e){ return {}; }
}
function setUnitBase(unit, obj){
  try{ localStorage.setItem(unitBaseKey(unit), JSON.stringify(obj)); }catch(e){}
}

/* ---------- تجميع بيانات اليوم للوحدة (للإدارة) ---------- */
function unitSavedKey(unit, date){ return "mr-unit-saved-" + unit + "-" + date; }
function saveUnitData(unit, date, payload){
  try{ localStorage.setItem(unitSavedKey(unit,date), JSON.stringify(payload)); }catch(e){}
}
function getUnitSaved(unit, date){
  try{ return JSON.parse(localStorage.getItem(unitSavedKey(unit,date)) || "null"); }catch(e){ return null; }
}
