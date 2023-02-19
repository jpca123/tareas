"use strict";
//Variables generales
const contenedorTareas = document.querySelector(".tareas");
let apiIndexedDB = indexedDB.open("ListaTareas", 1);
let db = null;

//****************validando si la api indexedDB existe y creando la base de datos****************
if (!apiIndexedDB)
  alert(
    "Lo siento tu navegador es muy antiguo o desactualizado y no posee la api de permanencia de datos necesaria, por lo cual este administrador no funcionara"
  );

//crea la bbdd
apiIndexedDB.onupgradeneeded = (e) => {
  db = e.target.result;
  db.createObjectStore("Tareas", {
    autoIncrement: true,
  });
  console.log("creada");
};
//abre la bbdd
apiIndexedDB.onsuccess = (e) => {
  db = apiIndexedDB.result;
  console.log("Abierta bbdd");
  cargarData();
};
apiIndexedDB.addEventListener("error", (e) => {
  alert("no se ha podido abrir la base de datos intente recargar la pagina");
});

//************ Manipulando la bbdd ****************

// lee todas las tareas de la bbdd y llama a renderData(data)
function cargarData() {
  let data = [];
  let transaccion = db.transaction(["Tareas"], "readonly");
  let almacen = transaccion.objectStore("Tareas");
  let peticion = almacen.openCursor();

  peticion.onsuccess = (e) => {
    let cursor = e.target.result;
    if (cursor) {
			let infoTarea = cursor.value;
			infoTarea.id = cursor.primaryKey;
      data.push(infoTarea);
      cursor.continue();
    } else renderData(data);
  };
}

//renderiza el contenido de las tarea (data)
function renderData(data) {
  contenedorTareas.innerHTML = "";
  let fragmento = document.createDocumentFragment();

  for (let dato of data) {
    if (dato.hora === "") dato.hora = "12:00";

    // inicializando objetos
    let tarea = document.createElement("article"),
      nombre = document.createElement("h2"),
      contenedorTiempo = document.createElement("section"),
      hora = document.createElement("span"),
      fecha = document.createElement("h2"),
      desc = document.createElement("p"),
      btnEliminar = document.createElement("span"),
      btnEditar = document.createElement("span");

    // colocando clases y atributos de ayuda
    tarea.classList.add("tarea");
    nombre.classList.add("tarea__nombre");
    contenedorTiempo.classList.add("tarea__time-container");
    hora.classList.add("tarea__time");
    fecha.classList.add("tarea__time");
    desc.classList.add("tarea__descripcion");
    btnEditar.classList.add("btn", "btn__editar");
    btnEliminar.classList.add("btn", "btn__danger");

    // rellenando informacion
    btnEditar.dataset.key = dato.id;
    btnEliminar.dataset.key = dato.id;

    nombre.textContent = dato.nombre;
    fecha.textContent = dato.fecha;
    hora.textContent = dato.hora;
    desc.textContent = dato.descripcion;
    btnEditar.textContent = "Editar";
    btnEliminar.textContent = "Eliminar";

    // renderizando
    contenedorTiempo.appendChild(fecha);
    contenedorTiempo.appendChild(hora);

    tarea.appendChild(btnEditar);
    tarea.appendChild(btnEliminar);
    tarea.appendChild(nombre);
    tarea.appendChild(contenedorTiempo);
    tarea.appendChild(desc);

    fragmento.appendChild(tarea);
  }

  contenedorTareas.appendChild(fragmento);
}


//recibe el evento sumbit, extrae la informacion y llama manipularData(data)
function crearTarea(e) {
  e.preventDefault();
  let nombre = e.target.nombre.value,
		id = parseInt(e.target.id.value),
    descripcion = e.target.desc.value,
    fecha = e.target.fecha.value,
    hora = e.target.hora.value;
  closeModal();
  e.target.reset();

  let accion = e.target.name;

  manipularData(
    {
			id,
      nombre,
      descripcion,
      fecha,
      hora,
    },
    accion
  );
}

//agrega o actualiza "data" a la base de datos y llama a cargarData()
function manipularData(data, accion = "crear") {
  let transaccion = db.transaction(["Tareas"], "readwrite");
  let almacen = transaccion.objectStore("Tareas");

  if (accion === "crear") {
		delete data.id;
		almacen.add(data);
    showInfo("Tarea Agregada con exito", "Exito");
	}

  else if (accion === "actualizar") {
    let idTarea = data.id;
    delete data.id;
    almacen.put(data, idTarea);
    showInfo("Tarea Editada con exito", "Exito");

  }
  cargarData();
}

//recibe la "data" de una tarea y crea modal con formulario esta
function editarTarea(data) {
  showModal("modalEditar")
  let form = document.forms.actualizar;
  form.id.value = data.id;
  form.nombre.value = data.nombre;
  form.desc.value = data.descripcion;
  form.fecha.value = data.fecha;
  form.hora.value = data.hora;
}

// obtiene la info de una tarea de la bbdd y la envia a  ediatarTarea()
function obtenerTarea(key) {
  let transaccion = db.transaction(["Tareas"], "readonly");
  let objectStorage = transaccion.objectStore("Tareas");
  let confirmacion = objectStorage.openCursor();

  confirmacion.onsuccess = (e) => {
    let cursor = e.target.result;

    if (cursor) {

      if (cursor.primaryKey == key) {
        let datosTarea = cursor.value;
        datosTarea.id = cursor.primaryKey;
        editarTarea(datosTarea);

      }
      else cursor.continue();

    }
  };
  confirmacion.onerror = (e) => {
    showInfo("algo ha fallado, intente actualizar la pagina y actualizar luego", "Error");
  };
}

//recibe la key de una tarea la elimina y llama a cargarData()
function eliminarTarea(key) {
  let transaccion = db.transaction(["Tareas"], "readwrite");
  let almacen = transaccion.objectStore("Tareas");
  let request = almacen.delete(key);
  request.onerror = (e) => {
    showInfo("Fallo la eliminación, intente recargar la pagina y eliminar entonces", "Error")
  };
  cargarData();
}


function closeModal(){
  document.querySelectorAll(".modal__active").forEach(modal => modal.classList.remove("modal__active"));
}

function showModal(name){
  let modal = document.getElementById(name);
  if(!modal) return console.log('no se encontro modal', e.target);

  modal.classList.add("modal__active")
}
function showInfo(message, title="Información"){
  let information = document.querySelector("#modalInformation .modal__information");
  let titleNode = document.querySelector("#modalInformation .modal__title");
  if(!information || !titleNode) console.log("no se encontro modal information");

  titleNode.innerHTML = title;

  information.innerHTML = message;
  closeModal();
  showModal("modalInformation");
}

//************ Escucha y delegacion de eventos DOM **************

document.addEventListener("submit", crearTarea);

document.addEventListener("click", (e) => {
  if (e.target.matches(".modal__close")) closeModal();
  if (e.target.matches("[data-modal]")) showModal(e.target.dataset.modal);
  if (e.target.matches(".btn__danger")) {
    try {
      let enteroKey = parseInt(e.target.dataset.key);
      eliminarTarea(enteroKey);
    } catch (e) {
      eliminarTarea(e.target.dataset.key);
    }
  }
  if (e.target.matches(".btn__editar")) {
    try {
      let enteroKey = parseInt(e.target.dataset.key);
      obtenerTarea(enteroKey);
    } catch (err) {
      obtenerTarea(e.target.dataset.key);
    }
  }
});

document.addEventListener("keydown", e=>{
  if(e.key === "Escape") closeModal();
})

//*********************service worker y cache ********************************

navigator.serviceWorker.register('worker.js');
