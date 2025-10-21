import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X, AlertCircle, FileText, Play, ExternalLink, RefreshCw, Info } from 'lucide-react-native';
import Colors from '../../constant/Colors';
import { router } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { getResourcePublicUrl, getResourceSignedUrl, getAndroidPdfViewerUrl, optimizeVideoUrlForAndroid } from '../../utils/resourceUtils';

interface ResourceViewerProps {
  resourceUrl: string;
  resourceType: string;
  resourceTitle?: string;
  isVisible: boolean;
  onClose: () => void;
  courseId?: string;
  lessonId?: string;
  resourceId?: string;
  onPdfViewed?: () => void;
}

export default function ResourceViewer({
  resourceUrl,
  resourceType,
  resourceTitle = 'Resource',
  isVisible,
  onClose,
  courseId,
  lessonId,
  resourceId,
}: ResourceViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  
  useEffect(() => {
    if (isVisible) {
      setLoading(true);
      setError(null);
      validateUrl(resourceUrl);
    }
  }, [resourceUrl, resourceType, resourceId, isVisible]);
  
  const validateUrl = async (url: string) => {
    if (!url) {
      setError('Resource URL is empty');
      setLoading(false);
      return;
    }
    
    let cleanUrl = url.trim();
    
    if (resourceId) {
      try {
        const publicUrl = getResourcePublicUrl(resourceId);
        if (publicUrl) {
          cleanUrl = publicUrl;
        } else {
          const signedUrl = await getResourceSignedUrl(resourceId, 3600);
          if (signedUrl) {
            cleanUrl = signedUrl;
          } else {
            setError('Resource file not found in storage');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        setError('Error connecting to storage service');
        setLoading(false);
        return;
      }
    }

    setProcessedUrl(cleanUrl);
    setLoading(false);
  };
  
  const renderContent = () => {
    if (loading || !processedUrl) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Loading {resourceType}...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={40} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    
    if (resourceType === 'pdf') {
      const pdfViewUrl = Platform.OS === 'android' 
        ? getAndroidPdfViewerUrl(processedUrl, true)
        : processedUrl;
        
      return (
        <WebView
            ref={webViewRef}
            source={{ uri: pdfViewUrl }}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
              </View>
            )}
            onShouldStartLoadWithRequest={(request) => {
              const requestUrl = request.url.trim();
              const originalUrl = processedUrl.trim();

              if (requestUrl.startsWith('https://drive.google.com/viewer') || requestUrl.startsWith(originalUrl)) {
                return true;
              }
              
              console.log('Blocked navigation to:', request.url);
              return false;
            }}
          />
      );
    }
    
    return <Text>Unsupported type</Text>;
  };
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {resourceTitle}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#000000" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>{renderContent()}</View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});