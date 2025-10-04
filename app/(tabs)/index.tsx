import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

// ✅ Configure notifications (new API, no warnings)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Index() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        console.log("✅ Expo Push Token:", token);
        // After tokenResponse.data is received
        const token = tokenResponse.data;
        console.log("✅ Expo Push Token:", token);

        // Send token to backend
`       await fetch("http://127.0.0.1:8000/register-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        });`

      } else {
        console.warn("⚠️ No push token received.");
      }
    });

    // Listener: notification received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📩 Notification received:", notification);
      });

    // Listener: when user taps on a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Local test notification
  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💸 Expense Alert!",
        body: "Alice added $40 for Dinner 🍕. You owe $10.",
      },
      trigger: { seconds: 2 },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Expense Splitter Push Test</Text>
      <Text>Your Expo Push Token:</Text>
      <Text selectable style={styles.tokenText}>
        {expoPushToken ?? "Fetching..."}
      </Text>
      <Button title="Send Test Notification" onPress={sendTestNotification} />
    </View>
  );
}

// ✅ Helper: register device & get push token
async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.warn("⚠️ Must use a physical device for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("⚠️ Notification permissions not granted!");
    return null;
  }

  try {
    // ✅ Requires projectId from app.json
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error("❌ No projectId found. Please add it to app.json under extra.eas.projectId");
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("📡 Full Expo token response:", tokenResponse);
    return tokenResponse.data;
  } catch (err) {
    console.error("❌ Failed to get push token:", err);
    return null;
  }

}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  tokenText: { 
  fontSize: 12, 
  marginVertical: 10, 
  textAlign: "center",
  color: "#00FF00"   // 👈 bright green so you can see it clearly
},
});
