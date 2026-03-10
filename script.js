/* ================= VARIABEL HTML ================= */

const homePage = document.getElementById("homePage");
const loginPage = document.getElementById("loginPage");
const tesPage = document.getElementById("tesPage");
const hasilPage = document.getElementById("hasilPage");
const loginGuru = document.getElementById("loginGuru");
const dashboard = document.getElementById("dashboard");

const nama = document.getElementById("nama");
const kelas = document.getElementById("kelas");
const passwordGuru = document.getElementById("passwordGuru");

const soalBox = document.getElementById("soalBox");
const nomorSoal = document.getElementById("nomorSoal");
const timer = document.getElementById("timer");
const nilai = document.getElementById("nilai");
const statistik = document.getElementById("statistik");
const grafikNilai = document.getElementById("grafikNilai");


/* ================= KONSTANTA ================= */

const PASSWORD_GURU = "admin123";


/* ================= DATA TES ================= */

let soal = [];
let jawaban = [];
let index = 0;
let waktu = 20 * 60;
let timerInterval;


/* ================= NAVIGASI ================= */

document.getElementById("btnMulai").onclick = () => {
homePage.style.display = "none";
loginPage.style.display = "block";
};

document.getElementById("btnDashboard").onclick = () => {
homePage.style.display = "none";
loginGuru.style.display = "block";
};

document.getElementById("btnMulaiTes").onclick = mulaiTes;
document.getElementById("btnSelesai").onclick = selesaiTes;
document.getElementById("btnLoginGuru").onclick = cekPassword;

function kembaliHome(){
location.reload();
}


/* ================= LOAD SOAL ================= */

async function loadSoal(){

try{

const res = await fetch("soal.json");
soal = await res.json();

}catch(e){

alert("Gagal memuat soal.json");

}

}


/* ================= MULAI TES ================= */

async function mulaiTes(){

if(nama.value.trim()==="" || kelas.value.trim()===""){
alert("Isi nama dan kelas terlebih dahulu!");
return;
}

await loadSoal();

if(soal.length === 0){
alert("Soal belum tersedia");
return;
}

jawaban = Array(soal.length).fill(null);
index = 0;

loginPage.style.display = "none";
tesPage.style.display = "block";

buatNomorSoal();
tampilkanSoal();
mulaiTimer();

}


/* ================= NOMOR SOAL ================= */

function buatNomorSoal(){

nomorSoal.innerHTML = "";

soal.forEach((s,i)=>{

const btn = document.createElement("div");

btn.innerText = i+1;
btn.className = "nomorBtn";

btn.onclick = ()=>{

index = i;
tampilkanSoal();
updateNomor();

};

nomorSoal.appendChild(btn);

});

updateNomor();

}


function updateNomor(){

document.querySelectorAll(".nomorBtn").forEach((b,i)=>{

b.classList.remove("aktif","jawab");

if(i === index) b.classList.add("aktif");

if(jawaban[i] !== null) b.classList.add("jawab");

});

}


/* ================= TAMPILKAN SOAL ================= */

function tampilkanSoal(){

const s = soal[index];

let html = `
<div class="soalCard">

<h3>Soal ${index+1}</h3>

<p>${s.t}</p>

<div class="opsiJawaban">
`;

s.a.forEach((p,i)=>{

const checked = jawaban[index] === i ? "checked" : "";

html += `
<label class="opsiItem">

<input type="radio" name="jawaban" ${checked}
onclick="jawaban[${index}] = ${i}; updateNomor();">

<span>${p}</span>

</label>
`;

});

html += "</div></div>";

soalBox.innerHTML = html;

}


/* ================= NAVIGASI SOAL ================= */

function soalBerikutnya(){

if(index < soal.length - 1){

index++;
tampilkanSoal();
updateNomor();

}

}

function soalSebelumnya(){

if(index > 0){

index--;
tampilkanSoal();
updateNomor();

}

}


/* ================= TIMER ================= */

function mulaiTimer(){

clearInterval(timerInterval);

let detik = waktu;

timerInterval = setInterval(()=>{

detik--;

const m = Math.floor(detik/60).toString().padStart(2,"0");
const d = (detik%60).toString().padStart(2,"0");

timer.innerHTML = `${m}:${d}`;

if(detik <= 0){

clearInterval(timerInterval);
alert("Waktu habis");
selesaiTes(true);

}

},1000);

}


/* ================= SELESAI TES ================= */

function selesaiTes(force=false){

clearInterval(timerInterval);

let skor = 0;

soal.forEach((s,i)=>{

if(jawaban[i] === s.k){
skor += s.bobot || 1;
}

});

const total = soal.reduce((sum,s)=>sum+(s.bobot||1),0);

const nilaiAkhir = Math.round((skor/total)*100);


db.collection("nilaiSiswa").add({

nama: nama.value.trim(),
kelas: kelas.value.trim(),
nilai: nilaiAkhir,
timestamp: firebase.firestore.FieldValue.serverTimestamp()

});

tesPage.style.display="none";
hasilPage.style.display="block";

nilai.innerHTML = `<h2>${nilaiAkhir}</h2>`;

}


/* ================= LOGIN GURU ================= */

function cekPassword(){

if(passwordGuru.value === PASSWORD_GURU){

loginGuru.style.display="none";
dashboard.style.display="block";

loadDashboard();

}else{

alert("Password salah!");

}

}


/* ================= DASHBOARD ================= */

function loadDashboard(){

db.collection("nilaiSiswa").orderBy("nilai","desc").get()

.then(snapshot=>{

let html = "<h3>Rekap Nilai</h3>";

html += "<table border='1'><tr><th>Nama</th><th>Kelas</th><th>Nilai</th></tr>";

const namaArr = [];
const nilaiArr = [];

snapshot.forEach(doc=>{

const d = doc.data();

html += `<tr><td>${d.nama}</td><td>${d.kelas}</td><td>${d.nilai}</td></tr>`;

namaArr.push(d.nama);
nilaiArr.push(d.nilai);

});

html += "</table>";

statistik.innerHTML = html;


new Chart(grafikNilai,{

type:"bar",

data:{
labels:namaArr,
datasets:[{
label:"Nilai",
data:nilaiArr,
backgroundColor:"rgba(54,162,235,0.6)"
}]
},

options:{
scales:{
y:{
beginAtZero:true,
max:100
}
}
}

});

});

}


/* ================= EXPORT EXCEL ================= */

function exportExcel(){

db.collection("nilaiSiswa").get().then(snapshot=>{

let csv = "Nama,Kelas,Nilai\n";

snapshot.forEach(doc=>{

const d = doc.data();

csv += `${d.nama},${d.kelas},${d.nilai}\n`;

});

const blob = new Blob([csv],{type:"text/csv"});

const url = URL.createObjectURL(blob);

const a = document.createElement("a");

a.href = url;
a.download = "nilai_siswa.csv";

a.click();

});

}


/* ================= RESET NILAI ================= */

function resetNilai(){

if(!confirm("Yakin ingin menghapus semua nilai?")) return;

db.collection("nilaiSiswa").get().then(snapshot=>{

const batch = db.batch();

snapshot.docs.forEach(doc=>{

batch.delete(doc.ref);

});

batch.commit().then(()=>{

alert("Semua nilai berhasil dihapus");

loadDashboard();

});

});

}
