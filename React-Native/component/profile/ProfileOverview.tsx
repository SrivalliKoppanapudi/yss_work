// // // app/(screens)/ProfileOverview.tsx
// // import React, { useState, useEffect, useCallback } from 'react';
// // import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
// // import { useRouter } from 'expo-router';
// // import { supabase } from '../../lib/Superbase';
// // import { useAuth } from '../../Context/auth';
// // import Colors from '../../constant/Colors';
// // import { Edit, Briefcase, GraduationCap, UploadCloud, PlusCircle, Award, MessageSquare, ChevronRight, UserPlus, CheckCircle } from 'lucide-react-native';
// // import * as DocumentPicker from 'expo-document-picker';
// // import * as FileSystem from 'expo-file-system';
// // import { decode } from 'base64-arraybuffer';

// // // Reusable Section Component
// // const ProfileSection = ({ title, children, onAdd, onEdit, hasContent = true }: { title: string, children: React.ReactNode, onAdd?: () => void, onEdit?: () => void, hasContent?: boolean }) => (
// //     <View style={styles.section}>
// //         <View style={styles.sectionHeader}>
// //             <Text style={styles.sectionTitle}>{title}</Text>
// //             {onAdd && !hasContent ? (
// //                 <TouchableOpacity onPress={onAdd} style={styles.addButton}>
// //                     <PlusCircle size={22} color={Colors.PRIMARY} />
// //                 </TouchableOpacity>
// //             ) : onEdit && hasContent ? (
// //                 <TouchableOpacity onPress={onEdit} style={styles.editButton}>
// //                     <Edit size={18} color={Colors.GRAY} />
// //                 </TouchableOpacity>
// //             ) : null}
// //         </View>
// //         <View style={styles.sectionContent}>
// //             {hasContent ? children : <Text style={styles.emptySectionText}>No information provided yet.</Text>}
// //         </View>
// //     </View>
// // );

// // // Mock Data Component for Mutual Connections
// // const MockMutualConnections = () => {
// //     // ... (This component remains the same)
// //     const mockConnections = [ { id: '1', name: 'Jonnesh William', workExperience: 'Lead Educator', profilePicture: 'https://i.pravatar.cc/150?u=jonnesh' }, { id: '2', name: 'Jannet William', workExperience: 'Curriculum Developer', profilePicture: 'https://i.pravatar.cc/150?u=jannet' }];
// //     return (
// //         <>
// //             {mockConnections.map(conn => (
// //                  <View key={conn.id} style={styles.listItem}><Image source={{ uri: conn.profilePicture }} style={styles.avatarIcon} /><View style={styles.listTextContainer}><Text style={styles.listTitle}>{conn.name}</Text><Text style={styles.listSubtitle}>{conn.workExperience}</Text></View><TouchableOpacity style={styles.connectButton}><UserPlus size={18} color={Colors.PRIMARY} /></TouchableOpacity></View>
// //             ))}
// //         </>
// //     );
// // }

// // const ProfileOverview = () => {
// //     const router = useRouter();
// //     const { session, isLoading: authIsLoading } = useAuth();
// //     const [profile, setProfile] = useState<any>(null);
// //     const [loading, setLoading] = useState(true);
// //     const [isParsing, setIsParsing] = useState(false);

// //     const fetchProfileData = useCallback(async () => {
// //         // ... (fetchProfileData function remains the same)
// //         if (!session?.user) return;
// //         setLoading(true);
// //         try {
// //             const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
// //             if (error) throw error;
// //             setProfile(data);
// //         } catch (err: any) { console.error("Profile Overview fetch error:", err); } finally { setLoading(false); }
// //     }, [session]);

// //     useEffect(() => { if (!authIsLoading) fetchProfileData(); }, [authIsLoading, fetchProfileData]);

// //     const handleImportResume = async () => {
// //         // ... (handleImportResume function remains the same)
// //         if (!session?.user) return;
// //         const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true });
// //         if (result.canceled || !result.assets) return;
// //         const file = result.assets[0];
// //         setIsParsing(true);
// //         try {
// //             const filePath = `${session.user.id}/${Date.now()}_${file.name}`;
// //             const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
// //             await supabase.storage.from('resumes').upload(filePath, decode(base64), { contentType: file.mimeType });
// //             const { data: parsedData, error: functionError } = await supabase.functions.invoke('resume-parser', { body: { filePath } });
// //             if (functionError) throw functionError;
// //             const updatePayload = { experience_json: parsedData.experience_json || [], education_json: parsedData.education_json || [] };
// //             await supabase.from('profiles').update(updatePayload).eq('id', session.user.id);
// //             Alert.alert("Success", "Your profile has been updated from your resume!");
// //             fetchProfileData();
// //         } catch (error: any) {
// //             Alert.alert("Import Failed", error.message || "An unknown error occurred.");
// //         } finally {
// //             setIsParsing(false);
// //         }
// //     };
    
// //     if (loading || authIsLoading) {
// //         return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
// //     }

// //     if (!profile) {
// //         return <View style={styles.centered}><Text>Could not load profile overview.</Text></View>;
// //     }
    
// //     const hasExperience = Array.isArray(profile.experience_json) && profile.experience_json.length > 0;
// //     const hasEducation = Array.isArray(profile.education_json) && profile.education_json.length > 0;
// //     const mockBadges = [{ id: '1', title: 'Curriculum Designer', description: "Created 25+ highly-rated educational resources" }];
// //     const mockRecentActivities = [{ type: 'comment', content: 'Thanks for sharing Sarah, I will see this for future', target: 'Sarah\'s Post' }];
    
// //     return (
// //         <View style={styles.container}>
// //             <ProfileSection
// //                 title="Experience"
// //                 onAdd={() => router.push({ pathname: '/(screens)/profile/AddExperienceScreen', params: { profile: JSON.stringify(profile) } })}
// //                 hasContent={hasExperience}
// //             >
// //                 {profile.experience_json?.map((exp: any, index: number) => (
// //                     <TouchableOpacity 
// //                         key={index}
// //                         style={styles.listItem}
// //                         onPress={() => router.push({ pathname: '/(screens)/profile/AddExperienceScreen', params: { profile: JSON.stringify(profile), index: index.toString() } })}
// //                     >
// //                         <Briefcase size={40} color={Colors.PRIMARY} style={styles.listIcon} />
// //                         <View style={styles.listTextContainer}><Text style={styles.listTitle}>{exp.role || 'Position'}</Text><Text style={styles.listSubtitle}>{exp.institution || 'Organization'}</Text></View>
// //                         <Edit size={18} color={Colors.GRAY} />
// //                     </TouchableOpacity>
// //                 ))}
// //             </ProfileSection>

// //             <ProfileSection
// //                 title="Education"
// //                 onAdd={() => router.push({ pathname: '/(screens)/profile/AddEducationScreen', params: { profile: JSON.stringify(profile) } })}
// //                 hasContent={hasEducation}
// //             >
// //                 {profile.education_json?.map((edu: any, index: number) => (
// //                     <TouchableOpacity 
// //                         key={index} 
// //                         style={styles.listItem}
// //                         onPress={() => router.push({ pathname: '/(screens)/profile/AddEducationScreen', params: { profile: JSON.stringify(profile), index: index.toString() } })}
// //                     >
// //                         <GraduationCap size={40} color={Colors.PRIMARY} style={styles.listIcon} />
// //                         <View style={styles.listTextContainer}><Text style={styles.listTitle}>{edu.degree || 'Degree'}</Text><Text style={styles.listSubtitle}>{edu.institution || 'Institution'}</Text></View>
// //                          <Edit size={18} color={Colors.GRAY} />
// //                     </TouchableOpacity>
// //                 ))}
// //             </ProfileSection>

// //             {/* --- MOVED AND RESTYLED RESUME SECTION --- */}
// //             <View style={styles.section}>
// //                 <Text style={styles.sectionTitle}>Resume</Text>
// //                 <TouchableOpacity style={styles.importButton} onPress={handleImportResume} disabled={isParsing}>
// //                     {isParsing ? <ActivityIndicator color={Colors.PRIMARY} /> : <><UploadCloud size={20} color={Colors.PRIMARY} /><Text style={styles.importButtonText}>{profile.resume_url ? 'Replace Resume' : 'Import from Resume'}</Text></>}
// //                 </TouchableOpacity>
                
// //                 {profile.resume_url ? (
// //                     <View style={styles.fileUploadedContainer}>
// //                         <CheckCircle size={16} color={Colors.SUCCESS} />
// //                         <Text style={styles.fileUploadedText}>A resume is on file.</Text>
// //                     </View>
// //                 ) : (
// //                     <Text style={styles.importSubtext}>Automatically fill your Resume while applying job.</Text>
// //                 )}
// //             </View>

// //             <ProfileSection title="Badges and Certifications" onEdit={() => Alert.alert("Edit Badges")} hasContent={mockBadges.length > 0}>
// //                  {mockBadges.map(badge => (
// //                     <TouchableOpacity key={badge.id} style={styles.listItem}>
// //                         <Award size={40} color={Colors.PRIMARY} style={styles.listIcon} />
// //                         <View style={styles.listTextContainer}><Text style={styles.listTitle}>{badge.title}</Text><Text style={styles.listSubtitle}>{badge.description}</Text></View>
// //                         <ChevronRight size={20} color={Colors.GRAY} />
// //                     </TouchableOpacity>
// //                 ))}
// //             </ProfileSection>

// //             <ProfileSection title="Recent Activities" onEdit={() => Alert.alert("Edit Activities")} hasContent={mockRecentActivities.length > 0}>
// //                 {mockRecentActivities.map((activity, index) => (
// //                     <TouchableOpacity key={index} style={styles.listItem}><MessageSquare size={24} color={Colors.PRIMARY} style={styles.listIconActivity} /><View style={styles.listTextContainer}><Text style={styles.listTitle}>{activity.content}</Text><Text style={styles.listSubtitle}>{activity.target}</Text></View><ChevronRight size={20} color={Colors.GRAY} /></TouchableOpacity>
// //                 ))}
// //             </ProfileSection>

// //             <ProfileSection title="Mutual Connections" onEdit={() => Alert.alert("View All Mutuals")}>
// //                 <MockMutualConnections />
// //             </ProfileSection>
// //         </View>
// //     );
// // };

// // const styles = StyleSheet.create({
// //     container: { backgroundColor: '#F7F7F7', paddingBottom: 20 },
// //     centered: { minHeight: 300, justifyContent: 'center', alignItems: 'center' },
// //     section: { backgroundColor: 'white', marginHorizontal: 16, marginTop: 12, borderRadius: 8, padding: 16 },
// //     sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
// //     sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.BLACK,marginBottom:12,marginTop:12 },
// //     editButton: { padding: 4 },
// //     addButton: { padding: 4 },
// //     sectionContent: {},
// //     listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
// //     listIcon: { marginRight: 16 },
// //     listIconActivity: { marginRight: 16, alignSelf: 'flex-start', marginTop: 4 },
// //     avatarIcon: { width: 48, height: 48, borderRadius: 24, marginRight: 16, backgroundColor: '#e0e0e0' },
// //     badgeIconPlaceholder: { width: 48, height: 48, borderRadius: 24, marginRight: 16, backgroundColor: '#e0e0e0' },
// //     listTextContainer: { flex: 1 },
// //     listTitle: { fontSize: 16, fontWeight: '500', color: Colors.BLACK },
// //     listSubtitle: { fontSize: 14, color: Colors.GRAY, marginTop: 2, lineHeight: 20 },
// //     emptySectionText: { textAlign: 'center', color: Colors.GRAY, paddingVertical: 20, fontStyle: 'italic' },
// //     connectButton: { padding: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.PRIMARY },

// //     // --- UPDATED AND MOVED STYLES ---
// //     importButton: {
// //         flexDirection: 'row',
// //         alignItems: 'center',
// //         justifyContent: 'center',
// //         backgroundColor: Colors.PRIMARY_LIGHT,
// //         paddingVertical: 12,
// //         paddingHorizontal: 20,
// //         borderRadius: 8,
// //         borderWidth: 1,
// //         borderColor: Colors.PRIMARY,
// //     },
// //     importButtonText: {
// //         marginLeft: 10,
// //         fontSize: 16,
// //         fontWeight: '600',
// //         color: Colors.PRIMARY,
// //     },
// //     importSubtext: {
// //         marginTop: 8,
// //         fontSize: 12,
// //         color: Colors.GRAY,
// //         textAlign: 'center',
// //     },
// //     fileUploadedContainer: {
// //         flexDirection: 'row',
// //         alignItems: 'center',
// //         justifyContent: 'center',
// //         marginTop: 8,
// //         paddingHorizontal: 12,
// //         paddingVertical: 6,
// //         backgroundColor: '#e6fffa',
// //         borderRadius: 20,
// //         alignSelf: 'center',
// //     },
// //     fileUploadedText: {
// //         marginLeft: 6,
// //         fontSize: 12,
// //         color: Colors.SUCCESS,
// //         fontWeight: '500',
// //     },
// // });

// // export default ProfileOverview;
// // file: component/profile/ProfileOverview.tsx
// // app/(screens)/ProfileOverview.tsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
// import { useRouter } from 'expo-router';
// import { supabase } from '../../lib/Superbase';
// import { useAuth } from '../../Context/auth';
// import Colors from '../../constant/Colors';
// import { Edit, Briefcase, GraduationCap, UploadCloud, PlusCircle, Award, MessageSquare, ChevronRight, UserPlus, CheckCircle } from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
// import * as FileSystem from 'expo-file-system';
// import { decode } from 'base64-arraybuffer';

// // Reusable Section Component
// const ProfileSection = ({ title, children, onAdd, onEdit, hasContent = true }: { title: string, children: React.ReactNode, onAdd?: () => void, onEdit?: () => void, hasContent?: boolean }) => (
//     <View style={styles.section}>
//         <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>{title}</Text>
//             {onAdd && !hasContent ? (
//                 <TouchableOpacity onPress={onAdd} style={styles.addButton}>
//                     <PlusCircle size={22} color={Colors.PRIMARY} />
//                 </TouchableOpacity>
//             ) : onEdit && hasContent ? (
//                 <TouchableOpacity onPress={onEdit} style={styles.editButton}>
//                     <Edit size={18} color={Colors.GRAY} />
//                 </TouchableOpacity>
//             ) : null}
//         </View>
//         <View style={styles.sectionContent}>
//             {hasContent ? children : <Text style={styles.emptySectionText}>No information provided yet.</Text>}
//         </View>
//     </View>
// );

// // Mock Data Component for Mutual Connections
// const MockMutualConnections = () => {
//     // ... (This component remains the same)
//     const mockConnections = [ { id: '1', name: 'Jonnesh William', workExperience: 'Lead Educator', profilePicture: 'https://i.pravatar.cc/150?u=jonnesh' }, { id: '2', name: 'Jannet William', workExperience: 'Curriculum Developer', profilePicture: 'https://i.pravatar.cc/150?u=jannet' }];
//     return (
//         <>
//             {mockConnections.map(conn => (
//                  <View key={conn.id} style={styles.listItem}><Image source={{ uri: conn.profilePicture }} style={styles.avatarIcon} /><View style={styles.listTextContainer}><Text style={styles.listTitle}>{conn.name}</Text><Text style={styles.listSubtitle}>{conn.workExperience}</Text></View><TouchableOpacity style={styles.connectButton}><UserPlus size={18} color={Colors.PRIMARY} /></TouchableOpacity></View>
//             ))}
//         </>
//     );
// }

// const ProfileOverview = () => {
//     const router = useRouter();
//     const { session, isLoading: authIsLoading } = useAuth();
//     const [profile, setProfile] = useState<any>(null);
//     const [loading, setLoading] = useState(true);
//     const [isParsing, setIsParsing] = useState(false);

//     const fetchProfileData = useCallback(async () => {
//         // ... (fetchProfileData function remains the same)
//         if (!session?.user) return;
//         setLoading(true);
//         try {
//             const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
//             if (error) throw error;
//             setProfile(data);
//         } catch (err: any) { console.error("Profile Overview fetch error:", err); } finally { setLoading(false); }
//     }, [session]);

//     useEffect(() => { if (!authIsLoading) fetchProfileData(); }, [authIsLoading, fetchProfileData]);

//     const handleImportResume = async () => {
//         // ... (handleImportResume function remains the same)
//         if (!session?.user) return;
//         const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true });
//         if (result.canceled || !result.assets) return;
//         const file = result.assets[0];
//         setIsParsing(true);
//         try {
//             const filePath = `${session.user.id}/${Date.now()}_${file.name}`;
//             const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
//             await supabase.storage.from('resumes').upload(filePath, decode(base64), { contentType: file.mimeType });
//             const { data: parsedData, error: functionError } = await supabase.functions.invoke('resume-parser', { body: { filePath } });
//             if (functionError) throw functionError;
//             const updatePayload = { experience_json: parsedData.experience_json || [], education_json: parsedData.education_json || [] };
//             await supabase.from('profiles').update(updatePayload).eq('id', session.user.id);
//             Alert.alert("Success", "Your profile has been updated from your resume!");
//             fetchProfileData();
//         } catch (error: any) {
//             Alert.alert("Import Failed", error.message || "An unknown error occurred.");
//         } finally {
//             setIsParsing(false);
//         }
//     };
    
//     if (loading || authIsLoading) {
//         return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
//     }

//     if (!profile) {
//         return <View style={styles.centered}><Text>Could not load profile overview.</Text></View>;
//     }
    
//     const hasExperience = Array.isArray(profile.experience_json) && profile.experience_json.length > 0;
//     const hasEducation = Array.isArray(profile.education_json) && profile.education_json.length > 0;
//     const mockBadges = [{ id: '1', title: 'Curriculum Designer', description: "Created 25+ highly-rated educational resources" }];
//     const mockRecentActivities = [{ type: 'comment', content: 'Thanks for sharing Sarah, I will see this for future', target: 'Sarah\'s Post' }];
    
//     return (
//         <View style={styles.container}>
//             <ProfileSection
//                 title="Experience"
//                 onAdd={() => router.push({ pathname: '/profile/AddExperienceScreen', params: { profile: JSON.stringify(profile) } })}
//                 onEdit={() => router.push({ pathname: '/profile/AddExperienceScreen', params: { profile: JSON.stringify(profile) } })}
//                 hasContent={hasExperience}
//             >
//                 {profile.experience_json?.map((exp: any, index: number) => (
//                     <TouchableOpacity 
//                         key={index}
//                         style={styles.listItem}
//                         onPress={() => router.push({ pathname: '/profile/AddExperienceScreen', params: { profile: JSON.stringify(profile) } })}
//                     >
//                         <Briefcase size={40} color={Colors.PRIMARY} style={styles.listIcon} />
//                         <View style={styles.listTextContainer}><Text style={styles.listTitle}>{exp.role || 'Position'}</Text><Text style={styles.listSubtitle}>{exp.institution || 'Organization'}</Text></View>
//                     </TouchableOpacity>
//                 ))}
//             </ProfileSection>

//             <ProfileSection
//                 title="Education"
//                 onAdd={() => router.push({ pathname: '/profile/AddEducationScreen', params: { profile: JSON.stringify(profile) } })}
//                 onEdit={() => router.push({ pathname: '/profile/AddEducationScreen', params: { profile: JSON.stringify(profile) } })}
//                 hasContent={hasEducation}
//             >
//                 {profile.education_json?.map((edu: any, index: number) => (
//                     <TouchableOpacity 
//                         key={index} 
//                         style={styles.listItem}
//                         onPress={() => router.push({ pathname: '/profile/AddEducationScreen', params: { profile: JSON.stringify(profile) } })}
//                     >
//                         <GraduationCap size={40} color={Colors.PRIMARY} style={styles.listIcon} />
//                         <View style={styles.listTextContainer}><Text style={styles.listTitle}>{edu.degree || 'Degree'}</Text><Text style={styles.listSubtitle}>{edu.institution || 'Institution'}</Text></View>
//                     </TouchableOpacity>
//                 ))}
//             </ProfileSection>

//             {/* --- MOVED AND RESTYLED RESUME SECTION --- */}
//             <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Resume</Text>
//                 <TouchableOpacity style={styles.importButton} onPress={handleImportResume} disabled={isParsing}>
//                     {isParsing ? <ActivityIndicator color={Colors.PRIMARY} /> : <><UploadCloud size={20} color={Colors.PRIMARY} /><Text style={styles.importButtonText}>{profile.resume_url ? 'Replace Resume' : 'Import from Resume'}</Text></>}
//                 </TouchableOpacity>
                
//                 {profile.resume_url ? (
//                     <View style={styles.fileUploadedContainer}>
//                         <CheckCircle size={16} color={Colors.SUCCESS} />
//                         <Text style={styles.fileUploadedText}>A resume is on file.</Text>
//                     </View>
//                 ) : (
//                     <Text style={styles.importSubtext}>Automatically fill your Resume while applying job.</Text>
//                 )}
//             </View>

//             <ProfileSection title="Badges and Certifications" onEdit={() => Alert.alert("Edit Badges")} hasContent={mockBadges.length > 0}>
//                  {mockBadges.map(badge => (
//                     <TouchableOpacity key={badge.id} style={styles.listItem}>
//                         <Award size={40} color={Colors.PRIMARY} style={styles.listIcon} />
//                         <View style={styles.listTextContainer}><Text style={styles.listTitle}>{badge.title}</Text><Text style={styles.listSubtitle}>{badge.description}</Text></View>
//                         <ChevronRight size={20} color={Colors.GRAY} />
//                     </TouchableOpacity>
//                 ))}
//             </ProfileSection>

//             <ProfileSection title="Recent Activities" onEdit={() => Alert.alert("Edit Activities")} hasContent={mockRecentActivities.length > 0}>
//                 {mockRecentActivities.map((activity, index) => (
//                     <TouchableOpacity key={index} style={styles.listItem}><MessageSquare size={24} color={Colors.PRIMARY} style={styles.listIconActivity} /><View style={styles.listTextContainer}><Text style={styles.listTitle}>{activity.content}</Text><Text style={styles.listSubtitle}>{activity.target}</Text></View><ChevronRight size={20} color={Colors.GRAY} /></TouchableOpacity>
//                 ))}
//             </ProfileSection>

//             <ProfileSection title="Mutual Connections" onEdit={() => Alert.alert("View All Mutuals")}>
//                 <MockMutualConnections />
//             </ProfileSection>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: { backgroundColor: '#F7F7F7', paddingBottom: 20 },
//     centered: { minHeight: 300, justifyContent: 'center', alignItems: 'center' },
//     section: { backgroundColor: 'white', marginHorizontal: 16, marginTop: 12, borderRadius: 8, padding: 16 },
//     sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
//     sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.BLACK,marginBottom:12,marginTop:12 },
//     editButton: { padding: 4 },
//     addButton: { padding: 4 },
//     sectionContent: {},
//     listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
//     listIcon: { marginRight: 16 },
//     listIconActivity: { marginRight: 16, alignSelf: 'flex-start', marginTop: 4 },
//     avatarIcon: { width: 48, height: 48, borderRadius: 24, marginRight: 16, backgroundColor: '#e0e0e0' },
//     badgeIconPlaceholder: { width: 48, height: 48, borderRadius: 24, marginRight: 16, backgroundColor: '#e0e0e0' },
//     listTextContainer: { flex: 1 },
//     listTitle: { fontSize: 16, fontWeight: '500', color: Colors.BLACK },
//     listSubtitle: { fontSize: 14, color: Colors.GRAY, marginTop: 2, lineHeight: 20 },
//     emptySectionText: { textAlign: 'center', color: Colors.GRAY, paddingVertical: 20, fontStyle: 'italic' },
//     connectButton: { padding: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.PRIMARY },

//     // --- UPDATED AND MOVED STYLES ---
//     importButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: Colors.PRIMARY_LIGHT,
//         paddingVertical: 12,
//         paddingHorizontal: 20,
//         borderRadius: 8,
//         borderWidth: 1,
//         borderColor: Colors.PRIMARY,
//     },
//     importButtonText: {
//         marginLeft: 10,
//         fontSize: 16,
//         fontWeight: '600',
//         color: Colors.PRIMARY,
//     },
//     importSubtext: {
//         marginTop: 8,
//         fontSize: 12,
//         color: Colors.GRAY,
//         textAlign: 'center',
//     },
//     fileUploadedContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginTop: 8,
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         backgroundColor: '#e6fffa',
//         borderRadius: 20,
//         alignSelf: 'center',
//     },
//     fileUploadedText: {
//         marginLeft: 6,
//         fontSize: 12,
//         color: Colors.SUCCESS,
//         fontWeight: '500',
//     },
// });

// export default ProfileOverview;
// file: component/profile/ProfileOverview.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';
import { Edit, Briefcase, GraduationCap, UploadCloud, PlusCircle, Award, MessageSquare, ChevronRight, UserPlus, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Reusable Section Component
const ProfileSection = ({ title, children, onAdd, onEdit, hasContent = true }: { title: string, children: React.ReactNode, onAdd?: () => void, onEdit?: () => void, hasContent?: boolean }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {onAdd && !hasContent ? (
                <TouchableOpacity onPress={onAdd} style={styles.addButton}>
                    <PlusCircle size={22} color={Colors.PRIMARY} />
                </TouchableOpacity>
            ) : onEdit && hasContent ? (
                <TouchableOpacity onPress={onEdit} style={styles.editButton}>
                    <Edit size={18} color={Colors.GRAY} />
                </TouchableOpacity>
            ) : null}
        </View>
        <View style={styles.sectionContent}>
            {hasContent ? children : <Text style={styles.emptySectionText}>No information provided yet.</Text>}
        </View>
    </View>
);

// Mock Data Component for Mutual Connections
const MockMutualConnections = () => {
    const mockConnections = [ { id: '1', name: 'Jonnesh William', workExperience: 'Lead Educator', profilePicture: 'https://i.pravatar.cc/150?u=jonnesh' }, { id: '2', name: 'Jannet William', workExperience: 'Curriculum Developer', profilePicture: 'https://i.pravatar.cc/150?u=jannet' }];
    return (
        <>
            {mockConnections.map(conn => (
                 <View key={conn.id} style={styles.listItem}><Image source={{ uri: conn.profilePicture }} style={styles.avatarIcon} /><View style={styles.listTextContainer}><Text style={styles.listTitle}>{conn.name}</Text><Text style={styles.listSubtitle}>{conn.workExperience}</Text></View><TouchableOpacity style={styles.connectButton}><UserPlus size={18} color={Colors.PRIMARY} /></TouchableOpacity></View>
            ))}
        </>
    );
}

const ProfileOverview = () => {
    const router = useRouter();
    const { session, isLoading: authIsLoading } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const fetchProfileData = useCallback(async () => {
        if (!session?.user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (error) throw error;
            setProfile(data);
        } catch (err: any) { console.error("Profile Overview fetch error:", err); } finally { setLoading(false); }
    }, [session]);

    useEffect(() => { if (!authIsLoading) fetchProfileData(); }, [authIsLoading, fetchProfileData]);

    const handleImportResume = async () => {
        if (!session?.user) return;

        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            copyToCacheDirectory: true
        });

        if (result.canceled || !result.assets) return;

        const file = result.assets[0];
        setIsUploading(true);

        try {
            const filePath = `${session.user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
            const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
            
            // Upload to the 'resumes' bucket
            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, decode(base64), { contentType: file.mimeType });

            if (uploadError) throw uploadError;

            // Get the public URL of the uploaded file
            const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(filePath);
            const resumeUrl = urlData.publicUrl;

            // Update the 'resume_url' field in the 'profiles' table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ resume_url: resumeUrl })
                .eq('id', session.user.id);

            if (updateError) throw updateError;
            
            Alert.alert("Success", "Your resume has been uploaded successfully!");
            fetchProfileData(); // Refresh profile data to show the new status
        } catch (error: any) {
            Alert.alert("Upload Failed", error.message || "An unknown error occurred while uploading your resume.");
        } finally {
            setIsUploading(false);
        }
    };
    
    if (loading || authIsLoading) {
        return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
    }

    if (!profile) {
        return <View style={styles.centered}><Text>Could not load profile overview.</Text></View>;
    }
    
    const hasExperience = Array.isArray(profile.experience_json) && profile.experience_json.length > 0;
    const hasEducation = Array.isArray(profile.education_json) && profile.education_json.length > 0;
    const mockBadges = [{ id: '1', title: 'Curriculum Designer', description: "Created 25+ highly-rated educational resources" }];
    const mockRecentActivities = [{ type: 'comment', content: 'Thanks for sharing Sarah, I will see this for future', target: 'Sarah\'s Post' }];
    
    return (
        <View style={styles.container}>
            <ProfileSection
                title="Experience"
                onAdd={() => router.push({ pathname: '/profile/AddExperienceScreen', params: { profile: JSON.stringify(profile) } })}
                onEdit={() => router.push({ pathname: '/profile/AddExperienceScreen', params: { profile: JSON.stringify(profile) } })}
                hasContent={hasExperience}
            >
                {profile.experience_json?.map((exp: any, index: number) => (
                    <TouchableOpacity 
                        key={index}
                        style={styles.listItem}
                        onPress={() => router.push({ pathname: '/profile/AddExperienceScreen', params: { profile: JSON.stringify(profile) } })}
                    >
                        <Briefcase size={40} color={Colors.PRIMARY} style={styles.listIcon} />
                        <View style={styles.listTextContainer}><Text style={styles.listTitle}>{exp.role || 'Position'}</Text><Text style={styles.listSubtitle}>{exp.institution || 'Organization'}</Text></View>
                    </TouchableOpacity>
                ))}
            </ProfileSection>

            <ProfileSection
                title="Education"
                onAdd={() => router.push({ pathname: '/profile/AddEducationScreen', params: { profile: JSON.stringify(profile) } })}
                onEdit={() => router.push({ pathname: '/profile/AddEducationScreen', params: { profile: JSON.stringify(profile) } })}
                hasContent={hasEducation}
            >
                {profile.education_json?.map((edu: any, index: number) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.listItem}
                        onPress={() => router.push({ pathname: '/profile/AddEducationScreen', params: { profile: JSON.stringify(profile) } })}
                    >
                        <GraduationCap size={40} color={Colors.PRIMARY} style={styles.listIcon} />
                        <View style={styles.listTextContainer}><Text style={styles.listTitle}>{edu.degree || 'Degree'}</Text><Text style={styles.listSubtitle}>{edu.institution || 'Institution'}</Text></View>
                    </TouchableOpacity>
                ))}
            </ProfileSection>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resume</Text>
                <TouchableOpacity style={styles.importButton} onPress={handleImportResume} disabled={isUploading}>
                    {isUploading ? <ActivityIndicator color={Colors.PRIMARY} /> : <><UploadCloud size={20} color={Colors.PRIMARY} /><Text style={styles.importButtonText}>{profile.resume_url ? 'Replace Resume' : 'Import Resume'}</Text></>}
                </TouchableOpacity>
                
                {profile.resume_url ? (
                    <View style={styles.fileUploadedContainer}>
                        <CheckCircle size={16} color={Colors.SUCCESS} />
                        <Text style={styles.fileUploadedText}>A resume is on file.</Text>
                    </View>
                ) : (
                    <Text style={styles.importSubtext}>This will be used for job applications.</Text>
                )}
            </View>

            <ProfileSection title="Badges and Certifications" onEdit={() => Alert.alert("Edit Badges")} hasContent={mockBadges.length > 0}>
                 {mockBadges.map(badge => (
                    <TouchableOpacity key={badge.id} style={styles.listItem}>
                        <Award size={40} color={Colors.PRIMARY} style={styles.listIcon} />
                        <View style={styles.listTextContainer}><Text style={styles.listTitle}>{badge.title}</Text><Text style={styles.listSubtitle}>{badge.description}</Text></View>
                        <ChevronRight size={20} color={Colors.GRAY} />
                    </TouchableOpacity>
                ))}
            </ProfileSection>

            <ProfileSection title="Recent Activities" onEdit={() => Alert.alert("Edit Activities")} hasContent={mockRecentActivities.length > 0}>
                {mockRecentActivities.map((activity, index) => (
                    <TouchableOpacity key={index} style={styles.listItem}><MessageSquare size={24} color={Colors.PRIMARY} style={styles.listIconActivity} /><View style={styles.listTextContainer}><Text style={styles.listTitle}>{activity.content}</Text><Text style={styles.listSubtitle}>{activity.target}</Text></View><ChevronRight size={20} color={Colors.GRAY} /></TouchableOpacity>
                ))}
            </ProfileSection>

            <ProfileSection title="Mutual Connections" onEdit={() => Alert.alert("View All Mutuals")}>
                <MockMutualConnections />
            </ProfileSection>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: '#F7F7F7', paddingBottom: 20 },
    centered: { minHeight: 300, justifyContent: 'center', alignItems: 'center' },
    section: { backgroundColor: 'white', marginHorizontal: 16, marginTop: 12, borderRadius: 8, padding: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.BLACK,marginBottom:12,marginTop:12 },
    editButton: { padding: 4 },
    addButton: { padding: 4 },
    sectionContent: {},
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    listIcon: { marginRight: 16 },
    listIconActivity: { marginRight: 16, alignSelf: 'flex-start', marginTop: 4 },
    avatarIcon: { width: 48, height: 48, borderRadius: 24, marginRight: 16, backgroundColor: '#e0e0e0' },
    listTextContainer: { flex: 1 },
    listTitle: { fontSize: 16, fontWeight: '500', color: Colors.BLACK },
    listSubtitle: { fontSize: 14, color: Colors.GRAY, marginTop: 2, lineHeight: 20 },
    emptySectionText: { textAlign: 'center', color: Colors.GRAY, paddingVertical: 20, fontStyle: 'italic' },
    connectButton: { padding: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.PRIMARY },
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.PRIMARY_LIGHT,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    importButtonText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    importSubtext: {
        marginTop: 8,
        fontSize: 12,
        color: Colors.GRAY,
        textAlign: 'center',
    },
    fileUploadedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#e6fffa',
        borderRadius: 20,
        alignSelf: 'center',
    },
    fileUploadedText: {
        marginLeft: 6,
        fontSize: 12,
        color: Colors.SUCCESS,
        fontWeight: '500',
    },
});

export default ProfileOverview;