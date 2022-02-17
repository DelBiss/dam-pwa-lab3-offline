const sync_tag = "syncOffline"
const syncButton = document.querySelector('.register')
const syncMsg = document.querySelector('.syncRequestMsg')

function PromptSync(){
    syncMsg.innerHTML = "Vous pouvez être notifier losqu'elle sera disponible."
    syncMsg.classList.toggle('hidden', false)
    syncButton.classList.toggle('hidden', false)
}

function SyncPending(){
    syncMsg.innerHTML = "Vous serez notifier losqu'elle sera disponible."
    syncMsg.classList.toggle('hidden', false)
    syncButton.classList.toggle('hidden', true)
}

if ('serviceWorker' in navigator && 'SyncManager' in window) {
    syncButton.addEventListener('click', function(event) {
        event.preventDefault();

        new Promise(function(resolve, reject) {
        Notification.requestPermission(function(result) {
            if (result !== 'granted') return reject(Error("Denied notification permission"));
            resolve();
        })
        }).then(function() {
        return navigator.serviceWorker.ready;
        }).then(function(reg) {
        return reg.sync.register(sync_tag);
        }).then(function() {
        console.log('Sync registered');
        SyncPending()
        }).catch(function(err) {
        console.log('It broke');
        console.log(err.message);
        });
    });

    //Looking if already pending
    navigator.serviceWorker.ready
    .then(
        (reg) =>{
            return reg.sync.getTags();
        }
    ).then(
        (tags)=>{
            if(tags.includes(sync_tag)){
                console.log("Offline sync already pending")
                SyncPending()
            }
            else{
                PromptSync()
            }
        }
    ).catch(
        (err)=>{
            console.log("It broke")
            console.log(err)
        }
    )
}