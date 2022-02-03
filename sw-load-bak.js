//@ts-check

// const _registration

const fetched_CSS_promise = []
function LogPass(msg){
    return function (arg) {
        console.log("[Client][Log]",msg)
        return arg
    }
}

function prefetchCSS(urls){

    return function (arg){
    for (const url of urls) {
        fetched_CSS_promise.push(fetchCss(url))
    }
return arg}
}

function fetchCss(url){
    let head = document.head;
    let link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'preload';     
    link.as = "style"   

    const linkPromise = new Promise((resolve, reject) => {
        link.onload = function (){resolve(link)}
        link.href = url;
        head.appendChild(link);
    })

    return new Promise((resolve) =>{
        resolve(linkPromise)
    })
}

function fetchContent(url){
    return function (){
        return fetch(url).then(
            (content)=>{
                return content.text()
            }
        )}
}

function showContent(content){
    Promise.all(fetched_CSS_promise)
        .then(
            (linkPromises)=>{
                return Promise.all(linkPromises)
            }
        )
        .then(
        (css_links) =>{
            for (const link of css_links) {
                link.rel ="stylesheet"
            }
        }
    ).then(
        () =>{
            document.body.innerHTML = content
        }
    )    
}
// function
/**
 * @param {ServiceWorkerRegistration} registration 
 * @returns {PromiseLike}
 */
function UpdateServiceWorker(registration){
    //If thers's already a SW, look for update
    if (registration){
        console.log("[Client][Update] Asking to update")        
        return registration.update().then(()=>{return registration})
    }
    else{
        console.log("[Client][Update] Register... again?")
        return navigator.serviceWorker.register('sw.js')
    }
}


function CheckWaiting(registration){
    if (registration.waiting){
        if (navigator.serviceWorker.controller) {
            // invokeServiceWorkerUpdateFlow(registration)
            console.log('[Client][CW] Service Worker Waiting')
            navigator.serviceWorker.controller.postMessage({type:"ReadyToUpdate"})
        } else {
            // otherwise it's the first install, nothing to do
            console.log('[Client][CW] Service Worker initialized for the first time')
        }
    }
    else{
        console.log("[Client][CW] No service worker waiting")
    }
    return registration
}

function HookEvent(eventStr, callback){
   return function (obj){
        obj.addEventListener(eventStr,callback)
        return obj
    }
    
}

function OnMessage(event){
    console.log("[MSG] Message Receive from SW:", event.data)
    if(event.data.type == "GoUpdate"){
        console.log("[MSG] GO!!!")
        event.target.ready.then(
            (registration)=>{
                console.log("[Client][MSG]  Sent message","TakeControl")
                registration.waiting.postMessage({type:"TakeControl"})
            })
    }
    if(event.data.type == "AskUpdate"){
        console.log("[Client][MSG] Other windows use the Service worker. Ask for update")
    }
}


function OnUpdate(e){
    console.log("[Client][EVENT][Update] Service Worker Update Found")
    CheckWaiting(e.target)
    if (e.target.installing) {
        console.log("[Client][EVENT][Update]  Service Worker Installing")
        e.target.installing.addEventListener("statechange",
        (g)=>{
                console.log("[Client][EVENT][STATEChange]  Statechange",g.target.state)
                CheckWaiting(e.target)
            })
    }
}

HookEvent("message",OnMessage)(navigator.serviceWorker)

// @ts-ignore
const register_prom = navigator.serviceWorker.register('sw.js')
    .then(LogPass("Register Done"))
    .then(prefetchCSS(["bootstrap-5.1.3-dist/css/bootstrap.min.css ","icons-1.7.2/font/bootstrap-icons.css"]))
    .then(HookEvent("updatefound",OnUpdate))
    .then(UpdateServiceWorker)
    .then(LogPass("Update Done"))
    .then(fetchContent("index-sw.html"))
    .then(showContent)
    .then(LogPass("ALL DONE!!!!"))
    // .then(CheckWaiting)




// .then((swr)=>{
//     console.log("Register Done")
//     return swr
// }).then(UpdateServiceWorker).then(()=>{})