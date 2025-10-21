import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Student, EnrollmentStatus } from '../../types/enrollment';
import * as Progress from 'react-native-progress';
import Colors from '../../constant/Colors';

interface StudentListItemProps {
  student: Student;
  onPress: () => void;
}

const StatusColors = {
  active: Colors.PRIMARY,
  inactive: Colors.GRAY,
  completed: Colors.SUCCESS,
  dropped: Colors.ERROR,
};

const StatusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  completed: 'Completed',
  dropped: 'Dropped',
};

const StudentListItem: React.FC<StudentListItemProps> = ({ student, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
        <Image
          source={
            student.profilePicture
              ? { uri: student.profilePicture }
              : require('../../assets/images/default.png')
          }
          style={styles.avatar}
        />
        <View style={styles.studentInfo}>
          <Text style={styles.name}>{student.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: StatusColors[student.status] }]}>
            <Text style={styles.statusText}>{StatusLabels[student.status]}</Text>
          </View>
        </View>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>{student.progress}% Progress</Text>
          <Progress.Bar
            progress={student.progress / 100}
            width={80}
            color={StatusColors[student.status]}
            unfilledColor="#e0e0e0"
            borderWidth={0}
            height={6}
          />
        </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  progressSection: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    color: Colors.GRAY,
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
});

export default StudentListItem;