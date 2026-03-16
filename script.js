const app = {
    data: { 
        txns: [], budgets: {}, shopping: [], wealth: [], 
        cats: { expense: ['Food','Bills','Transport','Electronics','Medical','Gym','Shopping','Education','Rent','Other'], income: ['Salary','Freelance','Investment','Gift','Other'] }, 
        rates: { INR:1, USD:84 } 
    },
    charts: {}, calcStr: "",

    init() {
        const s=localStorage.getItem('proFinanceV17'); if(s)this.data=JSON.parse(s);
        document.getElementById('inp-date').valueAsDate=new Date();
        document.getElementById('rep-month').value=new Date().toISOString().slice(0,7);
        document.getElementById('cal-month').value=new Date().toISOString().slice(0,7);
        this.updateCats(); this.renderAll();
        document.addEventListener('keydown', (e) => {
            if(document.getElementById('view-calculator').style.display === 'block') {
                if(e.key>='0' && e.key<='9') app.calcIn(e.key);
                if(['+','-','*','/','%','.'].includes(e.key)) app.calcIn(e.key);
                if(e.key==='Enter') app.calcEq(); if(e.key==='Backspace') app.calcBack(); if(e.key==='Escape') app.calcClr();
            }
        });
    },
    save() { localStorage.setItem('proFinanceV17',JSON.stringify(this.data)); this.renderAll(); },
    fmt(n) { return '₹' + n.toLocaleString(); },

    // TAX LOGIC
    calcTaxSlab() {
        const i = parseFloat(document.getElementById('tax-inc').value) || 0;
        // Generic Slab Logic (Example New Regime)
        let t = 0;
        if(i > 1500000) t = (i-1500000)*0.3 + 150000;
        else if(i > 1200000) t = (i-1200000)*0.2 + 90000;
        else if(i > 900000) t = (i-900000)*0.15 + 45000;
        else if(i > 600000) t = (i-600000)*0.1 + 15000;
        else if(i > 300000) t = (i-300000)*0.05;
        
        const rate = (t/i)*100;
        document.getElementById('tax-rate').value = rate.toFixed(2);
        this.showTaxRes(t, i);
    },
    calcTaxCustom() {
        const i = parseFloat(document.getElementById('tax-inc').value) || 0;
        const r = parseFloat(document.getElementById('tax-rate').value) || 0;
        const t = i * (r/100);
        this.showTaxRes(t, i);
    },
    showTaxRes(t, i) {
        document.getElementById('tax-res').innerHTML = `Tax: <span class="text-danger">${this.fmt(Math.round(t))}</span><br>Net Income: <span class="text-success">${this.fmt(Math.round(i-t))}</span>`;
        document.getElementById('tax-res').style.display = 'block';
    },

    // CORE & RENDER
    renderAll(){ this.renderDash(); this.renderTxn(); this.renderAnalytics(); this.renderPlan(); this.renderWealth(); },
    
    renderDash(){
        const now=new Date(), exp=this.data.txns.filter(t=>t.type==='expense'), inc=this.data.txns.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0);
        const tot=exp.reduce((a,b)=>a+b.amount,0);
        document.getElementById('d-week').innerText=this.fmt(exp.filter(t=>(now-new Date(t.date))/864e5<=7).reduce((a,b)=>a+b.amount,0));
        document.getElementById('d-month').innerText=this.fmt(exp.filter(t=>new Date(t.date).getMonth()===now.getMonth()).reduce((a,b)=>a+b.amount,0));
        document.getElementById('d-year').innerText=this.fmt(exp.filter(t=>new Date(t.date).getFullYear()===now.getFullYear()).reduce((a,b)=>a+b.amount,0));
        document.getElementById('d-balance').innerText=this.fmt(inc-tot); document.getElementById('d-inc').innerText=this.fmt(inc); document.getElementById('d-exp').innerText=this.fmt(tot); document.getElementById('d-save').innerText=this.fmt(inc-tot);
        const bl=document.getElementById('budget-list'), bi=document.getElementById('budget-inp-container'); bl.innerHTML=''; bi.innerHTML='';
        const cm={}; exp.filter(t=>new Date(t.date).getMonth()===now.getMonth()).forEach(t=>cm[t.cat]=(cm[t.cat]||0)+t.amount);
        this.data.cats.expense.forEach(c=>{
            bi.innerHTML+=`<div><label style="font-size:0.8rem">${c}</label><input type="number" class="budget-inp" data-c="${c}" value="${this.data.budgets[c]||0}"></div>`;
            if(this.data.budgets[c]){const p=Math.min((cm[c]||0)/this.data.budgets[c]*100,100),cl=p>90?'var(--danger)':p>70?'var(--warning)':'var(--success)';bl.innerHTML+=`<div><div class="flex-between" style="font-size:0.9rem"><span>${c}</span><span>${this.fmt(cm[c]||0)} / ${this.fmt(this.data.budgets[c])}</span></div><div style="background:var(--border);height:6px;border-radius:3px"><div style="width:${p}%;background:${cl};height:100%"></div></div></div>`;}
        });
    },

    renderTxn(){
        const s=document.getElementById('txn-search').value.toLowerCase(), f=document.getElementById('txn-filter').value, c=document.getElementById('txn-container'); c.innerHTML='';
        const fil=this.data.txns.filter(t=>(t.note.toLowerCase().includes(s)||t.cat.toLowerCase().includes(s))&&(f==='all'||t.cat===f)).sort((a,b)=>new Date(b.date)-new Date(a.date));
        const groups = {}; fil.forEach(t => { if(!groups[t.date]) groups[t.date] = { sum:0, items:[] }; if(t.type==='expense') groups[t.date].sum += t.amount; groups[t.date].items.push(t); });
        Object.keys(groups).forEach(d => {
            let h = `<div class="txn-group"><div class="txn-header"><span>${new Date(d).toDateString()}</span><span class="text-danger">Day Exp: ${this.fmt(groups[d].sum)}</span></div>`;
            groups[d].items.forEach(t => {
                const ie = t.type==='expense';
                h += `<div class="txn-row"><div style="display:flex;align-items:center"><div class="cat-icon ${ie?'bg-red-soft':'bg-green-soft'}"><i class="fa-solid ${this.getIcon(t.cat)}"></i></div><div><b>${t.note||t.cat}</b><div style="font-size:0.8rem;color:var(--text-sec)">${t.cat}</div></div></div><div style="text-align:right"><div class="money-value ${ie?'text-danger':'text-success'}">${ie?'-':'+'}${this.fmt(t.amount)}</div><div style="margin-top:5px;"><button class="action-btn" onclick="app.openTxnModal(${t.id})"><i class="fa-solid fa-pen"></i></button><button class="action-btn" onclick="app.cloneTxn(${t.id})"><i class="fa-solid fa-copy"></i></button><button class="action-btn" onclick="app.delTxn(${t.id})"><i class="fa-solid fa-trash"></i></button></div></div></div>`;
            }); c.innerHTML += h + '</div>';
        });
    },

    renderAnalytics(){
        const exp=this.data.txns.filter(t=>t.type==='expense'), cats={}; exp.forEach(t=>cats[t.cat]=(cats[t.cat]||0)+t.amount);
        if(this.charts.c)this.charts.c.destroy(); this.charts.c=new Chart(document.getElementById('chart-cat').getContext('2d'),{type:'doughnut',data:{labels:Object.keys(cats),datasets:[{data:Object.values(cats),backgroundColor:['#4f46e5','#ef4444','#10b981','#f59e0b']}]},options:{plugins:{legend:{position:'bottom'}}}});
        const lbs=[],dts=[]; for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const k=d.toISOString().slice(0,7);lbs.push(d.toLocaleString('default',{month:'short'}));dts.push(exp.filter(t=>t.date.startsWith(k)).reduce((a,b)=>a+b.amount,0));}
        if(this.charts.t)this.charts.t.destroy(); this.charts.t=new Chart(document.getElementById('chart-trend').getContext('2d'),{type:'line',data:{labels:lbs,datasets:[{label:'Exp',data:dts,borderColor:'#4f46e5',tension:0.4}]}});
        const cg=document.getElementById('cal-grid'); cg.innerHTML=''; const ms=document.getElementById('cal-month').value; const [y,m]=ms.split('-').map(Number), dys=new Date(y,m,0).getDate(), st=new Date(y,m-1,1).getDay(), daily={}; exp.filter(t=>t.date.startsWith(ms)).forEach(t=>{const d=parseInt(t.date.split('-')[2]);daily[d]=(daily[d]||0)+t.amount;});
        ['S','M','T','W','T','F','S'].forEach(d=>cg.innerHTML+=`<div class="cal-head">${d}</div>`);
        for(let i=0;i<st;i++)cg.innerHTML+='<div></div>';
        for(let i=1;i<=dys;i++){const v=daily[i]||0; let bg='var(--bg-body)', col='var(--text-main)'; if(v>0) { col='#fff'; bg=v>2000?'var(--danger)':v>500?'var(--warning)':'var(--success)'; } cg.innerHTML+=`<div class="cal-day ${v>0?'active':''}" style="background:${bg}; color:${col}">${i}</div>`;}
        const mc={}; exp.forEach(t=>mc[t.note]=(mc[t.note]||0)+t.amount); document.getElementById('merchant-list').innerHTML=Object.entries(mc).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,a])=>`<div class="flex-between" style="padding:15px;border-bottom:1px solid #eee"><span>${n}</span><b>${this.fmt(a)}</b></div>`).join('');
    },

    renderPlan(){ document.getElementById('shop-container').innerHTML=this.data.shopping.map(s=>`<div class="txn-row"><div><input type="checkbox" onclick="app.buyShop(${s.id})"> <b>${s.name}</b></div><div>${this.fmt(s.est)}<button class="action-btn" onclick="app.delShop(${s.id})"><i class="fa-solid fa-trash"></i></button></div></div>`).join(''); },
    renderWealth(){ let a=0,l=0; this.data.wealth.forEach(w=>w.type==='asset'?a+=w.val:l+=w.val); document.getElementById('w-networth').innerText=this.fmt(a-l); document.getElementById('w-assets').innerText=this.fmt(a); document.getElementById('w-liabs').innerText=this.fmt(l); document.getElementById('asset-list').innerHTML=this.data.wealth.map(w=>`<div class="txn-row" style="border-left:4px solid ${w.type==='asset'?'var(--success)':'var(--danger)'}"><div><b>${w.name}</b></div><div>${this.fmt(w.val)}</div></div>`).join(''); },

    openTxnModal(id=null) { document.getElementById('txnModal').style.display='flex'; if(id){const t=this.data.txns.find(x=>x.id===id);document.getElementById('txn-title').innerText="Edit";document.getElementById('inp-id').value=t.id;document.getElementById('inp-type').value=t.type;this.updateCats();document.getElementById('inp-amt').value=t.orig||t.amount;document.getElementById('inp-date').value=t.date;document.getElementById('inp-note').value=t.note;document.getElementById('inp-cat').value=t.cat;}else{document.getElementById('txn-title').innerText="New";document.getElementById('inp-id').value='';document.querySelector('#txnModal form').reset();document.getElementById('inp-date').valueAsDate=new Date();this.updateCats();} },
    saveTxn(e) { e.preventDefault(); const id=document.getElementById('inp-id').value,type=document.getElementById('inp-type').value,raw=parseFloat(document.getElementById('inp-amt').value),amt=raw*this.data.rates[document.getElementById('inp-curr').value],obj={id:id?parseInt(id):Date.now(),type,amount:amt,orig:raw,date:document.getElementById('inp-date').value,note:document.getElementById('inp-note').value,cat:document.getElementById('inp-cat').value,rec:document.getElementById('inp-rec').checked}; if(id){const i=this.data.txns.findIndex(x=>x.id==id);this.data.txns[i]=obj;}else this.data.txns.push(obj); this.save(); this.closeModal('txnModal'); },
    cloneTxn(id){ const t=this.data.txns.find(x=>x.id===id);this.data.txns.push({...t,id:Date.now(),date:new Date().toISOString().split('T')[0]});this.save(); },
    
    // UTILS
    openAssetModal(){document.getElementById('assetModal').style.display='flex'; const c=document.getElementById('asset-inps'); c.innerHTML=''; if(this.data.wealth.length===0)this.data.wealth=[{name:'Cash',val:0,type:'asset'}]; this.data.wealth.forEach((w,i)=>c.innerHTML+=`<div style="display:flex;gap:5px;margin-bottom:5px"><select onchange="app.data.wealth[${i}].type=this.value"><option value="asset" ${w.type==='asset'?'selected':''}>Asset</option><option value="liab" ${w.type==='liab'?'selected':''}>Liab</option></select><input value="${w.name}" onchange="app.data.wealth[${i}].name=this.value"><input type="number" value="${w.val}" onchange="app.data.wealth[${i}].val=parseFloat(this.value)"><button class="action-btn" onclick="app.remAsset(${i})"><i class="fa-solid fa-trash"></i></button></div>`);},
    addAssetItem(){this.data.wealth.push({name:'',val:0,type:'asset'});this.openAssetModal();}, remAsset(i){this.data.wealth.splice(i,1);this.openAssetModal();}, saveAssets(){this.save();this.closeModal('assetModal');},
    calcIn(v){this.calcStr+=v;this.calcUp();}, calcClr(){this.calcStr="";this.calcUp();}, calcBack(){this.calcStr=this.calcStr.slice(0,-1);this.calcUp();}, calcEq(){try{this.calcStr=eval(this.calcStr).toString();this.calcUp();}catch{this.calcStr="Error";this.calcUp();setTimeout(()=>this.calcClr(),1000);}}, calcUp(){document.getElementById('calc-display').innerText=this.calcStr||"0";},
    genPDF(){const {jsPDF}=window.jspdf,doc=new jsPDF(),ms=document.getElementById('rep-month').value,[y,m]=ms.split('-').map(Number),tx=this.data.txns.filter(t=>t.type==='expense'&&new Date(t.date).getFullYear()===y&&new Date(t.date).getMonth()+1===m).sort((a,b)=>new Date(a.date)-new Date(b.date));const tot=tx.reduce((a,b)=>a+b.amount,0);doc.setFillColor(79,70,229);doc.rect(0,0,210,35,'F');doc.setTextColor(255);doc.setFontSize(22);doc.text("Expense Report",14,23);doc.setFontSize(10);doc.text(ms,195,23,{align:'right'});doc.setTextColor(0);doc.text(`Total: Rs. ${tot}`,14,50);doc.autoTable({startY:60,head:[['Date','Cat','Note','Amt']],body:tx.map(t=>[t.date,t.cat,t.note,`Rs. ${t.amount}`]),theme:'grid'});doc.save(`Rep_${ms}.pdf`);},
    genCSV(){const r=[["Date","Type","Cat","Note","Amt"]];this.data.txns.forEach(t=>r.push([t.date,t.type,t.cat,t.note,t.amount]));const c="data:text/csv;charset=utf-8,"+r.map(e=>e.join(",")).join("\n");const a=document.createElement("a");a.href=encodeURI(c);a.download="data.csv";a.click();},
    
    updateCats(){const t=document.getElementById('inp-type').value,s=document.getElementById('inp-cat'),f=document.getElementById('txn-filter');s.innerHTML='';f.innerHTML='<option value="all">All</option>';this.data.cats[t].forEach(c=>s.innerHTML+=`<option value="${c}">${c}</option>`);[...this.data.cats.expense,...this.data.cats.income].forEach(c=>f.innerHTML+=`<option value="${c}">${c}</option>`);},
    smartCat(){const n=document.getElementById('inp-note').value.toLowerCase(),r={'gym':'Gym','pill':'Medical','uber':'Transport','bill':'Bills'};for(let k in r)if(n.includes(k))document.getElementById('inp-cat').value=r[k];},
    getIcon(c){const m={'Food':'fa-utensils','Bills':'fa-file-invoice','Transport':'fa-car','Electronics':'fa-laptop','Medical':'fa-briefcase-medical','Gym':'fa-dumbbell'};return m[c]||'fa-circle';},
    
    saveBudgets(){document.querySelectorAll('.budget-inp').forEach(i=>this.data.budgets[i.dataset.c]=parseFloat(i.value)||0);this.save();this.closeModal('budgetModal');},
    addShop(){const n=document.getElementById('shop-name').value,e=document.getElementById('shop-est').value;if(n){this.data.shopping.push({id:Date.now(),name:n,est:e||0});this.save();this.renderPlan();this.closeModal('shopModal');}},
    delTxn(id){if(confirm('Delete?')){this.data.txns=this.data.txns.filter(t=>t.id!==id);this.save();}}, delShop(id){this.data.shopping=this.data.shopping.filter(s=>s.id!==id);this.save();this.renderPlan();}, 
    buyShop(id){const i=this.data.shopping.find(s=>s.id===id);if(confirm('Buy?')){this.data.txns.push({id:Date.now(),type:'expense',amount:i.est,date:new Date().toISOString().split('T')[0],cat:'Shopping',note:i.name});this.delShop(id);}},
    calcEMI(){const p=document.getElementById('emi-p').value,r=document.getElementById('emi-r').value/1200,n=document.getElementById('emi-n').value*12,e=(p*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);document.getElementById('emi-res').innerText=`EMI: ${this.fmt(Math.round(e))}`;document.getElementById('emi-res').style.display='block';},
    backup(){const a=document.createElement('a');a.href="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(this.data));a.download="backup.json";a.click();},restore(i){const r=new FileReader();r.onload=e=>{this.data=JSON.parse(e.target.result);this.save();location.reload();};r.readAsText(i.files[0]);},reset(){if(confirm('Reset all?')){localStorage.removeItem('proFinanceV17');location.reload();}},
    toggleTheme(){document.body.classList.toggle('dark-mode');},togglePrivacy(){document.body.classList.toggle('blur-mode');},shareSummary(){const d=new Date(),exp=this.data.txns.filter(t=>t.type==='expense'&&new Date(t.date).getMonth()===d.getMonth()),tot=exp.reduce((a,b)=>a+b.amount,0);navigator.clipboard.writeText(`Report: ${this.fmt(tot)}`);alert('Copied');},
    switchTab(i,b){document.querySelectorAll('.view-section').forEach(e=>e.style.display='none');document.getElementById('view-'+i).style.display='block';document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(i==='analytics')this.renderAnalytics();if(i==='wealth')this.openAssetModal();},
    openModal(id){document.getElementById(id).style.display='flex';if(id==='assetModal')this.openAssetModal();},closeModal(id){document.getElementById(id).style.display='none';}
};

document.addEventListener('DOMContentLoaded', ()=>app.init());
