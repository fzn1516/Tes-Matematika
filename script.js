/* =================== VARIABEL HTML =================== */
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
const grafikNilai = document.getElementById("grafikNilai");
const statistik = document.getElementById("statistik");

const setTimer = document.getElementById("setTimer");
const timerInfo = document.getElementById("timerInfo");

/* =================== KONSTANTA =================== */
const PASSWORD_GURU = "admin123";

/* =================== BANK SOAL =================== */
let soal = [];
let jawaban = [];
let index = 0;
let waktu = 20;
let timerInterval;

/* =================== NAVIGASI =================== */
function keLogin(){ homePage.style.display="none"; loginPage.style.display="block"; }
function loginGuruPage(){ homePage.style.display="none"; loginGuru.style.display="block"; }
function kembaliHome(){ location.reload(); }

/* =================== LOAD SOAL =================== */
async function loadSoal(){
    try{
        const res = await fetch("soal.json");
        soal = await res.json();
        console.log("Soal berhasil di-load:", soal.length);
    }catch(e){
        alert("Gagal memuat soal! "+e);
    }
}

/* =================== MULAI TES =================== */
async function mulaiTes(){
    if(nama.value.trim()===""){ alert("Isi nama dulu!"); return; }
    await loadSoal();
    if(soal.length===0){ alert("Soal belum tersedia"); return; }

    jawaban=[]; index=0;
    waktu = parseInt(localStorage.getItem("timerTes"))||20;
    waktu = waktu*60;

    loginPage.style.display="none";
    tesPage.style.display="block";

    buatNomorSoal();
    tampilkanSoal();
    mulaiTimer();
}

/* =================== NOMOR SOAL =================== */
function buatNomorSoal(){
    let html="";
    soal.forEach((s,i)=>{ html+=`<div class="nomorBtn" onclick="lompatSoal(${i})" id="n${i}">${i+1}</div>`; });
    nomorSoal.innerHTML=html; updateNomor();
}

/* =================== TAMPILKAN SOAL =================== */
function tampilkanSoal(){
    const s = soal[index];
    let html=`<h3>Soal ${index+1}</h3><p>${s.t}</p>`;
    s.a.forEach((p,i)=>{
        html+=`<label><input type="radio" name="j" onclick="simpan(${i})" ${jawaban[index]===i?'checked':''}> ${p}</label><br>`;
    });
    soalBox.innerHTML = html;
    updateNomor();
}
function simpan(i){ jawaban[index]=i; updateNomor(); }
function updateNomor(){
    soal.forEach((s,i)=>{
        const btn=document.getElementById("n"+i); if(!btn) return;
        btn.classList.remove("aktif","jawab","kosong");
        if(jawaban[i]!=null) btn.classList.add("jawab");
        else btn.classList.add("kosong");
    });
    const aktif=document.getElementById("n"+index); if(aktif) aktif.classList.add("aktif");
}
function lompatSoal(i){ index=i; tampilkanSoal(); }
function soalBerikutnya(){ if(index<soal.length-1){ index++; tampilkanSoal(); } }
function soalSebelumnya(){ if(index>0){ index--; tampilkanSoal(); } }

/* =================== TIMER =================== */
function mulaiTimer(){
    timerInterval=setInterval(()=>{
        waktu--;
        const m=Math.floor(waktu/60).toString().padStart(2,"0");
        const d=(waktu%60).toString().padStart(2,"0");
        timer.innerHTML=`${m}:${d}`;
        if(waktu<=0){ clearInterval(timerInterval); alert("Waktu habis"); selesaiTes(true); }
    },1000);
}

/* =================== SELESAI TES =================== */
function selesaiTes(force=false){
    if(!force){
        const kosong = soal.filter((s,i)=>jawaban[i]==null).length;
        if(kosong>0){
            const lanjut = confirm(`Masih ada ${kosong} soal belum dijawab.\nTetap ingin menyelesaikan tes?`);
            if(!lanjut) return;
        }
    }
    clearInterval(timerInterval);

    let skor=0, total=0;
    soal.forEach((s,i)=>{ total+=s.bobot||1; if(jawaban[i]===s.k) skor+=s.bobot||1; });
    const nilaiAkhir=Math.round((skor/total)*100);

    db.collection("nilaiSiswa").add({
        nama: nama.value,
        kelas: kelas.value||"-",
        nilai: nilaiAkhir,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(()=>{
        tesPage.style.display="none"; hasilPage.style.display="block";
        nilai.innerHTML=`<h2>${nilaiAkhir}</h2>`;
    }).catch(err=>{ alert("Gagal menyimpan: "+err); });
}

/* =================== LOGIN GURU =================== */
function cekPassword(){
    if(passwordGuru.value===PASSWORD_GURU){
        loginGuru.style.display="none"; dashboard.style.display="block";
        timerInfo.innerHTML=localStorage.getItem("timerTes")||20;
        loadDashboard();
    }else{ alert("Password salah!"); }
}

/* =================== DASHBOARD =================== */
function loadDashboard(){
    db.collection("nilaiSiswa").orderBy("nilai","desc").get().then(snapshot=>{
        const data = snapshot.docs.map(d=>d.data());
        if(data.length>0){ const avg=data.reduce((a,b)=>a+b.nilai,0)/data.length; statistik.innerHTML=`Rata-rata: ${avg.toFixed(1)}`; }

        let html=`<h3>Rekap Nilai Siswa</h3><table border="1" cellpadding="6"><tr><th>Peringkat</th><th>Nama</th><th>Kelas</th><th>Nilai</th></tr>`;
        data.forEach((d,i)=>{ html+=`<tr><td>${i+1}</td><td>${d.nama}</td><td>${d.kelas}</td><td>${d.nilai}</td></tr>`; });
        html+="</table>";
        statistik.innerHTML+=html;

        const namaArr = data.map(d=>d.nama);
        const nilaiArr = data.map(d=>d.nilai);
        new Chart(grafikNilai,{
            type:"bar",
            data:{labels:namaArr,datasets:[{label:"Nilai",data:nilaiArr,backgroundColor:"rgba(75,192,192,0.6)"}]},
            options:{scales:{y:{beginAtZero:true,max:100}}}
        });
    });
}

/* =================== EXPORT & RESET =================== */
function exportExcel(){
    db.collection("nilaiSiswa").get().then(snapshot=>{
        let csv="Nama,Kelas,Nilai\n";
        snapshot.forEach(d=>{ const v=d.data(); csv+=`${v.nama},${v.kelas},${v.nilai}\n`; });
        const blob=new Blob([csv],{type:"text/csv"});
        const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="nilai.csv"; a.click();
    });
}
function resetNilai(){
    if(confirm("Yakin ingin menghapus semua nilai?")){
        db.collection("nilaiSiswa").get().then(snapshot=>{
            snapshot.forEach(doc=>{ db.collection("nilaiSiswa").doc(doc.id).delete(); });
        }).then(()=>alert("Semua nilai dihapus"));
    }
}

/* =================== TIMER GURU =================== */
function simpanTimer(){
    const menit=parseInt(setTimer.value);
    if(isNaN(menit)||menit<=0){ alert("Masukkan waktu valid"); return; }
    localStorage.setItem("timerTes",menit);
    timerInfo.innerHTML=menit;
    alert("Timer berhasil disimpan!");
}
