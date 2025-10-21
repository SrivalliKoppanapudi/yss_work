import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    ScrollView,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import Colors from '../../constant/Colors';
import EnhancedVideoPlayer, { EnhancedVideoPlayerRef } from '../../component/courses/EnhancedVideoPlayer';
import ResourceViewer from '../../component/courses/ResourceViewer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

let ScreenOrientation: any = null;
try {
  ScreenOrientation = require('expo-screen-orientation');
} catch (e) { console.warn('expo-screen-orientation not available'); }

interface ContentDisplayStyles {
  safeArea: ViewStyle;
  fullscreenSafeArea: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerTitle: TextStyle;
  contentContainer: ViewStyle;
  videoPlayerContainer: ViewStyle;
  transcriptScrollView: ViewStyle;
  transcriptHeader: TextStyle;
  transcriptText: TextStyle;
  centerContainer: ViewStyle;
  errorText: TextStyle;
  unsupportedText: TextStyle;
  markCompleteButton: ViewStyle;
  markCompleteButtonText: TextStyle;
}

// Key for AsyncStorage - ensure this matches StudentCourseContentScreen
const ASYNC_STORAGE_COMPLETION_PREFIX = '@item_completed_';


const ContentDisplayScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contentUrl: string;
    contentType: 'video' | 'pdf' | 'link' | string;
    contentTitle: string;
    courseId?: string;
    itemId?: string; // This is the lesson ID OR the module-level resource ID
    itemType?: 'lesson' | 'resource';
    moduleId?: string; // Module ID is crucial
    transcript?: string;
    resourceId?: string; // This can be redundant if itemId is used consistently for the displayed item
  }>();

  const [loading, setLoading] = useState(true);
  const [isContentActuallyFullscreen, setIsContentActuallyFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { contentUrl, contentType, contentTitle, transcript, courseId, itemId, itemType, moduleId, resourceId: paramResourceId } = params;
  const videoPlayerRef = useRef<EnhancedVideoPlayerRef>(null);

  // Determine the actual ID of the item being displayed (lesson or resource)
  const displayedItemId = itemId || paramResourceId;


  useEffect(() => {
    if (!contentUrl || !contentType) {
      setError("Content information is missing.");
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(false);
  }, [contentUrl, contentType]);

  useEffect(() => {
    const manageOrientation = async () => {
        if (contentType === 'video' && ScreenOrientation) {
            try {
                if (isContentActuallyFullscreen) {
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                } else {
                    await ScreenOrientation.unlockAsync();
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                }
            } catch (err: any) { console.warn("CDS: Orientation failed:", err.message); }
        }
    };
    if (contentType === 'video') manageOrientation();

    return () => {
      if (contentType === 'video' && ScreenOrientation && isContentActuallyFullscreen) {
        ScreenOrientation.unlockAsync()
            .then(() => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP))
            .catch((err: any) => console.warn("CDS Unmount: Orientation reset failed:", err.message));
      }
    };
  }, [contentType, isContentActuallyFullscreen]);

  const handleBack = () => {
    if (isContentActuallyFullscreen && contentType === 'video') {
      setIsContentActuallyFullscreen(false); 
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace({ pathname: '/(screens)/StudentCourseContent', params: { courseId, initialItemId: displayedItemId, initialItemType: itemType, initialModuleId: moduleId } });
      }, 300);
    } else {
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/(screens)/StudentCourseContent', params: { courseId, initialItemId: displayedItemId, initialItemType: itemType, initialModuleId: moduleId } });
    }
  };

  const handlePlayerFullscreenChange = (playerIsFullscreen: boolean) => {
    setIsContentActuallyFullscreen(playerIsFullscreen);
  };

  const handleContentCompletion = async () => {
    // This function is called by EnhancedVideoPlayer's onFinished or ResourceViewer's onPdfViewed
    if (courseId && displayedItemId && itemType && moduleId) { // Ensure all necessary IDs are present
      const storageKey = `${ASYNC_STORAGE_COMPLETION_PREFIX}${courseId}_${displayedItemId}`;
      try {
        await AsyncStorage.setItem(storageKey, 'true');
        console.log(`[CDS] Marked item ${displayedItemId} (type: ${itemType}, module: ${moduleId}, course: ${courseId}) as potentially completed. Key: ${storageKey}`);
        Alert.alert("Progress Noted", "Your progress for this item will be updated when you return to the course content page.");
      } catch (e) {
        console.error("[CDS] Failed to set item completion flag:", e);
      }
    } else {
      console.warn("[CDS] Cannot mark completion: Missing required IDs for tracking.", { courseId, displayedItemId, itemType, moduleId });
    }
  };


  if (loading && (!contentUrl || !contentType)) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}><AntDesign name="arrowleft"  size={24} color={Colors.PRIMARY} /></TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Error</Text>
        </View>
        <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>
      </SafeAreaView>
    );
  }

  const hideMainUI = isContentActuallyFullscreen && contentType === 'video';

  return (
    <SafeAreaView style={[styles.safeArea, hideMainUI && styles.fullscreenSafeArea]}>
        <StatusBar style={hideMainUI ? "light" : "dark"} hidden={hideMainUI} />

        {!hideMainUI && (
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <AntDesign name="arrowleft"  size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{contentTitle || 'Content'}</Text>
            </View>
        )}

      <View style={styles.contentContainer}>
        {contentType === 'video' && contentUrl ? (
          <>
            <View style={styles.videoPlayerContainer}>
                <EnhancedVideoPlayer
                  key={contentUrl} 
                  ref={videoPlayerRef}
                  url={contentUrl}
                  title={contentTitle}
                  onError={(err) => { setError("Could not load video."); console.error("PLAYER_ERROR:", err);}}
                  onLoad={() => console.log("Video Player OnLoad (CDS)")}
                  onFullscreenChange={handlePlayerFullscreenChange}
                  onFinished={handleContentCompletion} // Ensure this is called by EnhancedVideoPlayer
                />
            </View>
            {!hideMainUI && transcript && (
              <ScrollView style={styles.transcriptScrollView}>
                <Text style={styles.transcriptHeader}>Transcript</Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </ScrollView>
            )}
             {!hideMainUI && (itemType === 'lesson' || (itemType === 'resource' && contentType === 'video')) && (
              <TouchableOpacity style={styles.markCompleteButton} onPress={handleContentCompletion}>
                <Text style={styles.markCompleteButtonText}>Mark as Viewed/Completed</Text>
              </TouchableOpacity>
            )}
          </>
        ) : contentType === 'pdf' && contentUrl ? (
          <ResourceViewer
            resourceUrl={contentUrl}
            resourceType="pdf"
            resourceTitle={contentTitle || "PDF Document"}
            isVisible={true} 
            onClose={handleBack} 
            courseId={courseId}
            lessonId={itemType === 'lesson' ? displayedItemId : undefined} 
            resourceId={itemType === 'resource' ? displayedItemId : undefined} 
            onPdfViewed={handleContentCompletion} 
          />
        ) : (
          <Text style={styles.unsupportedText}>
            Unsupported content type ({contentType}) or URL missing.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create<ContentDisplayStyles>({
  safeArea: { flex: 1, backgroundColor: Colors.WHITE, },
  fullscreenSafeArea: { backgroundColor: '#000', },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: Colors.WHITE, },
  backButton: { padding: 6, marginRight: 10 },
  headerTitle: { fontSize: Platform.OS === 'web' ? 18 : 17, fontWeight: '600', color: Colors.BLACK, flex: 1, },
  contentContainer: { flex: 1, },
  videoPlayerContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', },
  transcriptScrollView: { flex: 1, padding: 16, },
  transcriptHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: Colors.BLACK,},
  transcriptText: { fontSize: 15, lineHeight: 22, color: '#333',},
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,},
  errorText: { color: Colors.ERROR, fontSize: 16, textAlign: 'center',},
  unsupportedText: { fontSize: 16, color: Colors.GRAY, textAlign: 'center', marginTop: 20,},
  markCompleteButton: {
    backgroundColor: Colors.SUCCESS,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  markCompleteButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ContentDisplayScreen;