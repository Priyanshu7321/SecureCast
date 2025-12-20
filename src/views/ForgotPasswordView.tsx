import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import { forgotPassword, clearError } from '../store/slices/authSlice';
import ProgressBar from '../components/ProgressBar';
import StatusDialog from '../components/StatusDialog';

type ForgotPasswordViewNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordViewNavigationProp;
}

const ForgotPasswordView: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [progress, setProgress] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleForgotPassword = async () => {
    if (!validateEmail()) return;

    try {
      // Simulate progress
      setProgress(0);
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 150);

      await dispatch(forgotPassword(email)).unwrap();
      
      clearInterval(progressInterval);
      setProgress(100);

      setShowSuccessDialog(true);
      setEmail('');
      
    } catch (error) {
      setProgress(0);
      console.error('Forgot password error:', error);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {isLoading && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Sending reset instructions...</Text>
              <ProgressBar
                progress={progress}
                color="#FF9500"
                height={6}
                showPercentage={true}
                animated={true}
              />
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.resetButton, isLoading && styles.disabledButton]}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.resetButtonText}>
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            • We'll send a password reset link to your email{'\n'}
            • Click the link to create a new password{'\n'}
            • Use your new password to sign in
          </Text>
        </View>
      </ScrollView>

      <StatusDialog
        visible={showSuccessDialog}
        type="success"
        title="Email Sent!"
        message="Password reset instructions have been sent to your email address. Please check your inbox and follow the instructions."
        onClose={() => {
          setShowSuccessDialog(false);
          navigation.navigate('Login');
        }}
        confirmText="Back to Login"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  resetButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#e8f5e8',
    padding: 20,
    borderRadius: 12,
    marginTop: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#388e3c',
    lineHeight: 20,
  },
});

export default ForgotPasswordView;