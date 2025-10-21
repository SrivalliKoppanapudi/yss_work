import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { getCurrentUserName } from './getCurrentUserName';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop, G, Line, Ellipse, Path, TSpan, Pattern, Image as SvgImage } from 'react-native-svg';

interface EventData {
  name: string;
  event: string;
  date: string;
  venue: string;
}

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  signature_url?: string;
  signer_name?: string;
  designation?: string;
}

interface Event {
  id: string;
  title: string;
  organization_id: string;
  date: string;
  venue: string;
}

export default function FullCertificate() {
  const router = useRouter();
  const { name, event, date, venue } = useLocalSearchParams<{
    name: string;
    event: string;
    date: string;
    venue: string;
  }>();
  const [userName, setUserName] = useState<string>('');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef<any>(null);
  const { width } = useWindowDimensions();
  const certWidth = width - 32;
  const certHeight = certWidth * 0.75;
  const isMobileScreen = certWidth < 500;
  const fontScale = isMobileScreen ? 0.85 : 1;

  // Colors
  const primaryColor = '#0F3528';
  const secondaryColor = '#0f3e45';
  const accentColor = '#D84B24';
  const lightBg = '#F8F5EB';
  const borderColor = '#e5e5e5';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current user name
        const currentUserName = await getCurrentUserName?.() || 'Learner';
        setUserName(currentUserName);

        // Fetch event data if event title is provided
        if (event) {
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('title', event)
            .single();

          if (!eventError && eventData) {
            setEvents(eventData);

            // Fetch organization data
            if (eventData.organization_id) {
              const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', eventData.organization_id)
                .single();

              if (!orgError && orgData) {
                setOrganization(orgData);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching certificate data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [event]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.95,
      });
      const fileUri = FileSystem.cacheDirectory + `certificate_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: fileUri });
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      Alert.alert('Error', 'Failed to download certificate.');
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.95,
      });
      const fileUri = FileSystem.cacheDirectory + `certificate_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: fileUri });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Certificate',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share certificate.');
    }
    setSharing(false);
  };

  const handleSharePDF = async () => {
    setSharing(true);
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.95,
      });
      
      // Convert to PDF using HTML template
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 20px; background: #F8F5EB; }
              .cert-container {
                width: 800px; height: 600px; margin: 0 auto; 
                background: #F8F5EB; border-radius: 16px; 
                border: 4px solid #0F3528; position: relative;
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                overflow: hidden;
              }
              .cert-inner {
                position: absolute; left: 14px; top: 14px; right: 14px; bottom: 14px;
                border-radius: 10px; border: 2px solid #e5e5e5;
                background: repeating-linear-gradient(30deg, #f7f7f7 0 10px, #F8F5EB 10px 20px);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
              }
              .top-bar {
                position: absolute; top: 0; left: 0; width: 100%; height: 170px;
                border-bottom-left-radius: 450px; border-bottom-right-radius: 450px;
                background: linear-gradient(135deg, #0F3528 0%, #0f3e45 100%);
                display: flex; align-items: center; justify-content: center;
                padding: 0 20px; z-index: 10;
              }
              .cert-title { font-size: 44px; color: #0F3528; font-weight: bold; 
                letter-spacing: 5px; text-align: center; margin: 0; }
              .cert-subtitle { color: #0f3e45; font-size: 24px; font-weight: 600; 
                margin-top: 8px; text-align: center; }
              .presented-to { font-size: 20px; color: #0f3e45; font-weight: 500; 
                margin-bottom: 20px; font-style: italic; }
              .recipient-name { font-family: 'Great Vibes', cursive; font-size: 48px; 
                font-weight: 600; color: #D84B24; margin: 2px 0; word-break: break-word; 
                max-width: 90%; line-height: 1.9; border-bottom: 3px solid #0F3528; 
                width: 55%; word-spacing: 20px; letter-spacing: 8px; }
              .description { color: #374151; font-size: 23px; line-height: 36px; 
                margin-top: 12px; max-width: 720px; margin-left: auto; margin-right: auto; 
                font-style: italic; font-weight: 500; }
              .event-title { font-weight: bold; color: #0F3528; font-size: 28px; }
              .signatories { display: flex; justify-content: space-between; width: 100%; 
                padding: 0 100px; margin-bottom: 50px; }
              .signer { text-align: center; width: 200px; margin-right: 120px; }
              .signer-name { font-weight: 600; font-size: 18px; border-top: 3px dotted #0F3528; }
              .logo { height: 56px; width: auto; max-width: 200px; object-fit: contain; 
                align-self: center; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="cert-container">
              <div class="cert-inner">
                <div class="top-bar">
                  <div style="display: flex; align-items: center; flex-direction: column; margin-top: 80px;">
                    <div class="cert-title">CERTIFICATE</div>
                    <div class="cert-subtitle">of Completion</div>
                  </div>
                </div>
                <div style="position: relative; z-index: 10; display: flex; flex-direction: column; 
                     align-items: center; justify-content: center; padding: 45px 40px 48px; 
                     min-height: 550px; text-align: center;">
                  <div class="presented-to">This certificate is proudly presented to :</div>
                  <div class="recipient-name">${userName}</div>
                  <div class="description">
                    For <i style="color:#0F3528">successfully</i> completing the one day intensive workshop on
                    <span style="font-weight: 600; padding: 10px;">${date ? new Date(date as string).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                    at ${venue || 'Lynkt Academy'}
                    <br/>
                    <span class="event-title">Titled: ${event || 'Course Completion'}</span>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: stretch; width: 100%; margin-top: 40px;">
                    <div class="signatories">
                      <div class="signer">
                        <div style="height: 80%; width: 60%; position: absolute; left: 20px; top: 67%; 
                             transform: translateY(-50%); border-radius: 50%; object-fit: cover; 
                             background: #0F3528; display: flex; align-items: center; justify-content: center; color: white;">
                          LYNKT
                        </div>
                      </div>
                      <div class="signer">
                        <div style="height: 100px; object-fit: contain; margin-bottom: 8px; 
                             border-top: 1px solid black; width: 160px; margin: 0 auto 8px;"></div>
                        <div class="signer-name">${organization?.signer_name || 'Lynkt Academy'}</div>
                        <div>${organization?.designation || 'Course Instructor'}</div>
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; flex-direction: column;">
                      <div style="height: 40px; margin-top: 8px; object-fit: contain; color: #0F3528; font-weight: bold;">
                        ${organization?.name || 'Lynkt Academy'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri: pdfUri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Certificate as PDF',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share certificate as PDF.');
    }
    setSharing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Loading certificate...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificate</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Certificate */}
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }} style={styles.certificateContainer}>
        <Svg width={certWidth} height={certHeight} style={styles.certificate}>
          {/* Background */}
          <Defs>
            <LinearGradient id="bgGradient" x1="0" y1="0" x2={certWidth} y2={certHeight}>
              <Stop offset="0%" stopColor={lightBg} />
              <Stop offset="100%" stopColor="#f5f5f5" />
            </LinearGradient>
            <LinearGradient id="topBarGradient" x1="0" y1="0" x2={certWidth} y2="170">
              <Stop offset="0%" stopColor={primaryColor} />
              <Stop offset="100%" stopColor={secondaryColor} />
            </LinearGradient>
            <Pattern id="stripes" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(30)">
              <Rect x="0" y="0" width="10" height="20" fill="#f7f7f7" fillOpacity="0.13" />
            </Pattern>
          </Defs>

          {/* Outer Border */}
          <Rect x="0" y="0" width={certWidth} height={certHeight} rx="24" fill="url(#bgGradient)" stroke={primaryColor} strokeWidth="6" />
          
          {/* Inner Border with Stripes */}
          <Rect x="18" y="18" width={certWidth-36} height={certHeight-36} rx="14" fill="url(#stripes)" stroke={borderColor} strokeWidth="2" />

          {/* Top Bar */}
          <Rect x="18" y="18" width={certWidth-36} height="170" rx="14" fill="url(#topBarGradient)" />
          
          {/* Certificate Title */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.13}
            fontSize={certWidth*0.09*fontScale}
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
            fontFamily="serif"
            letterSpacing="3"
          >CERTIFICATE</SvgText>
          
          <SvgText
            x={certWidth/2}
            y={certHeight*0.22}
            fontSize={certWidth*0.04*fontScale}
            fontWeight="600"
            fill="white"
            textAnchor="middle"
            fontFamily="serif"
            letterSpacing="1"
          >of Completion</SvgText>

          {/* Presented To */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.35}
            fontSize={certWidth*0.025*fontScale}
            fontWeight="500"
            fill={secondaryColor}
            textAnchor="middle"
            fontFamily="serif"
            fontStyle="italic"
          >This certificate is proudly presented to :</SvgText>

          {/* Recipient Name */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.45}
            fontSize={certWidth*0.045*fontScale}
            fontWeight="bold"
            fill={accentColor}
            textAnchor="middle"
            fontFamily="serif"
            letterSpacing="2"
          >{userName}</SvgText>

          {/* Description */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.55}
            fontSize={certWidth*0.02*fontScale}
            fontWeight="500"
            fill="#374151"
            textAnchor="middle"
            fontFamily="serif"
            fontStyle="italic"
          >For successfully completing the one day intensive workshop on</SvgText>

          <SvgText
            x={certWidth/2}
            y={certHeight*0.60}
            fontSize={certWidth*0.018*fontScale}
            fontWeight="600"
            fill={secondaryColor}
            textAnchor="middle"
            fontFamily="serif"
          >{date ? new Date(date as string).toLocaleDateString() : new Date().toLocaleDateString()}</SvgText>

          <SvgText
            x={certWidth/2}
            y={certHeight*0.65}
            fontSize={certWidth*0.018*fontScale}
            fontWeight="500"
            fill="#374151"
            textAnchor="middle"
            fontFamily="serif"
          >at {venue || 'Lynkt Academy'}</SvgText>

          <SvgText
            x={certWidth/2}
            y={certHeight*0.70}
            fontSize={certWidth*0.025*fontScale}
            fontWeight="bold"
            fill={primaryColor}
            textAnchor="middle"
            fontFamily="serif"
          >Titled: {event || 'Course Completion'}</SvgText>

          {/* Badge/Seal */}
          <G>
            <Ellipse
              cx={certWidth*0.25}
              cy={certHeight*0.85}
              rx={certWidth*0.08*fontScale}
              ry={certWidth*0.08*fontScale}
              fill={primaryColor}
              stroke={secondaryColor}
              strokeWidth="3"
            />
            <SvgText
              x={certWidth*0.25}
              y={certHeight*0.86}
              fontSize={certWidth*0.025*fontScale}
              fontWeight="bold"
              fill="white"
              textAnchor="middle"
              fontFamily="serif"
              letterSpacing="2"
            >LYNKT</SvgText>
          </G>

          {/* Signature Area */}
          <G>
            <Line
              x1={certWidth*0.65}
              y1={certHeight*0.93}
              x2={certWidth*0.92}
              y2={certHeight*0.93}
              stroke="#888"
              strokeWidth="2"
            />
            <SvgText
              x={certWidth*0.785}
              y={certHeight*0.96}
              fontSize={certWidth*0.022*fontScale}
              fill="#888"
              textAnchor="middle"
              fontFamily="serif"
            >{organization?.signer_name || 'Lynkt Academy'}</SvgText>
            <SvgText
              x={certWidth*0.785}
              y={certHeight*0.98}
              fontSize={certWidth*0.018*fontScale}
              fill={secondaryColor}
              textAnchor="middle"
              fontFamily="serif"
              fontWeight="bold"
            >{organization?.designation || 'Course Instructor'}</SvgText>
          </G>

          {/* Organization Logo/Name */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.95}
            fontSize={certWidth*0.02*fontScale}
            fontWeight="bold"
            fill={primaryColor}
            textAnchor="middle"
            fontFamily="serif"
          >{organization?.name || 'Lynkt Academy'}</SvgText>
        </Svg>
      </ViewShot>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.downloadButton]}
          onPress={handleDownload}
          disabled={downloading}
        >
          <Text style={styles.buttonText}>
            {downloading ? 'Downloading...' : 'Download Certificate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.shareButton]}
          onPress={handleShare}
          disabled={sharing}
        >
          <Text style={styles.buttonText}>
            {sharing ? 'Sharing...' : 'Share Certificate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.pdfButton]}
          onPress={handleSharePDF}
          disabled={sharing}
        >
          <Text style={styles.buttonText}>
            {sharing ? 'Generating...' : 'Share as PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backToDashboard}
        onPress={() => router.back()}
      >
        <Text style={styles.backToDashboardText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5EB',
  },
  contentContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F5EB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#0F3528',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#0F3528',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F3528',
  },
  certificateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },
  certificate: {
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    minWidth: 160,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  downloadButton: {
    backgroundColor: '#0f3e45',
  },
  shareButton: {
    backgroundColor: '#25D366',
  },
  pdfButton: {
    backgroundColor: '#ff7043',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  backToDashboard: {
    marginTop: 16,
  },
  backToDashboardText: {
    fontSize: 18,
    color: '#0f3e45',
    textDecorationLine: 'underline',
  },
}); 