// components/forms/ImageUploadField.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UploadCloud, Image as ImageIcon, XCircle } from 'lucide-react-native';
import Colors from '../../constant/Colors'; // Adjust path

interface ImageUploadFieldProps {
  label: string;
  onImageSelected: (asset: ImagePicker.ImagePickerAsset | null) => void; // Pass the whole asset or null
  currentImageUrl?: string | null; // To display an already uploaded image URL
  aspectRatio?: [number, number]; // e.g., [16, 9] or [1, 1]
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  onImageSelected,
  currentImageUrl,
  aspectRatio = [16, 9], // Default aspect ratio
}) => {
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(currentImageUrl || null);

  useEffect(() => { // Sync with prop changes
      setPickedImageUri(currentImageUrl || null);
  }, [currentImageUrl]);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return false;
      }
    }
    return true;
  };

  const handlePickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.7, // Compress image slightly
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPickedImageUri(asset.uri); // Show local preview
        onImageSelected(asset);       // Pass the asset to parent
      } else {
        onImageSelected(null); // Inform parent if selection was cancelled
      }
    } catch (error) {
      console.error("ImagePicker Error: ", error);
      Alert.alert("Image Picker Error", "Could not select image.");
      onImageSelected(null);
    }
  };

  const handleRemoveImage = () => {
    setPickedImageUri(null);
    onImageSelected(null); // Inform parent that image is removed
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        {pickedImageUri ? (
          <Image source={{ uri: pickedImageUri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholder}>
            <UploadCloud size={40} color={Colors.GRAY} />
            <Text style={styles.placeholderText}>Tap to select image</Text>
            <Text style={styles.aspectRatioHint}>(Recommended aspect ratio: {aspectRatio[0]}:{aspectRatio[1]})</Text>
          </View>
        )}
      </TouchableOpacity>
      {pickedImageUri && (
        <TouchableOpacity style={styles.removeButton} onPress={handleRemoveImage}>
          <XCircle size={20} color={Colors.ERROR} />
          <Text style={styles.removeButtonText}>Remove Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.GRAY,
    marginBottom: 6,
  },
  imagePicker: {
    height: 150, // Adjust as needed
    width: '100%',
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    overflow: 'hidden', // Important for the Image component
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: Colors.GRAY,
    fontSize: 14,
  },
  aspectRatioHint: {
      fontSize: 12,
      color: Colors.GRAY,
      marginTop: 4,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ffebee', // Light red background
    borderRadius: 6,
    alignSelf: 'flex-start', // Position it to the left
  },
  removeButtonText: {
    marginLeft: 6,
    color: Colors.ERROR,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ImageUploadField;