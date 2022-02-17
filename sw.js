self.version = "V1"
const cacheKeeplist = [self.version]
const doNotCache =[
    "index2.html",
]
console.log(self.version, "Service worker")

self.addEventListener('sync', function(event) {
    console.log(self.version,"Sync Event", event)
    if (event.tag == 'syncOffline') {
        self.registration.showNotification("La page est maintenant disponible");
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
            ]);
        })
    );

})
function isSameOrigin(url) {
    const urlOrigin = (url).origin;
    return urlOrigin === self.location.origin;
  }

async function FetchCache(eventRequest){
    const fichier = eventRequest.url.split("/").splice(-1)[0]
    const requestURL = new URL(eventRequest.url)
    console.debug("Fetch", fichier, requestURL)

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
                requestURL.pathname = "/index_offline.html"
                cacheRequestUrl = requestURL.toString()
            }
            console.log("Looking into cache for", cacheRequestUrl)
            return caches.match(cacheRequestUrl)
        }
    )
}
self.addEventListener('fetch', function(event) {
    const fichier = event.request.url.split("/").splice(-1)[0]
    const requestURL = new URL(event.request.url)
    console.debug("Fetch:", event.request,"doNotCache",doNotCache.includes(fichier),"isSameOrigin",isSameOrigin(event.request.url))
    return event.respondWith(FetchCache(event.request))
    // if(doNotCache.includes(fichier)){
    //     console.log( "Not Cache fetch Request", fichier)
    //     return event.respondWith(
    //         fetch(event.request)
    //         .then(
    //             (fetchResponse)=>{
    //                 console.log(fichier, "Not Cache fetch response", fetchResponse)
    //                 return fetchResponse
    //             }
    //         )
    //         .catch(
    //             (reason)=>{
    //                 requestURL.pathname = "/index_offline.html"
    //                 console.log("Not Online",requestURL)
    //                 return (fetch())
    //             }
    //         )
    //     )
    // }
    // else if (!isSameOrigin(requestURL)){
    //     return event.respondWith(
    //         fetch(event.request)
    //     )
    // }
    // else{
    //     event.respondWith(
    //         fetch(event.request)
    //         .then(
    //             function(response) {
    //                 // response may be used only once
    //                 // we need to save clone to put one copy in cache
    //                 // and serve second one
    //                 // console.log("FETCH RESPONDED, Put in cache")
    //                 let responseClone = response.clone();

    //                 caches.open(self.version).then(function(cache) {
    //                     cache.put(event.request, responseClone);
    //                 });
    //                 return response;
    //             }
    //         )
    //         .catch( 
    //             () => {
    //                 // console.log("FETCH Fail, Look in cache")
    //                 return caches.match(event.request)
    //                 .then(
    //                     function(response) {
    //                         // caches.match() always resolves
    //                         // but in case of success response will have value
    //                         if (response !== undefined) {
    //                             // console.log("cache RESPONDED",response)
    //                             return response;
    //                         } else {
    //                             // console.log("cache faild")
    //                             return fetch(event.request).then(
    //                                 function(response) {
    //                                     // response may be used only once
    //                                     // we need to save clone to put one copy in cache
    //                                     // and serve second one
    //                                     let responseClone = response.clone();

    //                                     caches.open(self.version).then(
    //                                         function(cache) {
    //                                             cache.put(event.request, responseClone);
    //                                         }
    //                                     );
    //                                     return response;
    //                                 }
    //                             )
    //                         }
    //                     }
    //                 )
    //             }
    //         )
    //     );
    // }
    
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
