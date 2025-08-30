// To center the 'Login' button and add a 'Progressing...' indicator when logging in,
// update the component as follows:

import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { ImageBackground } from "react-native";

import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AlignCenter } from "lucide-react";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/07uaAt66XG1tMh2UZZfrEV877fGUjpzjrlqYIX4FBPQoSqgB9AmlRGmx7q8gmf1tKKeqFjekK8ljKM9taYQIZswEh8H734PJ1VhKME2xYlMikUTshpbBt5uRUbU2VtHpztat97D0SdLgcaGbFqpes1Lp40rOgwyM9OSXsoA7sofamFf9XwSGZBuCHW0AIssdes9cTGcXZJFukl6mWEZa2Fx1HDI5MmiUa7fJx6XmSB2tRQQGHipKbsM2h67FXVbeJGKkTqxm9Kl5TcsFREdMaDDLPx9RxwFFJ55wdjDfROt4BsCuCHw18iCiIXCrvvz1Zc9r5Lo7a7cWsZtVTFUOkTVXojyJcsUtVXyWMLFXg73kva0QcFTQJZBmjYMqWweLowaRwdLceTfRURaiT3cWRp90sAcldKhCu7WZGHk2t0LussICVXlmKKBGYf3Mtqs9oaZYwo4sMx4D5gd0DuUHjK5kdM3spZAtdYoAsYT5EQYowk7E2KOoL1EfIvOrDyyS");
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: "https://cdn.pixabay.com/photo/2020/05/15/06/24/water-5172404_1280.jpg" }}
  style={styles.background}
  resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Welcome to ZAPEE WORLD! A Digital world.</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin as any}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </ImageBackground>
  );
};

const styles = StyleSheet.create({
    background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    height: 865,
    // backgroundColor: "#00ccc0",
    justifyContent: "center",
    alignItems: "center",
    padding: 200,
  },
  form: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "white",
    borderRadius: 15,
    paddingVertical: 40,
    paddingHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center", // Center the contents horizontally
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fffff",
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: 3,
    fontFamily: "Montserrat",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
    width: "100%",
  },
  button: {
    width: "100%", // Make button full width inside form container
    backgroundColor: "#00cc00",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
  },
  error: {
    color: "#d9534f",
    textAlign: "center",
    marginBottom: 15,
  },
});



export default LoginPage;
