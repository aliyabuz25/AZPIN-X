import"./modulepreload-polyfill-B5Qt9EMX.js";import{createClient as w}from"https://esm.sh/@supabase/supabase-js@2";const $="https://qmrchngwatxrnnkklfwa.supabase.co",_="sb_publishable_FHdYeBLA59RTUx1SVtbBrQ__L35Ax02",d=w($,_),L="admin123",E={URL:"/api"};let r={orders:[],users:[],wallets:[],apis:[],products:[],lastRefresh:null,search:"",statusFilter:"all",charts:{sales:null,products:null}};const k=()=>{sessionStorage.getItem("admin_session")==="true"&&y()},y=()=>{document.getElementById("login-overlay").classList.add("hidden"),document.getElementById("app-container").classList.remove("opacity-0","pointer-events-none"),j()};document.getElementById("btn-login").addEventListener("click",()=>{if(document.getElementById("admin-key").value===L)sessionStorage.setItem("admin_session","true"),y();else{const s=document.getElementById("login-error");s.classList.remove("opacity-0"),setTimeout(()=>s.classList.add("opacity-0"),3e3)}});document.getElementById("btn-logout").addEventListener("click",()=>{sessionStorage.removeItem("admin_session"),location.reload()});document.querySelectorAll(".sidebar-link").forEach(e=>{e.addEventListener("click",s=>{s.preventDefault();const t=e.dataset.section;I(t)})});const I=e=>{document.querySelectorAll(".panel").forEach(s=>s.classList.add("hidden")),document.getElementById(`panel-${e}`).classList.remove("hidden"),document.querySelectorAll(".sidebar-link").forEach(s=>s.classList.remove("active")),document.querySelector(`[data-section="${e}"]`).classList.add("active"),document.getElementById("current-section-title").innerText=e.charAt(0).toUpperCase()+e.slice(1),lucide.createIcons(),e==="products"&&r.products.length===0&&f()},g=e=>Number(e||0).toLocaleString("az-AZ",{minimumFractionDigits:2,maximumFractionDigits:2}),p=(e,s="accent")=>{const t=document.createElement("div");t.className="fixed bottom-8 right-8 px-6 py-3 rounded-xl glass border-l-4 font-bold text-sm animate-in z-[10000] flex items-center shadow-2xl shrink-0",t.style.borderLeftColor=s==="success"?"#059669":s==="error"?"#dc2626":"#dc143c",t.innerHTML=`<i data-lucide="${s==="success"?"check-circle":"info"}" class="w-4 h-4 mr-3"></i> ${e}`,document.body.appendChild(t),lucide.createIcons(),setTimeout(()=>{t.style.opacity="0",t.style.transform="translateY(10px)",setTimeout(()=>t.remove(),500)},3e3)},m=async()=>{try{const[e,s,t,n,a]=await Promise.all([d.from("orders").select("*").order("created_at",{ascending:!1}),d.from("order_items").select("*"),d.from("profiles").select("*"),d.from("reseller_wallets").select("*"),d.from("reseller_api_keys").select("*")]);if(e.error)throw e.error;const c=e.data||[],u=s.data||[],l=t.data||[];r.orders=c.map(o=>({...o,profiles:l.find(i=>i.user_id===o.user_id)||null,order_items:u.filter(i=>i.order_id===o.id)})),r.users=l,r.wallets=n.data||[],r.apis=a.data||[],r.lastRefresh=new Date,document.getElementById("last-updated").innerText=`SON YENİLƏNMƏ: ${r.lastRefresh.toLocaleTimeString()}`,B(),S()}catch(e){console.error(e),p("Məlumatlar yüklenərkən xəta: "+e.message,"error")}},f=async()=>{try{const s=await(await fetch(`${E.URL}/products`)).json();r.products=s.data?.products||[],h()}catch{p("Katalog yüklənə bilmədi","error")}},B=()=>{const e=r.orders.reduce((t,n)=>(n.status==="paid"&&(t.revenue+=n.total),(n.status==="pending"||n.status==="pending_review")&&(t.activeCount++,t.pendingRevenue+=n.total),t),{revenue:0,activeCount:0,pendingRevenue:0});document.getElementById("stat-total-revenue").innerText=`${g(e.revenue)} ₼`,document.getElementById("stat-active-orders").innerText=e.activeCount,document.getElementById("stat-total-users").innerText=r.users.length,document.getElementById("stat-pending-revenue").innerText=`${g(e.pendingRevenue)} ₼`;const s=document.getElementById("pending-badge");e.activeCount>0?(s.innerText=e.activeCount,s.classList.remove("hidden")):s.classList.add("hidden")},S=()=>{x(),A(),C(),T(),D()},x=()=>{const e=document.getElementById("orders-list");let s=r.orders.filter(t=>{const n=r.search===""||t.id.toLowerCase().includes(r.search.toLowerCase())||(t.profiles?.phone||"").includes(r.search)||(t.profiles?.first_name||"").toLowerCase().includes(r.search.toLowerCase()),a=r.statusFilter==="all"||t.status===r.statusFilter;return n&&a});e.innerHTML=s.map(t=>{const n=new Date(t.created_at).toLocaleString("az-AZ",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}),a=t.order_items?.map(l=>`<span class="bg-gray-800 text-[10px] px-1.5 py-0.5 rounded border border-gray-700 mr-1 mb-1 inline-block">${l.name} ×${l.quantity}</span>`).join("")||"-",c=t.profiles?`<div><p class="font-bold text-white">${t.profiles.first_name} ${t.profiles.last_name}</p><p class="text-[10px] text-gray-500">${t.profiles.phone}</p></div>`:'<span class="text-gray-500">Qonaq</span>',u=`badge-${t.status}`;return`
          <tr class="hover:bg-gray-900/30 transition-colors group">
            <td class="px-6 py-4">
              <p class="font-mono text-[11px] text-gray-400">#${t.id.slice(0,8)}</p>
              <p class="text-[10px] text-gray-500 font-bold uppercase">${n}</p>
            </td>
            <td class="px-6 py-4">${c}</td>
            <td class="px-6 py-4 max-w-xs ring-0 outline-none">${a}</td>
            <td class="px-6 py-4 font-black text-white text-base">${g(t.total)} ₼</td>
            <td class="px-6 py-4">
              <span class="text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${u}">${t.status}</span>
            </td>
            <td class="px-6 py-4 text-right">
               <div class="flex items-center justify-end space-x-2">
                 ${t.receipt_url?`<a href="${t.receipt_url}" target="_blank" class="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-all" title="Dekonta Bax"><i data-lucide="image" class="w-4 h-4"></i></a>`:""}
                 ${t.status!=="paid"?`<button onclick="updateOrderStatus('${t.id}', 'paid')" class="p-2 hover:bg-green-500/10 text-green-500 rounded-lg transition-all" title="Təhvil Verildi"><i data-lucide="check-circle" class="w-4 h-4"></i></button>`:""}
                 ${t.status==="pending"?`<button onclick="updateOrderStatus('${t.id}', 'pending_review')" class="p-2 hover:bg-yellow-500/10 text-yellow-500 rounded-lg transition-all" title="İncelemeye Al"><i data-lucide="eye" class="w-4 h-4"></i></button>`:""}
                 ${t.status!=="cancelled"&&t.status!=="paid"?`<button onclick="updateOrderStatus('${t.id}', 'cancelled')" class="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all" title="İptal Et"><i data-lucide="x-circle" class="w-4 h-4"></i></button>`:""}
               </div>
            </td>
          </tr>
        `}).join("")||'<tr><td colspan="6" class="px-6 py-10 text-center text-gray-500 italic">Sifariş tapılmadı</td></tr>',lucide.createIcons()},h=()=>{const e=document.getElementById("products-list"),s=document.getElementById("product-search").value.toLowerCase(),t=r.products.filter(n=>n.name.toLowerCase().includes(s));e.innerHTML=t.map(n=>`
        <div class="p-4 rounded-xl glass border border-gray-800 flex flex-col space-y-3">
          <img src="${n.image||"https://dummyimage.com/200x200/1f1f26/9aa3b2.png?text=AZPIN-X"}" class="w-full aspect-square object-contain bg-white/5 rounded-lg">
          <div class="flex-1">
            <p class="text-[10px] text-[#dc143c] font-black uppercase">${n.category_name||"Markasız"}</p>
            <h5 class="text-[11px] font-bold text-white line-clamp-2 leading-tight h-8 mb-2">${n.name}</h5>
            <p class="text-sm font-black text-white">${g(n.price)} ₼</p>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${n.stock>0?"bg-green-500/10 text-green-500 border border-green-500/20":"bg-red-500/10 text-red-500 border border-red-500/20"} uppercase">
              ${n.stock>0?"Stokda var":"Bitib"}
            </span>
          </div>
        </div>
      `).join("")},A=()=>{const e=document.getElementById("users-list");e.innerHTML=r.users.map(s=>{const t=((s.first_name?.[0]||"")+(s.last_name?.[0]||"")).toUpperCase()||"?";return`
          <tr class="hover:bg-gray-900/30 transition-colors">
            <td class="px-6 py-4 text-center">
               <div class="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 mx-auto flex items-center justify-center font-black text-xs text-gray-400 overflow-hidden">
                 ${s.avatar_url?`<img src="${s.avatar_url}" class="w-full h-full object-cover">`:t}
               </div>
            </td>
            <td class="px-6 py-4 font-bold text-white">${s.first_name} ${s.last_name}</td>
            <td class="px-6 py-4 text-gray-400">${s.email}</td>
            <td class="px-6 py-4 text-gray-400 font-mono">${s.phone||"-"}</td>
            <td class="px-6 py-4 text-right text-xs text-gray-500">${s.created_at?new Date(s.created_at).toLocaleDateString():"-"}</td>
          </tr>
        `}).join("")},C=()=>{const e=document.getElementById("wallets-list");e.innerHTML=r.wallets.map(s=>`
        <tr class="hover:bg-gray-900/30">
          <td class="px-6 py-4 font-mono text-xs text-gray-400">${s.reseller_id}</td>
          <td class="px-6 py-4 text-center font-bold text-gray-500">${s.currency}</td>
          <td class="px-6 py-4 font-black text-lg text-white">${g(s.balance)}</td>
          <td class="px-6 py-4 text-right">
            <button onclick="editWallet('${s.reseller_id}', ${s.balance})" class="text-xs font-bold text-[#dc143c] hover:underline">Balansı Dəyiş</button>
          </td>
        </tr>
      `).join("")},T=()=>{const e=document.getElementById("apis-list");e.innerHTML=r.apis.map(s=>`
        <tr class="hover:bg-gray-900/30 font-mono">
          <td class="px-6 py-4 text-xs text-gray-400">${s.reseller_id}</td>
          <td class="px-6 py-4 text-xs text-blue-400">${s.api_key}</td>
          <td class="px-6 py-4">
             <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.active?"bg-green-500/10 text-green-500":"bg-red-500/10 text-red-500"}">
               ${s.active?"Aktiv":"Pasiv"}
             </span>
          </td>
          <td class="px-6 py-4 text-right">
            <button onclick="toggleApi('${s.id}', ${s.active})" class="text-xs font-bold text-[#dc143c] hover:underline">${s.active?"Deaktiv et":"Aktiv et"}</button>
          </td>
        </tr>
      `).join("")},D=()=>{const e=document.getElementById("sales-chart"),s=document.getElementById("product-chart");if(!e||!s)return;const t=[...Array(7)].map((l,o)=>{const i=new Date;return i.setDate(i.getDate()-(6-o)),i.toLocaleDateString("en-CA")}),n=t.map(l=>r.orders.filter(o=>o.status==="paid"&&o.created_at.startsWith(l)).reduce((o,i)=>o+i.total,0));r.charts.sales&&r.charts.sales.destroy(),r.charts.sales=new Chart(e,{type:"line",data:{labels:t.map(l=>l.split("-").slice(1).join("/")),datasets:[{label:"Satış (₼)",data:n,borderColor:"#dc143c",backgroundColor:"rgba(220, 20, 60, 0.1)",fill:!0,tension:.4,borderWidth:3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{grid:{color:"#1f1f26"},ticks:{color:"#6b7280"}},x:{grid:{display:!1},ticks:{color:"#6b7280"}}}}});const a={};r.orders.forEach(l=>l.order_items?.forEach(o=>{a[o.name]=(a[o.name]||0)+o.quantity}));const c=Object.keys(a).slice(0,5),u=c.map(l=>a[l]);r.charts.products&&r.charts.products.destroy(),r.charts.products=new Chart(s,{type:"doughnut",data:{labels:c,datasets:[{data:u,backgroundColor:["#dc143c","#2563eb","#059669","#d97706","#7c3aed"],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"bottom",labels:{color:"#9aa3b2",font:{size:10}}}}}})};window.updateOrderStatus=async(e,s)=>{try{const t=r.orders.find(c=>c.id===e),n={status:s};if(s==="paid"&&t){const{data:c}=await d.from("payments").select("id").eq("order_id",e).maybeSingle(),u={order_id:e,amount:t.total,status:"paid",method:"c2c"};c?await d.from("payments").update({status:"paid"}).eq("id",c.id):await d.from("payments").insert(u)}const{error:a}=await d.from("orders").update(n).eq("id",e);if(a)throw a;p(`Sifariş #${e.slice(0,8)} statusu '${s}' olaraq dəyişdirildi`,"success"),m()}catch(t){p("Xəta: "+t.message,"error")}};window.editWallet=async(e,s)=>{const t=prompt(`Reseller ${e} üçün yeni balans:`,s);if(t===null)return;const n=parseFloat(t);if(isNaN(n))return p("Düzgün məbləğ daxil edin","error");try{const{error:a}=await d.from("reseller_wallets").upsert({reseller_id:e,balance:n,currency:"AZN"},{onConflict:"reseller_id"});if(a)throw a;p("Balans yeniləndi","success"),m()}catch(a){p("Xəta: "+a.message,"error")}};window.toggleApi=async(e,s)=>{try{const{error:t}=await d.from("reseller_api_keys").update({active:!s}).eq("id",e);if(t)throw t;p("API statusu dəyişdirildi","success"),m()}catch(t){p("Xəta: "+t.message,"error")}};document.getElementById("order-search").addEventListener("input",e=>{r.search=e.target.value,x()});document.getElementById("order-status-filter").addEventListener("change",e=>{r.statusFilter=e.target.value,x()});document.getElementById("product-search").addEventListener("input",h);document.getElementById("btn-sync-products").addEventListener("click",f);document.getElementById("btn-refresh-all").addEventListener("click",m);document.getElementById("btn-add-wallet").addEventListener("click",()=>{R()});const R=()=>{const e=document.getElementById("user-selector-modal");e.classList.remove("hidden"),e.classList.add("flex"),v(),lucide.createIcons()},b=()=>{const e=document.getElementById("user-selector-modal");e.classList.add("hidden"),e.classList.remove("flex")};document.getElementById("close-user-selector").onclick=b;document.getElementById("user-selector-search").oninput=e=>v(e.target.value);const v=(e="")=>{const s=document.getElementById("user-selector-list"),t=e.toLowerCase(),n=r.users.filter(a=>(a.first_name||"").toLowerCase().includes(t)||(a.last_name||"").toLowerCase().includes(t)||(a.email||"").toLowerCase().includes(t)||(a.phone||"").includes(t));s.innerHTML=n.map(a=>`
        <div onclick="selectUserForWallet('${a.user_id}', '${a.first_name||""} ${a.last_name||""}')" class="p-3 hover:bg-gray-800 rounded-xl cursor-pointer flex items-center group transition-all">
          <div class="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-black text-xs text-gray-500 mr-4 overflow-hidden">
            ${a.avatar_url?`<img src="${a.avatar_url}" class="w-full h-full object-cover">`:a.first_name?.[0]||"?"}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-white truncate">${a.first_name||""} ${a.last_name||""}</p>
            <p class="text-[11px] text-gray-500 truncate">${a.email||""}</p>
          </div>
          <p class="text-[11px] font-mono text-gray-600 bg-gray-900 px-2 py-1 rounded hidden group-hover:block">${a.user_id}</p>
        </div>
      `).join("")||'<p class="text-center p-10 text-gray-600 italic">İstifadəçi tapılmadı</p>'};window.selectUserForWallet=(e,s)=>{b(),window.editWallet(e,0)};const j=()=>{m(),setInterval(m,6e4),lucide.createIcons()};window.onload=k;
