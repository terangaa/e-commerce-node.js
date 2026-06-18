if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js")
    .then(() => console.log("SW OK"))
    .catch(err => console.log("SW ERROR", err));
}