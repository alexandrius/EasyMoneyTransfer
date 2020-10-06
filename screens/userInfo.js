import React, { useState } from "react";
import { View } from "react-native";
import { Appbar, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-community/async-storage";

export default function UserInfo({ onDataSaved }) {
   const [name, setName] = useState("");
   const [iban, setIban] = useState("");
   const [avatar, setAvatar] = useState("");

   return (
      <View>
         <Appbar.Header>
            <Appbar.Content
               title="User information"
               subtitle="Please enter user information"
            />
            <Appbar.Action
               icon="content-save"
               onPress={async () => {
                  if (name && iban) {
                     const userInfo = {
                        name,
                        iban,
                        avatar: avatar || `https://robohash.org/${iban}.png`,
                     };
                     AsyncStorage.setItem(
                        "user_info",
                        JSON.stringify(userInfo)
                     );
                     onDataSaved(userInfo);
                  }
               }}
            />
         </Appbar.Header>

         <TextInput
            label="Enter your name"
            value={name}
            onChangeText={setName}
         />
         <TextInput
            label="Enter your iban"
            value={iban}
            onChangeText={setIban}
         />
         <TextInput
            label="Paste avatar link"
            value={avatar}
            onChangeText={setAvatar}
         />
      </View>
   );
}
