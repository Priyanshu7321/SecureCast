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
import { AuthStackParamList, SignUpCredentials } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import { signUp, clearError } from '../store/slices/authSlice';
import { useNotificationViewModel } from '../viewmodels/useNotificationViewModel';
import ProgressBar from '../components/ProgressBar';
import StatusDialog from '../components/StatusDialog';

type SignUpViewNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

interface Props {
  navigation: SignUpViewNavigationProp;
}

const SignUpView: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const { showSuccessNotification } = useNotificationViewModel();

  const [formData, setFormData] = useState<SignUpCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const updateField = (field: keyof SignUpCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) {
      dispatch(clearError());
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return false;
    }

    if (formData.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Validation Error', 'Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      // Simulate progress
      setProgress(0);
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 8;
        });
      }, 250);

      const result = await dispatch(signUp(formData)).unwrap();
      
      clearInterval(progressInterval);
      setProgress(100);

      // Show success notification and dialog
      showSuccessNotification('Account Created', `Welcome to SecureCast, ${result.user.name}!`);
      setShowSuccessDialog(true);

      // Clear form
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      
    } catch (error) {
      setProgress(0);
      console.error('Sign up error:', error);
    }
  };

  const handleLoginNavigation = () => {
    navigation.navigate('Login');
  };

  const getPasswordStrength = (password: string): { strength: number; text: string; color: string } => {
    if (password.length === 0) return { strength: 0, text: '', color: '#ddd' };
    if (password.length < 6) return { strength: 25, text: 'Weak', color: '#f44336' };
    if (password.length < 8) return { strength: 50, text: 'Fair', color: '#ff9800' };
    if (password.length < 12) return { strength: 75, text: 'Good', color: '#2196f3' };
    return { strength: 100, text: 'Strong', color: '#4caf50' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join SecureCast today</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {formData.password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <ProgressBar
                  progress={passwordStrength.strength}
                  color={passwordStrength.color}
                  height={4}
                  animated={true}
                />
                <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {formData.confirmPassword.length > 0 && (
              <Text style={[
                styles.passwordMatchText,
                { color: formData.password === formData.confirmPassword ? '#4caf50' : '#f44336' }
              ]}>
                {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
              </Text>
            )}
          </View>

          {isLoading && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Creating your account...</Text>
              <ProgressBar
                progress={progress}
                color="#34C759"
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
            style={[styles.signUpButton, isLoading && styles.disabledButton]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.signUpButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLoginNavigation} disabled={isLoading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Demo Note:</Text>
          <Text style={styles.demoText}>Use exists@test.com to test email already exists error</Text>
        </View>
      </ScrollView>

      <StatusDialog
        visible={showSuccessDialog}
        type="success"
        title="Account Created!"
        message="Your SecureCast account has been created successfully. Welcome aboard!"
        onClose={() => setShowSuccessDialog(false)}
        autoClose={true}
        autoCloseDelay={2500}
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
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 12,
    padding: 5,
  },
  eyeText: {
    fontSize: 18,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  passwordMatchText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
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
  signUpButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  demoContainer: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e65100',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#e65100',
  },
});

export default SignUpView;