import React, { useEffect, useState, useRef } from "react";
import publicIP from "react-native-public-ip";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-community/async-storage";
import { setDevice, listenToDevices } from "../services/firebase";
import axios from "axios";
import {
   View,
   Text,
   Image,
   StyleSheet,
   Dimensions,
   Vibration,
   Platform,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { getStatusBarHeight } from "react-native-iphone-x-helper";
import Animated, {
   useAnimatedStyle,
   useSharedValue,
   withSpring,
   useAnimatedGestureHandler,
   runOnJS,
} from "react-native-reanimated";
import moment from "moment";
import currency from "currency.js";
import * as Haptics from "expo-haptics";

//normal 60
const DISSAPEAR_AFTER = 60;

function Person({ avatar, name, iban, onPositionSet, isHovered }) {
   const scale = useSharedValue(0);
   const animStyle = useAnimatedStyle(() => {
      return {
         transform: [{ scale: scale.value }],
      };
   });
   useEffect(() => {
      scale.value = withSpring(1, {
         duration: 200,
      });
   }, []);

   useEffect(() => {
      const reqValue = isHovered ? 1.2 : 1;
      scale.value = withSpring(reqValue, {
         duration: 200,
      });
   }, [isHovered]);

   return (
      <Animated.View
         onLayout={({ nativeEvent: { layout } }) => {
            onPositionSet(iban, layout);
         }}
         style={[styles.personContainer, animStyle]}
      >
         <Image style={styles.avatar} source={{ uri: avatar }} />
         <Text style={styles.name}>{name}</Text>
      </Animated.View>
   );
}

let statusBarHeight = 0;

export default function Users({ route, navigation }) {
   const amount = route.params?.amount;

   const [people, setPeople] = useState([]);
   const [peopleCoords, setPeopleCoords] = useState([]);
   const peopleCoordsRef = useRef({});
   const [hoveringIndex, setHoveringIndexRaw] = useState(-1);
   const hoveringIndexRef = useRef(-1);
   const [moneyTransferTriggered, setMoneyTransferTriggered] = useState(false);

   const setHoveringIndex = (index) => {
      hoveringIndexRef.current = index;
      setHoveringIndexRaw(index);
   };

   const intervalRef = useRef(null);

   const translateX = useSharedValue(0);
   const translateY = useSharedValue(0);

   const animatedStyles = useAnimatedStyle(() => {
      return {
         transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
         ],
      };
   });

   const getIpAndStartListening = async () => {
      const ip = await publicIP();
      const userInfo = JSON.parse(await AsyncStorage.getItem("user_info"));

      listenToDevices(ip, (data) => {
         let rawPeople = Object.values(data);
         let _people = [];
         rawPeople.forEach((p) => {
            const duration = moment.duration(moment().diff(p.timestamp));
            if (
               p.iban !== userInfo.iban &&
               duration.asSeconds() < DISSAPEAR_AFTER
            ) {
               _people.push(p);
            }
         });

         setPeople(_people);
      });

      setDevice(ip, userInfo);

      intervalRef.current = setInterval(() => setDevice(ip, userInfo), 30000);
   };

   useEffect(() => {
      getIpAndStartListening();
      statusBarHeight = getStatusBarHeight(true);
      return () => {
         if (intervalRef.current) clearInterval(intervalRef.current);
      };
   }, []);

   useEffect(() => {
      if (hoveringIndex >= 0 && moneyTransferTriggered) {
         const token = people[hoveringIndex].token;
         if (token)
            axios
               .post(
                  "https://exp.host/--/api/v2/push/send",
                  {
                     to: token,
                     title: "Someone sent Money",
                     body: `You received $ ${currency(amount)}USD`,
                  },
                  {
                     headers: {
                        host: "exp.host",
                        accept: "application/json",
                        "accept-encoding": "gzip, deflate",
                        "content-type": "application/json",
                     },
                  }
               )
               .then((res) => console.log("res", res));
      }
   }, [hoveringIndex, moneyTransferTriggered]);

   const vibrate = () => {
      if (Platform.OS === "android") Vibration.vibrate(10);
      else Haptics.selectionAsync();
   };

   const onGestureEvent = useAnimatedGestureHandler({
      onStart: (_, ctx) => {
         ctx.offsetX = translateX.value;
         ctx.offsetY = translateY.value;
      },
      onActive: (event, ctx) => {
         const y = event.absoluteY - statusBarHeight - 75;
         const x = event.absoluteX;
         let index = -1;

         peopleCoords.forEach((coords) => {
            if (
               x > coords.x &&
               x < coords.x + coords.width &&
               y > coords.y &&
               y < coords.y + coords.height
            ) {
               for (let i = 0; i < people.length; i++) {
                  if (people[i].iban === coords.id) {
                     index = i;
                     break;
                  }
               }
            }
         });
         if (index >= 0) {
            if (hoveringIndexRef.current !== index) {
               runOnJS(setHoveringIndex)(index);
               runOnJS(vibrate)();
            }
         } else if (hoveringIndexRef.current >= 0) {
            runOnJS(setHoveringIndex)(-1);
         }

         translateX.value = ctx.offsetX + event.translationX;
         translateY.value = ctx.offsetY + event.translationY;
      },
      onEnd: () => {
         translateX.value = withSpring(0, { duration: 100 });
         translateY.value = withSpring(0, { duration: 100 });
         if (hoveringIndexRef.current >= 0) {
            runOnJS(setMoneyTransferTriggered)(true);
         }
      },
   });

   const onPersonPositionSet = (id, pos) => {
      peopleCoordsRef.current[id] = { ...pos, id };
      setPeopleCoords(Object.values(peopleCoordsRef.current));
   };

   return (
      <View style={styles.flex}>
         <View style={styles.peopleContainer}>
            {people.map((p, i) => (
               <Person
                  isHovered={hoveringIndex === i}
                  onPositionSet={onPersonPositionSet}
                  {...p}
                  key={p.iban}
               />
            ))}
         </View>

         {!!amount && (
            <View style={styles.moneyRoot}>
               <PanGestureHandler {...{ onGestureEvent }}>
                  <Animated.View
                     source={require("../assets/money_background.png")}
                     style={[styles.moneyContainer, animatedStyles]}
                  >
                     <Image
                        style={styles.moneyBackground}
                        resizeMode="contain"
                        source={require("../assets/money_background.png")}
                     />
                     <Text style={styles.moneyAmounttoSend}>
                        $ {currency(amount).toString()}
                     </Text>
                  </Animated.View>
               </PanGestureHandler>
            </View>
         )}
         {moneyTransferTriggered && (
            <View style={styles.moneyTransferOverlay}>
               <LottieView
                  autoPlay
                  style={styles.animation}
                  loop={false}
                  source={require("../assets/send_money.json")}
                  onAnimationFinish={() => {
                     navigation.goBack();
                  }}
               />
            </View>
         )}
      </View>
   );
}

const styles = StyleSheet.create({
   flex: {
      flex: 1,
      paddingTop: 10,
      backgroundColor: "#F3F4F6",
   },
   peopleContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
   },
   moneyBackground: {
      flex: 1,
   },
   moneyAmounttoSend: {
      color: "white",
      position: "absolute",
      height: "100%",
      width: "100%",
      textAlign: "center",
      top: 40,
      fontWeight: "bold",
      fontSize: 16,
   },
   personContainer: {
      alignItems: "center",
      marginHorizontal: 10,
      height: 80,
   },
   avatar: {
      height: 80,
      width: 80,
      borderRadius: 40,
      backgroundColor: "white",
   },
   name: {
      marginTop: 10,
      fontSize: 16,
      color: "#2b2b40",
   },
   iban: {
      fontSize: 10,
   },
   moneyRoot: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
   },
   moneyContainer: {
      alignItems: "center",
      justifyContent: "center",
      height: 100,
      width: 100,
      borderRadius: 50,
   },
   moneyTransferOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#38c172",
   },
});
