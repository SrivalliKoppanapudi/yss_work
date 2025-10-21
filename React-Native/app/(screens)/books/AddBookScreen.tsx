// // import React, { useState } from 'react';
// // import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Switch, Platform } from 'react-native';
// // import { useRouter } from 'expo-router';
// // import { supabase } from '../../../lib/Superbase';
// // import Colors from '../../../constant/Colors';
// // import { Book as BookType, BookFormat } from '../../../types/books';
// // import * as DocumentPicker from 'expo-document-picker';
// // import * as ImagePicker from 'expo-image-picker';
// // import { decode } from 'base64-arraybuffer';
// // import { ArrowLeft, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react-native';
// // import * as FileSystem from 'expo-file-system';

// // type UploadState = 'idle' | 'uploading' | 'success' | 'error';
// // interface FileUploadStatus {
// //     status: UploadState;
// //     path: string | null;
// //     url: string | null;
// //     error?: string;
// // }

// // interface FileUploadFieldProps {
// //     label: string;
// //     onPick: () => void;
// //     fileName: string | null;
// //     uploadStatus: UploadState;
// // }

// // const FileUploadField: React.FC<FileUploadFieldProps> = ({ label, onPick, fileName, uploadStatus }) => (
// //     <View style={styles.inputGroup}>
// //         <Text style={styles.label}>{label}</Text>
// //         <TouchableOpacity
// //             style={[styles.filePickerButton, uploadStatus === 'error' && styles.filePickerError]}
// //             onPress={onPick}
// //             disabled={uploadStatus === 'uploading'}
// //         >
// //             <UploadCloud size={20} color={uploadStatus === 'error' ? Colors.ERROR : Colors.PRIMARY} />
// //             <Text style={[styles.filePickerText, uploadStatus === 'error' && { color: Colors.ERROR }]} numberOfLines={1}>
// //                 {fileName || 'Select File'}
// //             </Text>
// //             {uploadStatus === 'uploading' && <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginLeft: 10 }} />}
// //             {uploadStatus === 'success' && <CheckCircle size={20} color={Colors.SUCCESS} style={{ marginLeft: 10 }} />}
// //             {uploadStatus === 'error' && <AlertCircle size={20} color={Colors.ERROR} style={{ marginLeft: 10 }} />}
// //         </TouchableOpacity>
// //     </View>
// // );

// // export default function AddBookScreen() {
// //     const router = useRouter();
// //     const [isSubmitting, setIsSubmitting] = useState(false);

// //     const [bookDetails, setBookDetails] = useState<Partial<BookType>>({
// //         title: '', author: '', publisher: '', description: '', language: 'English',
// //         year_of_publication: new Date().getFullYear(),
// //     });

// //     const [coverImageFile, setCoverImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
// //     const [ebookFile, setEbookFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
// //     const [sampleFile, setSampleFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

// //     const [uploadStatus, setUploadStatus] = useState({
// //         cover: { status: 'idle' } as FileUploadStatus,
// //         ebook: { status: 'idle' } as FileUploadStatus,
// //         sample: { status: 'idle' } as FileUploadStatus,
// //     });

// //     const [addHardcover, setAddHardcover] = useState(false);
// //     const [hardcoverPrice, setHardcoverPrice] = useState('');
// //     const [hardcoverPages, setHardcoverPages] = useState('');
// //     const [hardcoverStock, setHardcoverStock] = useState('');

// //     const [ebookPrice, setEbookPrice] = useState('');
// //     const [ebookPages, setEbookPages] = useState('');

// //     const handleInputChange = (field: keyof typeof bookDetails, value: string | number) => {
// //         setBookDetails(prev => ({ ...prev, [field]: value }));
// //     };

// //     const handlePickFile = async (
// //         setFile: (file: any) => void,
// //         fileType: 'cover' | 'ebook' | 'sample',
// //         pickerType: 'pdf' | 'image'
// //     ) => {
// //         try {
// //             setUploadStatus(prev => ({ ...prev, [fileType]: { status: 'idle', path: null, url: null }}));

// //             if (pickerType === 'image') {
// //                 const result = await ImagePicker.launchImageLibraryAsync({
// //                     mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.7
// //                 });
// //                 if (!result.canceled) setFile(result.assets[0]);
// //             } else {
// //                 const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
// //                 if (!result.canceled) setFile(result.assets[0]);
// //             }
// //         } catch (error) {
// //             Alert.alert("Error", "Could not select file.");
// //         }
// //     };

// //     const uploadFile = async (
// //         fileAsset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset,
// //         bucket: string,
// //         folder: string
// //     ): Promise<{ path: string; url: string }> => {
// //         const fileExt = fileAsset.uri.split('.').pop()?.toLowerCase() ?? 'file';
// //         const fileName = `${Date.now()}.${fileExt}`;
// //         const filePath = `${folder}/${fileName}`;

// //         const base64 = await FileSystem.readAsStringAsync(fileAsset.uri, {
// //             encoding: FileSystem.EncodingType.Base64,
// //         });

// //         const { error } = await supabase.storage
// //             .from(bucket)
// //             .upload(filePath, decode(base64), { contentType: fileAsset.mimeType });

// //         if (error) throw error;

// //         const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
// //         if (!urlData.publicUrl) throw new Error(`Could not get public URL for ${filePath}`);

// //         return { path: filePath, url: urlData.publicUrl };
// //     };

// //     const handleSubmit = async () => {
// //         if (!bookDetails.title) { Alert.alert("Missing Information", "Please provide a book title."); return; }
// //         if (!coverImageFile) { Alert.alert("Missing Information", "Please select a cover image."); return; }
// //         if (!ebookFile) { Alert.alert("Missing Information", "Please select an e-book PDF file."); return; }
// //         if (!ebookPrice || !ebookPages) { Alert.alert("Missing Information", "Please provide the price and page count for the e-book."); return; }

// //         setIsSubmitting(true);
// //         let uploadedPaths: { coverUrl?: string; ebookPath?: string; samplePath?: string } = {};

// //         try {
// //             // --- 1. UPLOAD FILES ---
// //             setUploadStatus(prev => ({ ...prev, cover: { ...prev.cover, status: 'uploading' }}));
// //             const { url: coverUrl } = await uploadFile(coverImageFile, 'book-covers', 'public');
// //             uploadedPaths.coverUrl = coverUrl;
// //             setUploadStatus(prev => ({ ...prev, cover: { ...prev.cover, status: 'success', url: coverUrl }}));

// //             setUploadStatus(prev => ({ ...prev, ebook: { ...prev.ebook, status: 'uploading' }}));
// //             const { path: ebookPath } = await uploadFile(ebookFile, 'ebook-files', bookDetails.title!.replace(/\s+/g, '-').toLowerCase());
// //             uploadedPaths.ebookPath = ebookPath;
// //             setUploadStatus(prev => ({ ...prev, ebook: { ...prev.ebook, status: 'success', path: ebookPath }}));

// //             if (sampleFile) {
// //                 setUploadStatus(prev => ({ ...prev, sample: { ...prev.sample, status: 'uploading' }}));
// //                 const { path: samplePath } = await uploadFile(sampleFile, 'ebook-files', bookDetails.title!.replace(/\s+/g, '-').toLowerCase());
// //                 uploadedPaths.samplePath = samplePath;
// //                 setUploadStatus(prev => ({ ...prev, sample: { ...prev.sample, status: 'success', path: samplePath }}));
// //             }

// //             // --- 2. INSERT INTO DATABASE (only if all uploads succeed) ---
// //             const { data: { session }, error: sessionError } = await supabase.auth.getSession();
// //             if (sessionError || !session?.user) {
// //                 throw new Error("You must be logged in to add a book.");
// //             }

// //             const { data: newBook, error: bookError } = await supabase
// //                 .from('books')
// //                 .insert({
// //                     ...bookDetails,
// //                     cover_image_url: uploadedPaths.coverUrl,
// //                     user_id: session.user.id // **THIS IS THE FIX FOR RLS**
// //                 })
// //                 .select()
// //                 .single();

// //             if (bookError) throw bookError;

// //             // Prepare formats to insert
// //             const formatsToInsert: Partial<BookFormat>[] = [{
// //                 book_id: newBook.id,
// //                 format: 'ebook',
// //                 price: parseFloat(ebookPrice) || 0,
// //                 pages: parseInt(ebookPages) || 0,
// //                 is_in_stock: true,
// //                 ebook_file_url: uploadedPaths.ebookPath,
// //                 sample_file_url: uploadedPaths.samplePath || null,
// //             }];

// //             if (addHardcover) {
// //                 if (!hardcoverPrice || !hardcoverPages || !hardcoverStock) {
// //                     throw new Error("Please fill all fields for the Hardcover format.");
// //                 }
// //                 formatsToInsert.push({
// //                     book_id: newBook.id,
// //                     format: 'hardcover',
// //                     price: parseFloat(hardcoverPrice) || 0,
// //                     pages: parseInt(hardcoverPages) || 0,
// //                     stock_quantity: parseInt(hardcoverStock) || 0,
// //                     is_in_stock: (parseInt(hardcoverStock) || 0) > 0,
// //                 });
// //             }

// //             const { error: formatError } = await supabase.from('book_formats').insert(formatsToInsert);
// //             if (formatError) throw formatError;

// //             Alert.alert("Success!", "Book has been added.", [{ text: "OK", onPress: () => router.back() }]);

// //         } catch (error: any) {
// //             if (uploadStatus.cover.status === 'uploading') setUploadStatus(prev => ({...prev, cover: { ...prev.cover, status: 'error' }}));
// //             if (uploadStatus.ebook.status === 'uploading') setUploadStatus(prev => ({...prev, ebook: { ...prev.ebook, status: 'error' }}));
// //             if (uploadStatus.sample.status === 'uploading') setUploadStatus(prev => ({...prev, sample: { ...prev.sample, status: 'error' }}));
// //             Alert.alert("Submission Failed", error.message);
// //         } finally {
// //             setIsSubmitting(false);
// //         }
// //     };

// //     return (
// //         <View style={styles.container}>
// //             <View style={styles.header}>
// //                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
// //                     <ArrowLeft size={24} color={Colors.BLACK} />
// //                 </TouchableOpacity>
// //                 <Text style={styles.headerTitle}>Add New Book</Text>
// //                  <View style={{width: 24}}/>
// //             </View>

// //             <ScrollView contentContainerStyle={styles.scrollContainer}>
// //                 <View style={styles.section}>
// //                     <Text style={styles.sectionTitle}>Book Details</Text>

// //                     <FileUploadField label="Cover Image*" onPick={() => handlePickFile(setCoverImageFile, 'cover', 'image')} fileName={coverImageFile?.fileName || coverImageFile?.uri.split('/').pop() || null} uploadStatus={uploadStatus.cover.status} />
// //                     {coverImageFile && <Image source={{uri: coverImageFile.uri}} style={styles.imagePreview} />}

// //                     <TextInput style={styles.input} placeholder="Book Title*" value={bookDetails.title} onChangeText={val => handleInputChange('title', val)} placeholderTextColor={Colors.GRAY} />
// //                     <TextInput style={styles.input} placeholder="Author*" value={bookDetails.author} onChangeText={val => handleInputChange('author', val)} placeholderTextColor={Colors.GRAY} />
// //                     <TextInput style={styles.input} placeholder="Publisher" value={bookDetails.publisher} onChangeText={val => handleInputChange('publisher', val)} placeholderTextColor={Colors.GRAY} />
// //                     <TextInput style={styles.textArea} placeholder="Description" value={bookDetails.description} onChangeText={val => handleInputChange('description', val)} multiline placeholderTextColor={Colors.GRAY} />
// //                     <TextInput style={styles.input} placeholder="Language" value={bookDetails.language} onChangeText={val => handleInputChange('language', val)} placeholderTextColor={Colors.GRAY} />
// //                     <TextInput style={styles.input} placeholder="Year of Publication" value={String(bookDetails.year_of_publication)} onChangeText={val => handleInputChange('year_of_publication', Number(val))} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
// //                 </View>

// //                 <View style={styles.section}>
// //                     <Text style={styles.sectionTitle}>E-book Format</Text>
// //                     <FileUploadField label="E-book PDF File*" onPick={() => handlePickFile(setEbookFile, 'ebook', 'pdf')} fileName={ebookFile?.name || null} uploadStatus={uploadStatus.ebook.status} />
// //                     <FileUploadField label="Sample PDF File (Optional)" onPick={() => handlePickFile(setSampleFile, 'sample', 'pdf')} fileName={sampleFile?.name || null} uploadStatus={uploadStatus.sample.status} />
// //                     <TextInput style={styles.input} placeholder="Price (e.g., 450.00)*" value={ebookPrice} onChangeText={setEbookPrice} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
// //                     <TextInput style={styles.input} placeholder="Number of Pages*" value={ebookPages} onChangeText={setEbookPages} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
// //                 </View>

// //                 <View style={styles.section}>
// //                     <View style={styles.switchContainer}>
// //                         <Text style={styles.sectionTitle}>Add Hardcover Format?</Text>
// //                         <Switch value={addHardcover} onValueChange={setAddHardcover} trackColor={{false: '#767577', true: Colors.PRIMARY_LIGHT}} thumbColor={addHardcover ? Colors.PRIMARY : '#f4f3f4'}/>
// //                     </View>
// //                     {addHardcover && (
// //                         <>
// //                             <TextInput style={styles.input} placeholder="Hardcover Price*" value={hardcoverPrice} onChangeText={setHardcoverPrice} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
// //                             <TextInput style={styles.input} placeholder="Number of Pages*" value={hardcoverPages} onChangeText={setHardcoverPages} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
// //                             <TextInput style={styles.input} placeholder="Stock Quantity*" value={hardcoverStock} onChangeText={setHardcoverStock} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
// //                         </>
// //                     )}
// //                 </View>

// //                 <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
// //                     {isSubmitting ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.submitButtonText}>Save Book</Text>}
// //                 </TouchableOpacity>
// //             </ScrollView>
// //         </View>
// //     );
// // }

// // const styles = StyleSheet.create({
// //     container: {
// //         flex: 1,
// //         backgroundColor: '#f8f9fa'
// //     },
// //     header: {
// //         flexDirection: 'row',
// //         alignItems: 'center',
// //         padding: 16,
// //         backgroundColor: Colors.WHITE,
// //         borderBottomWidth: 1,
// //         borderBottomColor: '#eee'
// //     },
// //     backButton: {
// //         padding: 4
// //     },
// //     headerTitle: {
// //         flex: 1,
// //         textAlign: 'center',
// //         fontSize: 20,
// //         fontWeight: '600'
// //     },
// //     scrollContainer: {
// //         padding: 16
// //     },
// //     section: {
// //         backgroundColor: Colors.WHITE,
// //         borderRadius: 8,
// //         padding: 20,
// //         marginBottom: 20
// //     },
// //     sectionTitle: {
// //         fontSize: 18,
// //         fontWeight: 'bold',
// //         marginBottom: 16
// //     },
// //     inputGroup: {
// //         marginBottom: 12
// //     },
// //     label: {
// //         fontSize: 15,
// //         color: Colors.GRAY,
// //         marginBottom: 6,
// //         fontWeight: '500'
// //     },
// //     input: {
// //         backgroundColor: '#f8f9fa',
// //         borderWidth: 1,
// //         borderColor: '#e0e0e0',
// //         borderRadius: 8,
// //         padding: 14,
// //         fontSize: 16,
// //         marginBottom: 10
// //     },
// //     textArea: {
// //         minHeight: 100,
// //         textAlignVertical: 'top',
// //         backgroundColor: '#f8f9fa',
// //         borderWidth: 1,
// //         borderColor: '#e0e0e0',
// //         borderRadius: 8,
// //         padding: 14,
// //         fontSize: 16,
// //         marginBottom: 10
// //     },
// //     filePickerButton: {
// //         flexDirection: 'row',
// //         alignItems: 'center',
// //         backgroundColor: '#e7f3ff',
// //         padding: 14,
// //         borderRadius: 8,
// //         borderWidth: 1,
// //         borderColor: Colors.PRIMARY,
// //         borderStyle: 'dashed'
// //     },
// //     filePickerError: {
// //         borderColor: Colors.ERROR,
// //         backgroundColor: '#fff2f2'
// //     },
// //     filePickerText: {
// //         marginLeft: 10,
// //         color: Colors.PRIMARY,
// //         flexShrink: 1,
// //         fontSize: 15
// //     },
// //     imagePreview: {
// //         width: 100,
// //         height: 133,
// //         borderRadius: 8,
// //         marginTop: 10,
// //         alignSelf: 'center',
// //         borderWidth: 1,
// //         borderColor: '#ddd'
// //     },
// //     switchContainer: {
// //         flexDirection: 'row',
// //         justifyContent: 'space-between',
// //         alignItems: 'center'
// //     },
// //     submitButton: {
// //         backgroundColor: Colors.PRIMARY,
// //         padding: 15,
// //         borderRadius: 8,
// //         alignItems: 'center'
// //     },
// //     submitButtonText: {
// //         color: Colors.WHITE,
// //         fontSize: 16,
// //         fontWeight: 'bold'
// //     },
// //     disabledButton: {
// //         backgroundColor: Colors.GRAY
// //     },
// // });
// import React, { useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Switch } from 'react-native';
// import { useRouter } from 'expo-router';
// import { supabase } from '../../../lib/Superbase';
// import Colors from '../../../constant/Colors';
// import { Book as BookType, BookFormat } from '../../../types/books';
// import * as DocumentPicker from 'expo-document-picker';
// import * as ImagePicker from 'expo-image-picker';
// import { decode } from 'base64-arraybuffer';
// import { ArrowLeft, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react-native';
// import * as FileSystem from 'expo-file-system';

// type UploadState = 'idle' | 'uploading' | 'success' | 'error';
// interface FileUploadStatus {
//     status: UploadState;
//     path: string | null;
//     url: string | null;
//     error?: string;
// }

// interface FileUploadFieldProps {
//     label: string;
//     onPick: () => void;
//     fileName: string | null;
//     uploadStatus: UploadState;
// }

// const FileUploadField: React.FC<FileUploadFieldProps> = ({ label, onPick, fileName, uploadStatus }) => (
//     <View style={styles.inputGroup}>
//         <Text style={styles.label}>{label}</Text>
//         <TouchableOpacity
//             style={[styles.filePickerButton, uploadStatus === 'error' && styles.filePickerError]}
//             onPress={onPick}
//             disabled={uploadStatus === 'uploading'}
//         >
//             <UploadCloud size={20} color={uploadStatus === 'error' ? Colors.ERROR : Colors.PRIMARY} />
//             <Text style={[styles.filePickerText, uploadStatus === 'error' && { color: Colors.ERROR }]} numberOfLines={1}>
//                 {fileName || 'Select File'}
//             </Text>
//             {uploadStatus === 'uploading' && <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginLeft: 10 }} />}
//             {uploadStatus === 'success' && <CheckCircle size={20} color={Colors.SUCCESS} style={{ marginLeft: 10 }} />}
//             {uploadStatus === 'error' && <AlertCircle size={20} color={Colors.ERROR} style={{ marginLeft: 10 }} />}
//         </TouchableOpacity>
//     </View>
// );

// export default function AddBookScreen() {
//     const router = useRouter();
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     const [bookDetails, setBookDetails] = useState<Partial<BookType>>({
//         title: '', author: '', publisher: '', description: '', language: 'English',
//         year_of_publication: new Date().getFullYear(),
//     });

//     const [coverImageFile, setCoverImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
//     const [ebookFile, setEbookFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
//     const [sampleFile, setSampleFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

//     const [uploadStatus, setUploadStatus] = useState({
//         cover: { status: 'idle' } as FileUploadStatus,
//         ebook: { status: 'idle' } as FileUploadStatus,
//         sample: { status: 'idle' } as FileUploadStatus,
//     });

//     // --- MODIFICATION: Toggles for each format ---
//     const [addEbook, setAddEbook] = useState(true);
//     const [addHardcover, setAddHardcover] = useState(false);
//     const [addPaperback, setAddPaperback] = useState(false);

//     // --- State for each format's details ---
//     const [ebookPrice, setEbookPrice] = useState('');
//     const [ebookPages, setEbookPages] = useState('');
//     const [hardcoverPrice, setHardcoverPrice] = useState('');
//     const [hardcoverPages, setHardcoverPages] = useState('');
//     const [hardcoverStock, setHardcoverStock] = useState('');
//     const [paperbackPrice, setPaperbackPrice] = useState('');
//     const [paperbackPages, setPaperbackPages] = useState('');
//     const [paperbackStock, setPaperbackStock] = useState('');


//     const handleInputChange = (field: keyof typeof bookDetails, value: string | number) => {
//         setBookDetails(prev => ({ ...prev, [field]: value }));
//     };

//     const handlePickFile = async (
//         setFile: (file: any) => void,
//         fileType: 'cover' | 'ebook' | 'sample',
//         pickerType: 'pdf' | 'image'
//     ) => {
//         try {
//             setUploadStatus(prev => ({ ...prev, [fileType]: { status: 'idle', path: null, url: null }}));

//             if (pickerType === 'image') {
//                 const result = await ImagePicker.launchImageLibraryAsync({
//                     mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.7
//                 });
//                 if (!result.canceled) setFile(result.assets[0]);
//             } else {
//                 const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
//                 if (!result.canceled) setFile(result.assets[0]);
//             }
//         } catch (error) {
//             Alert.alert("Error", "Could not select file.");
//         }
//     };

//     const uploadFile = async (
//         fileAsset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset,
//         bucket: string,
//         folder: string
//     ): Promise<{ path: string; url: string }> => {
//         const fileExt = fileAsset.uri.split('.').pop()?.toLowerCase() ?? 'file';
//         const fileName = `${Date.now()}.${fileExt}`;
//         const filePath = `${folder}/${fileName}`;

//         const base64 = await FileSystem.readAsStringAsync(fileAsset.uri, {
//             encoding: FileSystem.EncodingType.Base64,
//         });

//         const { error } = await supabase.storage
//             .from(bucket)
//             .upload(filePath, decode(base64), { contentType: fileAsset.mimeType });

//         if (error) throw error;

//         const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
//         if (!urlData.publicUrl) throw new Error(`Could not get public URL for ${filePath}`);

//         return { path: filePath, url: urlData.publicUrl };
//     };

//     const handleSubmit = async () => {
//         // --- MODIFICATION: Updated Validation Logic ---
//         if (!bookDetails.title) { Alert.alert("Missing Information", "Please provide a book title."); return; }
//         if (!coverImageFile) { Alert.alert("Missing Information", "Please select a cover image."); return; }

//         if (!addEbook && !addHardcover && !addPaperback) {
//             Alert.alert("No Format Selected", "Please add at least one format (E-book, Hardcover, or Paperback).");
//             return;
//         }
//         if (addEbook && (!ebookFile || !ebookPrice || !ebookPages)) {
//             Alert.alert("E-book Error", "Please provide the PDF, price, and pages for the e-book format.");
//             return;
//         }
//         if (addHardcover && (!hardcoverPrice || !hardcoverPages || !hardcoverStock)) {
//             Alert.alert("Hardcover Error", "Please provide the price, pages, and stock for the hardcover format.");
//             return;
//         }
//         if (addPaperback && (!paperbackPrice || !paperbackPages || !paperbackStock)) {
//             Alert.alert("Paperback Error", "Please provide the price, pages, and stock for the paperback format.");
//             return;
//         }
//         // --- End of Validation ---

//         setIsSubmitting(true);
//         let uploadedPaths: { coverUrl?: string; ebookPath?: string; samplePath?: string } = {};

//         try {
//             // --- 1. UPLOAD FILES ---
//             setUploadStatus(prev => ({ ...prev, cover: { ...prev.cover, status: 'uploading' }}));
//             const { url: coverUrl } = await uploadFile(coverImageFile, 'book-covers', 'public');
//             uploadedPaths.coverUrl = coverUrl;
//             setUploadStatus(prev => ({ ...prev, cover: { ...prev.cover, status: 'success', url: coverUrl }}));

//             // --- MODIFICATION: Conditional Upload ---
//             if (addEbook && ebookFile) {
//                 setUploadStatus(prev => ({ ...prev, ebook: { ...prev.ebook, status: 'uploading' }}));
//                 const { path: ebookPath } = await uploadFile(ebookFile, 'ebook-files', bookDetails.title!.replace(/\s+/g, '-').toLowerCase());
//                 uploadedPaths.ebookPath = ebookPath;
//                 setUploadStatus(prev => ({ ...prev, ebook: { ...prev.ebook, status: 'success', path: ebookPath }}));
//             }
//             if (addEbook && sampleFile) {
//                 setUploadStatus(prev => ({ ...prev, sample: { ...prev.sample, status: 'uploading' }}));
//                 const { path: samplePath } = await uploadFile(sampleFile, 'ebook-files', bookDetails.title!.replace(/\s+/g, '-').toLowerCase());
//                 uploadedPaths.samplePath = samplePath;
//                 setUploadStatus(prev => ({ ...prev, sample: { ...prev.sample, status: 'success', path: samplePath }}));
//             }

//             // --- 2. INSERT INTO DATABASE (only if all uploads succeed) ---
//             const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//             if (sessionError || !session?.user) {
//                 throw new Error("You must be logged in to add a book.");
//             }

//             const { data: newBook, error: bookError } = await supabase
//                 .from('books')
//                 .insert({
//                     ...bookDetails,
//                     cover_image_url: uploadedPaths.coverUrl,
//                     user_id: session.user.id
//                 })
//                 .select()
//                 .single();

//             if (bookError) throw bookError;

//             // --- MODIFICATION: Dynamically build formats to insert ---
//             const formatsToInsert: Partial<BookFormat>[] = [];

//             if (addEbook) {
//                 formatsToInsert.push({
//                     book_id: newBook.id,
//                     format: 'ebook',
//                     price: parseFloat(ebookPrice) || 0,
//                     pages: parseInt(ebookPages) || 0,
//                     is_in_stock: true,
//                     ebook_file_url: uploadedPaths.ebookPath,
//                     sample_file_url: uploadedPaths.samplePath || null,
//                 });
//             }
//             if (addHardcover) {
//                 formatsToInsert.push({
//                     book_id: newBook.id,
//                     format: 'hardcover',
//                     price: parseFloat(hardcoverPrice) || 0,
//                     pages: parseInt(hardcoverPages) || 0,
//                     stock_quantity: parseInt(hardcoverStock) || 0,
//                     is_in_stock: (parseInt(hardcoverStock) || 0) > 0,
//                 });
//             }
//             if (addPaperback) {
//                 formatsToInsert.push({
//                     book_id: newBook.id,
//                     format: 'paperback',
//                     price: parseFloat(paperbackPrice) || 0,
//                     pages: parseInt(paperbackPages) || 0,
//                     stock_quantity: parseInt(paperbackStock) || 0,
//                     is_in_stock: (parseInt(paperbackStock) || 0) > 0,
//                 });
//             }
//             // --- End of Dynamic Build ---

//             const { error: formatError } = await supabase.from('book_formats').insert(formatsToInsert);
//             if (formatError) throw formatError;

//             Alert.alert("Success!", "Book has been added.", [{ text: "OK", onPress: () => router.back() }]);

//         } catch (error: any) {
//             if (uploadStatus.cover.status === 'uploading') setUploadStatus(prev => ({...prev, cover: { ...prev.cover, status: 'error' }}));
//             if (uploadStatus.ebook.status === 'uploading') setUploadStatus(prev => ({...prev, ebook: { ...prev.ebook, status: 'error' }}));
//             if (uploadStatus.sample.status === 'uploading') setUploadStatus(prev => ({...prev, sample: { ...prev.sample, status: 'error' }}));
//             Alert.alert("Submission Failed", error.message);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <View style={styles.container}>
//             <View style={styles.header}>
//                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//                     <ArrowLeft size={24} color={Colors.BLACK} />
//                 </TouchableOpacity>
//                 <Text style={styles.headerTitle}>Add New Book</Text>
//                  <View style={{width: 24}}/>
//             </View>

//             <ScrollView contentContainerStyle={styles.scrollContainer}>
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>Book Details</Text>
//                     <FileUploadField label="Cover Image*" onPick={() => handlePickFile(setCoverImageFile, 'cover', 'image')} fileName={coverImageFile?.fileName || coverImageFile?.uri.split('/').pop() || null} uploadStatus={uploadStatus.cover.status} />
//                     {coverImageFile && <Image source={{uri: coverImageFile.uri}} style={styles.imagePreview} />}
//                     <TextInput style={styles.input} placeholder="Book Title*" value={bookDetails.title} onChangeText={val => handleInputChange('title', val)} placeholderTextColor={Colors.GRAY} />
//                     <TextInput style={styles.input} placeholder="Author*" value={bookDetails.author} onChangeText={val => handleInputChange('author', val)} placeholderTextColor={Colors.GRAY} />
//                     <TextInput style={styles.input} placeholder="Publisher" value={bookDetails.publisher} onChangeText={val => handleInputChange('publisher', val)} placeholderTextColor={Colors.GRAY} />
//                     <TextInput style={styles.textArea} placeholder="Description" value={bookDetails.description} onChangeText={val => handleInputChange('description', val)} multiline placeholderTextColor={Colors.GRAY} />
//                     <TextInput style={styles.input} placeholder="Language" value={bookDetails.language} onChangeText={val => handleInputChange('language', val)} placeholderTextColor={Colors.GRAY} />
//                     <TextInput style={styles.input} placeholder="Year of Publication" value={String(bookDetails.year_of_publication)} onChangeText={val => handleInputChange('year_of_publication', Number(val))} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
//                 </View>

//                 {/* --- MODIFICATION: E-book section is now optional --- */}
//                 <View style={styles.section}>
//                     <View style={styles.switchContainer}>
//                         <Text style={styles.sectionTitle}>Add E-book Format?</Text>
//                         <Switch value={addEbook} onValueChange={setAddEbook} trackColor={{false: '#767577', true: Colors.PRIMARY_LIGHT}} thumbColor={addEbook ? Colors.PRIMARY : '#f4f3f4'}/>
//                     </View>
//                     {addEbook && (
//                         <>
//                             <FileUploadField label="E-book PDF File*" onPick={() => handlePickFile(setEbookFile, 'ebook', 'pdf')} fileName={ebookFile?.name || null} uploadStatus={uploadStatus.ebook.status} />
//                             <FileUploadField label="Sample PDF File (Optional)" onPick={() => handlePickFile(setSampleFile, 'sample', 'pdf')} fileName={sampleFile?.name || null} uploadStatus={uploadStatus.sample.status} />
//                             <TextInput style={styles.input} placeholder="Price (e.g., 450.00)*" value={ebookPrice} onChangeText={setEbookPrice} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
//                             <TextInput style={styles.input} placeholder="Number of Pages*" value={ebookPages} onChangeText={setEbookPages} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
//                         </>
//                     )}
//                 </View>

//                 {/* --- MODIFICATION: Hardcover section is now optional --- */}
//                 <View style={styles.section}>
//                     <View style={styles.switchContainer}>
//                         <Text style={styles.sectionTitle}>Add Hardcover Format?</Text>
//                         <Switch value={addHardcover} onValueChange={setAddHardcover} trackColor={{false: '#767577', true: Colors.PRIMARY_LIGHT}} thumbColor={addHardcover ? Colors.PRIMARY : '#f4f3f4'}/>
//                     </View>
//                     {addHardcover && (
//                         <>
//                             <TextInput style={styles.input} placeholder="Hardcover Price*" value={hardcoverPrice} onChangeText={setHardcoverPrice} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
//                             <TextInput style={styles.input} placeholder="Number of Pages*" value={hardcoverPages} onChangeText={setHardcoverPages} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
//                             <TextInput style={styles.input} placeholder="Stock Quantity*" value={hardcoverStock} onChangeText={setHardcoverStock} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
//                         </>
//                     )}
//                 </View>
                
//                 {/* --- NEW: Paperback section --- */}
//                 <View style={styles.section}>
//                     <View style={styles.switchContainer}>
//                         <Text style={styles.sectionTitle}>Add Paperback Format?</Text>
//                         <Switch value={addPaperback} onValueChange={setAddPaperback} trackColor={{false: '#767577', true: Colors.PRIMARY_LIGHT}} thumbColor={addPaperback ? Colors.PRIMARY : '#f4f3f4'}/>
//                     </View>
//                     {addPaperback && (
//                         <>
//                             <TextInput style={styles.input} placeholder="Paperback Price*" value={paperbackPrice} onChangeText={setPaperbackPrice} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
//                             <TextInput style={styles.input} placeholder="Number of Pages*" value={paperbackPages} onChangeText={setPaperbackPages} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
//                             <TextInput style={styles.input} placeholder="Stock Quantity*" value={paperbackStock} onChangeText={setPaperbackStock} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
//                         </>
//                     )}
//                 </View>

//                 <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
//                     {isSubmitting ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.submitButtonText}>Save Book</Text>}
//                 </TouchableOpacity>
//             </ScrollView>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#f8f9fa'
//     },
//     header: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 16,
//         backgroundColor: Colors.WHITE,
//         borderBottomWidth: 1,
//         borderBottomColor: '#eee'
//     },
//     backButton: {
//         padding: 4
//     },
//     headerTitle: {
//         flex: 1,
//         textAlign: 'center',
//         fontSize: 20,
//         fontWeight: '600'
//     },
//     scrollContainer: {
//         padding: 16
//     },
//     section: {
//         backgroundColor: Colors.WHITE,
//         borderRadius: 8,
//         padding: 20,
//         marginBottom: 20
//     },
//     sectionTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginBottom: 16
//     },
//     inputGroup: {
//         marginBottom: 12
//     },
//     label: {
//         fontSize: 15,
//         color: Colors.GRAY,
//         marginBottom: 6,
//         fontWeight: '500'
//     },
//     input: {
//         backgroundColor: '#f8f9fa',
//         borderWidth: 1,
//         borderColor: '#e0e0e0',
//         borderRadius: 8,
//         padding: 14,
//         fontSize: 16,
//         marginBottom: 10
//     },
//     textArea: {
//         minHeight: 100,
//         textAlignVertical: 'top',
//         backgroundColor: '#f8f9fa',
//         borderWidth: 1,
//         borderColor: '#e0e0e0',
//         borderRadius: 8,
//         padding: 14,
//         fontSize: 16,
//         marginBottom: 10
//     },
//     filePickerButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#e7f3ff',
//         padding: 14,
//         borderRadius: 8,
//         borderWidth: 1,
//         borderColor: Colors.PRIMARY,
//         borderStyle: 'dashed'
//     },
//     filePickerError: {
//         borderColor: Colors.ERROR,
//         backgroundColor: '#fff2f2'
//     },
//     filePickerText: {
//         marginLeft: 10,
//         color: Colors.PRIMARY,
//         flexShrink: 1,
//         fontSize: 15
//     },
//     imagePreview: {
//         width: 100,
//         height: 133,
//         borderRadius: 8,
//         marginTop: 10,
//         alignSelf: 'center',
//         borderWidth: 1,
//         borderColor: '#ddd'
//     },
//     switchContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center'
//     },
//     submitButton: {
//         backgroundColor: Colors.PRIMARY,
//         padding: 15,
//         borderRadius: 8,
//         alignItems: 'center'
//     },
//     submitButtonText: {
//         color: Colors.WHITE,
//         fontSize: 16,
//         fontWeight: 'bold'
//     },
//     disabledButton: {
//         backgroundColor: Colors.GRAY
//     },
// });

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { Book as BookType, BookFormat } from '../../../types/books';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { ArrowLeft, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { ShowForBookCreation } from '../../../component/RoleBasedUI';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';
interface FileUploadStatus {
    status: UploadState;
    path: string | null;
    url: string | null;
    error?: string;
}

interface FileUploadFieldProps {
    label: string;
    onPick: () => void;
    fileName: string | null;
    uploadStatus: UploadState;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({ label, onPick, fileName, uploadStatus }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
            style={[styles.filePickerButton, uploadStatus === 'error' && styles.filePickerError]}
            onPress={onPick}
            disabled={uploadStatus === 'uploading'}
        >
            <UploadCloud size={20} color={uploadStatus === 'error' ? Colors.ERROR : Colors.PRIMARY} />
            <Text style={[styles.filePickerText, uploadStatus === 'error' && { color: Colors.ERROR }]} numberOfLines={1}>
                {fileName || 'Select File'}
            </Text>
            {uploadStatus === 'uploading' && <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginLeft: 10 }} />}
            {uploadStatus === 'success' && <CheckCircle size={20} color={Colors.SUCCESS} style={{ marginLeft: 10 }} />}
            {uploadStatus === 'error' && <AlertCircle size={20} color={Colors.ERROR} style={{ marginLeft: 10 }} />}
        </TouchableOpacity>
    </View>
);

const AddBookContent = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [bookDetails, setBookDetails] = useState<Partial<BookType>>({
        title: '', author: '', publisher: '', description: '', language: 'English',
        year_of_publication: new Date().getFullYear(),
    });

    const [coverImageFile, setCoverImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [ebookFile, setEbookFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [sampleFile, setSampleFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    const [uploadStatus, setUploadStatus] = useState({
        cover: { status: 'idle' } as FileUploadStatus,
        ebook: { status: 'idle' } as FileUploadStatus,
        sample: { status: 'idle' } as FileUploadStatus,
    });

    const [addEbook, setAddEbook] = useState(true);
    const [addHardcover, setAddHardcover] = useState(false);
    const [addPaperback, setAddPaperback] = useState(false); // This was missing

    const [ebookPrice, setEbookPrice] = useState('');
    const [ebookPages, setEbookPages] = useState('');
    
    const [hardcoverPrice, setHardcoverPrice] = useState('');
    const [hardcoverPages, setHardcoverPages] = useState('');
    const [hardcoverStock, setHardcoverStock] = useState('');

    // --- THIS IS THE FIX: Added the missing state variables ---
    const [paperbackPrice, setPaperbackPrice] = useState('');
    const [paperbackPages, setPaperbackPages] = useState('');
    const [paperbackStock, setPaperbackStock] = useState('');
    // --- END OF FIX ---

    const handleInputChange = (field: keyof typeof bookDetails, value: string | number) => {
        setBookDetails(prev => ({ ...prev, [field]: value }));
    };

    const handlePickFile = async (
        setFile: (file: any) => void,
        fileType: 'cover' | 'ebook' | 'sample',
        pickerType: 'pdf' | 'image'
    ) => {
        try {
            setUploadStatus(prev => ({ ...prev, [fileType]: { status: 'idle', path: null, url: null }}));

            if (pickerType === 'image') {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.7
                });
                if (!result.canceled) setFile(result.assets[0]);
            } else {
                const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
                if (!result.canceled) setFile(result.assets[0]);
            }
        } catch (error) {
            Alert.alert("Error", "Could not select file.");
        }
    };

    const uploadFile = async (
        fileAsset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset,
        bucket: string,
        userId: string
    ): Promise<{ path: string; url: string }> => {
        const fileExt = fileAsset.uri.split('.').pop()?.toLowerCase() ?? 'file';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const base64 = await FileSystem.readAsStringAsync(fileAsset.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, decode(base64), { contentType: fileAsset.mimeType });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (!urlData.publicUrl) throw new Error(`Could not get public URL for ${filePath}`);

        return { path: filePath, url: urlData.publicUrl };
    };

    const handleSubmit = async () => {
        if (!bookDetails.title) { Alert.alert("Missing Information", "Please provide a book title."); return; }
        if (!coverImageFile) { Alert.alert("Missing Information", "Please select a cover image."); return; }

        if (!addEbook && !addHardcover && !addPaperback) {
            Alert.alert("No Format Selected", "Please add at least one format (E-book, Hardcover, or Paperback).");
            return;
        }
        if (addEbook && (!ebookFile || !ebookPrice || !ebookPages)) {
            Alert.alert("E-book Error", "Please provide the PDF, price, and pages for the e-book format.");
            return;
        }
        if (addHardcover && (!hardcoverPrice || !hardcoverPages || !hardcoverStock)) {
            Alert.alert("Hardcover Error", "Please provide the price, pages, and stock for the hardcover format.");
            return;
        }
        if (addPaperback && (!paperbackPrice || !paperbackPages || !paperbackStock)) {
            Alert.alert("Paperback Error", "Please provide the price, pages, and stock for the paperback format.");
            return;
        }

        setIsSubmitting(true);
        let uploadedPaths: { coverUrl?: string; ebookPath?: string; samplePath?: string } = {};

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.user) {
                throw new Error("You must be logged in to add a book.");
            }
            const userId = session.user.id;

            setUploadStatus(prev => ({ ...prev, cover: { ...prev.cover, status: 'uploading' }}));
            const { url: coverUrl } = await uploadFile(coverImageFile, 'book-covers', userId);
            uploadedPaths.coverUrl = coverUrl;
            setUploadStatus(prev => ({ ...prev, cover: { ...prev.cover, status: 'success', url: coverUrl }}));

            if (addEbook && ebookFile) {
                setUploadStatus(prev => ({ ...prev, ebook: { ...prev.ebook, status: 'uploading' }}));
                const { path: ebookPath } = await uploadFile(ebookFile, 'ebook-files', userId);
                uploadedPaths.ebookPath = ebookPath;
                setUploadStatus(prev => ({ ...prev, ebook: { ...prev.ebook, status: 'success', path: ebookPath }}));
            }
            if (addEbook && sampleFile) {
                setUploadStatus(prev => ({ ...prev, sample: { ...prev.sample, status: 'uploading' }}));
                const { path: samplePath } = await uploadFile(sampleFile, 'ebook-files', userId);
                uploadedPaths.samplePath = samplePath;
                setUploadStatus(prev => ({ ...prev, sample: { ...prev.sample, status: 'success', path: samplePath }}));
            }

            const { data: newBook, error: bookError } = await supabase
                .from('books')
                .insert({
                    ...bookDetails,
                    cover_image_url: uploadedPaths.coverUrl,
                    user_id: userId
                })
                .select()
                .single();

            if (bookError) throw bookError;

            const formatsToInsert: Partial<BookFormat>[] = [];

            if (addEbook) {
                formatsToInsert.push({
                    book_id: newBook.id,
                    format: 'ebook',
                    price: parseFloat(ebookPrice) || 0,
                    pages: parseInt(ebookPages) || 0,
                    is_in_stock: true,
                    ebook_file_url: uploadedPaths.ebookPath,
                    sample_file_url: uploadedPaths.samplePath || null,
                });
            }
            if (addHardcover) {
                formatsToInsert.push({
                    book_id: newBook.id,
                    format: 'hardcover',
                    price: parseFloat(hardcoverPrice) || 0,
                    pages: parseInt(hardcoverPages) || 0,
                    stock_quantity: parseInt(hardcoverStock) || 0,
                    is_in_stock: (parseInt(hardcoverStock) || 0) > 0,
                });
            }
            if (addPaperback) {
                formatsToInsert.push({
                    book_id: newBook.id,
                    format: 'paperback',
                    price: parseFloat(paperbackPrice) || 0,
                    pages: parseInt(paperbackPages) || 0,
                    stock_quantity: parseInt(paperbackStock) || 0,
                    is_in_stock: (parseInt(paperbackStock) || 0) > 0,
                });
            }

            const { error: formatError } = await supabase.from('book_formats').insert(formatsToInsert);
            if (formatError) throw formatError;

            Alert.alert("Success!", "Book has been added.", [{ text: "OK", onPress: () => router.back() }]);

        } catch (error: any) {
            if (uploadStatus.cover.status === 'uploading') setUploadStatus(prev => ({...prev, cover: { ...prev.cover, status: 'error' }}));
            if (uploadStatus.ebook.status === 'uploading') setUploadStatus(prev => ({...prev, ebook: { ...prev.ebook, status: 'error' }}));
            if (uploadStatus.sample.status === 'uploading') setUploadStatus(prev => ({...prev, sample: { ...prev.sample, status: 'error' }}));
            Alert.alert("Submission Failed", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Book</Text>
                 <View style={{width: 24}}/>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Book Details</Text>
                    <FileUploadField label="Cover Image*" onPick={() => handlePickFile(setCoverImageFile, 'cover', 'image')} fileName={coverImageFile?.fileName || coverImageFile?.uri.split('/').pop() || null} uploadStatus={uploadStatus.cover.status} />
                    {coverImageFile && <Image source={{uri: coverImageFile.uri}} style={styles.imagePreview} />}
                    <TextInput style={styles.input} placeholder="Book Title*" value={bookDetails.title} onChangeText={val => handleInputChange('title', val)} placeholderTextColor={Colors.GRAY} />
                    <TextInput style={styles.input} placeholder="Author*" value={bookDetails.author} onChangeText={val => handleInputChange('author', val)} placeholderTextColor={Colors.GRAY} />
                    <TextInput style={styles.input} placeholder="Publisher" value={bookDetails.publisher} onChangeText={val => handleInputChange('publisher', val)} placeholderTextColor={Colors.GRAY} />
                    <TextInput style={styles.textArea} placeholder="Description" value={bookDetails.description} onChangeText={val => handleInputChange('description', val)} multiline placeholderTextColor={Colors.GRAY} />
                    <TextInput style={styles.input} placeholder="Language" value={bookDetails.language} onChangeText={val => handleInputChange('language', val)} placeholderTextColor={Colors.GRAY} />
                    <TextInput style={styles.input} placeholder="Year of Publication" value={String(bookDetails.year_of_publication)} onChangeText={val => handleInputChange('year_of_publication', Number(val))} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
                </View>

                <View style={styles.section}>
                    <View style={styles.switchContainer}>
                        <Text style={styles.sectionTitle}>Add E-book Format?</Text>
                        <Switch value={addEbook} onValueChange={setAddEbook} trackColor={{false: '#767577', true: Colors.PRIMARY_LIGHT}} thumbColor={addEbook ? Colors.PRIMARY : '#f4f3f4'}/>
                    </View>
                    {addEbook && (
                        <>
                            <FileUploadField label="E-book PDF File*" onPick={() => handlePickFile(setEbookFile, 'ebook', 'pdf')} fileName={ebookFile?.name || null} uploadStatus={uploadStatus.ebook.status} />
                            <FileUploadField label="Sample PDF File (Optional)" onPick={() => handlePickFile(setSampleFile, 'sample', 'pdf')} fileName={sampleFile?.name || null} uploadStatus={uploadStatus.sample.status} />
                            <TextInput style={styles.input} placeholder="Price (e.g., 450.00)*" value={ebookPrice} onChangeText={setEbookPrice} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
                            <TextInput style={styles.input} placeholder="Number of Pages*" value={ebookPages} onChangeText={setEbookPages} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
                        </>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.switchContainer}>
                        <Text style={styles.sectionTitle}>Add Hardcover Format?</Text>
                        <Switch value={addHardcover} onValueChange={setAddHardcover} trackColor={{false: '#767577', true: Colors.PRIMARY_LIGHT}} thumbColor={addHardcover ? Colors.PRIMARY : '#f4f3f4'}/>
                    </View>
                    {addHardcover && (
                        <>
                            <TextInput style={styles.input} placeholder="Hardcover Price*" value={hardcoverPrice} onChangeText={setHardcoverPrice} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
                            <TextInput style={styles.input} placeholder="Number of Pages*" value={hardcoverPages} onChangeText={setHardcoverPages} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
                            <TextInput style={styles.input} placeholder="Stock Quantity*" value={hardcoverStock} onChangeText={setHardcoverStock} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
                        </>
                    )}
                </View>
                
                <View style={styles.section}>
                    <View style={styles.switchContainer}>
                        <Text style={styles.sectionTitle}>Add Paperback Format?</Text>
                        <Switch value={addPaperback} onValueChange={setAddPaperback} trackColor={{false: '#767577', true: Colors.PRIMARY_LIGHT}} thumbColor={addPaperback ? Colors.PRIMARY : '#f4f3f4'}/>
                    </View>
                    {addPaperback && (
                        <>
                            <TextInput style={styles.input} placeholder="Paperback Price*" value={paperbackPrice} onChangeText={setPaperbackPrice} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
                            <TextInput style={styles.input} placeholder="Number of Pages*" value={paperbackPages} onChangeText={setPaperbackPages} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
                            <TextInput style={styles.input} placeholder="Stock Quantity*" value={paperbackStock} onChangeText={setPaperbackStock} keyboardType="number-pad" placeholderTextColor={Colors.GRAY} />
                        </>
                    )}
                </View>

                <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.submitButtonText}>Save Book</Text>}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    backButton: {
        padding: 4
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '600'
    },
    scrollContainer: {
        padding: 16
    },
    section: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 20,
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16
    },
    inputGroup: {
        marginBottom: 12
    },
    label: {
        fontSize: 15,
        color: Colors.GRAY,
        marginBottom: 6,
        fontWeight: '500'
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        marginBottom: 10
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        marginBottom: 10
    },
    filePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e7f3ff',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        borderStyle: 'dashed'
    },
    filePickerError: {
        borderColor: Colors.ERROR,
        backgroundColor: '#fff2f2'
    },
    filePickerText: {
        marginLeft: 10,
        color: Colors.PRIMARY,
        flexShrink: 1,
        fontSize: 15
    },
    imagePreview: {
        width: 100,
        height: 133,
        borderRadius: 8,
        marginTop: 10,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    submitButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    submitButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold'
    },
    disabledButton: {
        backgroundColor: Colors.GRAY
    },
});

export default function AddBookScreen() {
    return (
        <ShowForBookCreation
            fallback={
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={Colors.BLACK} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Access Denied</Text>
                        <View style={{width: 24}}/>
                    </View>
                    <View style={[styles.section, { margin: 16 }]}>
                        <Text style={[styles.sectionTitle, { color: Colors.ERROR }]}>⛔ Access Denied</Text>
                        <Text style={styles.label}>Only administrators can add books.</Text>
                        <TouchableOpacity 
                            style={styles.submitButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.submitButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            }
        >
            <AddBookContent />
        </ShowForBookCreation>
    );
}