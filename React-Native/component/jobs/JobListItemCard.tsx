// import React from 'react'; 
// import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
// import { MapPin, Briefcase, Clock, DollarSign, ChevronRight, Bookmark as BookmarkIcon, Share2 } from 'lucide-react-native'; // Renamed Bookmark to BookmarkIcon
// import Colors from '../../constant/Colors';
// import { Job } from '../../types/jobs';
// import { useAuth } from '../../Context/auth'; 
// import { Alert } from 'react-native';

// interface JobListItemCardProps {
//   job: Job;
//   onPress: () => void;
//   onToggleBookmark?: (jobId: number, currentIsBookmarked: boolean) => Promise<void>; 
//   onShare?: (job: Job) => void;
//   isBookmarked?: boolean; 
// }

// const timeSince = (dateString: string | Date | undefined): string => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     const now = new Date();
//     const secondsPast = (now.getTime() - date.getTime()) / 1000;

//     if (secondsPast < 60) return `${Math.round(secondsPast)}s ago`;
//     if (secondsPast < 3600) return `${Math.round(secondsPast / 60)}m ago`;
//     if (secondsPast <= 86400) return `${Math.round(secondsPast / 3600)}h ago`;
//     const days = Math.round(secondsPast / 86400);
//     if (days <= 30) return `${days}d ago`;
//     const months = Math.round(days / 30);
//     if (months <= 12) return `${months}mo ago`;
//     const years = Math.round(days / 365);
//     return `${years}y ago`;
// };

// const JobListItemCard: React.FC<JobListItemCardProps> = ({
//   job,
//   onPress,
//   onToggleBookmark,
//   onShare,
//   isBookmarked // Receive bookmark status as prop
// }) => {
//   const { session } = useAuth(); // Get session to enable/disable bookmark for logged-in users

//   const handleBookmarkPress = () => {
//     if (!session?.user) {
//         Alert.alert("Login Required", "Please sign in to bookmark jobs.");
//         // Optionally navigate to login: router.push('/auth/SignIn');
//         return;
//     }
//     if (onToggleBookmark) {
//       onToggleBookmark(job.id, !!isBookmarked); // Pass current status
//     }
//   };

//   return (
//     <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
//       <View style={styles.header}>
//         <Image
//           source={job.organization_logo ? { uri: job.organization_logo } : require('../../assets/images/organization_default_logo.jpg')}
//           style={styles.logo}
//         />
//         <View style={styles.titleContainer}>
//           <Text style={styles.jobName} numberOfLines={1} ellipsizeMode="tail">{job.job_name}</Text>
//           <Text style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">{job.company_name || 'Confidential'}</Text>
//         </View>
//         <View style={styles.headerActions}>
//           {onToggleBookmark && session?.user && ( // Only show if handler and user exist
//             <TouchableOpacity style={styles.iconButton} onPress={handleBookmarkPress}>
//               <BookmarkIcon
//                 size={20}
//                 color={isBookmarked ? Colors.PRIMARY : Colors.GRAY}
//                 fill={isBookmarked ? Colors.PRIMARY : 'none'} // Fill if bookmarked
//               />
//             </TouchableOpacity>
//           )}
//           {onShare && (
//             <TouchableOpacity style={styles.iconButton} onPress={() => onShare(job)}>
//               <Share2 size={20} color={Colors.GRAY} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* ... (details and footer sections remain the same) ... */}
//       <View style={styles.details}>
//         {job.preferred_location && (
//           <View style={styles.detailItem}>
//             <MapPin size={14} color={Colors.GRAY} style={styles.detailIcon} />
//             <Text style={styles.detailText} numberOfLines={1}>{job.preferred_location}</Text>
//           </View>
//         )}
//         {(job.job_type || job.work_mode) && (
//           <View style={styles.detailItem}>
//             <Briefcase size={14} color={Colors.GRAY} style={styles.detailIcon} />
//             <Text style={styles.detailText} numberOfLines={1}>
//               {job.job_type || ''}{job.job_type && job.work_mode ? ` • ` : ''}{job.work_mode || ''}
//             </Text>
//           </View>
//         )}
//         {job.salary_range && (
//           <View style={styles.detailItem}>
//             <DollarSign size={14} color={Colors.GRAY} style={styles.detailIcon} />
//             <Text style={styles.detailText} numberOfLines={1}>{job.salary_range}</Text>
//           </View>
//         )}
//       </View>

//       <View style={styles.footer}>
//         <View style={styles.postedDateContainer}>
//           <Clock size={14} color={Colors.GRAY} style={styles.detailIcon} />
//           <Text style={styles.postedDate}>Posted {timeSince(job.created_at)}</Text>
//         </View>
//         <ChevronRight size={20} color={Colors.PRIMARY} />
//       </View>
//     </TouchableOpacity>
//   );
// };

// // Styles remain the same
// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: Colors.WHITE,
//     borderRadius: 12,
//     padding: 16,
//     marginHorizontal: 16,
//     marginVertical: 8,
//     shadowColor: '#000000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   logo: {
//     width: 48,
//     height: 48,
//     borderRadius: 8,
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   titleContainer: {
//     flex: 1,
//   },
//   jobName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: Colors.BLACK,
//     marginBottom: 2,
//   },
//   companyName: {
//     fontSize: 13,
//     color: Colors.GRAY,
//   },
//   headerActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   iconButton: {
//     padding: 4,
//     marginLeft: 8,
//   },
//   details: {
//     marginBottom: 12,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   detailIcon: {
//     marginRight: 6,
//   },
//   detailText: {
//     fontSize: 13,
//     color: Colors.GRAY,
//     flexShrink: 1,
//   },
//   footer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//     paddingTop: 12,
//     marginTop: 4,
//   },
//   postedDateContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   postedDate: {
//     fontSize: 12,
//     color: Colors.GRAY,
//   },
// });

// export default JobListItemCard;
import React from 'react'; 
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MapPin, Briefcase, Clock, DollarSign, ChevronRight, Bookmark as BookmarkIcon, Share2 } from 'lucide-react-native';
import Colors from '../../constant/Colors';
import { Job } from '../../types/jobs';
import { useAuth } from '../../Context/auth'; 
import { Alert } from 'react-native';

interface JobListItemCardProps {
  job: Job;
  onPress: () => void;
  onToggleBookmark?: (jobId: number, currentIsBookmarked: boolean) => Promise<void>; 
  onShare?: (job: Job) => void;
  isBookmarked?: boolean;
  // --- NEW: Add an optional prop for the application status ---
  applicationStatus?: string | null;
}

const timeSince = (dateString: string | Date | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const secondsPast = (now.getTime() - date.getTime()) / 1000;

    if (secondsPast < 60) return `${Math.round(secondsPast)}s ago`;
    if (secondsPast < 3600) return `${Math.round(secondsPast / 60)}m ago`;
    if (secondsPast <= 86400) return `${Math.round(secondsPast / 3600)}h ago`;
    const days = Math.round(secondsPast / 86400);
    if (days <= 30) return `${days}d ago`;
    const months = Math.round(days / 30);
    if (months <= 12) return `${months}mo ago`;
    const years = Math.round(days / 365);
    return `${years}y ago`;
};

const getStatusBadgeStyle = (status: string) => {
    const baseStyle = styles.statusBadge;
    const statusColors = {
      Hired: { backgroundColor: Colors.SUCCESS, color: Colors.WHITE },
      Offered: { backgroundColor: '#22c55e', color: Colors.WHITE },
      Rejected: { backgroundColor: Colors.ERROR, color: Colors.WHITE },
      Withdrawn: { backgroundColor: Colors.GRAY, color: Colors.WHITE },
      Interviewing: { backgroundColor: '#8b5cf6', color: Colors.WHITE },
      Shortlisted: { backgroundColor: '#3b82f6', color: Colors.WHITE },
      Viewed: { backgroundColor: '#f59e0b', color: Colors.WHITE },
      Applied: { backgroundColor: '#eef0f2', color: Colors.GRAY },
    };
    return [baseStyle, statusColors[status as keyof typeof statusColors] || {}];
};

const JobListItemCard: React.FC<JobListItemCardProps> = ({
  job,
  onPress,
  onToggleBookmark,
  onShare,
  isBookmarked,
  applicationStatus, // <-- Destructure the new prop
}) => {
  const { session } = useAuth();

  const handleBookmarkPress = () => {
    if (!session?.user) {
        Alert.alert("Login Required", "Please sign in to bookmark jobs.");
        return;
    }
    if (onToggleBookmark) {
      onToggleBookmark(job.id, !!isBookmarked);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Image
          source={job.organization_logo ? { uri: job.organization_logo } : require('../../assets/images/organization_default_logo.jpg')}
          style={styles.logo}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.jobName} numberOfLines={1} ellipsizeMode="tail">{job.job_name}</Text>
          <Text style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">{job.company_name || 'Confidential'}</Text>
        </View>
        <View style={styles.headerActions}>
          {onToggleBookmark && session?.user && (
            <TouchableOpacity style={styles.iconButton} onPress={handleBookmarkPress}>
              <BookmarkIcon
                size={20}
                color={isBookmarked ? Colors.PRIMARY : Colors.GRAY}
                fill={isBookmarked ? Colors.PRIMARY : 'none'}
              />
            </TouchableOpacity>
          )}
          {onShare && (
            <TouchableOpacity style={styles.iconButton} onPress={() => onShare(job)}>
              <Share2 size={20} color={Colors.GRAY} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.details}>
        {job.preferred_location && (
          <View style={styles.detailItem}>
            <MapPin size={14} color={Colors.GRAY} style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>{job.preferred_location}</Text>
          </View>
        )}
        {(job.job_type || job.work_mode) && (
          <View style={styles.detailItem}>
            <Briefcase size={14} color={Colors.GRAY} style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>
              {job.job_type || ''}{job.job_type && job.work_mode ? ` • ` : ''}{job.work_mode || ''}
            </Text>
          </View>
        )}
        {job.salary_range && (
          <View style={styles.detailItem}>
            <DollarSign size={14} color={Colors.GRAY} style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>{job.salary_range}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.postedDateContainer}>
          {/* --- CORRECTED CONDITIONAL LOGIC --- */}
          {applicationStatus ? (
            <View style={getStatusBadgeStyle(applicationStatus)}>
              <Text 
                style={[
                  styles.statusBadgeText,
                  applicationStatus === 'Applied' && { color: Colors.GRAY }
                ]}
              >
                {applicationStatus}
              </Text>
            </View>
          ) : (
            <>
              <Clock size={14} color={Colors.GRAY} style={styles.detailIcon} />
              <Text style={styles.postedDate}>Posted {timeSince(job.created_at)}</Text>
            </>
          )}
        </View>
        <ChevronRight size={20} color={Colors.PRIMARY} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  titleContainer: {
    flex: 1,
  },
  jobName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 2,
  },
  companyName: {
    fontSize: 13,
    color: Colors.GRAY,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  details: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.GRAY,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 4,
  },
  postedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postedDate: {
    fontSize: 12,
    color: Colors.GRAY,
  },
  statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
  },
  statusBadgeText: {
      color: Colors.WHITE,
      fontSize: 11,
      fontWeight: 'bold',
      textTransform: 'capitalize',
  }
});

export default JobListItemCard;