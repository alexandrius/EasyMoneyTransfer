import React, { useEffect, useState } from "react";
import { StyleSheet, FlatList, View } from "react-native";
import firebase from "firebase";
import "firebase/firestore";
import * as Device from "expo-device";
import moment from "moment";
import publicIP from "react-native-public-ip";
import { NavigationContainer } from "@react-navigation/native";

const firebaseConfig = {
   apiKey: "AIzaSyDQwA0A0xhd2SCzhEa2Rgkrnb-9cHVNObQ",
   authDomain: "localbankusers.firebaseapp.com",
   databaseURL: "https://localbankusers.firebaseio.com",
   projectId: "localbankusers",
   storageBucket: "localbankusers.appspot.com",
   messagingSenderId: "657466208482",
   appId: "1:657466208482:web:cf191540473b8303d1eebb",
};

console.log("firebase.apps", firebase.apps);

if (!firebase.apps || firebase.apps.length === 0) {
   firebase.initializeApp(firebaseConfig);
}

const dbh = firebase.firestore();

export default function App() {
   const [devices, setDevices] = useState();

   const getMacAddress = async () => {
      const ip = await publicIP();

      dbh.collection("mac_addresses")
         .doc(ip)
         .onSnapshot({ includeMetadataChanges: true }, (doc) => {
            console.log(doc.data());
         });

      dbh.collection("mac_addresses")
         .doc(ip)
         .set(
            {
               [Device.modelName]: moment().format(),
            },
            { merge: true }
         );
   };

   useEffect(() => {
      getMacAddress();
   }, []);

   return (
      <NavigationContainer>
         <View style={styles.container}>
            <FlatList data={devices} />
         </View>
      </NavigationContainer>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
});
