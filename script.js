'use strict'
//Variables generales
const contenedorTareas = document.querySelector('.tareas');
let apiIndexedDB = indexedDB.open('ListaTareas', 1);
let db = null;

//****************validando si la api indexedDB existe y creando la base de datos****************
if (!apiIndexedDB) alert('Lo siento tu navegador es muy antiguo o desactualizado y no posee la api de permanencia de datos necesaria, por lo cual este administrador no funcionara, Gracias.');

//crea la bbdd
apiIndexedDB.onupgradeneeded = e => {
	db = e.target.result;
	db.createObjectStore('Tareas', {
		keyPath: 'nombre',
	})
	console.log('creada');
}
//abre la bbdd
apiIndexedDB.onsuccess = e => {
	db = apiIndexedDB.result
	console.log('Abierta bbdd');
	cargarData();
}
apiIndexedDB.addEventListener('error', e => {
	alert('no se ha podido abrir la base de datos intente recargar la pagina');
})

//************ Manipulando la bbdd ****************

// lee todas las tareas de la bbdd y llama a renderData(data)
function cargarData() {
	let data = [];
	let transaccion = db.transaction(['Tareas'], 'readonly');
	let almacen = transaccion.objectStore('Tareas');
	let peticion = almacen.openCursor();

	peticion.onsuccess = e => {
		let cursor = e.target.result
		if (cursor) {
			data.push(cursor.value);
			cursor.continue();
		}
		else {
			renderData(data);
		}
	}
}

//renderiza el contenido de las tarea (data)
function renderData(data) {
	contenedorTareas.innerHTML = '';
	let fragmento = document.createDocumentFragment()

	for (let dato of data) {
		if(dato.hora === '') dato.hora = '12:00'

		let tarea = document.createElement('article'),
			nombre = document.createElement('h2'),
			contenedorTiempo = document.createElement('section'),
			hora = document.createElement('span'),
			fecha = document.createElement('h2'),
			desc = document.createElement('p'),
			btnEliminar = document.createElement('span'),
			btnEditar = document.createElement('span');

		tarea.classList.add('tarea');
		nombre.classList.add('tarea__nombre');
		contenedorTiempo.classList.add('tarea__time-container');
		hora.classList.add('tarea__time');
		fecha.classList.add('tarea__time');
		desc.classList.add('tarea__descripcion');
		btnEditar.classList.add('tarea__btn', 'btn__editar');
		btnEliminar.classList.add('tarea__btn', 'btn__eliminar');

		tarea.style.setProperty('--color-usuario', dato.color);

		nombre.textContent = dato.nombre;
		fecha.textContent = dato.fecha;
		hora.textContent = dato.hora;
		desc.textContent = dato.descripcion;
		btnEditar.textContent = 'Editar';
		btnEliminar.textContent = 'Eliminar';
		btnEditar.dataset.key = dato.nombre;
		btnEliminar.dataset.key = dato.nombre;

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
	console.log('finalizo renderizado')
}


//crea y retorna nodo de una ventana modal con el form tarea
function crearModal(accion='crear') {
	let modal = document.createElement('div');
	modal.classList.add('modal');
	let btnClose = document.createElement('span');
	btnClose.classList.add('modal__close')
	modal.appendChild(btnClose);
	modal.innerHTML += `<form class="form" data-accion="${accion}">
	<h2>Añadir Tarea</h2>

	<label class="form__label" for="tarea-nombre">Nombre</label>
	<input type="text" id="tarea-nombre" class="form__input" name="nombre" minlength="3" placeholder="Escribe un nombre" maxlength="50" required>

	<label class="form__label" for="tarea-descripcion">Descripcion</label>
	<textarea class="form__input desc"  id="tarea-descripcion" name="desc" minlength="5" placeholder="Escribe una descripcion" maxlength="255" required></textarea>

	<label class="form__label" for="tarea-fecha">Fecha</label>
	<input type="date" name="fecha" id="tarea-fecha" class="form__input" required>

	<label class="form__label" for="tarea-hora">Hora</label>
	<input type="time" name="hora" id="tarea-hora" class="form__input">

	<label class="form__label" for="tarea-hora">Color (Preferiblemente tonos claros)</label>
	<input type="color" name="color" value="#02a96f" id="tarea-hora" class="form__input">

	<button class="form__guardar" type="submit">Guardar</button>
	</form>`
	document.body.appendChild(modal);
	return modal;
}


//recibe el evento sumbit, extrae la informacion y llama manipularData(data)
function crearTarea(e) {
	e.preventDefault();
	let nombre = e.target.nombre.value,
		descripcion = e.target.desc.value,
		fecha = e.target.fecha.value,
		hora = e.target.hora.value,
		color = e.target.color.value;
	let accion = e.target.dataset.accion;


	cargarData();
	console.log(e.target)
	cerrarModal(e.target);

	manipularData({
		nombre, 
		descripcion,
		fecha,
		hora,
		color
	}, accion)
}

//agrega o actualiza "data" a la base de datos y llama a cargarData()
function manipularData(data, accion='crear') {
	let transaccion = db.transaction(['Tareas'], 'readwrite');
	let almacen = transaccion.objectStore('Tareas')
	console.log(data, accion);
	if(accion === 'crear') almacen.add(data);
	else if(accion === 'actualizar') almacen.put(data);
	cargarData();
}
// cierra la ventana modal, recibe el input type=submit
function cerrarModal(nodo) {
	nodo.parentElement.parentElement.removeChild(nodo.parentElement);
}

//recibe la "data" de una tarea y crea modal con formulario esta
function editarTarea(data){
	let modal = crearModal('actualizar');
	let form = modal.querySelector('.form');
	console.log(data)
	form.nombre.disabled = true;
	form.nombre.value = data.nombre
	form.desc.value = data.descripcion;
	form.fecha.value = data.fecha;
	form.hora.value = data.hora;
	form.color.value = data.color;
}

// obtiene la info de una tarea de la bbdd y la envia a  ediatarTarea()
function obtenerTarea(key){
	let transaccion = db.transaction(['Tareas'], 'readonly');
	let objectStorage = transaccion.objectStore('Tareas')
	let confirmacion = objectStorage.get(key);
	confirmacion.onsuccess = e=>{
		editarTarea(e.target.result);
	}
	confirmacion.onerror = e=>{
		alert('algo ha fallado, intente actualizar la pagina y actualizar luego')
	}
}

//recibe la key de una tarea la elimina y llama a cargarData()
function eliminarTarea(key){
	let transaccion = db.transaction(['Tareas'], 'readwrite');
	let almacen = transaccion.objectStore('Tareas');
	let request = almacen.delete(key);
	cargarData();
}


//************ Escucha y delegacion de eventos DOM **************

document.addEventListener('submit', crearTarea)

document.addEventListener('click', e => {
	if (e.target.matches('.modal__close')) cerrarModal(e.target);
	if (e.target.matches('.header__agregar')) crearModal();
	if(e.target.matches('.btn__editar')) obtenerTarea(e.target.dataset.key);
	if(e.target.matches('.btn__eliminar')) eliminarTarea(e.target.dataset.key);
})


//*********************service worker y cache ********************************

navigator.serviceWorker.register('worker.js');
