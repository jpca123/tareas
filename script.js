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
    console.log(dato);

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
    btnEditar.classList.add("tarea__btn", "btn__editar");
    btnEliminar.classList.add("tarea__btn", "btn__eliminar");

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
  console.log("finalizo renderizado");
}

//crea y retorna nodo de una ventana modal con el form tarea
function crearModal(accion = "crear") {
  let modal = document.createElement("div");
  modal.classList.add("modal");
  let btnClose = document.createElement("span");
  btnClose.classList.add("modal__close");
  modal.appendChild(btnClose);

  modal.innerHTML += `<form class="form" data-accion="${accion}">
	<h2>Añadir Tarea</h2>

	<input name="id" type="hidden">

	<label class="form__label" for="tarea-nombre">Nombre</label>
	<input type="text" id="tarea-nombre" class="form__input" name="nombre" minlength="3" placeholder="Escribe un nombre" maxlength="50" required>

	<label class="form__label" for="tarea-descripcion">Descripcion</label>
	<textarea class="form__input desc"  id="tarea-descripcion" name="desc" minlength="5" placeholder="Escribe una descripcion" maxlength="255" required></textarea>

	<label class="form__label" for="tarea-fecha">Fecha</label>
	<input type="date" name="fecha" id="tarea-fecha" class="form__input" required>

	<label class="form__label" for="tarea-hora">Hora</label>
	<input type="time" name="hora" id="tarea-hora" class="form__input">

	<button class="form__guardar" type="submit">Guardar</button>
	</form>`;
  document.body.appendChild(modal);
  return modal;
}

//recibe el evento sumbit, extrae la informacion y llama manipularData(data)
function crearTarea(e) {
  e.preventDefault();
  let nombre = e.target.nombre.value,
		id = parseInt(e.target.id.value),
    descripcion = e.target.desc.value,
    fecha = e.target.fecha.value,
    hora = e.target.hora.value;
  let accion = e.target.dataset.accion;

  console.log(e.target);
  cerrarModal(e.target);

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
  console.log(data, accion);
  if (accion === "crear") {
		delete data.id;
		almacen.add(data);
	}

  else if (accion === "actualizar") {
    let idTarea = data.id;
    delete data.id;
		console.log(idTarea)
    almacen.put(data, idTarea);
  }
  cargarData();
}
// cierra la ventana modal, recibe el input type=submit
function cerrarModal(nodo) {
  nodo.parentElement.parentElement.removeChild(nodo.parentElement);
}

//recibe la "data" de una tarea y crea modal con formulario esta
function editarTarea(data) {
  let modal = crearModal("actualizar");
  let form = modal.querySelector(".form");
  console.log(data);
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
				cursor.continue();
      }else console.log("No se encontro el pk");
    }
  };
  confirmacion.onerror = (e) => {
    alert("algo ha fallado, intente actualizar la pagina y actualizar luego");
  };
}

//recibe la key de una tarea la elimina y llama a cargarData()
function eliminarTarea(key) {
  let transaccion = db.transaction(["Tareas"], "readwrite");
  let almacen = transaccion.objectStore("Tareas");
  let request = almacen.delete(key);
  request.onerror = (e) => {
    alert(
      "Fallo la eliminación, intente recrgar la pagina y eliminar entonces"
    );
  };
  cargarData();
}

//************ Escucha y delegacion de eventos DOM **************

document.addEventListener("submit", crearTarea);

document.addEventListener("click", (e) => {
  if (e.target.matches(".modal__close")) cerrarModal(e.target);
  if (e.target.matches(".header__agregar")) crearModal();
  if (e.target.matches(".btn__eliminar")) {
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
    } catch (e) {
      obtenerTarea(e.target.dataset.key);
    }
  }
});

//*********************service worker y cache ********************************

navigator.serviceWorker.register('worker.js');
