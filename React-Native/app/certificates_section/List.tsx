import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { CourseCertificate } from '../../types/certificates';

const certificateTemplates = [
	{
		id: 1,
		name: 'Achievement Certificate',
		hasImage: true,
		icon: require('../../assets/images/Lynkt.png'),
	},
	{
		id: 2,
		name: 'Completion Certificate',
		hasImage: false,
	},
];

export default function List() {
	const router = useRouter();
  const [certificates, setCertificates] = useState<CourseCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return setCertificates([]);
        const { data, error } = await supabase
          .from('course_completions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });
        if (error) throw error;
        setCertificates(data || []);
      } catch (e) {
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

	const handleCertificatePress = (cert: CourseCertificate) => {
		router.push({ 
			pathname: '/certificates_section/fullcertificate1', 
			params: { 
				name: cert.course_title,
				event: cert.course_title,
				date: cert.completed_at,
				venue: cert.instructor || 'Lynkt Academy'
			} 
		});
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Your Course Certificates</Text>
      {loading && <ActivityIndicator size="large" color="#1CB5E0" style={{ marginTop: 40 }} />}
      {!loading && certificates.length === 0 && <Text style={{ textAlign: 'center', marginTop: 32 }}>No completed courses yet.</Text>}
      {certificates.map((cert) => (
        <TouchableOpacity
          key={cert.id}
          style={styles.card}
          onPress={() => handleCertificatePress(cert)}
          activeOpacity={0.7}
        >
          <Image source={require('../../assets/images/Lynkt.png')} style={styles.icon} />
          <View>
            <Text style={styles.templateName}>{cert.course_title}</Text>
            <Text style={{ fontSize: 14, color: '#666' }}>Instructor: {cert.instructor || 'N/A'}</Text>
            <Text style={{ fontSize: 13, color: '#888' }}>Completed: {new Date(cert.completed_at).toLocaleDateString()}</Text>
          </View>
        </TouchableOpacity>
      ))}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 16,
		backgroundColor: 'white',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		color: '#222',
		textAlign: 'center',
	},
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f3f4f6',
		borderRadius: 10,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 2,
		shadowOffset: { width: 0, height: 1 },
	},
	icon: {
		width: 48,
		height: 48,
		borderRadius: 8,
		marginRight: 16,
	},
	templateName: {
		fontSize: 18,
		color: '#222',
		fontWeight: '500',
	},
});