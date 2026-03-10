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
const timer = document.getElementById("timer");
const nilai = document.getElementById("nilai");
const statistik = document.getElementById("statistik");
const grafikNilai = document.getElementById("grafikNilai");

/* ================= KONSTANTA ================= */
const PASSWORD_GURU = "admin123";

/* ================= BANK SOAL ================= */
let soal = [];
let jawaban = [];
let index = 0;
let waktu = 20*60;
let timerInterval;

/* ================= NAVIGASI ================= */
document.getElementById("btnMulai").addEventListener("click", () => {
  homePage.style.display = "none";
  loginPage.style.display = "block";
});
document.getElementById("btnDashboard").addEventListener("click", () => {
  homePage.style.display = "none";
  loginGuru.style.display = "block";
});
document.getElementById("btnMulaiTes").addEventListener("click", mulaiTes);
document.getElementById("btnSelesai").addEventListener("click", selesaiTes);
document.getElementById("btnLoginGuru").addEventListener("click", cekPassword);

function kembaliHome(){ location.reload(); }

/* ================= LOAD SOAL ================= */
async function loadSoal(){
  try{
    const res = await fetch("soal.json");
    soal = await res.json();
  }catch(e){
    alert("Gagal memuat soal.json");
    console.error(e);
  }
}

/* ================= MULAI TES ================= */
async function mulaiTes(){
  if(nama.value.trim()==="" || kelas.value.trim()===""){
    alert("Isi nama dan kelas dulu!");
    return;
  }

  await loadSoal();
  if(soal.length===0){
    alert("Soal belum tersedia");
    return;
  }

  jawaban = Array(soal.length).fill(null);
  index = 0;

  loginPage.style.display="none";
  tesPage.style.display="block";

  tampilkanSoal();
  mulaiTimer();
}

/* ================= TAMPILKAN SOAL ================= */
function tampilkanSoal(){
  const s = soal[index];
  let html = `<h3>Soal ${index+1}</h3><p>${s.t}</p>`;
  s.a.forEach((p,i)=>{
    html += `<label><input type="radio" name="jawaban" onclick="jawaban[index]=${i}"> ${p}</label><br>`;
  });
  soalBox.innerHTML = html;
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
    if(detik<=0){
      clearInterval(timerInterval);
      alert("Waktu habis");
      selesaiTes(true);
    }
  },1000);
}

/* ================= SELESAI TES ================= */
function selesaiTes(force=false){
  const kosong = jawaban.filter(j=>j===null).length;
  if(!force && kosong>0){
    if(!confirm(`Masih ada ${kosong} soal belum dijawab. Tetap selesai?`)) return;
  }
  clearInterval(timerInterval);

  let skor=0;
  soal.forEach((s,i)=>{ if(jawaban[i]===s.k) skor+=s.bobot||1; });
  const totalBobot = soal.reduce((sum,s)=>sum+(s.bobot||1),0);
  const nilaiAkhir = Math.round((skor/totalBobot)*100);

  const docId = `${nama.value.trim()}_${kelas.value.trim()}`;
  db.collection("nilaiSiswa").doc(docId).set({
    nama: nama.value.trim(),
    kelas: kelas.value.trim(),
    nilai: nilaiAkhir,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(()=>{
    tesPage.style.display="none";
    hasilPage.style.display="block";
    nilai.innerHTML=`<h2>${nilaiAkhir}</h2>`;
  }).catch(err=>{
    console.error(err);
    alert("Gagal menyimpan hasil tes");
    tesPage.style.display="none";
    hasilPage.style.display="block";
    nilai.innerHTML=`<h2>${nilaiAkhir}</h2>`;
  });
}

/* ================= LOGIN GURU ================= */
function cekPassword(){
  if(passwordGuru.value===PASSWORD_GURU){
    loginGuru.style.display="none";
    dashboard.style.display="block";
    loadDashboard();
  } else alert("Password salah!");
}

/* ================= DASHBOARD ================= */
function loadDashboard(){
  db.collection("nilaiSiswa").orderBy("nilai","desc").get().then(snapshot=>{
    const data = snapshot.docs.map(d=>d.data());
    let html = "<h3>Rekap Nilai</h3><table border='1'><tr><th>Nama</th><th>Kelas</th><th>Nilai</th></tr>";
    data.forEach(d=>html+=`<tr><td>${d.nama}</td><td>${d.kelas}</td><td>${d.nilai}</td></tr>`);
    html+="</table>";
    statistik.innerHTML=html;

    const namaArr = data.map(d=>d.nama);
    const nilaiArr = data.map(d=>d.nilai);
    new Chart(grafikNilai,{
      type:"bar",
      data:{labels:namaArr,datasets:[{label:"Nilai",data:nilaiArr,backgroundColor:"rgba(75,192,192,0.6)"}]},
      options:{scales:{y:{beginAtZero:true,max:100}}}
    });
  });
}
