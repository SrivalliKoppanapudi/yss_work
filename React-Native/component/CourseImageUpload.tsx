import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { imageUploadService, ImageInfo } from '../lib/imageUploadService';

const { width } = Dimensions.get('window');
const isMobile = width < 700;

interface CourseImageUploadProps {
  currentImageUrl?: string;
  onImageSelected: (imageUrl: string, fileName: string) => void;
  onImageRemoved: () => void;
  disabled?: boolean;
}

const CourseImageUpload: React.FC<CourseImageUploadProps> = ({
  currentImageUrl,
  onImageSelected,
  onImageRemoved,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageInfo | null>(null);

  const handleImagePicker = async () => {
    if (disabled) return;

    try {
      setUploading(true);

      // Show image picker
      const imageInfo = await imageUploadService.showImagePickerOptions();
      
      if (!imageInfo) {
        // User cancelled
        return;
      }

      // Set preview
      setPreviewImage(imageInfo);

      // Upload to storage
      const uploadResult = await imageUploadService.processAndUploadImage(imageInfo);

      if (uploadResult.success && uploadResult.url && uploadResult.fileName) {
        onImageSelected(uploadResult.url, uploadResult.fileName);
        Alert.alert('Success', 'Image uploaded successfully!');
      } else {
        Alert.alert('Error', uploadResult.error || 'Failed to upload image');
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Error in image picker:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      setPreviewImage(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPreviewImage(null);
            onImageRemoved();
          },
        },
      ]
    );
  };

  const renderImagePreview = () => {
    const imageUrl = currentImageUrl || previewImage?.uri;
    
    if (!imageUrl) {
      return (
        <View style={styles.placeholderContainer}>
          <Ionicons name="image-outline" size={48} color="#666" />
          <Text style={styles.placeholderText}>
            {uploading ? 'Uploading...' : 'Click to upload cover image'}
          </Text>
          {uploading && (
            <ActivityIndicator 
              size="small" 
              color="#1CB5E0" 
              style={styles.uploadIndicator}
            />
          )}
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveImage}
            disabled={disabled}
          >
            <Ionicons name="close-circle" size={24} color="#FF4B4B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.uploadButton,
          disabled && styles.uploadButtonDisabled,
          currentImageUrl && styles.uploadButtonWithImage,
        ]}
        onPress={handleImagePicker}
        disabled={disabled || uploading}
      >
        {renderImagePreview()}
      </TouchableOpacity>
      
      {currentImageUrl && (
        <View style={styles.imageInfo}>
          <Text style={styles.imageInfoText}>
            ✓ Cover image uploaded
          </Text>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={handleImagePicker}
            disabled={disabled}
          >
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d0e3f1',
    borderStyle: 'dashed',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonWithImage: {
    borderStyle: 'solid',
    borderColor: '#1CB5E0',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  uploadIndicator: {
    marginTop: 8,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  removeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  imageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  imageInfoText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  changeButton: {
    backgroundColor: '#EAF6FB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  changeButtonText: {
    color: '#1CB5E0',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CourseImageUpload; 