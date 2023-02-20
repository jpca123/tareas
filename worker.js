let version = 'Version 1';

//añadiendo al cache
self.addEventListener('install', e=>{
	caches.open(version).then(cache =>{
		console.log('service worker instalado');
		cache.addAll(['index.html', 'style.css', 'script.js', 'worker.js']);
	})
})

//cargando peticion de cache o de internet si no es osible
self.addEventListener('fetch', e=>{
	e.respondWith(caches.match(e.request).then(archivo =>{
		if(archivo) return archivo;
		return e.request;
	}))
})