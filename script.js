const app = {
    data: {
        txns: [], budgets: {}, shopping: [], wealth: [],
        cats: {
            expense: ['Food','Bills','Transport','Electronics','Medical','Gym','Shopping','Education','Rent','Other'],
            income: ['Salary','Freelance','Investment','Gift','Other']
        },
        rates: { INR:1, USD:84 }
    },

    charts: {}, calcStr: "",

    init() {
        const s = localStorage.getItem('expenseTrackerData');
        if(s) this.data = JSON.parse(s);

        document.getElementById('inp-date').valueAsDate = new Date();
        document.getElementById('rep-month').value = new Date().toISOString().slice(0,7);
        document.getElementById('cal-month').value = new Date().toISOString().slice(0,7);

        this.updateCats();
        this.renderAll();

        document.addEventListener('keydown',(e)=>{
            if(document.getElementById('view-calculator').style.display==='block'){
                if(e.key>='0' && e.key<='9') app.calcIn(e.key);
                if(['+','-','*','/','%','.'].includes(e.key)) app.calcIn(e.key);
                if(e.key==='Enter') app.calcEq();
                if(e.key==='Backspace') app.calcBack();
                if(e.key==='Escape') app.calcClr();
            }
        });
    },

    save(){
        localStorage.setItem('expenseTrackerData',JSON.stringify(this.data));
        this.renderAll();
    },

    fmt(n){ return '₹' + n.toLocaleString(); },

    calcTaxSlab(){
        const i = parseFloat(document.getElementById('tax-inc').value) || 0;
        let t = 0;

        if(i > 1500000) t = (i-1500000)*0.3 + 150000;
        else if(i > 1200000) t = (i-1200000)*0.2 + 90000;
        else if(i > 900000) t = (i-900000)*0.15 + 45000;
        else if(i > 600000) t = (i-600000)*0.1 + 15000;
        else if(i > 300000) t = (i-300000)*0.05;

        const rate = (t/i)*100;
        document.getElementById('tax-rate').value = rate.toFixed(2);

        this.showTaxRes(t,i);
    },

    calcTaxCustom(){
        const i = parseFloat(document.getElementById('tax-inc').value) || 0;
        const r = parseFloat(document.getElementById('tax-rate').value) || 0;

        const t = i*(r/100);
        this.showTaxRes(t,i);
    },

    showTaxRes(t,i){
        document.getElementById('tax-res').innerHTML =
        `Tax: <span class="text-danger">${this.fmt(Math.round(t))}</span><br>
        Net Income: <span class="text-success">${this.fmt(Math.round(i-t))}</span>`;

        document.getElementById('tax-res').style.display='block';
    },

    renderAll(){
        this.renderDash();
        this.renderTxn();
        this.renderAnalytics();
        this.renderPlan();
        this.renderWealth();
    },

    getIcon(c){
        const m={
            'Food':'fa-utensils',
            'Bills':'fa-file-invoice',
            'Transport':'fa-bus',
            'Electronics':'fa-mobile-screen',
            'Medical':'fa-briefcase-medical',
            'Gym':'fa-dumbbell'
        };
        return m[c] || 'fa-circle';
    },

    calcIn(v){ this.calcStr+=v; this.calcUp(); },
    calcClr(){ this.calcStr=""; this.calcUp(); },
    calcBack(){ this.calcStr=this.calcStr.slice(0,-1); this.calcUp(); },

    calcEq(){
        try{
            this.calcStr = eval(this.calcStr).toString();
            this.calcUp();
        }
        catch{
            this.calcStr="Error";
            this.calcUp();
            setTimeout(()=>this.calcClr(),1000);
        }
    },

    calcUp(){
        document.getElementById('calc-display').innerText = this.calcStr || "0";
    },

    genPDF(){
        const {jsPDF}=window.jspdf;
        const doc=new jsPDF();

        const ms=document.getElementById('rep-month').value;

        doc.setFillColor(79,70,229);
        doc.rect(0,0,210,35,'F');

        doc.setTextColor(255);
        doc.setFontSize(22);
        doc.text("Smart Expense Report",14,23);

        doc.save(`Expense_Report_${ms}.pdf`);
    },

    shareSummary(){
        const d=new Date();

        const exp=this.data.txns.filter(
            t=>t.type==='expense' && new Date(t.date).getMonth()===d.getMonth()
        );

        const tot=exp.reduce((a,b)=>a+b.amount,0);

        navigator.clipboard.writeText(`Monthly Expense: ${this.fmt(tot)}`);
        alert('Summary copied');
    },

    reset(){
        if(confirm('Reset all data?')){
            localStorage.removeItem('expenseTrackerData');
            location.reload();
        }
    },

    switchTab(i,b){
        document.querySelectorAll('.view-section').forEach(e=>e.style.display='none');
        document.getElementById('view-'+i).style.display='block';

        document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
    }
};

document.addEventListener('DOMContentLoaded',()=>app.init());
