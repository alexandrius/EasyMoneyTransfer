import React, { useEffect, useState, useRef } from "react";
import publicIP from "react-native-public-ip";
import AsyncStorage from "@react-native-community/async-storage";
import { setDevice, listenToDevices } from "../services/firebase";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
   useAnimatedStyle,
   useSharedValue,
   withSpring,
   useAnimatedGestureHandler,
} from "react-native-reanimated";
import moment from "moment";

const { height, width } = Dimensions.get("window");

//normal 60
const DISSAPEAR_AFTER = 60;

function Person({ avatar, name, iban }) {
   const scale = useSharedValue(0);
   const animStyle = useAnimatedStyle(() => {
      return {
         transform: [{ scale: scale.value }],
      };
   });
   useEffect(() => {
      scale.value = withSpring(1, {
         duration: 500,
      });
   }, []);

   return (
      <Animated.View style={[styles.personContainer, animStyle]}>
         <Image style={styles.avatar} source={{ uri: avatar }} />
         <Text style={styles.name}>{name}</Text>
         <Text style={styles.iban}>{iban}</Text>
      </Animated.View>
   );
}

export default function Users({ route }) {
   const amount = route.params?.amount;

   const [people, setPeople] = useState([]);
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
         console.log("received_data", data);
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
      return () => {
         if (intervalRef.current) clearInterval(intervalRef.current);
      };
   }, []);

   const onGestureEvent = useAnimatedGestureHandler({
      onStart: (_, ctx) => {
         ctx.offsetX = translateX.value;
         ctx.offsetY = translateY.value;
      },
      onActive: (event, ctx) => {
         translateX.value = ctx.offsetX + event.translationX;
         translateY.value = ctx.offsetY + event.translationY;
      },
      onEnd: ({ velocityX, velocityY }) => {
         translateX.value = withSpring(0, { duration: 200 });
         translateY.value = withSpring(0, { duration: 200 });
      },
   });

   return (
      <View style={styles.flex}>
         {people.map((p) => (
            <Person {...p} key={p.iban} />
         ))}

         {!!amount && (
            <View style={styles.moneyRoot}>
               <PanGestureHandler {...{ onGestureEvent }}>
                  <Animated.View
                     style={[styles.moneyContainer, animatedStyles]}
                  >
                     <Text>{amount} $</Text>
                  </Animated.View>
               </PanGestureHandler>
            </View>
         )}
      </View>
   );
}

const styles = StyleSheet.create({
   flex: {
      flex: 1,
      paddingTop: 10,
   },
   personContainer: {
      alignItems: "center",
   },
   avatar: {
      height: 80,
      width: 80,
      borderRadius: 40,
   },
   name: {
      marginTop: 10,
      fontSize: 12,
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
      height: 60,
      width: 60,
      borderRadius: 30,
      borderWidth: 1,
      backgroundColor: "white",
   },
});
