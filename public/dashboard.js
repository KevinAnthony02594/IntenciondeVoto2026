// ======================================================
// Dashboard Elecciones 2026
// Parte 1
// ======================================================

let TOKEN = "";

let tabla = null;

let chartBarras = null;
let chartPastel = null;
let chartZona = null;

let mapa = null;
let marcadores = [];

document.addEventListener("DOMContentLoaded", () => {

    // Si existe un token guardado
    const tokenGuardado = localStorage.getItem("token");

    if (tokenGuardado) {

        TOKEN = tokenGuardado;

        document.getElementById("loginPage").classList.add("d-none");
        document.getElementById("dashboard").classList.remove("d-none");

        document.getElementById("adminNombre").innerHTML =
            localStorage.getItem("nombre");

        iniciarDashboard();

    }

    document
        .getElementById("btnLogin")
        .addEventListener("click", login);

    document
        .getElementById("btnSalir")
        .addEventListener("click", cerrarSesion);

    document
        .getElementById("btnActualizar")
        .addEventListener("click", iniciarDashboard);

});

async function login() {

    const dni = document.getElementById("dni").value.trim();

    const error = document.getElementById("loginError");

    error.classList.add("d-none");

    if (dni.length !== 8) {

        error.innerHTML = "Ingrese un DNI válido.";

        error.classList.remove("d-none");

        return;

    }

    try {

        const response = await fetch("/api/admin/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                dni
            })

        });

        const data = await response.json();

        if (!response.ok) {

            error.innerHTML = data.message;

            error.classList.remove("d-none");

            return;

        }

        TOKEN = data.token;

        localStorage.setItem("token", TOKEN);
        localStorage.setItem("nombre", data.nombre);

        document.getElementById("adminNombre").innerHTML =
            data.nombre;

        document
            .getElementById("loginPage")
            .classList.add("d-none");

        document
            .getElementById("dashboard")
            .classList.remove("d-none");

        iniciarDashboard();

    } catch (e) {

        error.innerHTML = "No se pudo conectar con el servidor.";

        error.classList.remove("d-none");

    }

}

function cerrarSesion() {

    localStorage.removeItem("token");
    localStorage.removeItem("nombre");

    location.reload();

}

async function iniciarDashboard() {

    try {

        const response = await fetch("/api/dashboard", {

            headers: {

                Authorization: "Bearer " + TOKEN

            }

        });

        const data = await response.json();

        if (!data.success) {

            alert("Sesión expirada.");

            cerrarSesion();

            return;

        }

        cargarIndicadores(data);

        cargarResultados();

    } catch (e) {

        console.log(e);

    }

}

function cargarIndicadores(data) {

    document.getElementById("totalVotos").innerHTML =
        data.total;

    document.getElementById("totalPartidos").innerHTML =
        Object.keys(data.partidos).length;

    document.getElementById("totalZonas").innerHTML =
        Object.keys(data.zonas).length;

    document.getElementById("ultimaActualizacion").innerHTML =
        new Date().toLocaleTimeString();

}

async function cargarResultados() {

    const response = await fetch("/api/resultados", {

        headers: {

            Authorization: "Bearer " + TOKEN

        }

    });

    const data = await response.json();

    if (!data.success) return;

    actualizarTabla(data.votos);

    actualizarFiltros(data.votos);

    crearGraficoBarras(data.resultados);

    crearGraficoPastel(data.resultados);

    crearGraficoZona(data.votos);

    cargarMapa(data.votos);

}
// ======================================================
// Dashboard Elecciones 2026
// Parte 2 - Gráficos y Mapa
// ======================================================

const COLORES = {
    "Jorge Vejorano - Avanza país": "#c0392b",
    "Roberto de la cruz - Alianza por el progreso": "#e67e22",
    "Jordan Piminchomo - Un camino diferente": "#27ae60",
    "Jose Ruis Vega - Fuerza popular": "#2980b9",
    "Victor Cruz Bubio - Partido aprista peruano": "#8e44ad"
};

//=====================================================
// GRÁFICO DE BARRAS
//=====================================================

function crearGraficoBarras(resultados){

    const labels = Object.keys(resultados);

    const valores = Object.values(resultados);

    const colores = labels.map(x=>COLORES[x] || "#3498db");

    if(chartBarras){

        chartBarras.destroy();

    }

    chartBarras = new Chart(

        document.getElementById("graficoBarras"),

        {

            type:"bar",

            data:{

                labels,

                datasets:[{

                    label:"Votos",

                    data:valores,

                    backgroundColor:colores,

                    borderRadius:8

                }]

            },

            options:{

                responsive:true,

                plugins:{

                    legend:{
                        display:false
                    }

                },

                scales:{

                    y:{
                        beginAtZero:true
                    }

                }

            }

        }

    );

}

//=====================================================
// GRÁFICO DE PASTEL
//=====================================================

function crearGraficoPastel(resultados){

    const labels = Object.keys(resultados);

    const valores = Object.values(resultados);

    const colores = labels.map(x=>COLORES[x] || "#3498db");

    if(chartPastel){

        chartPastel.destroy();

    }

    chartPastel = new Chart(

        document.getElementById("graficoPastel"),

        {

            type:"pie",

            data:{

                labels,

                datasets:[{

                    data:valores,

                    backgroundColor:colores

                }]

            },

            options:{

                responsive:true,

                plugins:{

                    legend:{

                        position:"bottom"

                    }

                }

            }

        }

    );

}

//=====================================================
// GRÁFICO POR ZONA
//=====================================================

function crearGraficoZona(votos){

    const zonas={};

    votos.forEach(v=>{

        zonas[v.zona]=(zonas[v.zona]||0)+1;

    });

    const labels=Object.keys(zonas);

    const valores=Object.values(zonas);

    if(chartZona){

        chartZona.destroy();

    }

    chartZona=new Chart(

        document.getElementById("graficoZona"),

        {

            type:"doughnut",

            data:{

                labels,

                datasets:[{

                    data:valores,

                    backgroundColor:[

                        "#c0392b",

                        "#27ae60",

                        "#2980b9",

                        "#f39c12",

                        "#8e44ad",

                        "#16a085"

                    ]

                }]

            },

            options:{

                responsive:true,

                plugins:{

                    legend:{

                        position:"bottom"

                    }

                }

            }

        }

    );

}

//=====================================================
// MAPA
//=====================================================

function cargarMapa(votos){

    const zonas={

        "El Milagro":[-8.023047,-79.067330],

        "Villa del Mar":[-8.097796,-79.062740],

        "Víctor Raúl":[-8.021041,-79.070422],

        "Huanchaquito":[-8.097705,-79.109337],

        "Huanchaco Balneario":[-8.078579,-79.120930],

        "El Trópico":[-8.086008,-79.076372]

    };

    if(!mapa){

        mapa=L.map("map").setView(

            [-8.067,-79.086],

            12

        );

        L.tileLayer(

            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

            {

                attribution:"© OpenStreetMap"

            }

        ).addTo(mapa);

    }

    marcadores.forEach(m=>{

        mapa.removeLayer(m);

    });

    marcadores=[];

    const conteo={};

    votos.forEach(v=>{

        conteo[v.zona]=(conteo[v.zona]||0)+1;

    });

    Object.keys(conteo).forEach(z=>{

        if(!zonas[z]) return;

        const marker=L.marker(zonas[z])

        .addTo(mapa)

        .bindPopup(

            `<b>${z}</b><br>
            Total votos: <b>${conteo[z]}</b>`

        );

        marcadores.push(marker);

    });

}
// ======================================================
// Dashboard Elecciones 2026
// Parte 3 - Tabla, Filtros y Auto Refresh
// ======================================================

//===========================================
// TABLA
//===========================================

function actualizarTabla(votos){

    if(tabla){

        tabla.destroy();

    }

    const tbody=document.querySelector("#tablaVotos tbody");

    tbody.innerHTML="";

    votos.forEach((v,index)=>{

        const tr=document.createElement("tr");

        tr.innerHTML=`

            <td>${index+1}</td>

            <td>${v.dni ? "****"+String(v.dni).slice(-4) : "ANÓNIMO"}</td>

            <td>${v.zona ?? ""}</td>

            <td>${v.voto}</td>

        `;

        tbody.appendChild(tr);

    });

    tabla=$("#tablaVotos").DataTable({

        destroy:true,

        pageLength:10,

        responsive:true,

        language:{
            url:"https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json"
        }

    });

}

//===========================================
// FILTROS
//===========================================

function actualizarFiltros(votos){

    const partidos=[...new Set(votos.map(v=>v.voto))];

    const zonas=[...new Set(votos.map(v=>v.zona))];

    const filtroPartido=document.getElementById("filtroPartido");

    const filtroZona=document.getElementById("filtroZona");

    filtroPartido.innerHTML='<option value="">Todos los partidos</option>';

    filtroZona.innerHTML='<option value="">Todas las zonas</option>';

    partidos.forEach(p=>{

        filtroPartido.innerHTML+=`<option value="${p}">${p}</option>`;

    });

    zonas.forEach(z=>{

        filtroZona.innerHTML+=`<option value="${z}">${z}</option>`;

    });

    filtroPartido.onchange=filtrarTabla;

    filtroZona.onchange=filtrarTabla;

}

//===========================================
// FILTRAR
//===========================================

function filtrarTabla(){

    const partido=document.getElementById("filtroPartido").value;

    const zona=document.getElementById("filtroZona").value;

    tabla.column(3).search(partido);

    tabla.column(2).search(zona);

    tabla.draw();

}

//===========================================
// AUTO REFRESH
//===========================================

setInterval(()=>{

    if(TOKEN){

        iniciarDashboard();

    }

},5000);

//===========================================
// ANIMACIÓN DE TARJETAS
//===========================================

window.addEventListener("load",()=>{

    document.querySelectorAll(".dashboard-card").forEach((card,i)=>{

        card.style.opacity="0";

        card.style.transform="translateY(20px)";

        setTimeout(()=>{

            card.style.transition=".5s";

            card.style.opacity="1";

            card.style.transform="translateY(0px)";

        },i*120);

    });

});

//===========================================
// MENSAJE DE BIENVENIDA
//===========================================

function mostrarBienvenida(){

    console.log(

        "%cDashboard Elecciones 2026",

        "font-size:20px;color:#2563eb;font-weight:bold"

    );

}

mostrarBienvenida();