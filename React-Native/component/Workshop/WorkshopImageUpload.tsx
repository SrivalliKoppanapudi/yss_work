import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/Superbase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import Colors from '../../constant/Colors';
import { UploadCloud } from 'lucide-react-native';

interface WorkshopImageUploadProps {
  label: string;
  currentImageUrl?: string | null;
  onImageSelected: (filePath: string, publicUrl: string) => void;
  aspectRatio?: [number, number];
  bucket: string;
}

const WorkshopImageUpload: React.FC<WorkshopImageUploadProps> = ({
  label,
  currentImageUrl,
  onImageSelected,
  aspectRatio = [16, 9],
  bucket,
}) => {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const image = result.assets[0];
    setLocalPreview(image.uri);
    setUploading(true);

    try {
      const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `workshops/${fileName}`;
      
      const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: FileSystem.EncodingType.Base64 });

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, decode(base64), { contentType: image.mimeType ?? `image/${fileExt}` });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onImageSelected(filePath, urlData.publicUrl);
      Alert.alert('Success', 'Image uploaded. Remember to save the workshop to apply changes.');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };
  
  const displayUrl = localPreview || currentImageUrl;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage} disabled={uploading}>
        {displayUrl ? (
          <Image source={{ uri: displayUrl }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <UploadCloud size={32} color={Colors.GRAY} />
            <Text style={styles.placeholderText}>Tap to upload</Text>
          </View>
        )}
        {uploading && <ActivityIndicator style={styles.loader} color={Colors.WHITE} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.GRAY,
        marginBottom: 8,
    },
    uploadButton: {
        height: 180,
        width: '100%',
        backgroundColor: '#f0f2f5',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: Colors.GRAY,
    },
    loader: {
        position: 'absolute',
    },
});

export default WorkshopImageUpload;