import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, Pressable, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCurrentUserName } from './getCurrentUserName';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop, G, Line, Ellipse, Path, TSpan, Pattern } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';

export default function CertificateView() {
  const { courseId, completedAt, courseTitle, instructor } = useLocalSearchParams();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const certWidth = width - 32;
  const certHeight = certWidth * 0.75;
  const isMobileScreen = certWidth < 500;
  const fontScale = isMobileScreen ? 0.85 : 1;
  const gold = '#C9B037';
  const goldDark = '#A68A2D';
  const lightGold = '#F6F1E7';
  const watermarkColor = '#F3E9D2';
  const borderGray = '#e5e5e5';
  const [downloading, setDownloading] = useState(false);
  const viewShotRef = React.useRef<any>(null);

  useEffect(() => {
    const fetchName = async () => {
      setUserName(await getCurrentUserName?.() || 'Learner');
      setLoading(false);
    };
    fetchName();
  }, []);

  const courseName = courseTitle || 'Course Title';
  const completionDate = completedAt ? new Date(completedAt as string).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();
  const instructorName = instructor || 'Instructor';

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color="#121416" />
      </View>
    );
  }

  // Certificate content as a component for reuse
  const CertificateContent = (
    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }} style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Svg width={certWidth} height={certHeight} style={{ borderRadius: 24, backgroundColor: 'transparent' }}>
          {/* Background Gradient */}
          <Defs>
            <LinearGradient id="bgGradient" x1="0" y1="0" x2={certWidth} y2={certHeight}>
              <Stop offset="0%" stopColor={lightGold} />
              <Stop offset="100%" stopColor="#f5f5f5" />
            </LinearGradient>
            <LinearGradient id="goldGradient" x1="0" y1="0" x2="0" y2={certHeight}>
              <Stop offset="0%" stopColor={gold} />
              <Stop offset="100%" stopColor={goldDark} />
            </LinearGradient>
            <Pattern id="stripes" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(30)">
              <Rect x="0" y="0" width="10" height="20" fill="#f7f7f7" fillOpacity="0.13" />
            </Pattern>
          </Defs>
          {/* Outer Border */}
          <Rect x="0" y="0" width={certWidth} height={certHeight} rx="24" fill="url(#bgGradient)" stroke="url(#goldGradient)" strokeWidth="6" />
          {/* Inner Border with Stripes */}
          <Rect x="18" y="18" width={certWidth-36} height={certHeight-36} rx="14" fill="url(#stripes)" stroke="#e5e5e5" strokeWidth="2" />
          {/* Watermark */}
          <SvgText
            x={certWidth/2}
            y={certHeight/2 + 10}
            fontSize={certWidth*0.18}
            fontWeight="bold"
            fill={watermarkColor}
            textAnchor="middle"
            fontFamily="serif"
            opacity="0.13"
            letterSpacing="8"
          >LYNKT</SvgText>
          {/* Top Logo */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.13}
            fontSize={certWidth*0.09*fontScale}
            fontWeight="bold"
            fill={gold}
            textAnchor="middle"
            fontFamily="serif"
            letterSpacing="3"
            opacity="0.92"
          >LYNKT</SvgText>
          {/* Certificate Title */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.22}
            fontSize={certWidth*0.05*fontScale}
            fontWeight="bold"
            fill="#222"
            textAnchor="middle"
            fontFamily="serif"
            letterSpacing="2"
          >CERTIFICATE</SvgText>
          {/* Subtitle */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.29}
            fontSize={certWidth*0.022*fontScale}
            fontWeight="500"
            fill="#444"
            textAnchor="middle"
            fontFamily="serif"
            letterSpacing="1"
          >Awarded to</SvgText>
          {/* Recipient Name */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.38}
            fontSize={certWidth*0.045*fontScale}
            fontWeight="bold"
            fill="#1CB5E0"
            textAnchor="middle"
            fontFamily="serif"
            letterSpacing="1"
          >{userName.toUpperCase() || 'NAME SURNAME'}</SvgText>
          {/* For successfully completing */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.46}
            fontSize={certWidth*0.02*fontScale}
            fontWeight="500"
            fill="#333"
            textAnchor="middle"
            fontFamily="serif"
          >For completing the course</SvgText>
          {/* Course Name */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.52}
            fontSize={certWidth*0.03*fontScale}
            fontWeight="bold"
            fill={gold}
            textAnchor="middle"
            fontFamily="serif"
          >{courseName}</SvgText>
          {/* Instructor and Date */}
          <SvgText
            x={certWidth/2}
            y={certHeight*0.60}
            fontSize={certWidth*0.018*fontScale}
            fill="#444"
            textAnchor="middle"
            fontFamily="serif"
          >Instructor: {instructorName}</SvgText>
          <SvgText
            x={certWidth/2}
            y={certHeight*0.66}
            fontSize={certWidth*0.018*fontScale}
            fill="#444"
            textAnchor="middle"
            fontFamily="serif"
          >Date: {completionDate}</SvgText>
          {/* Golden Circle Seal with LYNKT */}
          <G>
            <Ellipse
              cx={certWidth/2}
              cy={certHeight*0.83}
              rx={certWidth*0.10*fontScale}
              ry={certWidth*0.10*fontScale}
              fill="url(#goldGradient)"
              stroke={goldDark}
              strokeWidth="4"
              opacity="0.98"
            />
            <Ellipse
              cx={certWidth/2}
              cy={certHeight*0.83}
              rx={certWidth*0.07*fontScale}
              ry={certWidth*0.07*fontScale}
              fill={lightGold}
              stroke={gold}
              strokeWidth="2"
            />
            <SvgText
              x={certWidth/2}
              y={certHeight*0.84}
              fontSize={certWidth*0.035*fontScale}
              fontWeight="bold"
              fill={gold}
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
            >Signature</SvgText>
            <SvgText
              x={certWidth*0.785}
              y={certHeight*0.98}
              fontSize={certWidth*0.018*fontScale}
              fill="#B0A160"
              textAnchor="middle"
              fontFamily="cursive"
              fontWeight="bold"
            >Lynkt Academy</SvgText>
          </G>
        </Svg>
      </View>
    </ViewShot>
  );

  // Helper to generate HTML for the certificate (mimics SVG design)
  const getCertificateHtml = () => `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { background: #f7f7f7; margin: 0; padding: 0; }
          .cert-container {
            width: 800px; height: 600px; margin: 40px auto; background: #F9F6EF;
            border-radius: 16px; border: 4px solid #D4AF37; position: relative;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            overflow: hidden;
          }
          .cert-inner {
            position: absolute; left: 14px; top: 14px; right: 14px; bottom: 14px;
            border-radius: 10px; border: 2px solid #e5e5e5;
            background: repeating-linear-gradient(30deg, #f7f7f7 0 10px, #f9f6ef 10px 20px);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
          }
          .lynkt-logo { width: 140px; margin-top: 24px; margin-bottom: 8px; }
          .cert-title { font-size: 44px; font-weight: bold; letter-spacing: 2px; color: #222; margin: 0; font-family: serif; }
          .cert-sub { font-size: 18px; color: #444; letter-spacing: 1px; margin: 8px 0 0 0; font-family: serif; }
          .cert-name { font-size: 34px; font-weight: bold; color: #222; margin: 24px 0 0 0; letter-spacing: 1px; font-family: serif; }
          .cert-achieve { font-size: 18px; color: #444; margin: 8px 0 0 0; font-family: serif; }
          .cert-course { font-size: 24px; font-weight: bold; color: #222; margin: 8px 0 0 0; font-family: serif; }
          .cert-desc { font-size: 16px; color: #555; margin: 24px 0 0 0; text-align: center; font-family: serif; }
          .cert-seal {
            position: absolute; left: 50%; transform: translateX(-50%); bottom: 80px;
            display: flex; flex-direction: column; align-items: center;
          }
          .seal-circle {
            width: 64px; height: 64px; border-radius: 50%; background: #D4AF37; border: 4px solid #bfa43a; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .seal-inner { width: 44px; height: 44px; border-radius: 50%; background: #fffbe6; border: 2px solid #D4AF37; display: flex; align-items: center; justify-content: center; }
          .seal-text { color: #D4AF37; font-weight: bold; font-size: 18px; font-family: serif; }
          .seal-ribbon { width: 64px; height: 24px; display: flex; justify-content: space-between; margin-top: -4px; }
          .ribbon-left, .ribbon-right { width: 16px; height: 24px; background: #2d2d2d; clip-path: polygon(0 0, 100% 0, 50% 100%); }
          .ribbon-right { transform: scaleX(-1); }
          .cert-footer { position: absolute; left: 0; right: 0; bottom: 24px; display: flex; flex-direction: row; justify-content: space-between; padding: 0 60px; }
          .footer-label { font-size: 16px; color: #444; font-family: serif; }
          .footer-value { font-size: 14px; color: #888; font-family: serif; }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="cert-inner">
            <img class="lynkt-logo" src="https://raw.githubusercontent.com/lynkt/brand-assets/main/Lynkt.png" alt="Lynkt Logo" />
            <div class="cert-title">CERTIFICATE</div>
            <div class="cert-sub">AWARDED TO</div>
            <div class="cert-name">${userName.toUpperCase() || 'NAME SURNAME'}</div>
            <div class="cert-achieve">FOR SUCCESSFUL ACHIEVEMENT IN</div>
            <div class="cert-course">${courseName}</div>
            <div class="cert-desc">This certificate is presented in recognition of<br/>outstanding performance and dedication.</div>
            <div class="cert-seal">
              <div class="seal-ribbon">
                <div class="ribbon-left"></div>
                <div class="ribbon-right"></div>
              </div>
              <div class="seal-circle">
                <div class="seal-inner">
                  <span class="seal-text">LYNKT</span>
                </div>
              </div>
            </div>
            <div class="cert-footer">
              <div style="text-align:center;">
                <div class="footer-label">DATE</div>
                <div class="footer-value">${completionDate}</div>
              </div>
              <div style="text-align:center;">
                <div class="footer-label">ORGANIZATION</div>
                <div class="footer-value">LYNKT</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Capture the certificate view as a JPG
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.95,
      });
      // Move to cache directory with .jpg extension (for iOS sharing compatibility)
      const fileUri = FileSystem.cacheDirectory + `certificate_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: fileUri });
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      alert('Failed to generate image.');
    }
    setDownloading(false);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconBox} onPress={() => router.back()} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
          <Text style={{fontSize: 24, color: '#121416'}}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificate</Text>
        <View style={{width: 48}} />
      </View>

      {/* Certificate Preview (Pressable) */}
      <Pressable onPress={() => setModalVisible(true)}>
        {CertificateContent}
      </Pressable>

      {/* Download Button */}
      <View style={styles.downloadRow}>
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} disabled={downloading}>
          <Text style={styles.downloadBtnText}>{downloading ? 'Downloading...' : 'Download'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{height: 20, backgroundColor: 'white'}} />

      {/* Modal for Enlarged Certificate */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
              <Text style={{fontSize: 28, color: '#121416'}} accessible accessibilityLabel="Close certificate preview">×</Text>
            </TouchableOpacity>
            <View style={{width: '100%', alignItems: 'center', justifyContent: 'center'}}>
              {CertificateContent}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#121416',
    paddingRight: 48,
  },
  bannerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  bannerImg: {
    width: '100%',
    minHeight: 218,
    borderRadius: 16,
    backgroundColor: '#e6eef7',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    // Use ImageBackground for real image if needed
    // For now, use backgroundColor as placeholder
  },
  certificateTitle: {
    color: '#121416',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    letterSpacing: -0.3,
  },
  certificateDesc: {
    color: '#121416',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  downloadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  downloadBtn: {
    minWidth: 84,
    height: 40,
    backgroundColor: '#dce7f3',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  downloadBtnText: {
    color: '#121416',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  certificateBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    marginBottom: 8,
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    // Add elevation for Android
    elevation: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 2,
  },
});
