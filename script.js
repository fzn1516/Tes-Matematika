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
let soal = []; // Akan di-load dari soal.json
let jawaban = [];
let index = 0;
let waktu = parseInt(localStorage.getItem("timerTes")) || 20; // menit
let timerInterval;

/* =================== NAVIGASI =================== */
function keLogin(){
    homePage.style.display = "none";
    loginPage.style.display = "block";
}

function loginGuruPage(){
    homePage.style.display = "none";
    loginGuru.style.display = "block";
}

function kembaliHome(){
    location.reload();
}

/* =================== LOAD SOAL =================== */
async function loadSoal(){
    try{
        const res = await fetch("soal.json");
        soal = await res.json();
    }catch(e){
        alert("Gagal memuat soal!");
    }
}

/* =================== MULAI TES =================== */
async function mulaiTes(){
    if(nama.value.trim() === ""){
        alert("Isi nama dulu!");
        return;
    }

    await loadSoal();

    if(soal.length === 0){
        alert("Soal belum tersedia");
        return;
    }

    jawaban = [];
    index = 0;
    waktu = parseInt(localStorage.getItem("timerTes")) || 20;
    waktu = waktu * 60; // detik

    loginPage.style.display = "none";
    tesPage.style.display = "block";

    buatNomorSoal();
    tampilkanSoal();
    mulaiTimer();
}

/* =================== NOMOR SOAL =================== */
function buatNomorSoal(){
    let html = "";
    soal.forEach((s,i)=>{
        html += `<div class="nomorBtn" onclick="lompatSoal(${i})" id="n${i}">${i+1}</div>`;
    });
    nomorSoal.innerHTML = html;
    updateNomor();
}

/* =================== TAMPILKAN SOAL =================== */
function tampilkanSoal(){
    const s = soal[index];
    let html = `<h3>Soal ${index+1}</h3>`;
    html += `<p>${s.t}</p>`;

    s.a.forEach((p,i)=>{
        html += `
        <label>
            <input type="radio" name="j" onclick="simpan(${i})" ${jawaban[index]===i?'checked':''}>
            ${p}
        </label><br>`;
    });

    soalBox.innerHTML = html;
    updateNomor();
}

/* =================== SIMPAN JAWABAN =================== */
function simpan(i){
    jawaban[index] = i;
    updateNomor();
}

/* =================== UPDATE NOMOR =================== */
function updateNomor(){
    soal.forEach((s,i)=>{
        const btn = document.getElementById("n"+i);
        if(!btn) return;
        btn.classList.remove("aktif","jawab","kosong");
        if(jawaban[i]!=null) btn.classList.add("jawab");
        else btn.classList.add("kosong");
    });
    const aktif = document.getElementById("n"+index);
    if(aktif) aktif.classList.add("aktif");
}

function lompatSoal(i){
    index = i;
    tampilkanSoal();
}

function soalBerikutnya(){
    if(index < soal.length-1){
        index++;
        tampilkanSoal();
    }
}

function soalSebelumnya(){
    if(index > 0){
        index--;
        tampilkanSoal();
    }
}

/* =================== TIMER =================== */
function mulaiTimer(){
    timerInterval = setInterval(()=>{
        waktu--;
        const m = Math.floor(waktu/60).toString().padStart(2,"0");
        const d = (waktu%60).toString().padStart(2,"0");
        timer.innerHTML = `${m}:${d}`;

        if(waktu<=0){
            clearInterval(timerInterval);
            alert("Waktu habis, tes otomatis selesai");
            selesaiTes(true);
        }
    },1000);
}

/* =================== CEK SOAL KOSONG =================== */
function cekKosong(){
    return soal.filter((s,i)=>jawaban[i]==null).length;
}

/* =================== SELESAI TES =================== */
function selesaiTes(force=false){
    if(!force){
        const kosong = cekKosong();
        if(kosong>0){
            const lanjut = confirm(`Masih ada ${kosong} soal belum dijawab.\nTetap ingin menyelesaikan tes?`);
            if(!lanjut) return;
        }
    }

    clearInterval(timerInterval);

    let skor = 0;
    let totalBobot = 0;

    soal.forEach((s,i)=>{
        totalBobot += s.bobot || 1;
        if(jawaban[i] === s.k){
            skor += s.bobot || 1;
        }
    });

    const nilaiAkhir = Math.round((skor/totalBobot)*100);

    const data = JSON.parse(localStorage.getItem("nilai")) || [];
    data.push({
        nama: nama.value,
        kelas: kelas.value || "-",
        nilai: nilaiAkhir
    });
    localStorage.setItem("nilai", JSON.stringify(data));

    tesPage.style.display = "none";
    hasilPage.style.display = "block";

    nilai.innerHTML = `<h2>${nilaiAkhir}</h2>`;
}

/* =================== LOGIN GURU =================== */
function cekPassword(){
    if(passwordGuru.value === PASSWORD_GURU){
        loginGuru.style.display = "none";
        dashboard.style.display = "block";

        timerInfo.innerHTML = localStorage.getItem("timerTes") || 20;

        buatGrafik();
        buatStatistik();
        buatRekap();
    }else{
        alert("Password salah!");
    }
}

/* =================== GRAFIK =================== */
function buatGrafik(){
    const data = JSON.parse(localStorage.getItem("nilai")) || [];
    const namaArr = data.map(d=>d.nama);
    const nilaiArr = data.map(d=>d.nilai);

    new Chart(grafikNilai,{
        type:"bar",
        data:{
            labels:namaArr,
            datasets:[{
                label:"Nilai",
                data:nilaiArr,
                backgroundColor:"rgba(75,192,192,0.6)"
            }]
        },
        options:{
            scales:{
                y:{beginAtZero:true, max:100}
            }
        }
    });
}

/* =================== STATISTIK =================== */
function buatStatistik(){
    const data = JSON.parse(localStorage.getItem("nilai")) || [];
    if(data.length===0) return;
    const arr = data.map(d=>d.nilai);
    const avg = arr.reduce((a,b)=>a+b)/arr.length;
    statistik.innerHTML = `Rata-rata: ${avg.toFixed(1)}`;
}

/* =================== REKAP =================== */
function buatRekap(){
    const data = JSON.parse(localStorage.getItem("nilai")) || [];
    data.sort((a,b)=>b.nilai-a.nilai);

    let html = `<h3>Rekap Nilai Siswa</h3>
    <table border="1" cellpadding="6">
    <tr>
        <th>Peringkat</th>
        <th>Nama</th>
        <th>Kelas</th>
        <th>Nilai</th>
    </tr>`;

    data.forEach((d,i)=>{
        html += `
        <tr>
            <td>${i+1}</td>
            <td>${d.nama}</td>
            <td>${d.kelas}</td>
            <td>${d.nilai}</td>
        </tr>`;
    });

    html += `</table>`;
    statistik.innerHTML += html;
}

/* =================== EXPORT NILAI =================== */
function exportExcel(){
    const data = JSON.parse(localStorage.getItem("nilai")) || [];
    let csv = "Nama,Kelas,Nilai\n";
    data.forEach(d=>{
        csv += `${d.nama},${d.kelas},${d.nilai}\n`;
    });

    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nilai.csv";
    a.click();
}

/* =================== RESET NILAI =================== */
function resetNilai(){
    localStorage.removeItem("nilai");
    alert("Nilai dihapus");
}

/* =================== TIMER GURU =================== */
function simpanTimer(){
    const menit = parseInt(setTimer.value);
    if(isNaN(menit) || menit <=0){
        alert("Masukkan waktu yang valid");
        return;
    }

    localStorage.setItem("timerTes", menit);
    timerInfo.innerHTML = menit;
    alert("Timer berhasil disimpan!");
}