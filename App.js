import React, { useEffect, useState } from "react";
import { StyleSheet, View, LogBox } from "react-native";

import AsyncStorage from "@react-native-community/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import UserInfo from "./screens/userInfo";
import LottieView from "lottie-react-native";
import MoneyAmount from "./screens/moneyAmount";
import Users from "./screens/users";
import {
   DefaultTheme,
   Provider as PaperProvider,
   ActivityIndicator,
} from "react-native-paper";

const theme = {
   ...DefaultTheme,
   dark: false,
   mode: "exact",
};

LogBox.ignoreAllLogs(true);

const Stack = createStackNavigator();

export default function App() {
   const [userInfo, setUserInfo] = useState();
   const [dataLoaded, setDataLoaded] = useState(false);

   const onDataLoaded = (info) => {
      setDataLoaded(true);
      setUserInfo(info);
   };

   useEffect(() => {
      AsyncStorage.getItem("user_info").then((info) => {
         if (info) {
            setUserInfo(JSON.parse(info));
         }
         setDataLoaded(true);
      });
   }, []);

   return (
      <PaperProvider theme={theme}>
         {!dataLoaded ? (
            <View style={styles.indicatorContainer}>
               <ActivityIndicator size="large" />
            </View>
         ) : (
            <>
               {!userInfo ? (
                  <UserInfo onDataSaved={onDataLoaded} />
               ) : (
                  <NavigationContainer>
                     <Stack.Navigator>
                        <Stack.Screen
                           options={{ title: "Send Money" }}
                           name="MoneyAmount"
                           component={MoneyAmount}
                        />
                        <Stack.Screen
                           options={{ title: "People around you" }}
                           name="Users"
                           component={Users}
                        />
                     </Stack.Navigator>
                  </NavigationContainer>
               )}
            </>
         )}
      </PaperProvider>
   );
}

const styles = StyleSheet.create({
   indicatorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
   },
});
