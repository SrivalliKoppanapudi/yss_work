// component/jobs/DraftJobCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Edit, Trash2 } from 'lucide-react-native';
import Colors from '../../constant/Colors';
import { Job } from '../../types/jobs';
import { useRouter } from 'expo-router';

interface DraftJobCardProps {
  job: Job;
  onDelete: (jobId: number) => void;
}

const DraftJobCard: React.FC<DraftJobCardProps> = ({ job, onDelete }) => {
    const router = useRouter();

    const handleEdit = () => {
        router.push({
            pathname: '/(screens)/CreateJobScreen',
            params: { jobToEdit: JSON.stringify(job) }
        });
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Image
                    source={job.organization_logo ? { uri: job.organization_logo } : require('../../assets/images/facebook.png')}
                    style={styles.logo}
                />
                <View style={styles.titleContainer}>
                    <Text style={styles.jobName} numberOfLines={1}>{job.job_name}</Text>
                    <Text style={styles.companyName} numberOfLines={1}>{job.company_name || 'Confidential'}</Text>
                </View>
            </View>
            
            <View style={styles.footer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                    <Edit size={18} color={Colors.PRIMARY} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => onDelete(job.id)}>
                    <Trash2 size={18} color={Colors.ERROR} />
                    <Text style={[styles.actionButtonText, {color: Colors.ERROR}]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    logo: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#f0f0f0',
    },
    titleContainer: {
        flex: 1,
    },
    jobName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    companyName: {
        fontSize: 13,
        color: Colors.GRAY,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    deleteButton: {},
    actionButtonText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
        color: Colors.PRIMARY,
    },
});

export default DraftJobCard;