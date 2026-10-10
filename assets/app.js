const KEYS={items:"lf_items",claims:"lf_claims",currentUser:"lf_current_user"};

const seedItems=[
{id:"LF1001",type:"Lost",name:"Black Wallet",category:"Accessories",location:"Central Library",date:"2026-10-02",reporter:"Aman Sharma",email:"aman@example.com",identifier:"Black leather, college ID inside",description:"A black leather wallet was lost near the reading area.",status:"Open",createdAt:"2026-10-02T10:00:00"},
{id:"LF1002",type:"Found",name:"Blue Water Bottle",category:"Other",location:"Computer Lab",date:"2026-10-03",reporter:"Riya Verma",email:"riya@example.com",identifier:"Blue bottle with sticker",description:"Found on the last bench of the computer lab.",status:"Open",createdAt:"2026-10-03T12:00:00"},
{id:"LF1003",type:"Lost",name:"USB Drive",category:"Electronics",location:"Canteen",date:"2026-10-04",reporter:"Rahul Singh",email:"rahul@example.com",identifier:"32GB, silver cap",description:"Small USB drive lost around the canteen tables.",status:"Claim Pending",createdAt:"2026-10-04T14:00:00"}
];

function getItems(){return JSON.parse(localStorage.getItem(KEYS.items)||"null")||seedItems}
function saveItems(x){localStorage.setItem(KEYS.items,JSON.stringify(x))}
function getClaims(){return JSON.parse(localStorage.getItem(KEYS.claims)||"[]")}
function saveClaims(x){localStorage.setItem(KEYS.claims,JSON.stringify(x))}
function uid(prefix){return prefix+Date.now().toString().slice(-7)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function setCurrentUser(user){localStorage.setItem(KEYS.currentUser,JSON.stringify(user))}
function currentUser(){return JSON.parse(localStorage.getItem(KEYS.currentUser)||"null")}
function ensureDemoUser(){if(!currentUser()) setCurrentUser({name:"Demo Student",email:"demo@example.com"})}

function renderHomeStats(){
 const items=getItems(), claims=getClaims();
 document.getElementById("homeStats").innerHTML=[
  ["Total Reports",items.length],["Lost Items",items.filter(x=>x.type==="Lost").length],
  ["Found Items",items.filter(x=>x.type==="Found").length],["Resolved",items.filter(x=>x.status==="Resolved").length]
 ].map(x=>`<div class="stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("");
}

function setupReportForm(){
 ensureDemoUser();
 const f=document.getElementById("reportForm");
 f.date.value=new Date().toISOString().slice(0,10);
 f.addEventListener("submit",e=>{
   e.preventDefault(); const d=Object.fromEntries(new FormData(f).entries());
   const item={id:uid("LF"),...d,status:"Open",createdAt:new Date().toISOString()};
   const items=getItems(); items.unshift(item); saveItems(items);
   setCurrentUser({name:d.reporter,email:d.email});
   document.getElementById("reportMessage").innerHTML='<p class="success">Report submitted successfully! Report ID: '+esc(item.id)+'</p>';
   f.reset(); f.date.value=new Date().toISOString().slice(0,10);
 });
}

function setupItemsPage(){
 const render=()=>{
   const q=document.getElementById("searchInput").value.toLowerCase();
   const type=document.getElementById("typeFilter").value, cat=document.getElementById("categoryFilter").value, status=document.getElementById("statusFilter").value;
   const items=getItems().filter(x=>(!type||x.type===type)&&(!cat||x.category===cat)&&(!status||x.status===status)&&(!q||[x.name,x.description,x.location,x.category].join(" ").toLowerCase().includes(q)));
   const grid=document.getElementById("itemsGrid");
   grid.innerHTML=items.length?items.map(itemCard).join(""):'<div class="empty">No matching reports found.</div>';
 };
 ["searchInput","typeFilter","categoryFilter","statusFilter"].forEach(id=>document.getElementById(id).addEventListener("input",render));
 render();
}
function itemCard(x){
 return `<article class="item-card"><span class="pill ${x.type==="Found"?"found":""}">${esc(x.type)}</span><span class="pill ${x.status==="Resolved"?"resolved":""}">${esc(x.status)}</span>
 <h3>${esc(x.name)}</h3><div class="item-meta">📍 ${esc(x.location)} • 📅 ${esc(x.date)}</div><p><b>Category:</b> ${esc(x.category)}</p><p>${esc(x.description)}</p><p><b>Identification:</b> ${esc(x.identifier||"Not provided")}</p>
 ${x.status!=="Resolved"?`<button class="btn primary claim-btn" onclick="claimItem('${x.id}')">Claim / Match This Item</button>`:""}</article>`;
}
function claimItem(id){
 const items=getItems(), item=items.find(x=>x.id===id); if(!item)return;
 const name=prompt("Enter your name:"); if(!name)return;
 const email=prompt("Enter your email:"); if(!email)return;
 const reason=prompt("Why do you believe this is your item? Include identifying details:");
 if(!reason)return;
 const claims=getClaims(); claims.push({id:uid("CL"),itemId:id,itemName:item.name,claimant:name,email,reason,status:"Pending",createdAt:new Date().toISOString()}); saveClaims(claims);
 item.status="Claim Pending"; saveItems(items); alert("Claim submitted successfully."); setupItemsPage();
}
function renderDashboard(){
 ensureDemoUser(); const u=currentUser(), items=getItems().filter(x=>x.email===u.email), claims=getClaims().filter(x=>x.email===u.email);
 document.getElementById("dashboardStats").innerHTML=[["My Reports",items.length],["My Claims",claims.length],["Open",items.filter(x=>x.status==="Open").length],["Resolved",items.filter(x=>x.status==="Resolved").length]].map(x=>`<div class="stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("");
 document.getElementById("myReports").innerHTML=items.length?items.map(x=>`<div class="card" style="margin-bottom:10px"><b>${esc(x.name)}</b> — ${esc(x.type)} <span class="pill">${esc(x.status)}</span><div class="item-meta">${esc(x.location)} • ${esc(x.date)} • ${esc(x.id)}</div></div>`).join(""):'<div class="empty">No reports for the current user.</div>';
 document.getElementById("myClaims").innerHTML=claims.length?claims.map(x=>`<div class="card" style="margin-bottom:10px"><b>${esc(x.itemName)}</b> — <span class="pill">${esc(x.status)}</span><p>${esc(x.reason)}</p></div>`).join(""):'<div class="empty">No claims for the current user.</div>';
}
function renderAdmin(){
 const items=getItems(), claims=getClaims();
 document.getElementById("adminStats").innerHTML=[["Reports",items.length],["Open",items.filter(x=>x.status==="Open").length],["Claims",claims.length],["Resolved",items.filter(x=>x.status==="Resolved").length]].map(x=>`<div class="stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("");
 document.getElementById("adminReports").innerHTML=items.map(x=>`<tr><td><b>${esc(x.name)}</b><br><small>${esc(x.id)}</small></td><td>${esc(x.type)}</td><td>${esc(x.reporter)}</td><td>${esc(x.location)}</td><td>${esc(x.status)}</td><td><button class="small-btn" onclick="resolveItem('${x.id}')">Resolve</button></td></tr>`).join("");
 document.getElementById("adminClaims").innerHTML=claims.length?claims.map(c=>`<tr><td>${esc(c.itemName)}</td><td>${esc(c.claimant)}</td><td>${esc(c.reason)}</td><td>${esc(c.status)}</td><td><button class="small-btn" onclick="approveClaim('${c.id}')">Approve</button></td></tr>`).join(""):'<tr><td colspan="5">No claim requests yet.</td></tr>';
}
function resolveItem(id){const items=getItems();const x=items.find(i=>i.id===id);if(x){x.status="Resolved";saveItems(items);renderAdmin()}}
function approveClaim(id){const claims=getClaims(), c=claims.find(x=>x.id===id);if(!c)return;c.status="Approved";saveClaims(claims);const items=getItems(),i=items.find(x=>x.id===c.itemId);if(i)i.status="Resolved";saveItems(items);renderAdmin()}
function resetDemo(){if(confirm("Reset all demo reports and claims?")){localStorage.removeItem(KEYS.items);localStorage.removeItem(KEYS.claims);location.reload()}}
