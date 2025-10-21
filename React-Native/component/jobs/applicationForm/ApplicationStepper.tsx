// components/jobs/applicationForm/ApplicationStepper.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../constant/Colors'; // Adjust path

interface ApplicationStepperProps {
  steps: string[];
  currentStep: number;
}

const ApplicationStepper: React.FC<ApplicationStepperProps> = ({ steps, currentStep }) => {
  return (
    <View style={styles.stepperOuterContainer}>
      <Text style={styles.currentStepTitle}>{steps[currentStep]}</Text>
      <View style={styles.stepperContainer}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View
              style={[
                styles.stepIndicator,
                index === currentStep ? styles.stepIndicatorActive : (index < currentStep ? styles.stepIndicatorCompleted : {}),
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  index === currentStep ? styles.stepNumberActive : (index < currentStep ? styles.stepNumberCompleted : {}),
                ]}
              >
                {index < currentStep ? '✓' : index + 1}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  index < currentStep ? styles.stepConnectorActive : {},
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepperOuterContainer: {
    alignItems: 'center', // Center the title above the stepper
    paddingVertical: 15,
    backgroundColor: '#f8f9fa', // Light background for the stepper area
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  currentStepTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: Colors.BLACK,
      marginBottom: 15, // Space between title and stepper line
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute steps evenly
    paddingHorizontal: 20, // Padding for the stepper line itself
    width: '100%', // Ensure stepper line takes full width
  },
  stepIndicator: {
    width: 32, // Slightly larger indicators
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0', // Inactive step color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0', // Border for inactive step
  },
  stepIndicatorActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY, // Active step border color
    transform: [{ scale: 1.1 }], // Slightly larger when active
  },
  stepIndicatorCompleted: {
    backgroundColor: Colors.SUCCESS, // Color for completed steps
    borderColor: Colors.SUCCESS,
  },
  stepNumber: {
    color: Colors.GRAY, // Text color for inactive step number
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepNumberActive: {
    color: Colors.WHITE, // Text color for active step number
  },
  stepNumberCompleted: {
    color: Colors.WHITE, // Text color for completed step number (check mark)
    fontSize: 16, // Checkmark can be slightly larger
  },
  stepConnector: {
    flex: 1, // Takes up space between indicators
    height: 3, // Thicker connector line
    backgroundColor: '#e0e0e0', // Inactive connector color
    marginHorizontal: -2, // Overlap slightly with indicators for continuous line
  },
  stepConnectorActive: {
    backgroundColor: Colors.SUCCESS, // Connector color for completed segments
  },
});

export default ApplicationStepper;