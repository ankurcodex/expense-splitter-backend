import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import { Button, FlatList, Platform, StyleSheet, Text, TextInput, View } from "react-native";

const API_URL = "https://expense-splitter-backend-okji.onrender.com";



// ✅ Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Index() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        fetch(`${API_URL}/register-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("📩 Notification received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("🧭 Notification response:", response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const fetchExpenses = async () => {
    const res = await fetch(`${API_URL}/expenses`);
    const data = await res.json();
    setExpenses(data.expenses || []);
  };
  console.log("📡 Sending expense to:", `${API_URL}/add-expense`);

  const addExpense = async () => {
    await fetch(`${API_URL}/add-expense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        amount: parseFloat(amount),
        added_by: addedBy,
        participants: ["Alice", "Bob"],
      }),
    });
    setDescription("");
    setAmount("");
    setAddedBy("");
    fetchExpenses();
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💸 Expense Splitter</Text>
      <Text style={styles.tokenText}>Token: {expoPushToken ? expoPushToken : "Fetching..."}</Text>

      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
      <TextInput style={styles.input} placeholder="Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
      <TextInput style={styles.input} placeholder="Added by" value={addedBy} onChangeText={setAddedBy} />

      <Button title="Add Expense" onPress={addExpense} />

      <Text style={styles.subtitle}>📜 Expenses:</Text>
      <FlatList
        data={expenses}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.listItem}>
            {item.added_by} spent ${item.amount} for {item.description}
          </Text>
        )}
      />
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 50 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  subtitle: { fontSize: 20, marginTop: 20, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginVertical: 5 },
  listItem: { fontSize: 16, marginVertical: 4 },
  tokenText: { fontSize: 12, marginBottom: 10 },
});
