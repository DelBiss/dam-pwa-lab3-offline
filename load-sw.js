//@ts-check

function AddCss(url) {
    let head = document.head;
    let link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = url;
    head.appendChild(link);
    return link;
}

/** @enum {string} */
const SERVICE_WORKER_STATE = Object.freeze({
    NONE: "[SW STATE] Not Registred",
    INSTALLING: "[SW STATE] Installing",
    WAITING: "[SW STATE] Waiting",
    UPDATING: "[SW STATE] Updating",
    TAKEOVER: "[SW STATE] Take over intiated",
    ASK: "[SW STATE] Update postponed until user agree",
    NEW: "[SW STATE] Waiting for new ruler",
    INIT: "[SW STATE] Initialisation",
    READY: "[SW STATE] Ready"
});


/**
 * @type {SERVICE_WORKER_STATE}
 */
let sw_state = SERVICE_WORKER_STATE.NONE

/**
 * Return the state of the service worker
 * @param {ServiceWorkerRegistration} registration 
 * @param {boolean} [initCompleted=false] 
 * @returns {SERVICE_WORKER_STATE}
 */
function GetServiceWorkerState(registration, initCompleted) {

    let current_state = sw_state
    if (registration && ([SERVICE_WORKER_STATE.NONE, SERVICE_WORKER_STATE.INIT, SERVICE_WORKER_STATE.INSTALLING, SERVICE_WORKER_STATE.WAITING].includes(current_state))) {
        current_state = initCompleted ? SERVICE_WORKER_STATE.READY : SERVICE_WORKER_STATE.INIT
        if (registration.installing) {
            current_state = SERVICE_WORKER_STATE.INSTALLING
        } else if (registration.waiting) {
            current_state = SERVICE_WORKER_STATE.WAITING
        }

    }

    return current_state
}

/**
 * Set the state of the service worker
 * @param {ServiceWorkerRegistration|SERVICE_WORKER_STATE} registration 
 * @param {boolean} [Complete] 
 */
function SetServiceWorkerState(registration, Complete) {
    let current_state = sw_state
    if (typeof registration === "string") {
        current_state = registration
    } else {
        current_state = GetServiceWorkerState(registration, Complete)
    }
    const isEnd = Complete ? "[End]" : ""
    if (Complete) {
        console.log("[Client]", "[End]", current_state)
    } else {
        console.info("[Client]", current_state)
    }
    sw_state = current_state
}

/**
 * @param {ServiceWorkerRegistration} registration 
 * @returns {Promise<ServiceWorkerRegistration>}
 */
function ServiceWorker_SetEndStatus(registration) {
    SetServiceWorkerState(registration, true)
    return Promise.resolve(registration)
}


/////////////////////////////////////////////////////////////////////////////

/**
 * @param {ServiceWorkerRegistration} [registration] 
 */
function ReadyForTakeOver(registration) {
    SetServiceWorkerState(SERVICE_WORKER_STATE.NEW)
    registration.waiting.postMessage({ type: "TakeOver_New_SW" })

}

/**
 * @param {MessageEvent} event
 */
function OnServiceWorkerMessage(event) {

    /** @type {{ type: string, response: string }} */
    const data = event.data

    const target = /** @type {ServiceWorkerContainer} */ (event.target)
        // console.log("[MSG] Message Receive from SW:", data)
    if (data.type == "TakeOver_Old_SW") {
        if (data.response == "Ready") {
            target.ready.then(ReadyForTakeOver)
        } else {
            SetServiceWorkerState(SERVICE_WORKER_STATE.ASK)
        }
    }
}

/**
 * @param {Event} g
 */
function OnStateChange(g) {
    // console.log("[EVENT][STATEChange]  Statechange", g.target)
    const service_worker = /** @type {ServiceWorker} */ (g.target)
    if (service_worker.state == "installed") {
        ServiceWorker_InitiateTakeOver()
    } else if (service_worker.state == "activated") {
        SetServiceWorkerState(SERVICE_WORKER_STATE.READY)
        service_worker.removeEventListener("statechange", OnStateChange)
    }
}

/**
 * @param {Event} e
 */
function OnUpdate(e) {
    const registration = /** @type {ServiceWorkerRegistration} */ (e.target)
    if (GetServiceWorkerState(registration) != sw_state) {
        SetServiceWorkerState(SERVICE_WORKER_STATE.UPDATING)
        registration.installing.addEventListener("statechange", OnStateChange)
    }
}

/**
 * @param {ServiceWorkerRegistration} [registration] 
 */
function ServiceWorker_InitiateTakeOver(registration) {
    console.debug("[Client]", "ServiceWorker_InitiateTakeOver")

    if (navigator.serviceWorker.controller) {
        if (registration && registration.waiting) {
            registration.waiting.addEventListener("statechange", OnStateChange)
        }
        SetServiceWorkerState(SERVICE_WORKER_STATE.TAKEOVER)
        navigator.serviceWorker.controller.postMessage({ type: "TakeOver_Old_SW" })
    }

}
/////////////////////////////////////////////////////////////////////////////

/**
 * @param {ServiceWorkerRegistration} registration 
 * @returns {Promise<ServiceWorkerRegistration>}
 */
function ServiceWorker_Init(registration) {
    console.debug("[Client]", "ServiceWorker_Init")
    SetServiceWorkerState(registration)
    if (sw_state === SERVICE_WORKER_STATE.NONE) {
        console.info("[Client]", "Registration of the Service Worker")
        return navigator.serviceWorker.register('sw.js')
            // throw new ServiceWorkerReady()
    } else if (sw_state == SERVICE_WORKER_STATE.WAITING) {
        ServiceWorker_InitiateTakeOver(registration)
    }

    return Promise.resolve(registration)
}

/**
 * @param {ServiceWorkerRegistration} registration 
 * @returns {Promise<ServiceWorkerRegistration>}
 */
function ServiceWorker_Update(registration) {
    console.debug("[Client]", "ServiceWorker_Update")
    registration.addEventListener("updatefound", OnUpdate)
    return registration.update()
        .then(
            () => {
                return Promise.resolve(registration)
            }
        )
}

/**
 * @param {ServiceWorkerRegistration} registration 
 * @returns {Promise<ServiceWorkerRegistration>}
 */
function ServiceWorker_CleanupListener(registration) {
    registration.removeEventListener("updatefound", OnUpdate)
    return Promise.resolve(registration)
}

/////////////////////////////////////////////////////////////////////////////

/**
 * @returns {PromiseLike<void|ServiceWorkerRegistration>}
 */
function InstallServiceWorker() {
    if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener("message", OnServiceWorkerMessage)
        return navigator.serviceWorker.getRegistration()
            .then(ServiceWorker_Init)
            .then(ServiceWorker_Update)
            .then(ServiceWorker_CleanupListener)
            .then(ServiceWorker_SetEndStatus)
    }
    return Promise.resolve()
}