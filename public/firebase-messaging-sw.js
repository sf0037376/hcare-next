importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDLuU8Xmo9Co6_tsWU7uFw1OeeXwdG0gLk",
  authDomain: "hcare-7ca08.firebaseapp.com",
  projectId: "hcare-7ca08",
  storageBucket: "hcare-7ca08.firebasestorage.app",
  messagingSenderId: "31424477293",
  appId: "1:31424477293:web:f48b240552896a6b942764",
  measurementId: "G-WQCK4TDJT8"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/next.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
