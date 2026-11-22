
const QUIZ = {

facile: [

["Quel lait est utilisé pour le Roquefort ?",
["Vache","Brebis","Chèvre","Buffle"],1,
"Le Roquefort est élaboré à partir de lait de brebis."],

["À quelle famille appartient le Comté ?",
["Pâte persillée","Pâte pressée cuite","Pâte molle","Fromage frais"],1,
"Le Comté est une pâte pressée cuite."],

["Quel fromage est surnommé le Colonel ?",
["Livarot","Munster","Morbier","Langres"],0,
"Le Livarot possède cinq bandelettes traditionnelles."],

["Quel label garantit un lien fort avec un terroir ?",
["AOP","Bio","Sans lactose","Commerce équitable"],0,
"L'AOP protège un produit lié à une aire géographique définie."],

["Quel fromage possède une ligne noire ?",
["Brie","Morbier","Beaufort","Crottin"],1,
"Le Morbier est reconnaissable à sa ligne noire centrale."]
],

intermediaire: [

["Quelle famille regroupe le Bleu d'Auvergne ?",
["Pâte pressée","Pâte persillée","Pâte molle","Pâte filée"],1,
"Le Bleu d'Auvergne est une pâte persillée."],

["Quelle forme est célèbre pour le Neufchâtel ?",
["Étoile","Cœur","Cylindre","Pyramide"],1,
"Le Neufchâtel est notamment façonné en forme de cœur."],

["Quelle différence caractérise l'AOP ?",
["Lait de vache obligatoire","Toutes les étapes liées à l'aire","Label bio","Aucune"],1,
"L'AOP impose que toutes les étapes se déroulent dans l'aire définie."],

["Quel fromage possède une IGP ?",
["Tomme de Savoie","Beaufort","Reblochon","Abondance"],0,
"La Tomme de Savoie bénéficie d'une IGP."],

["Dans quoi est enveloppé le Banon ?",
["Feuilles de châtaignier","Feuilles de vigne","Foin","Papier"],0,
"Le Banon est enveloppé dans des feuilles de châtaignier."]
],

expert: [

["Où sont affinés les Roquefort ?",
["Caves de Roquefort-sur-Soulzon","Vosges","Pays de Bray","Tarentaise"],0,
"Le Roquefort est affiné dans les caves de Roquefort-sur-Soulzon."],

["Quelle caractéristique possède le Beaufort ?",
["Cuvette supérieure","Talon concave","Paille centrale","Croûte cendrée"],1,
"Le Beaufort possède un talon concave."],

["À quelle période est lié le Salers traditionnel ?",
["Pâturage","Hiver uniquement","Toute l'année sans saisonnalité","Vendanges"],0,
"Le Salers fermier est lié à la période de pâturage."],

["Quel fromage utilise du lait de bufflonne ?",
["Feta","Mozzarella di Bufala","Parmigiano","Ossau-Iraty"],1,
"La Mozzarella di Bufala Campana utilise du lait de bufflonne."],

["Quelle est la particularité du Brocciu ?",
["Lactosérum","Pâte persillée","Caves de craie","Lait de vache uniquement"],0,
"Le Brocciu est élaboré à partir de lactosérum."]
]

};

let state = {};

function stats() {
try {
return JSON.parse(localStorage.getItem("leColonelQuiz")) ||
{points:0,attempts:0,correct:0,streak:0,best:0};
} catch(e) {
return {points:0,attempts:0,correct:0,streak:0,best:0};
}
}

function save(s) {
localStorage.setItem("leColonelQuiz",JSON.stringify(s));
}

function updateStats() {
const s=stats();
document.getElementById("points").textContent=s.points;
document.getElementById("success").textContent=
s.attempts ? Math.round(s.correct/s.attempts*100)+"%" : "—";
document.getElementById("best").textContent=s.best;
}

function start(level) {
state={
level,
questions:QUIZ[level].slice().sort(()=>Math.random()-.5),
index:0,
correct:0,
answered:false
};

document.getElementById("levels").classList.add("hidden");
document.getElementById("questionArea").classList.remove("hidden");
render();
}

function render() {
const q=state.questions[state.index];

document.getElementById("questionArea").innerHTML=`

<div class="question-meta">
<span>${state.level}</span>
<span>Question ${state.index+1}/5</span>
</div>

<div class="progress">
<span style="width:${state.index/5*100}%"></span>
</div>

<div class="question">${q[0]}</div>

<div class="answers">
${q[1].map((a,i)=>`
<button class="answer" onclick="answer(${i})">
${String.fromCharCode(65+i)} · ${a}
</button>
`).join("")}
</div>

<div id="feedback"></div>
`;
}

function answer(i) {

if(state.answered) return;
state.answered=true;

const q=state.questions[state.index];
const good=i===q[2];

document.querySelectorAll(".answer").forEach((b,n)=>{
b.disabled=true;
if(n===q[2]) b.classList.add("correct");
else if(n===i) b.classList.add("incorrect");
});

if(good) state.correct++;

const s=stats();
s.attempts++;

if(good) {
s.correct++;
s.points+=10;
s.streak++;
s.best=Math.max(s.best,s.streak);
} else {
s.streak=0;
}

save(s);
updateStats();

document.getElementById("feedback").innerHTML=`
<div class="explanation">
<strong>${good?"Bonne réponse · +10 points":"Pas tout à fait"}</strong>
${q[3]}
</div>
<button class="btn" onclick="next()">
${state.index===4?"Voir le résultat":"Question suivante →"}
</button>
`;
}

function next() {

if(state.index<4) {
state.index++;
state.answered=false;
render();
return;
}

document.getElementById("questionArea").innerHTML=`
<div style="text-align:center;padding:25px">
<h2>Résultat</h2>
<div style="font:normal 60px Georgia,serif">
${state.correct}/5
</div>
<p>${state.correct*10} points gagnés</p>
<button class="btn" onclick="backToLevels()">
Recommencer
</button>
</div>
`;
}

function backToLevels() {
document.getElementById("questionArea").classList.add("hidden");
document.getElementById("levels").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded",updateStats);
