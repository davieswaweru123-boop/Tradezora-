document.addEventListener("DOMContentLoaded",()=>{

const $=s=>document.querySelector(s),
user=JSON.parse(localStorage.getItem("tradezoraDemoUser")||"null");

if(!user){
location.href="auth.html";
return;
}

/* DEMO BALANCE */
let balance=10000;
localStorage.setItem("tradezoraDemoBalance","10000");

let stake=Number(localStorage.getItem("tradezoraDemoStake")||10),
price=1000,
history=[],
positions=[],
digit=0,
pnl=0;

$("#profileName").textContent=user.name||"Demo Trader";
$("#profileEmail").textContent=user.email||"";
$("#avatar").textContent=(user.name||"T")[0].toUpperCase();

function money(n){
return"$"+n.toFixed(2);
}

function toast(t){
const e=$("#toast");
if(!e)return;
e.textContent=t;
e.classList.add("show");
setTimeout(()=>e.classList.remove("show"),1800);
}

function renderBalance(){
$("#balance").textContent=money(balance);
$("#stake").textContent=money(stake);
$("#sessionPnl").textContent=(pnl>=0?"+":"")+money(pnl).replace("$","$");
}

renderBalance();


/* MENU */

const menu=$("#sideMenu"),
overlay=$("#overlay");

$("#menuBtn").onclick=()=>{
menu.classList.add("open");
overlay.classList.add("show");
};

$("#closeMenu").onclick=()=>{
menu.classList.remove("open");
overlay.classList.remove("show");
};

overlay.onclick=$("#closeMenu").onclick;

$("#logout").onclick=()=>{
localStorage.removeItem("tradezoraDemoUser");
location.href="auth.html";
};

$("#depositBtn").onclick=()=>{
toast("Demo account only — real deposits are disabled.");
};

$("#themeSwitch").onclick=()=>{
toast("Dark theme is active.");
};


/* DIGITS */

const digits=$("#digits"),
contracts=$("#contractDigits");

for(let i=0;i<10;i++){

const a=document.createElement("button"),
b=document.createElement("button");

a.textContent=i;
b.textContent=i;

a.onclick=()=>{
digit=i;
[...digits.children].forEach(x=>x.classList.remove("active"));
a.classList.add("active");
};

b.onclick=()=>{
digit=i;
[...contracts.children].forEach(x=>x.classList.remove("active"));
b.classList.add("active");
};

digits.appendChild(a);
contracts.appendChild(b);
}

digits.children[0].classList.add("active");
contracts.children[0].classList.add("active");


/* STAKE */

$("#stakeMinus").onclick=()=>{
stake=Math.max(1,stake-1);
localStorage.setItem("tradezoraDemoStake",stake);
renderBalance();
};

$("#stakePlus").onclick=()=>{
stake=Math.min(100,balance||100,stake+1);
localStorage.setItem("tradezoraDemoStake",stake);
renderBalance();
};

$("#scanner").onclick=()=>{
toast("AI Scanner is a demo interface.");
};


/* CHART */

let chart=$("#priceChart"),
ctx=chart.getContext("2d"),
series=Array.from(
{length:80},
()=>price+(Math.random()-.5)*100
);

function resize(){

const r=chart.getBoundingClientRect(),
d=devicePixelRatio||1;

chart.width=r.width*d;
chart.height=r.height*d;

ctx.setTransform(d,0,0,d,0,0);

draw();
}

function draw(){

const w=chart.clientWidth,
h=chart.clientHeight;

ctx.clearRect(0,0,w,h);

const min=Math.min(...series)-20,
max=Math.max(...series)+20;

ctx.beginPath();

series.forEach((v,i)=>{

const x=i*(w/(series.length-1)),
y=h-((v-min)/(max-min))*h*.82-h*.05;

i?ctx.lineTo(x,y):ctx.moveTo(x,y);

});

ctx.strokeStyle="#16e58a";
ctx.lineWidth=2;
ctx.stroke();
}

window.addEventListener("resize",resize);

resize();


/* SIMULATED PRICE */

setInterval(()=>{

const old=price;

price+=(Math.random()-.48)*18;

series.push(price);
series.shift();

$("#pct").textContent=
(price>=old?"+":"")+
((price-old)/old*100).toFixed(3)+"%";

$("#pct").style.color=
price>=old?"#16e58a":"#ff5d6c";

draw();

},1200);


/* CHART CONTROLS */

$("#zoomIn").onclick=()=>{
toast("Chart zoom control is demo-only.");
};

$("#zoomOut").onclick=()=>{
toast("Chart zoom control is demo-only.");
};

$("#resetZoom").onclick=()=>{
toast("Chart reset.");
};


/* POSITIONS + HISTORY */

function renderLists(){

const p=$("#positionsList"),
h=$("#historyList");

p.innerHTML=positions.length
?positions.map(x=>`
<div class="position">
<span>${x.type} • ${money(x.stake)} • digit ${x.digit}</span>
<strong>Open</strong>
</div>
`).join("")
:'<div class="empty">No open positions.</div>';

h.innerHTML=history.length
?history.slice().reverse().map(x=>`
<div class="history-item">
<span>${x.type} • ${money(x.stake)} • ${x.digit}</span>
<strong class="${x.win?'win':'loss'}">
${x.win?"WIN +"+money(x.profit):"LOSS -"+money(x.stake)}
</strong>
</div>
`).join("")
:'<div class="empty">No trades yet.</div>';

}


/* TRADE */

function trade(type){

if(stake>balance){
toast("Not enough demo balance.");
return;
}

balance-=stake;

localStorage.setItem(
"tradezoraDemoBalance",
balance
);

const pos={
id:Date.now(),
type,
stake,
digit
};

positions.push(pos);

renderBalance();
renderLists();

toast(type+" demo position opened.");

setTimeout(()=>{

const idx=positions.findIndex(
x=>x.id===pos.id
);

if(idx<0)return;

const win=
Math.floor(Math.random()*10)===digit;

const profit=win?stake*.85:0;

if(win){

balance+=stake+profit;
pnl+=profit;

}else{

pnl-=stake;

}

positions.splice(idx,1);

history.push({
...pos,
win,
profit
});

localStorage.setItem(
"tradezoraDemoBalance",
balance
);

renderBalance();
renderLists();

toast(
win
?"Demo trade won."
:"Demo trade lost."
);

},5000);

}


$("#match").onclick=()=>{
trade("MATCH");
};

$("#differ").onclick=()=>{
trade("DIFFER");
};

$("#clearPositions").onclick=()=>{
positions=[];
renderLists();
toast("Open positions cleared from view.");
};

renderLists();

});
