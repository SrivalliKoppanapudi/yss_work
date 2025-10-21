// import React, { useState, useRef, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   Dimensions, 
//   ActivityIndicator,
//   Alert,
//   Platform,
//   Animated,
//   Modal,
//   ScrollView,
//   BackHandler
// } from 'react-native';
// import { useEvent } from 'expo';
// import { useVideoPlayer, VideoView } from 'expo-video';
// import { 
//   Maximize, 
//   Minimize, 
//   ExternalLink, 
//   Play, 
//   Pause, 
//   Volume2, 
//   VolumeX,
//   Settings,
//   CheckCircle2,
//   ChevronLeft
// } from 'lucide-react-native';
// import Colors from '../../constant/Colors';

// // Import ScreenOrientation with error handling
// let ScreenOrientation: any = null;
// try {
//   ScreenOrientation = require('expo-screen-orientation');
// } catch (e) {
//   console.warn('expo-screen-orientation not available, fullscreen orientation changes will be disabled');
// }

// // Try to import ConfettiCannon, but don't fail if not available
// let ConfettiCannon: any = null;
// try {
//   ConfettiCannon = require('react-native-confetti-cannon').default;
// } catch (e) {
//   console.warn('react-native-confetti-cannon not available, confetti effects will be disabled');
// }

// interface EnhancedVideoPlayerProps {
//   url: string;
//   onError: (error: any) => void;
//   onLoad?: () => void;
// }

// const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({ 
//   url, 
//   onError,
//   onLoad
// }) => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [showControls, setShowControls] = useState(true);
//   const [playbackCompleted, setPlaybackCompleted] = useState(false);
//   const confettiRef = useRef<any>(null);

//   // Initialize video player
//   const player = useVideoPlayer(url, (player) => {
//     player.loop = false;
//     player.volume = 1.0;
//     player.play();
//   });

//   // Get playing status
//   const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

//   // Handle loading state
//   useEffect(() => {
//     if (player) {
//       setLoading(false);
//       if (onLoad) onLoad();
//     }
//   }, [player]);

//   // Reset orientation when component unmounts or when exiting fullscreen
//   useEffect(() => {
//     // Function to reset orientation to portrait with multiple attempts
//     const resetToPortrait = async () => {
//       if (!ScreenOrientation) return;
      
//       // Try up to 3 times to ensure orientation is reset
//       for (let attempt = 0; attempt < 3; attempt++) {
//         try {
//           // Force portrait orientation
//           await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
          
//           // Verify the orientation change was successful
//           const orientation = await ScreenOrientation.getOrientationAsync();
//           const isPortrait = 
//             orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
//             orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN;
          
//           if (isPortrait) {
//             console.log('Successfully reset to portrait mode');
//             break; // Exit the retry loop if successful
//           } else {
//             console.warn(`Portrait lock attempt ${attempt + 1} failed, retrying...`);
//             // Wait before trying again
//             await new Promise(resolve => setTimeout(resolve, 200));
//           }
//         } catch (error) {
//           // Don't log as error - this could be normal on some devices
//           console.warn(`Portrait lock attempt ${attempt + 1} notice: ${error.message}`);
//           // Still consider it a success if device doesn't support this orientation
//           if (error.message && error.message.includes('does not support the requested orientation')) {
//             console.log('Device reports it does not support portrait, but may still work');
//             break;
//           }
//           // Wait before trying again
//           await new Promise(resolve => setTimeout(resolve, 200));
//         }
//       }
//     };

//     // Handle back button press on Android
//     const backHandler = BackHandler.addEventListener(
//       'hardwareBackPress',
//       () => {
//         if (isFullscreen) {
//           setIsFullscreen(false);
//           // Force portrait orientation immediately when back button is pressed
//           resetToPortrait();
//           return true; // Prevent default back behavior
//         }
//         return false;
//       }
//     );

//     // If we're exiting fullscreen, ensure portrait orientation
//     if (!isFullscreen) {
//       resetToPortrait();
//     }

//     return () => {
//       // Always try to reset orientation when component unmounts
//       resetToPortrait();
//       backHandler.remove();
//     };
//   }, [isFullscreen]);

//   // Handle playback status changes
//   useEffect(() => {
//     const handleStatusChange = (status: any) => {
//       if (status.error) {
//         const errorMessage = Platform.OS === 'android' 
//           ? `Failed to load video on Android: ${status.error}` 
//           : 'Failed to load video. Please try again later.';
//         setError(errorMessage);
//         setLoading(false);
//         if (onError) onError(status.error);
//       }
      
//       // Check if playback has completed
//       if (status.isCompleted || (status.didJustFinish && !status.isLooping)) {
//         setPlaybackCompleted(true);
//         // Trigger confetti effect if available
//         if (confettiRef.current) {
//           confettiRef.current.start();
//         }
//       }
//     };

//     const statusSubscription = player?.addListener('statusChange', handleStatusChange);
    
//     return () => {
//       if (statusSubscription) {
//         statusSubscription.remove();
//       }
//     };
//   }, [player]);
  
//   const togglePlayPause = () => {
//     setShowControls(true);
//     if (isPlaying) {
//       player.pause();
//     } else {
//       player.play();
//     }
//   };

//   const toggleMute = () => {
//     setShowControls(true);
//     player.volume = player.volume === 0 ? 1.0 : 0;
//   };

//   const toggleFullscreen = async () => {
//     const newFullscreenState = !isFullscreen;
//     setIsFullscreen(newFullscreenState);
//     setShowControls(true);

//     if (!ScreenOrientation) return;
    
//     try {
//       if (newFullscreenState) {
//         // Enter fullscreen - switch to landscape
//         await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
//       } else {
//         // Exit fullscreen - force portrait mode with multiple attempts if needed
//         for (let attempt = 0; attempt < 3; attempt++) {
//           try {
//             // Use unlockAsync first to clear any previous locks before setting PORTRAIT
//             await ScreenOrientation.unlockAsync();
//             await new Promise(resolve => setTimeout(resolve, 50));
            
//             // Now lock to portrait
//             await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
            
//             // Verify orientation change was successful
//             const orientation = await ScreenOrientation.getOrientationAsync();
//             const isPortrait = 
//               orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
//               orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN;
            
//             if (isPortrait) {
//               console.log('Successfully switched to portrait mode');
//               break; // Exit retry loop if successful
//             } else {
//               console.warn(`Portrait mode attempt ${attempt + 1} failed, retrying...`);
//               // Short delay before next attempt
//               await new Promise(resolve => setTimeout(resolve, 300));
//             }
//           } catch (innerError) {
//             // Don't log as error - this could be normal on some devices
//             console.warn(`Portrait mode attempt ${attempt + 1} notice: ${innerError.message}`);
//             // Still consider it a success if device doesn't support this orientation
//             if (innerError.message && innerError.message.includes('does not support the requested orientation')) {
//               console.log('Device reports it does not support portrait, but may still work');
//               break;
//             }
//             // Short delay before next attempt
//             await new Promise(resolve => setTimeout(resolve, 300));
//           }
//         }
//       }
//     } catch (error) {
//       console.warn('Notice while changing screen orientation:', error.message);
//     }
//   };
//   const handleTouchScreen = () => {
//     setShowControls(!showControls);
//   };

//   const getProgressPercentage = () => {
//     if (!player?.duration) return 0;
//     return (player.currentTime / player.duration) * 100;
//   };

//   const formatTime = (seconds: number) => {
//     if (!seconds) return '0:00';
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = Math.floor(seconds % 60);
//     return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
//   };

//   const handleRetry = () => {
//     setError(null);
//     setLoading(true);
//     // Reinitialize the player with the same URL
//     player?.play();
//   };

//   // Define state variables for settings modal
//   const [showSettings, setShowSettings] = useState(false);
//   const [showSpeedOptions, setShowSpeedOptions] = useState(false);
//   const [showQualityOptions, setShowQualityOptions] = useState(false);
//   const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
//   const [selectedQuality, setSelectedQuality] = useState('Auto');
//   const [controlsOpacity] = useState(new Animated.Value(1));
//   const [title, setTitle] = useState('');
  
//   // Define available options
//   const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
//   const qualityOptions = ['Auto', '1080p', '720p', '480p', '360p'];
  
//   // Settings modal functions
//   const toggleSettings = () => {
//     setShowSettings(!showSettings);
//     setShowSpeedOptions(false);
//     setShowQualityOptions(false);
//   };
  
//   const toggleSpeedOptions = () => {
//     setShowSpeedOptions(true);
//     setShowQualityOptions(false);
//   };
  
//   const toggleQualityOptions = () => {
//     setShowQualityOptions(true);
//     setShowSpeedOptions(false);
//   };
  
//   const handleBackToSettings = () => {
//     setShowSpeedOptions(false);
//     setShowQualityOptions(false);
//   };
  
//   const handleSpeedChange = (speed: number) => {
//     setPlaybackSpeed(speed);
//     if (player) {
//       player.playbackRate = speed;
//     }
//     setShowSpeedOptions(false);
//   };
  
//   const handleQualityChange = (quality: string) => {
//     setSelectedQuality(quality);
//     setShowQualityOptions(false);
//     // In a real implementation, you would change the video quality here
//   };
  
//   const handleReplay = () => {
//     setPlaybackCompleted(false);
//     if (player) {
//       player.currentTime = 0;
//       player.play();
//     }
//   };

//   return (
//     <View style={[styles.container, isFullscreen && Platform.OS === 'android' && styles.fullscreenContainer]}>
//       {/* Loading indicator */}
//       {loading && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size="large" color={Colors.PRIMARY} />
//           <Text style={styles.loadingText}>Loading video...</Text>
//         </View>
//       )}

//       {/* Error message */}
//       {error && (
//         <View style={styles.errorOverlay}>
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity 
//             style={styles.errorButton}
//             onPress={handleRetry}
//           >
//             <Text style={styles.errorButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Video Player */}
//       {!error && (
//         <TouchableOpacity 
//           style={[styles.videoWrapper, isFullscreen && Platform.OS === 'android' && styles.fullscreenVideoWrapper]} 
//           activeOpacity={1}
//           onPress={handleTouchScreen}
//         >
//           {/* Title bar */}
//           {title && showControls && !loading && (
//             <View style={styles.titleBar}>
//               <Text style={styles.titleText} numberOfLines={1}>
//                 {title}
//               </Text>
//             </View>
//           )}

//           <VideoView
//             style={[styles.video, isFullscreen && Platform.OS === 'android' && styles.fullscreenVideo]}
//             player={player}
//             allowsFullscreen={false}
//             allowsPictureInPicture={true}
// // Remove showControls prop as it's not supported by VideoView
//           />

//           {/* Video controls */}
//           {showControls && !loading && (
//             <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
//               {/* Top controls */}
//               <View style={styles.topControls}>
//                 <TouchableOpacity 
//                   style={styles.controlButton} 
//                   onPress={toggleMute}
//                 >
//                   {player?.volume === 0 ? (
//                     <VolumeX size={20} color="#ffffff" />
//                   ) : (
//                     <Volume2 size={20} color="#ffffff" />
//                   )}
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                   style={styles.controlButton} 
//                   onPress={toggleSettings}
//                 >
//                   <Settings size={20} color="#ffffff" />
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                   style={styles.controlButton} 
//                   onPress={toggleFullscreen}
//                 >
//                   {isFullscreen ? (
//                     <Minimize size={20} color="#ffffff" />
//                   ) : (
//                     <Maximize size={20} color="#ffffff" />
//                   )}
//                 </TouchableOpacity>
//               </View>

//               {/* Center play/pause button */}
//               <TouchableOpacity 
//                 style={styles.centerPlayButton} 
//                 onPress={togglePlayPause}
//               >
//                 {isPlaying ? (
//                   <Pause size={40} color="#ffffff" />
//                 ) : (
//                   <Play size={40} color="#ffffff" />
//                 )}
//               </TouchableOpacity>

//               {/* Bottom controls */}
//               <View style={styles.bottomControls}>
//                 {/* Progress bar */}
//                 <View style={styles.progressBarContainer}>
//                   <View style={styles.progressBar}>
//                     <View 
//                       style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} 
//                     />
//                   </View>
//                   <View style={styles.timeContainer}>
//                     <Text style={styles.timeText}>
//                       {formatTime(player?.currentTime || 0)}
//                     </Text>
//                     <Text style={styles.timeText}>
//                       {formatTime(player?.duration || 0)}
//                     </Text>
//                   </View>
//                 </View>
//               </View>
//             </Animated.View>
//           )}
          
//           {/* Playback speed indicator */}
//           {isPlaying && playbackSpeed !== 1.0 && (
//             <View style={styles.speedIndicator}>
//               <Text style={styles.speedText}>{playbackSpeed}x</Text>
//             </View>
//           )}
          
//           {/* Completion overlay */}
//           {playbackCompleted && (
//             <View style={styles.completionOverlay}>
//               <View style={styles.completionContent}>
//                 <CheckCircle2 size={50} color={Colors.PRIMARY} />
//                 <Text style={styles.completionText}>Video Completed</Text>
//                   <TouchableOpacity 
//                   style={styles.replayButton}
//                   onPress={handleReplay}
//                   >
//                   <Text style={styles.replayButtonText}>Watch Again</Text>
//                   </TouchableOpacity>
//               </View>
//             </View>
//           )}
          
//           {/* Confetti effect for completion */}
//           {ConfettiCannon && (
//             <ConfettiCannon
//               ref={confettiRef}
//               count={100}
//               origin={{x: Dimensions.get('window').width / 2, y: 0}}
//               explosionSpeed={350}
//               fallSpeed={3000}
//               fadeOut={true}
//             />
//           )}
          
//           {/* Settings Modal */}
//           {showSettings && (
//             <Modal
//               visible={showSettings}
//               transparent={true}
//               animationType="fade"
//               onRequestClose={toggleSettings}
//             >
//               <View style={styles.settingsOverlay}>
//                 <View style={styles.settingsContainer}>
//                   {/* Settings Header */}
//                   <View style={styles.settingsHeader}>
//                     {(showSpeedOptions || showQualityOptions) && (
//                       <TouchableOpacity 
//                         style={styles.backButton}
//                         onPress={handleBackToSettings}
//                       >
//                         <ChevronLeft size={20} color="#ffffff" />
//                         <Text style={styles.backText}>Back</Text>
//                       </TouchableOpacity>
//                     )}
//                     <Text style={styles.settingsTitle}>
//                       {showSpeedOptions ? 'Playback Speed' : 
//                        showQualityOptions ? 'Quality' : 'Settings'}
//                     </Text>
//                     <TouchableOpacity 
//                       style={styles.closeButton}
//                       onPress={toggleSettings}
//                     >
//                       <Text style={styles.closeText}>×</Text>
//                     </TouchableOpacity>
//                   </View>
                  
//                   {/* Settings Content */}
//                   <ScrollView style={styles.settingsContent}>
//                     {/* Main Settings */}
//                     {!showSpeedOptions && !showQualityOptions && (
//                       <>
//                         <TouchableOpacity 
//                           style={styles.settingsOption}
//                           onPress={toggleSpeedOptions}
//                         >
//                           <Text style={styles.settingsOptionText}>Playback Speed</Text>
//                           <Text style={styles.settingsOptionValue}>{playbackSpeed}x</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity 
//                           style={styles.settingsOption}
//                           onPress={toggleQualityOptions}
//                         >
//                           <Text style={styles.settingsOptionText}>Quality</Text>
//                           <Text style={styles.settingsOptionValue}>{selectedQuality}</Text>
//                         </TouchableOpacity>
//                       </>
//                     )}
                    
//                     {/* Speed Options */}
//                     {showSpeedOptions && (
//                       <>
//                         {playbackSpeeds.map((speed) => (
//                   <TouchableOpacity 
//                             key={`speed-${speed}`}
//                             style={styles.settingsOption}
//                             onPress={() => handleSpeedChange(speed)}
//                           >
//                             <Text style={styles.settingsOptionText}>{speed}x</Text>
//                             {playbackSpeed === speed && (
//                               <CheckCircle2 size={20} color={Colors.PRIMARY} />
//                             )}
//                           </TouchableOpacity>
//                         ))}
//                       </>
//                     )}
                    
//                     {/* Quality Options */}
//                     {showQualityOptions && (
//                       <>
//                         {qualityOptions.map((quality) => (
//                           <TouchableOpacity 
//                             key={`quality-${quality}`}
//                             style={styles.settingsOption}
//                             onPress={() => handleQualityChange(quality)}
//                           >
//                             <Text style={styles.settingsOptionText}>{quality}</Text>
//                             {selectedQuality === quality && (
//                               <CheckCircle2 size={20} color={Colors.PRIMARY} />
//                     )}
//                   </TouchableOpacity>
//                         ))}
//                       </>
//                     )}
//                   </ScrollView>
//                 </View>
//               </View>
//             </Modal>
//           )}
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000000',
//     position: 'relative',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   fullscreenContainer: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: 1000,
//     elevation: 1000,
//     backgroundColor: '#000',
//     borderRadius: 0,
//     width: Dimensions.get('window').width,
//     height: Dimensions.get('window').height,
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   videoWrapper: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   fullscreenVideoWrapper: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: 1000,
//     elevation: 1000,
//     width: Dimensions.get('window').width,
//     height: Dimensions.get('window').height,
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//   },
//   fullscreenVideo: {
//     width: Dimensions.get('window').width,
//     height: Dimensions.get('window').height,
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   loadingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   loadingText: {
//     color: '#ffffff',
//     marginTop: 10,
//     fontSize: 14,
//   },
//   errorOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     padding: 20,
//   },
//   errorText: {
//     color: '#ffffff',
//     textAlign: 'center',
//     fontSize: 14,
//   },
//   controlsOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'space-between',
//     padding: 16,
//   },
//   topControls: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   bottomControls: {
//     flexDirection: 'column',
//   },
//   progressBarContainer: {
//     marginBottom: 8,
//   },
//   progressBar: {
//     height: 4,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     borderRadius: 2,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: Colors.PRIMARY,
//   },
//   timeContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 4,
//   },
//   timeText: {
//     color: '#ffffff',
//     fontSize: 12,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//   },
//   controlButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   centerPlayButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     alignSelf: 'center',
//   },
//   errorButton: {
//     backgroundColor: Colors.PRIMARY,
//     paddingHorizontal: 24,
//     paddingVertical: 10,
//     borderRadius: 6,
//     marginTop: 16,
//   },
//   errorButtonText: {
//     color: '#ffffff',
//     fontWeight: '600',
//   },
//   // Title bar styles
//   titleBar: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     padding: 10,
//     zIndex: 10,
//   },
//   titleText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Playback speed indicator styles
//   speedIndicator: {
//     position: 'absolute',
//     top: 10,
//     left: 10,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   speedText: {
//     color: '#ffffff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   // Completion overlay styles
//   completionOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 20,
//   },
//   completionContent: {
//     alignItems: 'center',
//     padding: 20,
//   },
//   completionText: {
//     color: '#ffffff',
//     fontSize: 18,
//     fontWeight: '600',
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   replayButton: {
//     backgroundColor: Colors.PRIMARY,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 6,
//   },
//   replayButtonText: {
//     color: '#ffffff',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   // Settings modal styles
//   settingsOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   settingsContainer: {
//     width: '80%',
//     maxHeight: '70%',
//     backgroundColor: '#1f1f1f',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   settingsHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   backButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   backText: {
//     color: '#ffffff',
//     marginLeft: 4,
//     fontSize: 14,
//   },
//   settingsTitle: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//     flex: 1,
//     textAlign: 'center',
//   },
//   closeButton: {
//     width: 30,
//     height: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   closeText: {
//     color: '#ffffff',
//     fontSize: 24,
//     fontWeight: '600',
//   },
//   settingsContent: {
//     padding: 16,
//   },
//   settingsOption: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   settingsOptionText: {
//     color: '#ffffff',
//     fontSize: 16,
//   },
//   settingsOptionValue: {
//     color: Colors.PRIMARY,
//     fontSize: 14,
//   },
// });

// export default EnhancedVideoPlayer;


import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  BackHandler,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { VideoPlayer, useVideoPlayer, VideoView } from 'expo-video'; 
import { RefreshCw, CheckCircle2 } from 'lucide-react-native';
import Colors from '../../constant/Colors';

let ScreenOrientation: any = null;
try {
  ScreenOrientation = require('expo-screen-orientation');
} catch (e) { console.warn('expo-screen-orientation not available'); }

let ConfettiCannon: any = null;
try {
  ConfettiCannon = require('react-native-confetti-cannon').default;
} catch (e) { console.warn('react-native-confetti-cannon not available'); }

export interface EnhancedVideoPlayerRef {}

interface EnhancedVideoPlayerProps {
  url: string;
  title?: string;
  onError: (error: any) => void;
  onLoad?: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onFinished?: () => void; 
}

interface AppStyles {
  playerRoot: ViewStyle; playerFullscreenOverlay: ViewStyle; videoWrapper: ViewStyle; video: ViewStyle;
  loadingOverlay: ViewStyle; loadingText: TextStyle; errorOverlay: ViewStyle; errorText: TextStyle;
  errorButton: ViewStyle; errorButtonText: TextStyle; completionOverlay: ViewStyle; completionContent: ViewStyle;
  completionText: TextStyle; replayButton: ViewStyle; replayButtonText: TextStyle;
  controlsOverlay: ViewStyle; topControls: ViewStyle; controlButton: ViewStyle;
  centerPlayButton: ViewStyle; bottomControls: ViewStyle; progressBarContainer: ViewStyle;
  progressBar: ViewStyle; progressFill: ViewStyle; timeContainer: ViewStyle;
  timeText: TextStyle; titleBar: ViewStyle; titleText: TextStyle;
  speedIndicator: ViewStyle; speedText: TextStyle; settingsOverlay: ViewStyle;
  settingsContainer: ViewStyle; settingsHeader: ViewStyle; settingsModalBackButton: ViewStyle;
  backText: TextStyle; settingsTitle: TextStyle; settingsModalCloseButton: ViewStyle;
  closeText: TextStyle; settingsContent: ViewStyle; settingsOption: ViewStyle;
  settingsOptionText: TextStyle; settingsOptionValue: TextStyle;
}

interface VideoStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  didJustFinish: boolean;
  isLooping: boolean;
  error?: string;
  
}
function isValidVideoStatus(status: any): status is VideoStatus {
  return status != null && typeof status === 'object' &&
         typeof status.isLoaded === 'boolean' &&
         typeof status.isPlaying === 'boolean' &&
         typeof status.didJustFinish === 'boolean' &&
         typeof status.isLooping === 'boolean';
}

const EnhancedVideoPlayer = React.forwardRef<EnhancedVideoPlayerRef, EnhancedVideoPlayerProps>(({
  url,
  title: propTitle,
  onError,
  onLoad,
  onFullscreenChange,
  onFinished,
}, ref) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const [playbackCompletedThisSession, setPlaybackCompletedThisSession] = useState(false); // Renamed to avoid conflict with prop
  const confettiRef = useRef<any>(null);
  const [currentTitle, setCurrentTitle] = useState(propTitle || '');

  const player = useVideoPlayer(url, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.volume = 1.0;
    
  });

  useEffect(() => {
    if (player) {
      setLoading(false);
      if (onLoad) onLoad();
    }
  }, [player, onLoad]);

  useEffect(() => {
    setCurrentTitle(propTitle || '');
  }, [propTitle]);

  const handleFullscreenEnter = useCallback(() => {
    if (!isPlayerFullscreen) {
      setIsPlayerFullscreen(true);
      if (onFullscreenChange) onFullscreenChange(true);
      if (ScreenOrientation) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
          .catch((err: any) => console.warn('EVP: FS Enter Orientation lock failed:', err.message));
      }
    }
  }, [isPlayerFullscreen, onFullscreenChange]);

  const handleFullscreenExit = useCallback(() => {
    if (isPlayerFullscreen) {
      setIsPlayerFullscreen(false);
      if (onFullscreenChange) onFullscreenChange(false);
      if (ScreenOrientation) {
        ScreenOrientation.unlockAsync()
          .then(() => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP))
          .catch((err: any) => console.warn('EVP: FS Exit Orientation unlock/lock failed:', err.message));
      }
    }
  }, [isPlayerFullscreen, onFullscreenChange]);

  React.useImperativeHandle(ref, () => ({}), []);

  useEffect(() => {
    const backAction = () => {
      if (isPlayerFullscreen) {
        if (ScreenOrientation) {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
            .catch((e: any) => console.warn("Back press orientation lock (was fullscreen):", e.message));
        }
        return false; 
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => {
      sub.remove();
      if (ScreenOrientation && isPlayerFullscreen) {
        ScreenOrientation.unlockAsync()
          .then(() => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP))
          .catch((err: any) => console.warn("EVP Unmount: Orientation reset failed:", err.message));
      }
    };
  }, [isPlayerFullscreen]);

  useEffect(() => {
    if (!player || !('addListener' in player)) return;

    const handleStatusChange = (status: any) => {
      if (status.error) {
        const errorMessage = Platform.OS === 'android' ? `Android Error: ${status.error}` : `Error: ${status.error}`;
        setError(errorMessage);
        setLoading(false);
        if (onError) onError(status.error);
      }

      if (isValidVideoStatus(status)) {
        if (status.isLoaded && !status.isPlaying && status.didJustFinish && !status.isLooping) {
          if (!playbackCompletedThisSession) { 
            console.log("[EVP] Video playback completed (didJustFinish).");
            setPlaybackCompletedThisSession(true);
            if (onFinished) {
              console.log("[EVP] Calling onFinished prop.");
              onFinished();
            }
            if (ConfettiCannon && confettiRef.current) confettiRef.current.start();
          }
        } else if (status.isLoaded && status.isPlaying) {
          if (playbackCompletedThisSession) {
            console.log("[EVP] Video playing again, resetting playbackCompletedThisSession.");
            setPlaybackCompletedThisSession(false);
          }
        }
      }
    };

    const statusSubscription = player.addListener('statusChange', handleStatusChange);
    return () => {
      statusSubscription?.remove();
    };
  }, [player, onError, onFinished, playbackCompletedThisSession]); // Added playbackCompletedThisSession

  const handleRetry = () => { setError(null); setLoading(true); player?.replace(url); player?.play(); };
  const handleReplay = () => {
    setPlaybackCompletedThisSession(false);
    if (player) { player.currentTime = 0; player.play(); }
  };

  return (
    <View style={[ styles.playerRoot, isPlayerFullscreen && styles.playerFullscreenOverlay ]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleRetry}>
            <RefreshCw size={20} color="#fff" /><Text style={styles.errorButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && (
        <View style={styles.videoWrapper}>
          <VideoView
            style={styles.video}
            player={player}
            nativeControls={true} 
            allowsFullscreen={true}
            onFullscreenEnter={handleFullscreenEnter}
            onFullscreenExit={handleFullscreenExit}
            allowsPictureInPicture={Platform.OS === 'ios'}
          />

          {playbackCompletedThisSession && !loading && (
            <View style={styles.completionOverlay}>
              <View style={styles.completionContent}>
                <CheckCircle2 size={50} color={Colors.PRIMARY} />
                <Text style={styles.completionText}>Video Completed</Text>
                <TouchableOpacity style={styles.replayButton} onPress={handleReplay}><Text style={styles.replayButtonText}>Watch Again</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {ConfettiCannon && (<ConfettiCannon ref={confettiRef} count={playbackCompletedThisSession ? 100 : 0} origin={{x: Dimensions.get('window').width / 2, y: 0}} autoStart={false} />)}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create<AppStyles>({
  playerRoot: {
    flex: 1,
    width: '100%',
    height: '100%', 
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playerFullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    zIndex: 1000,
    backgroundColor: '#000',
  },
  videoWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 30,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 20,
    zIndex: 40,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 15,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 16,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 15,
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  completionContent: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 10,
  },
  completionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  replayButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  replayButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between', 
    zIndex: 10,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    // Add styles for top control bar (e.g., title, back button)
  },
  controlButton: {
    padding: 8,
    // Add styles for individual control buttons (play, pause, fullscreen)
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    // transform: [{ translateX: -25 }, { translateY: -25 }], // Center the button
    // width: 50, // Example
    // height: 50, // Example
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.5)',
    // borderRadius: 25,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    // Add styles for bottom control bar (e.g., progress bar, time, fullscreen)
  },
  progressBarContainer: {
    flex: 1,
    height: 20, // Example height
    marginHorizontal: 10,
    justifyContent: 'center',
    // Add styles for the progress bar container
  },
  progressBar: {
    height: 5, // Example
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2.5,
    // Add styles for the full progress bar track
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.PRIMARY, // Example
    borderRadius: 2.5,
    // Add styles for the filled part of the progress bar
  },
  timeContainer: {
    flexDirection: 'row',
    // Add styles for the container holding current time / total duration
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    marginHorizontal: 5,
    // Add styles for time display text
  },
  titleBar: {
    padding: 10,
    // Styles for an optional title bar if not part of topControls
  },
  titleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    // Styles for the video title text
  },
  speedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    // Styles for playback speed indicator
  },
  speedText: {
    color: '#fff',
    fontSize: 12,
    // Styles for the speed indicator text
  },
  settingsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50, 
  },
  settingsContainer: {
    backgroundColor: '#222', 
    borderRadius: 8,
    padding: 15,
    width: '80%',
    maxWidth: 300, 
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 10,
  },
  settingsModalBackButton: {
    padding: 5,
  },
  backText: {
    color: Colors.PRIMARY,
    fontSize: 16,
  },
  settingsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsModalCloseButton: {
    padding: 5,
  },
  closeText: {
    color: Colors.PRIMARY,
    fontSize: 16,
  },
  settingsContent: {
  },
  settingsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingsOptionText: {
    color: '#eee',
    fontSize: 16,
  },
  settingsOptionValue: {
    color: Colors.PRIMARY, 
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EnhancedVideoPlayer;