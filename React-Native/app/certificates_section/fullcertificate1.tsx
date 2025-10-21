import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { supabase } from "../../lib/Superbase";
import { useAuth } from "../../Context/auth";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;

// Dynamic text scaling function
const getScaledFontSize = (baseSize: number, contentLength: number, maxLength: number = 50) => {
  const scaleFactor = Math.min(1, maxLength / Math.max(contentLength, 1));
  return Math.max(baseSize * scaleFactor, baseSize * 0.6); // Minimum 60% of original size
};

// Dynamic spacing function
const getScaledSpacing = (baseSpacing: number, contentLength: number, maxLength: number = 50) => {
  const scaleFactor = Math.min(1, maxLength / Math.max(contentLength, 1));
  return Math.max(baseSpacing * scaleFactor, baseSpacing * 0.7); // Minimum 70% of original spacing
};

const Fullertificate = () => {
  const certificateRef = useRef(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [events, setEvents] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { session, isLoading } = useAuth();

  // Extract data from params or use default values
  const eventData = {
    name: (params.name as string) || "John Doe",
    event: (params.event as string) || "Workshop",
    date: (params.date as string) || new Date().toISOString(),
    venue: (params.venue as string) || "Online"
  };

  const { name, event, date, venue } = eventData;
  
  // Calculate content lengths for dynamic scaling
  const nameLength = name?.length || 0;
  const eventLength = event?.length || 0;
  const descriptionLength = `For completing the workshop on ${new Date(date).toLocaleDateString()} "${event}"`.length;

  // Create styles with dynamic scaling
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F5F5F5",
      padding: isSmallScreen ? 10 : 20,
    },
    certificate: {
      width: Math.min(width - (isSmallScreen ? 40 : 80), height * 1.414),
      aspectRatio: 1.414, // A4 landscape ratio (1.414:1)
      borderRadius: isSmallScreen ? 12 : 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: isSmallScreen ? 5 : 10 },
      shadowOpacity: 0.15,
      shadowRadius: isSmallScreen ? 15 : 30,
      elevation: isSmallScreen ? 5 : 10,
    },
    backgroundImage: {
      position: "absolute",
      width: "100%",
      height: "100%",
      resizeMode: "contain",
      zIndex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: "transparent",
      zIndex: 2,
    },
    topBar: {
      height: isSmallScreen ? 100 : 120,
      justifyContent: "flex-start",
      alignItems: "center",
      paddingHorizontal: isSmallScreen ? 10 : 15,
      paddingTop: isSmallScreen ? 30 : 40,
    },
    headerContent: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      paddingTop: isSmallScreen ? 15 : 20,
    },
    certTitle: {
      fontSize: getScaledFontSize(isSmallScreen ? 16 : isMediumScreen ? 20 : 24, "CERTIFICATE".length, 15),
      color: "#0F3528",
      fontWeight: "bold",
      letterSpacing: isSmallScreen ? 1 : 2,
      textAlign: "center",
      marginBottom: getScaledSpacing(isSmallScreen ? 4 : 6, "CERTIFICATE".length, 15),
      textShadowColor: "rgba(255,255,255,0.9)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    certSubTitle: {
      color: "#0f3e45",
      fontSize: getScaledFontSize(isSmallScreen ? 10 : isMediumScreen ? 12 : 14, "of Completion".length, 15),
      fontWeight: "600",
      textAlign: "center",
      letterSpacing: 0.5,
      marginBottom: getScaledSpacing(isSmallScreen ? 20 : 25, "of Completion".length, 15),
      textShadowColor: "rgba(255,255,255,0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: isSmallScreen ? 20 : isMediumScreen ? 25 : 30,
      paddingVertical: isSmallScreen ? 30 : 40,
      paddingTop: isSmallScreen ? 50 : 60,
    },
    presentedTo: {
      fontSize: getScaledFontSize(isSmallScreen ? 10 : isMediumScreen ? 12 : 14, "This certificate is presented to:".length, 35),
      color: "#0f3e45",
      fontWeight: "500",
      marginBottom: getScaledSpacing(isSmallScreen ? 15 : 18, "This certificate is presented to:".length, 35),
      marginTop: getScaledSpacing(isSmallScreen ? 10 : 15, "This certificate is presented to:".length, 35),
      textAlign: "center",
      fontStyle: "italic",
      textShadowColor: "rgba(255,255,255,0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },
    name: {
      fontSize: getScaledFontSize(isSmallScreen ? 20 : isMediumScreen ? 24 : 28, nameLength, 30),
      fontWeight: "bold",
      color: "#D84B24",
      marginVertical: getScaledSpacing(isSmallScreen ? 8 : 12, nameLength, 30),
      textAlign: "center",
      borderBottomWidth: 2,
      borderBottomColor: "#0F3528",
      paddingBottom: getScaledSpacing(isSmallScreen ? 4 : 6, nameLength, 30),
      letterSpacing: 0.5,
      textShadowColor: "rgba(255,255,255,0.9)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    description: {
      color: "#374151",
      fontSize: getScaledFontSize(isSmallScreen ? 9 : isMediumScreen ? 11 : 13, descriptionLength, 80),
      lineHeight: getScaledFontSize(isSmallScreen ? 14 : isMediumScreen ? 16 : 18, descriptionLength, 80),
      marginTop: getScaledSpacing(isSmallScreen ? 12 : 16, descriptionLength, 80),
      textAlign: "center",
      fontWeight: "500",
      maxWidth: "95%",
      textShadowColor: "rgba(255,255,255,0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },
    dateText: {
      fontWeight: "bold",
      color: "#D84B24",
    },
    eventTitle: {
      fontWeight: "bold",
      color: "#0F3528",
      fontSize: getScaledFontSize(isSmallScreen ? 10 : isMediumScreen ? 12 : 14, eventLength, 40),
      marginTop: getScaledSpacing(isSmallScreen ? 4 : 6, eventLength, 40),
      textShadowColor: "rgba(255,255,255,0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },
    footer: {
      width: "100%",
      marginTop: getScaledSpacing(isSmallScreen ? 20 : 25, descriptionLength, 80),
      paddingHorizontal: isSmallScreen ? 15 : 20,
    },
    signatories: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: isSmallScreen ? 15 : 20,
    },
    signer: {
      alignItems: "center",
      flex: 1,
    },
    signerName: {
      fontWeight: "600",
      fontSize: getScaledFontSize(isSmallScreen ? 10 : isMediumScreen ? 12 : 14, "John Doe".length, 20),
      color: "#0F3528",
      marginTop: getScaledSpacing(isSmallScreen ? 8 : 12, "John Doe".length, 20),
      textAlign: "center",
      textShadowColor: "rgba(255,255,255,0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },
    designation: {
      fontSize: getScaledFontSize(isSmallScreen ? 8 : isMediumScreen ? 10 : 12, "Workshop Facilitator".length, 25),
      color: "#666",
      textAlign: "center",
      marginTop: 2,
      textShadowColor: "rgba(255,255,255,0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },
    actionButtons: {
      flexDirection: isSmallScreen ? "column" : "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: isSmallScreen ? 20 : 25,
      paddingHorizontal: 15,
    },
    button: {
      backgroundColor: "#0F3528",
      paddingHorizontal: isSmallScreen ? 20 : 25,
      paddingVertical: isSmallScreen ? 12 : 15,
      borderRadius: isSmallScreen ? 8 : 10,
      marginHorizontal: isSmallScreen ? 5 : 8,
      marginVertical: isSmallScreen ? 5 : 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: isSmallScreen ? 2 : 4 },
      shadowOpacity: 0.1,
      shadowRadius: isSmallScreen ? 4 : 8,
      elevation: isSmallScreen ? 3 : 6,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: "600",
      textAlign: "center",
    },
    errorText: {
      fontSize: isSmallScreen ? 16 : 18,
      color: "#666",
      textAlign: "center",
      marginBottom: 20,
    },
    logo: {
      height: isSmallScreen ? 20 : isMediumScreen ? 25 : 30,
      width: isSmallScreen ? 20 : isMediumScreen ? 25 : 30,
      resizeMode: "contain",
      marginBottom: isSmallScreen ? 4 : 6,
    },
    signature: {
      height: isSmallScreen ? 30 : isMediumScreen ? 40 : 50,
      width: isSmallScreen ? 50 : isMediumScreen ? 70 : 90,
      resizeMode: "contain",
      marginBottom: isSmallScreen ? 4 : 6,
    },
    logoContainer: {
      alignItems: "center",
      marginTop: isSmallScreen ? 8 : 12,
      paddingHorizontal: 15,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: isSmallScreen ? width - 40 : 180,
      paddingVertical: isSmallScreen ? 12 : 14,
      paddingHorizontal: isSmallScreen ? 20 : 28,
      borderRadius: 8,
      gap: 8,
    },
    downloadButton: {
      backgroundColor: "#0f3e45",
    },
    shareButton: {
      backgroundColor: "#D84B24",
    },
    pdfButton: {
      backgroundColor: "#4A90E2",
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: isSmallScreen ? 15 : 20,
      paddingVertical: isSmallScreen ? 12 : 16,
    },
    backButtonText: {
      color: "#0f3e45",
      fontSize: isSmallScreen ? 16 : 18,
      marginLeft: 8,
      textDecorationLine: "underline",
    },
  });

  useEffect(() => {
    if (!eventData?.event) {
      router.replace("/(screens)/Home");
    }
  }, [eventData, router]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventData?.event) return;

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("title", eventData.event)
        .single();

      if (error) {
        console.error("Error fetching event:", error.message);
      } else {
        setEvents(data);
      }
    };

    fetchEvent();
  }, [eventData]);

  useEffect(() => {
    if (!eventData) {
      router.replace("/(screens)/Home");
    } else if (events) {
      const fetchOrganization = async () => {
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", events.organization_id)
          .single();

        if (error) {
          console.error("Error fetching organization:", error.message);
        } else {
          setOrganization(data);
        }
      };

      fetchOrganization();
    }
  }, [eventData, router, events]);

  const handleDownload = async () => {
    if (!imagesLoaded) {
      Alert.alert("Please wait", "Certificate is still loading...");
      return;
    }

    try {
      const uri = await certificateRef.current?.capture();
      
      if (!session?.user) return;
      
      const { error: insertError } = await supabase
        .from("certificate_downloads")
        .upsert(
          {
            user_id: session.user.id,
            event_name: eventData.event,
            downloaded_at: new Date().toISOString(),
          },
          { onConflict: "user_id,event_name" }
        );

      if (insertError) {
        console.error("Failed to log certificate download:", insertError.message);
      }

      Alert.alert("Success", "Certificate captured successfully!");
    } catch (err) {
      console.error("Error during certificate capture:", err.message);
      Alert.alert("Error", "Failed to capture certificate");
    }
  };

  const handleShare = async () => {
    if (!imagesLoaded) {
      Alert.alert("Please wait", "Certificate is still loading...");
      return;
    }

    try {
      const uri = await certificateRef.current?.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Certificate'
        });
      } else {
        Alert.alert("Sharing not available", "Sharing is not supported on this device.");
      }
    } catch (err) {
      console.error("Error sharing certificate:", err.message);
      Alert.alert("Error", "Failed to share certificate");
    }
  };

  const handleSharePDF = async () => {
    if (!imagesLoaded) {
      Alert.alert("Please wait", "Certificate is still loading...");
      return;
    }

    try {
      const uri = await certificateRef.current?.capture();
      
      // Create HTML content for PDF
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .certificate { 
                border: 2px solid #0F3528; 
                padding: 40px; 
                text-align: center;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              }
              .title { font-size: 36px; color: #0F3528; margin-bottom: 10px; }
              .subtitle { font-size: 20px; color: #0f3e45; margin-bottom: 30px; }
              .name { font-size: 32px; color: #D84B24; margin: 20px 0; border-bottom: 2px solid #0F3528; }
              .description { font-size: 16px; color: #374151; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="certificate">
              <h1 class="title">CERTIFICATE</h1>
              <p class="subtitle">of Completion</p>
              <p>This certificate is proudly presented to:</p>
              <h2 class="name">${name}</h2>
              <p class="description">
                For successfully completing the workshop on ${new Date(date).toLocaleDateString()} at ${venue}
                <br><br>
                <strong>Titled: ${event}</strong>
              </p>
            </div>
          </body>
        </html>
      `;

      const { uri: pdfUri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Certificate PDF'
        });
      } else {
        Alert.alert("Sharing not available", "Sharing is not supported on this device.");
      }
    } catch (err) {
      console.error("Error sharing certificate PDF:", err.message);
      Alert.alert("Error", "Failed to share certificate PDF");
    }
  };

  if (!eventData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No event data found</Text>
                 <TouchableOpacity
           style={styles.button}
           onPress={() => router.replace("/(screens)/Home")}
         >
          <Text style={styles.buttonText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }


  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ 
        flexGrow: 1, 
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
        minHeight: "100%"
      }}
    >
      <ViewShot
        ref={certificateRef}
        style={styles.certificate}
        options={{
          format: "png",
          quality: 0.9,
        }}
      >
                 <Image
           source={require("../../assets/images/certificate_image.jpeg")}
           style={styles.backgroundImage}
           onLoad={() => {
             setImagesLoaded(true);
           }}
           onError={(error) => {
             console.error("Failed to load certificate background image:", error);
             setImagesLoaded(true); // Still allow functionality even if image fails
           }}
         />
        
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <View style={styles.headerContent}>
              <Text style={styles.certTitle}>CERTIFICATE</Text>
              <Text style={styles.certSubTitle}>of Completion</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.presentedTo}>
              This certificate is presented to:
            </Text>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.description}>
              For completing the workshop on{" "}
              <Text style={styles.dateText}>
                {new Date(date).toLocaleDateString()}
              </Text>
              {"\n"}
              <Text style={styles.eventTitle}>"{event}"</Text>
            </Text>

            <View style={styles.footer}>
              <View style={styles.signatories}>
                <View style={styles.signer}>
                  {organization?.signature_url && (
                    <Image
                      source={{ uri: organization.signature_url }}
                      style={styles.signature}
                    />
                  )}
                  <Text style={styles.signerName}>{organization?.signer_name}</Text>
                  <Text style={styles.designation}>{organization?.designation}</Text>
                </View>
              </View>

              {organization?.logo_url && (
                <View style={styles.logoContainer}>
                  <Image
                    source={{ uri: organization.logo_url }}
                    style={styles.logo}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </ViewShot>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={handleDownload}
          disabled={!imagesLoaded}
        >
          <Ionicons name="download" size={24} color="white" />
          <Text style={styles.buttonText}>
            {imagesLoaded ? "Download Certificate" : "Loading..."}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
          disabled={!imagesLoaded}
        >
          <Ionicons name="share" size={24} color="white" />
          <Text style={styles.buttonText}>Share Certificate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.pdfButton]}
          onPress={handleSharePDF}
          disabled={!imagesLoaded}
        >
          <Ionicons name="document" size={24} color="white" />
          <Text style={styles.buttonText}>Share as PDF</Text>
        </TouchableOpacity>
      </View>

             <TouchableOpacity
         style={styles.backButton}
         onPress={() => router.replace("/(screens)/Home")}
       >
        <Ionicons name="arrow-back" size={24} color="#0f3e45" />
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};





export default Fullertificate;
