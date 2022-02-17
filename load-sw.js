if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
  
      if (reg.installing) {
        console.log('Installation du Service Worker');
      } else if (reg.waiting) {
        console.log('Service Worker installer');
      } else if (reg.active) {
        console.log('Service Worker Actif');
      }
    }).catch(function (error) {
      // registration failed
      console.log('Echec de la registration ', error);
    });
  }

 
   
  async function LaunchInstall(){
    console.log('👍', 'butInstall-clicked');
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) {
      // The deferred prompt isn't available.
      return;
    }
    // Show the install prompt.
    promptEvent.prompt();
    // Log the result
    const result = await promptEvent.userChoice;
    console.log('👍', 'userChoice', result);
    // Reset the deferred prompt variable, since
    // prompt() can only be called once.
    window.deferredPrompt = null;
    // Hide the install button.
    document.getElementById('installContainer').classList.toggle('hidden', true);
    
  }
  window.addEventListener('beforeinstallprompt', (event) => {
    const divInstall = document.getElementById('installContainer');
    // Prevent the mini-infobar from appearing on mobile.
    event.preventDefault();
    console.log('👍', 'beforeinstallprompt', event);
    // Stash the event so it can be triggered later.
    window.deferredPrompt = event;
    // Remove the 'hidden' class from the install button container.
    document.getElementById('installContainer').classList.toggle('hidden', false);
  });
  
  window.addEventListener('appinstalled', (event) => {
    console.log('👍', 'appinstalled', event);
    // Clear the deferredPrompt so it can be garbage collected
    window.deferredPrompt = null;
    
  });

  document.getElementById('butInstall').addEventListener('click', LaunchInstall);
 
  