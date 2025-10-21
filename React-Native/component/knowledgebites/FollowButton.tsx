
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import Colors from '../../constant/Colors'; // Assuming you have a Colors file
const FollowButton = ({ currentUserId, profileUserId, isFollowing, onToggleFollow }) => {
  return (
    <TouchableOpacity
      style={[styles.followBtn, isFollowing && styles.followingBtn]}
      onPress={() => onToggleFollow(profileUserId, isFollowing)}
    >
      <Text style={{ color: isFollowing ? '#fff' : '#000' }}>
        {isFollowing ? 'Following' : '+ Follow'}
      </Text>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  followBtn: {
    padding: 5,
    backgroundColor: Colors.PRIMARY_LIGHT,
    borderRadius: 5,
  },
  followingBtn: {
    backgroundColor: 'green',
  },
});

export default FollowButton;
