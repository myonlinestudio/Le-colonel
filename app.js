
const $ = s => document.querySelector(s);

const photoCache = (() => { try { return JSON.parse(localStorage.getItem("leColonelPhotoCache") || "{}"); } catch (_) { return {}; } })();
async function loadCheesePhoto(id, img, retry = false) {
  const cheese = CHEESES.find(item => item.id === id); if (!cheese || !img) return;
  const wrapper = img.closest(".cheese-visual, .modal-photo");
  const credit = wrapper && wrapper.querySelector(".image-credit, .photo-credit a");
  const cached = photoCache[id];
  if (!retry && cached && cached.url) {
    cheese.image = cached.url; cheese.imageSource = cached.source || ""; cheese.imageCredit = cached.credit || "Wikimedia Commons"; img.src = cached.url;
    if (credit) { credit.href = cached.source || "https://commons.wikimedia.org/"; credit.textContent = "Photo : Wikimedia Commons"; credit.style.display = ""; } return;
  }
  if (!retry && cheese.image) { img.src = cheese.image; return; }
  if (wrapper) wrapper.classList.add("image-loading");
  try {
    const query = 'filetype:bitmap "' + cheese.name + '" cheese';
    const endpoint = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(query) + "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1000&format=json&origin=*";
    let response = await fetch(endpoint); let data = await response.json(); let pages = Object.values(data.query && data.query.pages || {});
    if (!pages.length) {
      const fallback = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent('filetype:bitmap "' + cheese.name + '"') + "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1000&format=json&origin=*";
      response = await fetch(fallback); data = await response.json(); pages = Object.values(data.query && data.query.pages || {});
    }
    const page = pages.find(p => p.imageinfo && p.imageinfo[0] && (p.imageinfo[0].thumburl || p.imageinfo[0].url)); if (!page) throw new Error("Photo introuvable");
    const info = page.imageinfo[0], url = info.thumburl || info.url, source = info.descriptionurl || "https://commons.wikimedia.org/";
    const artist = info.extmetadata && info.extmetadata.Artist && info.extmetadata.Artist.value ? info.extmetadata.Artist.value.replace(/<[^>]*>/g, "").trim() : "";
    const license = info.extmetadata && info.extmetadata.LicenseShortName ? info.extmetadata.LicenseShortName.value : "";
    cheese.image = url; cheese.imageSource = source; cheese.imageCredit = [artist, license].filter(Boolean).join(" — ") || "Wikimedia Commons";
    photoCache[id] = {url:url, source:source, credit:cheese.imageCredit}; try { localStorage.setItem("leColonelPhotoCache", JSON.stringify(photoCache)); } catch (_) {}
    img.src = url; if (credit) { credit.href = source; credit.textContent = "Photo : Wikimedia Commons"; credit.style.display = ""; }
    const modalCredit = document.querySelector('[data-photo-credit="' + id + '"]'); if (modalCredit) { modalCredit.href = source; modalCredit.textContent = cheese.imageCredit; }
  } catch (_) { if (wrapper) { wrapper.classList.remove("image-loading"); wrapper.classList.add("image-failed"); } }
}
function handleImageError(id, img) {
  if (img.dataset.retried === "yes") { img.closest(".cheese-visual, .modal-photo")?.classList.add("image-failed"); return; }
  img.dataset.retried = "yes"; const cheese = CHEESES.find(item => item.id === id); if (cheese) cheese.image = ""; loadCheesePhoto(id, img, true);
}
function observeCheesePhotos(root) {
  const images = root.querySelectorAll('img[data-cheese-id]:not([src])');
  if (!("IntersectionObserver" in window)) { images.forEach(img => loadCheesePhoto(img.dataset.cheeseId, img)); return; }
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { observer.unobserve(entry.target); loadCheesePhoto(entry.target.dataset.cheeseId, entry.target); } }); }, {rootMargin:"220px"});
  images.forEach(img => observer.observe(img));
}


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

<div class="cheese-visual image-loading">
<img data-cheese-id="${c.id}" alt="Photographie du fromage ${c.name}" loading="lazy" onload="this.parentElement.classList.remove('image-loading','image-failed')" onerror="handleImageError('${c.id}', this)">
<span class="image-fallback">${c.name}</span>
<a class="image-credit" href="${c.imageSource || "https://commons.wikimedia.org/"}" target="_blank" rel="noopener" style="${c.imageSource ? "" : "display:none"}">Photo : Wikimedia Commons</a>
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
observeCheesePhotos(grid);
}

function getFiltered() {

const q = clean($("#search").value);
const family = $("#family").value;
const milk = $("#milk").value;
const region = $("#region").value;
const country = $("#country").value;
const label = $("#label").value;
const sort = $("#sort").value;

let arr = CHEESES.filter(c =>

(!q || clean([
c.name,c.family,c.milk,c.region,c.country,
c.place,c.description,c.taste
].join(" ")).includes(q))

&& (family === "all" || c.family === family)
&& (milk === "all" || c.milk === milk)
&& (region === "all" || c.region === region)
&& (country === "all" || (c.country || c.region) === country)
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

<div class="modal-photo image-loading">
<img data-cheese-id="${c.id}" alt="Photographie du fromage ${c.name}" onload="this.parentElement.classList.remove('image-loading','image-failed')" onerror="handleImageError('${c.id}', this)">
<span class="image-fallback">${c.name}</span>
</div>
<p class="photo-credit">Crédit photo : <a data-photo-credit="${c.id}" href="${c.imageSource || "https://commons.wikimedia.org/"}" target="_blank" rel="noopener">${c.imageCredit || "Wikimedia Commons"}</a></p>
<p class="photo-credit">Crédit photo : <a href="${c.imageSource}" target="_blank" rel="noopener">${c.imageCredit}</a></p>

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

loadCheesePhoto(c.id, $("#modalBody").querySelector("img[data-cheese-id]"));
$("#modal").classList.add("open");
document.body.style.overflow="hidden";
}

function closeModal() {
$("#modal").classList.remove("open");
document.body.style.overflow="";
}

function resetFilters() {

["search","family","milk","region","country","label","sort"]
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

["search","family","milk","region","country","label","sort"]
.forEach(id=>{
document.getElementById(id).addEventListener(
id==="search"?"input":"change",
applyFilters
);
});

$("#filterToggle").addEventListener("click",()=>{
const box = document.querySelector(".filter-box");
const opened = box.classList.toggle("open");
$("#filterToggle").textContent = opened ? "Masquer les filtres −" : "Afficher les filtres ＋";
$("#filterToggle").setAttribute("aria-expanded", String(opened));
});

[...new Set(CHEESES.map(c=>c.country || c.region))].sort((x,y)=>x.localeCompare(y,"fr")).forEach(country=>{
$("#country").insertAdjacentHTML("beforeend", `<option value="${country}">${country}</option>`);
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
