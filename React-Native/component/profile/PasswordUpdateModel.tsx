import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  StyleSheet 
} from "react-native";
import { supabase } from "../../lib/Superbase"; // adjust path
import { useRouter } from 'expo-router';
export default function PasswordUpdateModal({ visible, onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePasswordUpdate = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // ✅ Step 1: Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.email) throw new Error("User email not found");

      // ✅ Step 2: Re-authenticate with old password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });
      if (authError) throw authError;

      // ✅ Step 3: Update new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      Alert.alert("Success", "Password updated successfully!");
      onClose();
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await supabase.auth.signOut();
          router.replace("/auth/SignIn");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Change Password</Text>

          <TextInput
            placeholder="Old Password"
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
            style={styles.input}
          />
          <TextInput
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
          />
          <TextInput
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handlePasswordUpdate} 
              disabled={loading}
            >
              <Text style={styles.saveText}>{loading ? "Updating..." : "Submit"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "85%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
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
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
