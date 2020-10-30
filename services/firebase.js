import firebase from "firebase";
import "firebase/firestore";
import moment from "moment";

const defaults = {
   pushToken: null,
};

const firebaseConfig = {
   apiKey: "AIzaSyDQwA0A0xhd2SCzhEa2Rgkrnb-9cHVNObQ",
   authDomain: "localbankusers.firebaseapp.com",
   databaseURL: "https://localbankusers.firebaseio.com",
   projectId: "localbankusers",
   storageBucket: "localbankusers.appspot.com",
   messagingSenderId: "657466208482",
   appId: "1:657466208482:web:cf191540473b8303d1eebb",
};

if (firebase.apps.length === 0) {
   firebase.initializeApp(firebaseConfig);
}

const dbh = firebase.firestore();

const setDevice = (ip, userInfo) => {
   dbh.collection("ip_addresses")
      .doc(ip)
      .set(
         {
            [userInfo.iban]: {
               timestamp: moment().format(),
               iban: userInfo.iban,
               name: userInfo.name,
               avatar: userInfo.avatar,
               token: defaults.pushToken,
            },
         },
         { merge: true }
      );
};

const listenToDevices = (ip, onData) => {
   dbh.collection("ip_addresses")
      .doc(ip)
      .onSnapshot({}, (doc) => {
         onData(doc.data());
      });
};

export { setDevice, listenToDevices, defaults };
