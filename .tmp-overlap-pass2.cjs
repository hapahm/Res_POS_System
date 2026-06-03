const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = process.cwd();
const customerSrc = path.join(root,'pos-customer','src');
const adminSrc = path.join(root,'pos-admin','src');
const exts=['.js','.jsx','.ts','.tsx','.css'];
const codeExts=['.js','.jsx','.ts','.tsx'];
function walk(d,a=[]){if(!fs.existsSync(d))return a;for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f,a);else if(exts.includes(path.extname(e.name)))a.push(path.normalize(f));}return a;}
function rel(b,f){return path.relative(b,f).replace(/\\/g,'/');}
function hash(f){return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');}
function resolveImp(from,s){if(!s.startsWith('.'))return null;const b=path.resolve(path.dirname(from),s);const cand=[b];for(const e of exts)cand.push(b+e);for(const e of codeExts)cand.push(path.join(b,'index'+e));for(const c of cand){if(fs.existsSync(c)&&fs.statSync(c).isFile())return path.normalize(c);}return null;}
function deps(files,src){const m=new Map();const re=/(?:import|export)\s+(?:[^'\";]+?\s+from\s+)?['\"]([^'\"]+)['\"]/g;for(const f of files){const t=fs.readFileSync(f,'utf8');const s=new Set();re.lastIndex=0;let k;while((k=re.exec(t))){const r=resolveImp(f,k[1]);if(r&&r.startsWith(src))s.add(r);}m.set(f,s);}return m;}
function reach(seeds,d){const seen=new Set();const st=[...seeds];while(st.length){const c=st.pop();if(!c||seen.has(c)||!d.has(c))continue;seen.add(c);for(const x of d.get(c))if(!seen.has(x))st.push(x);}return seen;}
const cf=walk(customerSrc), af=walk(adminSrc);const amap=new Map(af.map(f=>[rel(adminSrc,f),f]));
const d=deps(cf,customerSrc);const appReach=reach([path.join(customerSrc,'main.jsx')],d);
const customerSeeds=['main.jsx','App.jsx','pages/HomeCustomer.jsx','pages/DishDetail.jsx','pages/Cart.jsx','pages/StaticCustomerPage.jsx','pages/Auth.jsx','pages/Orders.jsx','pages/Tables.jsx','pages/Menu.jsx','pages/PaymentResult.jsx','components/chat/CustomerChatWidget.jsx','components/customer/home/Header.jsx','components/customer/home/Hero.jsx','components/customer/Footer.jsx','components/invoice/Invoice.jsx'].map(p=>path.join(customerSrc,p)).filter(fs.existsSync);
const customerReach=reach(customerSeeds,d);
const overlap=[];
for(const f of appReach){const r=rel(customerSrc,f);const afile=amap.get(r);if(!afile)continue;overlap.push({rel:'src/'+r,same:hash(f)===hash(afile),inCustomer:customerReach.has(f)});}overlap.sort((a,b)=>a.rel.localeCompare(b.rel));
console.log('OVERLAP_REACHABLE_TOTAL='+overlap.length);
console.log('OUT_OF_CUSTOMER_SCOPE='+overlap.filter(x=>!x.inCustomer).length);
console.log('IN_CUSTOMER_SCOPE='+overlap.filter(x=>x.inCustomer).length);
console.log('\n[OUT_OF_CUSTOMER_SCOPE]');
for(const x of overlap.filter(x=>!x.inCustomer))console.log(`${x.rel} | ${x.same?'UNCHANGED':'MODIFIED'}`);
console.log('\n[IN_CUSTOMER_SCOPE]');
for(const x of overlap.filter(x=>x.inCustomer))console.log(`${x.rel} | ${x.same?'UNCHANGED':'MODIFIED'}`);
