import React, { useState, useEffect } from "react";
import {
   View,
   StyleSheet,
   Dimensions,
   TouchableOpacity,
   SafeAreaView,
   Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import { Text, Button } from "react-native-paper";
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";
import { Svg, Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { defaults } from "../services/firebase";

Notifications.setNotificationHandler({
   handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
   }),
});

const getPushPermissionAsync = async () => {
   return await Permissions.getAsync(Permissions.NOTIFICATIONS);
};

const registerForPushNotificationsAsync = async () => {
   const { status: existingStatus } = await getPushPermissionAsync();
   let finalStatus = existingStatus;
   if (Platform.OS === "ios" && existingStatus !== "granted") {
      console.log(
         "Push Notifications - Asking for push notification permission"
      );
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status;
   }

   if (finalStatus !== "granted") {
      return;
   }
   const token = (await Notifications.getExpoPushTokenAsync()).data;
   console.log("Push Notifications - token = ", token);
   defaults.pushToken = token;
};

const padMatrix = [
   ["1", "2", "3"],
   ["4", "5", "6"],
   ["7", "8", "9"],
   [".", "0", "←"],
];

const { width } = Dimensions.get("window");

const itemWidth = width / 3;

function PadButton({ height, value, onPress }) {
   return (
      <TouchableOpacity
         activeOpacity={0.3}
         onPress={onPress}
         style={styles.item}
      >
         <View style={StyleSheet.absoluteFill}>
            <Svg height={height} width={itemWidth}>
               <Defs>
                  <RadialGradient
                     id="grad"
                     cx="50%"
                     cy="50%"
                     r="50%"
                     fx="50%"
                     fy="50%"
                     gradientUnits="userSpaceOnUse"
                  >
                     <Stop offset="0" stopColor="#eeeeee" stopOpacity="1" />
                     <Stop offset="1" stopColor="#fff" stopOpacity="1" />
                  </RadialGradient>
               </Defs>
               <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
            </Svg>
         </View>
         <Text style={{ fontSize: 23, color: "#455a64" }}>{value}</Text>
      </TouchableOpacity>
   );
}

const EMPTY_AMOUNT = "0.00";

export default function MoneyAmount({ navigation }) {
   const [numberPadHeight, setNumberPadHeight] = useState(0);
   const [amount, setAmount] = useState(EMPTY_AMOUNT);

   useEffect(() => {
      registerForPushNotificationsAsync();
   }, []);

   return (
      <SafeAreaView style={styles.flex}>
         <LottieView
            autoPlay
            style={styles.animation}
            source={require("../assets/money_in_hand.json")}
            onAnimationFinish={() => {}}
         />

         <Text
            style={[
               styles.amount,
               {
                  opacity: amount === EMPTY_AMOUNT ? 0.2 : 1,
               },
            ]}
         >
            {amount}
         </Text>
         <View
            style={styles.flex}
            onLayout={({ nativeEvent }) => {
               setNumberPadHeight(nativeEvent.layout.height);
            }}
         >
            {!!numberPadHeight &&
               padMatrix.map((row, i) => (
                  <View
                     style={styles.numberRow(
                        numberPadHeight / padMatrix.length
                     )}
                     key={i}
                  >
                     {row.map((v) => (
                        <PadButton
                           height={numberPadHeight / padMatrix.length}
                           value={v}
                           key={v}
                           onPress={() => {
                              if (v === "←") {
                                 if (amount.length === 1) {
                                    setAmount(EMPTY_AMOUNT);
                                 } else if (amount !== EMPTY_AMOUNT) {
                                    setAmount(
                                       amount.substring(0, amount.length - 1)
                                    );
                                 }
                                 return;
                              }

                              if (amount === EMPTY_AMOUNT) {
                                 if (v !== ".") {
                                    setAmount(v);
                                    return;
                                 }
                              }

                              if (amount.includes(".") && v === ".") {
                                 return;
                              }

                              if (
                                 amount.indexOf(".") !== -1 &&
                                 amount.substring(amount.indexOf(".") + 1)
                                    .length === 2
                              )
                                 return;
                              setAmount(amount + v);
                           }}
                        />
                     ))}
                  </View>
               ))}
         </View>

         <Button
            icon="send"
            mode="contained"
            style={styles.send}
            onPress={() => {
               setAmount(EMPTY_AMOUNT);
               navigation.navigate("Users", { amount });
            }}
         >
            Send
         </Button>

         <Button
            onPress={() => {
               navigation.navigate("Users");
            }}
            style={{ marginTop: 10 }}
         >
            I want to receive
         </Button>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   flex: {
      flex: 1,
      backgroundColor: "white",
   },
   animation: {
      width: 200,
      height: 200,
      alignSelf: "center",
      marginBottom: 20,
   },
   numberRow: (height) => ({
      flexDirection: "row",
      height,
   }),
   item: {
      height: "100%",
      width: itemWidth,
      alignItems: "center",
      justifyContent: "center",
   },
   send: {
      marginTop: 10,
      marginHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
   },
   amount: {
      alignSelf: "center",
      fontSize: 40,
   },
});
