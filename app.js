
const $ = s => document.querySelector(s);

const euro = n => new Intl.NumberFormat("fr-FR",{
style:"currency",
currency:"EUR",
maximumFractionDigits:0
}).format(n);

const clean = s => String(s || "")
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")
.toLowerCase();

function labelHTML(labels) {
return labels.map(l =>
`<span class="pill ${l.toLowerCase()}">${l}</span>`
).join("");
}

function priceText(c) {
return `${euro(c.price[0])}–${euro(c.price[1])}/kg`;
}

function renderCards(list) {
const grid = $("#cheeseGrid");

$("#resultCount").textContent =
`${list.length} fromage(s) affiché(s)`;

if (!list.length) {
grid.innerHTML = "<p>Aucun fromage trouvé.</p>";
return;
}

grid.innerHTML = list.map(c => `
<article class="cheese-card">

<div class="cheese-visual">
<span>${c.name}</span>
</div>

<div class="card-content">

<h3>${c.name}</h3>

<p class="family">${c.family}</p>

<div class="label-list">
${labelHTML(c.label)}
</div>

<div class="card-info">
<span>${c.milk}</span>
<span>${c.region}</span>
</div>

<div class="card-info">
<span>Prix indicatif</span>
<span class="price">${priceText(c)}</span>
</div>

<button class="details-btn"
onclick="openCheese('${c.id}')">
Découvrir la fiche →
</button>

</div>
</article>
`).join("");
}

function getFiltered() {

const q = clean($("#search").value);
const family = $("#family").value;
const milk = $("#milk").value;
const region = $("#region").value;
const label = $("#label").value;
const sort = $("#sort").value;

let arr = CHEESES.filter(c =>

(!q || clean([
c.name,c.family,c.milk,c.region,
c.place,c.description,c.taste
].join(" ")).includes(q))

&& (family === "all" || c.family === family)
&& (milk === "all" || c.milk === milk)
&& (region === "all" || c.region === region)
&& (label === "all" || c.label.includes(label))

);

if(sort === "name")
arr.sort((a,b)=>a.name.localeCompare(b.name,"fr"));

if(sort === "family")
arr.sort((a,b)=>a.family.localeCompare(b.family,"fr"));

if(sort === "priceAsc")
arr.sort((a,b)=>a.price[0]-b.price[0]);

if(sort === "priceDesc")
arr.sort((a,b)=>b.price[1]-a.price[1]);

return arr;
}

function applyFilters() {
renderCards(getFiltered());
}

function openCheese(id) {

const c = CHEESES.find(x=>x.id===id);
if(!c) return;

$("#modalBody").innerHTML = `

<div class="modal-head">

<div>
<span class="kicker">Fiche fromagère</span>
<h2>${c.name}</h2>
<div class="label-list">${labelHTML(c.label)}</div>
</div>

<button class="close" onclick="closeModal()">×</button>

</div>

<p>${c.description}</p>

<div class="facts">

<div class="fact">
<span>Famille</span>
<strong>${c.family}</strong>
</div>

<div class="fact">
<span>Type de lait</span>
<strong>${c.milk}</strong>
</div>

<div class="fact">
<span>Région</span>
<strong>${c.region}</strong>
</div>

<div class="fact">
<span>Lieu de production</span>
<strong>${c.place}</strong>
</div>

<div class="fact">
<span>Texture</span>
<strong>${c.texture}</strong>
</div>

<div class="fact">
<span>Prix indicatif</span>
<strong>${priceText(c)}</strong>
</div>

<div class="fact">
<span>Saveurs</span>
<strong>${c.taste}</strong>
</div>

<div class="fact">
<span>Saison</span>
<strong>${c.season}</strong>
</div>

</div>

<h3>Son appellation</h3>

<p>
${c.label.includes("AOP")
? "AOP : toutes les étapes de production doivent être liées à une aire géographique définie."
: "IGP : au moins une étape de production, transformation ou élaboration est liée à une aire géographique déterminée."
}
</p>

<p class="note">
Les prix sont indicatifs et varient selon le point de vente,
le format et l'affinage.
</p>

`;

$("#modal").classList.add("open");
document.body.style.overflow="hidden";
}

function closeModal() {
$("#modal").classList.remove("open");
document.body.style.overflow="";
}

function resetFilters() {

["search","family","milk","region","label","sort"]
.forEach(id => {

const el = document.getElementById(id);

el.value = id === "search" ? "" :
id === "sort" ? "default" : "all";

});

applyFilters();
}

document.addEventListener("DOMContentLoaded",()=>{

[...new Set(CHEESES.map(c=>c.family))]
.sort()
.forEach(f=>{
$("#family").insertAdjacentHTML("beforeend",
`<option>${f}</option>`);
});

[...new Set(CHEESES.map(c=>c.milk))]
.sort()
.forEach(m=>{
$("#milk").insertAdjacentHTML("beforeend",
`<option>${m}</option>`);
});

[...new Set(CHEESES.map(c=>c.region))]
.sort()
.forEach(r=>{
$("#region").insertAdjacentHTML("beforeend",
`<option>${r}</option>`);
});

["search","family","milk","region","label","sort"]
.forEach(id=>{
document.getElementById(id).addEventListener(
id==="search"?"input":"change",
applyFilters
);
});

$("#menuBtn").addEventListener("click",()=>{
$("#nav").classList.toggle("open");
});

$("#modal").addEventListener("click",e=>{
if(e.target.id==="modal") closeModal();
});

document.addEventListener("keydown",e=>{
if(e.key==="Escape") closeModal();
});

renderCards(CHEESES);

});
