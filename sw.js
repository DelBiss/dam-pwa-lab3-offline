self.version = "V1"
const cacheKeeplist = [self.version]
const doNotCache =[
    "index2.html",
]
console.log(self.version, "Service worker")

async function waitForPageLoad(){
    console.log("!!WAIT!!!")
    return fetch("./index2.html").then(
        (response)=>{
            console.log("=========== RESPONSE")
            self.registration.showNotification("La page est maintenant disponible")
            return response
        }
    )
}
self.addEventListener('sync', function(event) {
    console.log(self.version,"Sync Event", event)
    if (event.tag == 'syncOffline') {
        event.waitUntil(
            waitForPageLoad()
        )
    }
   });
   

self.addEventListener('install', (event) => {
    console.log(self.version, '[Service Worker] Installation', event);
    event.waitUntil(
        caches.open(self.version).then(function(cache) {
            console.log(self.version, "Caching new version")
            return cache.addAll([
                "./index.html",
                "./index_offline.html",
                "./load-sw.js",
                "./load-app.js",
                "./backgroud_sync.js",
                "./bootstrap-5.1.3-dist/css/bootstrap.min.css ",
                "./icons-1.7.2/font/bootstrap-icons.css",
                "./bootstrap-5.1.3-dist/js/bootstrap.bundle.min.js",
                "./img/charle.jpg",
                "./img/guillaume.jpg",
                "./img/philippe.jpg",
                "./img/zac.jpg",
                "./img/offline-internet.png",
                "./img/sun.png",
            ]);
        })
    );

})
function isSameOrigin(url) {
    const urlOrigin = (url).origin;
    console.log("SAME ORIGIN",self.location.origin, urlOrigin)
    return urlOrigin === self.location.origin;
  }

async function FetchCache(eventRequest){
    const fichier = eventRequest.url.split("/").splice(-1)[0]
    const requestURL = new URL(eventRequest.url)
    

    //Fetch the request
    return fetch(eventRequest)
    .then(
        (fetchResponse) => {

            //And update cache if is same Origin or Not in the DoNotCache list
            if(isSameOrigin(requestURL) && !(doNotCache.includes(fichier))){
                let responseClone = fetchResponse.clone();

                caches.open(self.version).then(function(cache) {
                    cache.put(eventRequest, responseClone);
                });
            }
            return fetchResponse;
        }
    )
    .catch(
        //if the fetch failed
        ()=>{
            let cacheRequestUrl = eventRequest.url
            if(doNotCache.includes(fichier)){
                pathSplit = requestURL.pathname.split("/")
                pathSplit[pathSplit.length-1] = "index_offline.html"
                cacheRequestUrl = pathSplit.join("/")
            }
            console.log("Looking into cache for", cacheRequestUrl)
            return caches.match(cacheRequestUrl)
        }
    )
}
self.addEventListener('fetch', function(event) {
    const fichier = event.request.url.split("/").splice(-1)[0]
    const requestURL = new URL(event.request.url)
    console.debug("Fetch:", event.request,"doNotCache",doNotCache.includes(fichier),"isSameOrigin",isSameOrigin(requestURL), "IsOnline",navigator.onLine)
    return event.respondWith(FetchCache(event.request))
        
})


self.addEventListener('activate', event => {
    console.log(self.version, "Activate")
    event.waitUntil(
        caches.keys()
        .then(
            (keyList) => {
                return Promise.all(
                    keyList.map(
                        (key) => {
                            if (cacheKeeplist.indexOf(key) === -1) {
                                console.log("Deleting", key)
                                return caches.delete(key);
                            }
                        }
                    )
                );
            }
        )
    );
});
