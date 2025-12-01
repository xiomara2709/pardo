// app.js
// Sistema web 100% en navegador para separar y unir hojas de Excel
// Credenciales por defecto (modificables en la interfaz)
let CRED = { user: "admin", pass: "1234" };

// Elementos
const screenLogin = document.getElementById("screen-login");
const screenApp = document.getElementById("screen-app");
const btnLogin = document.getElementById("btnLogin");
const btnDemo = document.getElementById("btnDemo");
const btnLogout = document.getElementById("btnLogout");
const welcomeText = document.getElementById("welcomeText");

const navSeparar = document.getElementById("navSeparar");
const navUnir = document.getElementById("navUnir");

const panelSeparar = document.getElementById("panel-separar");
const panelUnir = document.getElementById("panel-unir");

const inputSeparar = document.getElementById("inputSeparar");
const inputUnir = document.getElementById("inputUnir");

const btnPreviewSeparar = document.getElementById("btnPreviewSeparar");
const btnDoSeparar = document.getElementById("btnDoSeparar");
const separarPreview = document.getElementById("separarPreview");
const separarMsg = document.getElementById("separarMsg");

const btnPreviewUnir = document.getElementById("btnPreviewUnir");
const btnDoUnir = document.getElementById("btnDoUnir");
const unirPreview = document.getElementById("unirPreview");
const unirMsg = document.getElementById("unirMsg");

const confUser = document.getElementById("confUser");
const confPass = document.getElementById("confPass");
const btnChangeCred = document.getElementById("btnChangeCred");
const changeCredArea = document.getElementById("changeCredArea");
const newUser = document.getElementById("newUser");
const newPass = document.getElementById("newPass");
const saveCred = document.getElementById("saveCred");
const cancelCred = document.getElementById("cancelCred");

// LOGIN logic
btnDemo.onclick = () => { alert("Credenciales por defecto:\nusuario: admin\ncontraseña: 1234"); };
btnLogin.onclick = () => {
  const u = document.getElementById("usuario").value.trim();
  const p = document.getElementById("pass").value.trim();
  if (!u || !p) return alert("Ingresa usuario y contraseña");
  if (u === CRED.user && p === CRED.pass) {
    // iniciar
    screenLogin.classList.add("hidden");
    screenApp.classList.remove("hidden");
    welcomeText.innerText = `Usuario: ${u}`;
  } else {
    alert("Usuario o contraseña incorrectos");
  }
};
btnLogout.onclick = () => {
  screenApp.classList.add("hidden");
  screenLogin.classList.remove("hidden");
  document.getElementById("usuario").value = "";
  document.getElementById("pass").value = "";
};

// Navigation
navSeparar.onclick = () => {
  panelSeparar.style.display = "block";
  panelUnir.style.display = "none";
};
navUnir.onclick = () => {
  panelSeparar.style.display = "none";
  panelUnir.style.display = "block";
};

// Change credentials (in-memory)
confUser.innerText = CRED.user;
confPass.innerText = CRED.pass;
btnChangeCred.onclick = () => { changeCredArea.classList.toggle("hidden"); };
cancelCred.onclick = () => { changeCredArea.classList.add("hidden"); };
saveCred.onclick = () => {
  const nu = newUser.value.trim();
  const np = newPass.value.trim();
  if (!nu || !np) { alert("Ambos campos son obligatorios"); return; }
  CRED.user = nu; CRED.pass = np;
  confUser.innerText = CRED.user;
  confPass.innerText = CRED.pass;
  changeCredArea.classList.add("hidden");
  newUser.value = ""; newPass.value="";
  alert("Credenciales actualizadas (guardadas en memoria durante la sesión)");
};

// Utilities
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function workbookFromFile(file) {
  const ab = await readFileAsArrayBuffer(file);
  const data = new Uint8Array(ab);
  const wb = XLSX.read(data, { type: "array" });
  return wb;
}

// ------------------ SEPARAR HOJAS ------------------
btnPreviewSeparar.onclick = async () => {
  separarPreview.style.display = "none";
  separarPreview.innerHTML = "";
  separarMsg.innerText = "";
  const files = inputSeparar.files;
  if (!files || files.length === 0) { alert("Selecciona un archivo .xlsx"); return; }
  const file = files[0];
  try {
    const wb = await workbookFromFile(file);
    separarPreview.style.display = "block";
    wb.SheetNames.forEach((sName, idx) => {
      const div = document.createElement("div");
      div.className = "file-item";
      div.innerHTML = `<div><strong>${sName}</strong><div class="small">Hoja ${idx+1}</div></div>
                       <div><span class="small">${file.name}</span></div>`;
      separarPreview.appendChild(div);
    });
    separarMsg.innerText = `Se detectaron ${wb.SheetNames.length} hojas en ${file.name}`;
  } catch(e) {
    console.error(e);
    alert("Error al leer el archivo. Asegúrate que sea .xlsx válido.");
  }
};

btnDoSeparar.onclick = async () => {
  separarMsg.innerText = "";
  const files = inputSeparar.files;
  if (!files || files.length === 0) { alert("Selecciona un archivo .xlsx"); return; }
  const file = files[0];
  try {
    const wb = await workbookFromFile(file);
    const total = wb.SheetNames.length;
    if (total === 0) { alert("No se encontraron hojas"); return; }
    // Por cada hoja crear y descargar
    for (let sName of wb.SheetNames) {
      const nueva = XLSX.utils.book_new();
      const s = wb.Sheets[sName];
      XLSX.utils.book_append_sheet(nueva, s, sName);
      // Nombra: original_hoja.xlsx
      const safeFileName = (file.name.replace(/\.[^/.]+$/, ""));
      const outName = `${safeFileName}_${sName}.xlsx`;
      XLSX.writeFile(nueva, outName);
    }
    separarMsg.innerText = `Se generaron ${total} archivos (descarga iniciada).`;
  } catch(e) {
    console.error(e);
    alert("Error al procesar el archivo");
  }
};

// ------------------ UNIR HOJAS ------------------
let unirState = []; // {file, wb}

btnPreviewUnir.onclick = async () => {
  unirPreview.style.display = "none";
  unirPreview.innerHTML = "";
  unirMsg.innerText = "";
  const files = inputUnir.files;
  if (!files || files.length === 0) { alert("Selecciona al menos un archivo .xlsx"); return; }

  unirState = [];
  try {
    for (let f of files) {
      const wb = await workbookFromFile(f);
      unirState.push({ file: f, wb });
    }

    // mostrar lista con checkboxes por hoja
    unirPreview.style.display = "block";
    unirState.forEach((entry, idx) => {
      const fname = entry.file.name;
      const container = document.createElement("div");
      container.style.marginBottom = "8px";
      container.style.borderBottom = "1px dashed #eef4ff";
      container.style.paddingBottom = "6px";
      const title = document.createElement("div");
      title.innerHTML = `<strong>${fname}</strong> <span class="small">(${entry.wb.SheetNames.length} hojas)</span>`;
      container.appendChild(title);

      entry.wb.SheetNames.forEach((sName, sIdx) => {
        const id = `chk_${idx}_${sIdx}`;
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.padding = "6px 4px";
        row.innerHTML = `<div style="display:flex;gap:10px;align-items:center"><input id="${id}" type="checkbox" checked> <label for="${id}">${sName}</label></div>
                         <div class="small">${sIdx+1}</div>`;
        container.appendChild(row);
      });

      unirPreview.appendChild(container);
    });

    unirMsg.innerText = `Se cargaron ${unirState.length} archivos. Selecciona las hojas a incluir y presiona "Generar libro unido".`;
  } catch(e) {
    console.error(e);
    alert("Error al leer los archivos. Asegúrate que sean .xlsx válidos.");
  }
};

btnDoUnir.onclick = async () => {
  unirMsg.innerText = "";
  if (!unirState || unirState.length === 0) { alert("Primero carga los archivos y presiona 'Leer y listar hojas'"); return; }

  const nuevo = XLSX.utils.book_new();
  let count = 0;

  for (let i = 0; i < unirState.length; i++) {
    const entry = unirState[i];
    const fname = entry.file.name.replace(/\.[^/.]+$/, "");
    for (let sIdx = 0; sIdx < entry.wb.SheetNames.length; sIdx++) {
      const checkbox = document.getElementById(`chk_${i}_${sIdx}`);
      if (!checkbox) continue;
      if (checkbox.checked) {
        const sName = entry.wb.SheetNames[sIdx];
        const sheet = entry.wb.Sheets[sName];
        // nombre de la hoja en el libro final: HojaName_FileShort (evitar duplicados)
        let targetName = `${sName}_${fname}`;
        // SheetJS limita los 31 caracteres de nombre de hoja en Excel; recortar si hace falta
        if (targetName.length > 31) targetName = targetName.substring(0,28) + "...";
        // Si ya existe, añadir sufijo numérico
        let base = targetName, k = 1;
        while (nuevo[targetName]) {
          targetName = `${base}_${k}`; k++;
        }
        XLSX.utils.book_append_sheet(nuevo, sheet, targetName);
        count++;
      }
    }
  }

  if (count === 0) { alert("No se seleccionó ninguna hoja para unir"); return; }
  const outName = `Libro_Unido.xlsx`;
  XLSX.writeFile(nuevo, outName);
  unirMsg.innerText = `Libro unido generado con ${count} hojas. Descarga iniciada.`;
};

// Prevent accidental navigation (simple)
window.addEventListener("beforeunload", function(e){
  // nothing forced; left for future
});

// Optional: allow quick nav after login
navSeparar.onclick();
