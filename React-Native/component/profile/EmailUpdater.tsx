 import React, { useState } from "react";
import { View, Text, TextInput, Button, Modal, Alert,TouchableOpacity,StyleSheet } from "react-native";
import { supabase } from "../../lib/Superbase"; // adjust path
import {useRouter} from 'expo-router';
export default function EmailUpdater({ userId, account, setAccount }) {
  const [loading, setLoading] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [newEmail, setNewEmail] = useState(account.email || "");
  const [password, setPassword] = useState("");
  const router = useRouter()

const handleUpdateEmail = async () => {
  try {
    setLoading(true);

    // Step 1: Re-authenticate
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password,
    });

    if (signInError) throw signInError;
    if (!sessionData?.session) throw new Error("Re-authentication failed");

    // Step 2: Trigger email change (⚠️ don’t await long)
    supabase.auth.updateUser({ email: newEmail })
      .catch(err => console.error("Update user failed:", err)); // log if it fails


    
    // Step 3: Update your accounts table
    const { error: dbError } = await supabase
      .from("accounts")
      .update({ email: newEmail })   // 👈 update your column
      .eq("user_id", sessionData.session.user.id); // match with auth user id

    if (dbError) {
      console.error("Failed to update accounts table:", dbError);
    }

    // Step 3: Show alert & force sign out immediately
    Alert.alert(
      "Verify New Email",
      "We’ve sent a confirmation link to your new email. Please check your inbox and confirm it to complete the update."
    );

    setShowPasswordPrompt(false);
    setPassword("");
    setLoading(false);

    await supabase.auth.signOut();
    router.replace("/auth/SignIn");






    
  } catch (err: any) {
    setLoading(false); // stop spinner before logging out
    Alert.alert("Error", err.message || "Failed to update email");
  } 
};



  return (
    <View>
      
      
         <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={newEmail || ""}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email"
              /> 
        
        
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelBtn} >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
        
                <TouchableOpacity style={styles.saveBtn} onPress={() => setShowPasswordPrompt(true)}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
        
              </View>
            </View>

    
      <Modal visible={showPasswordPrompt} animationType="slide" transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              width: "85%",
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              elevation: 5,
            }}
          >
            <Text style={{ marginBottom: 12, fontWeight: "bold" }}>
              Re-enter password to confirm
            </Text>
            <TextInput
              secureTextEntry
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              style={{
                borderWidth: 1,
                padding: 8,
                marginBottom: 16,
                borderRadius: 6,
              }}
            />
            <Button
              title={loading ? "Updating..." : "Confirm"}
              onPress={handleUpdateEmail}
              disabled={loading}
            />
            <View style={{ marginTop: 10 }}>
              <Button
                title="Cancel"
                color="red"
                onPress={() => {
                  setShowPasswordPrompt(false);
                  setPassword("");
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom:10,marginTop: 20, },
  label: { fontSize: 14, fontWeight: "500", marginTop: 15 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 5 },
  button: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, marginTop: 30, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  cancelText: {
    color: "#007AFF",
    fontSize: 16,
  },
  saveBtn: {
   
    backgroundColor: "rgba(0, 122, 255, 1)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deactivate:{
    flexDirection: "row",
    justifyContent: "space-between",    
    
 
    marginTop: 20,
    alignItems: "center",
  },
});
 



