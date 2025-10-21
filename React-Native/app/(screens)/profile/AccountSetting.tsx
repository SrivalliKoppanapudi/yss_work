import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList
} from "react-native";
import { supabase } from "../../../lib/Superbase"; // Ensure this path is correct
import { RadioButton } from "react-native-paper";
import EmailUpdater from "../../../component/profile/EmailUpdater"; // Adjust path as needed
import { Ionicons } from "@expo/vector-icons"; // for close icon
import StepList from '../../../component/goals/StepList';
import PasswordUpdateModal from "../../../component/profile/PasswordUpdateModel";
export interface Account {
  account_id: number;
  email: string;
  phone: string | null;
  password_hash: string;
  is_deactivated: boolean;
  preferred_locations: string[];
  expected_salary: number | null;
  course_notifications: boolean;
  learning_list_notifications: boolean;
  auto_save_progress: boolean;
  track_time_spent: boolean;
  highlight_recent_courses: boolean;
  show_saved_courses: boolean;
  auto_save_certificates: boolean;
  created_at: string;
  updated_at: string;
  user_id: string; // uuid
}

export default function AccountSetting() {
  // Core identifiers
const [accountId, setAccountId] = useState<number | null>(null);
const [userId, setUserId] = useState<string>("");

// Required fields
const [email, setEmail] = useState<string>("");
const [phone, setPhone] = useState<string>("");

// Security
const [passwordHash, setPasswordHash] = useState<string>("");

// Status
const [isDeactivated, setIsDeactivated] = useState<boolean>(false);

// Preferences
const [location, setLocation] = useState<string>("");
const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
const [expectedSalary, setExpectedSalary] = useState<number | null>(null);

const [courseNotifications, setCourseNotifications] = useState<boolean>(true);
const [learningListNotifications, setLearningListNotifications] = useState<boolean>(true);
const [autoSaveProgress, setAutoSaveProgress] = useState<boolean>(true);
const [trackTimeSpent, setTrackTimeSpent] = useState<boolean>(false);
const [highlightRecentCourses, setHighlightRecentCourses] = useState<boolean>(true);
const [showSavedCourses, setShowSavedCourses] = useState<boolean>(true);
const [autoSaveCertificates, setAutoSaveCertificates] = useState<boolean>(true);

// Metadata
const [createdAt, setCreatedAt] = useState<string>("");
const [updatedAt, setUpdatedAt] = useState<string>("");

// Loading
const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

const loadProfile = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("No authenticated user found");

    const { data: account, error } = await supabase
      .from<Account>("accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    if (!account) throw new Error("No account found for this user");

    // Map fields → state
    setAccountId(account.account_id);
    setUserId(account.user_id);
    setEmail(account.email);
    setPhone(account.phone ?? "");
    setPasswordHash(account.password_hash);
    setIsDeactivated(account.is_deactivated);

    setPreferredLocations(account.preferred_locations ?? []);
    setExpectedSalary(account.expected_salary);

    setCourseNotifications(account.course_notifications);
    setLearningListNotifications(account.learning_list_notifications);
    setAutoSaveProgress(account.auto_save_progress);
    setTrackTimeSpent(account.track_time_spent);
    setHighlightRecentCourses(account.highlight_recent_courses);
    setShowSavedCourses(account.show_saved_courses);
    setAutoSaveCertificates(account.auto_save_certificates);

    setCreatedAt(account.created_at);
    setUpdatedAt(account.updated_at);

  } catch (err: any) {
    Alert.alert("Error", err.message || "Failed to load profile");
  } finally {
    setLoadingProfile(false);
  }
};




const updateAccountField = async (field: string, value: any) => {
  try {
    setLoadingProfile(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("No authenticated user found");

    // 👇 Skip email here (handled in EmailUpdater)
    if (field === "email") return;

    const { error } = await supabase
      .from("accounts")
      .update({ [field]: value })
      .eq("user_id", user.id);

    if (error) throw error;

    // Update state instantly for smooth UX
    switch (field) {
      case "phone": setPhone(value); break;
      case "is_deactivated": setIsDeactivated(value); break;
      case "preferred_locations": setPreferredLocations(value); break;
      case "expected_salary": setExpectedSalary(value); break;
      case "course_notifications": setCourseNotifications(value); break;
      case "learning_list_notifications": setLearningListNotifications(value); break;
      case "auto_save_progress": setAutoSaveProgress(value); break;
      case "track_time_spent": setTrackTimeSpent(value); break;
      case "highlight_recent_courses": setHighlightRecentCourses(value); break;
      case "show_saved_courses": setShowSavedCourses(value); break;
      case "auto_save_certificates": setAutoSaveCertificates(value); break;
    }

    Alert.alert("Success", "Profile updated!");
  } catch (err: any) {
    Alert.alert("Error", err.message || "Failed to update profile");
  } finally {
    setLoadingProfile(false);
  }
};


const removeLocation = (loc: string) => {
    const newLocations = preferredLocations.filter((item) => item !== loc);
    updateAccountField("preferred_locations",newLocations);
  };


    const addLocation = () => {
    if (!location.trim()) return;
    const newLocations = [...preferredLocations, location.trim()];
    console.log("adding")
    console.log(newLocations)
    updateAccountField("preferred_locations",newLocations);
    setLocation("");
  };

  if (loadingProfile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Account Settings</Text>
        
     
      <EmailUpdater
  userId={userId}
  account={{ email }}
  setAccount={(updated) => setEmail(updated.email)}
/>


      

      

       <View>
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn} >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={() => updateAccountField("phone", phone)}>
  <Text style={styles.saveText}>Save</Text>
</TouchableOpacity>

      </View>
    </View>


 

      
<Text style={styles.label}>Password</Text>
<TouchableOpacity 
  style={styles.button} 
  onPress={() => setShowPasswordModal(true)}
>
  <Text style={styles.buttonText}>Change Password</Text>
</TouchableOpacity>

<PasswordUpdateModal 
  visible={showPasswordModal} 
  onClose={() => setShowPasswordModal(false)} 
/>
      

      <Text style={styles.label}>Deactivate Account</Text>
      
      <View style={styles.deactivate}>
        <Text>Enable or disable your account temporarily</Text>
      
      <Switch 
  value={isDeactivated} 
  onValueChange={(val) => updateAccountField("is_deactivated", val)} 
/>

      </View>

      

 <Text style={styles.header}>Job Preferences</Text>
        <View>
      <Text style={styles.label}>Preferred work location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        autoCapitalize="none"
        
        placeholder="Tell us your location preferences"
      />

      {/* Chips */}
      <FlatList
        data={preferredLocations}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
            <TouchableOpacity onPress={() => removeLocation(item)}>
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
        style={{ marginTop: 15 }}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn} >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={addLocation}>
  <Text style={styles.saveText}>Save</Text>
</TouchableOpacity>

      </View>
    </View>

     
        <View>
      <Text style={styles.label}>Expected Salary in ( ₹ )</Text>
      <TextInput
        style={styles.input}
        value={expectedSalary?expectedSalary.toString() :""}
        onChangeText={(text) => setExpectedSalary(text ? parseFloat(text) : null)}
        autoCapitalize="none"
        placeholder="Expected Salary"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn} >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={() => updateAccountField("expected_salary", expectedSalary)}>
  <Text style={styles.saveText}>Save</Text>
</TouchableOpacity>

      </View>
    </View>

    <Text style={styles.header}>Manage Learning Activity</Text>
    
    <Text style={[styles.label, { color: "#007AFF" }]}>
  Course Notifications
</Text>

     <Text style={{marginTop:10}}>Course Notifications</Text>

    <RadioButton.Group 
  onValueChange={(val) => updateAccountField("course_notifications", val === "on")} 
  value={courseNotifications ? "on" : "off"}
>

        <View style={{ flexDirection: "row", alignItems: "center" , gap: 40 }}> 
            <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="on" />
        <Text>On</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="off" />
        <Text>Off</Text>
      </View>
              </View>
      
    </RadioButton.Group>

    <Text style={[styles.label, { color: "#007AFF" }]}>
 Learning List
</Text>

     <Text style={{marginTop:10}}>Enable Notifications</Text>

    <RadioButton.Group 
  onValueChange={(val) => updateAccountField("learning_list_notifications", val === "on")} 
  value={learningListNotifications ? "on" : "off"}
>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 40 }}> 
            <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="on" />
        <Text>On</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="off" />
        <Text>Off</Text>
      </View>
              </View>
      
    </RadioButton.Group>

     <Text style={{marginTop:10}}>Auto Save Course Progress</Text>

   <RadioButton.Group 
  onValueChange={(val) => updateAccountField("auto_save_progress", val === "on")} 
  value={autoSaveProgress ? "on" : "off"}
>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 40 }}> 
            <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="on" />
        <Text>On</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="off" />
        <Text>Off</Text>
      </View>
              </View>
      
    </RadioButton.Group>


     <Text style={{marginTop:10}}>Track Time Spent on Course</Text>

    <RadioButton.Group 
  onValueChange={(val) => updateAccountField("track_time_spent", val === "on")} 
  value={trackTimeSpent ? "on" : "off"}
>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 40 }}> 
            <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="on" />
        <Text>On</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="off" />
        <Text>Off</Text>
      </View>
              </View>
      
    </RadioButton.Group>



    
    
    <Text style={[styles.label, { color: "#007AFF" }]}>
  Saved Courses & Certificates
</Text>

     <Text style={{marginTop:10}}>Highlight Recently Saved Courses</Text>

   <RadioButton.Group 
  onValueChange={(val) => updateAccountField("highlight_recent_courses", val === "on")} 
  value={highlightRecentCourses ? "on" : "off"}
>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 40 }}> 
            <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="on" />
        <Text>On</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="off" />
        <Text>Off</Text>
      </View>
              </View>
      
    </RadioButton.Group>

     <Text style={{marginTop:10}}>Show Saved Courses on Profile</Text>

  <RadioButton.Group 
  onValueChange={(val) => updateAccountField("show_saved_courses", val === "on")} 
  value={showSavedCourses ? "on" : "off"}
>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 40 }}> 
            <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="on" />
        <Text>On</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="off" />
        <Text>Off</Text>
      </View>
              </View>
      
    </RadioButton.Group>


     <Text style={{marginTop:10}}>Auto-Save Certificates</Text>

   <RadioButton.Group 
  onValueChange={(val) => updateAccountField("auto_save_certificates", val === "on")} 
  value={autoSaveCertificates ? "on" : "off"}
>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 40 }}> 
            <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="on" />
        <Text>On</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <RadioButton value="off" />
        <Text>Off</Text>
      </View>
              </View>
      
    </RadioButton.Group>

    </ScrollView>
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
  chip: {
    flexDirection: "row",
    backgroundColor: "#00BCD4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 8,
  },
  chipText: {
    color: "white",
    marginRight: 6,
    fontWeight: "600",
  },
});