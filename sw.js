self.version = "V02"
const cacheKeeplist = [self.version]
console.log(self.version, "Service worker")


self.addEventListener('message', function(event) {
    //Message received from client
    console.log(self.version, event.data);

    if (event.data.type == "TakeOver_Old_SW") {
        self.clients.matchAll().then(
            (c) => {
                let NbClientConnected = c.length
                if (NbClientConnected <= 1) {
                    event.source.postMessage({ type: "TakeOver_Old_SW", response: "Ready" })
                } else {
                    event.source.postMessage({ type: "TakeOver_Old_SW", response: `Wait`, NbClient: NbClientConnected })
                }
            }
        )
    }
    if (event.data.type == "TakeOver_New_SW") {
        self.skipWaiting();
    }
    //Send response to client using the port that was sent with the message
    // event.ports[0].postMessage("world");
});

self.addEventListener('install', (event) => {
    console.log(self.version, '[Service Worker] Installation', event);
    event.waitUntil(
        caches.open(self.version).then(function(cache) {
            console.log("Caching new version")
            return cache.addAll([
                "./index.html",
                "./load-sw.js",
                "./style/load-sw.css",
                "./load-app.js",
                "./bootstrap-5.1.3-dist/css/bootstrap.min.css ",
                "./icons-1.7.2/font/bootstrap-icons.css",
                "./index-sw.html"
            ]);
        })
    );

})

self.addEventListener('fetch', function(event) {
    // console.info(self.version, "Fetch:", event.request.url)
    event.respondWith(caches.match(event.request).then(function(response) {
        // caches.match() always resolves
        // but in case of success response will have value
        if (response !== undefined) {
            return response;
        } else {
            return fetch(event.request).then(function(response) {
                // response may be used only once
                // we need to save clone to put one copy in cache
                // and serve second one
                let responseClone = response.clone();

                caches.open(self.version).then(function(cache) {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
        }
    }));
    return fetch(event.request)
})


self.addEventListener('activate', event => {
    console.log(self.version, "Activate")
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (cacheKeeplist.indexOf(key) === -1) {
                    console.log("Deleting", key)
                    return caches.delete(key);
                }
            }));
        })
    );
    clients.claim();
});