import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

interface StatusDialogProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const { width } = Dimensions.get('window');

const StatusDialog: React.FC<StatusDialogProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, autoClose, autoCloseDelay]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          color: '#4CAF50',
          icon: '✓',
          backgroundColor: '#E8F5E8',
        };
      case 'error':
        return {
          color: '#F44336',
          icon: '✕',
          backgroundColor: '#FFEBEE',
        };
      case 'warning':
        return {
          color: '#FF9800',
          icon: '⚠',
          backgroundColor: '#FFF3E0',
        };
      case 'info':
        return {
          color: '#2196F3',
          icon: 'ℹ',
          backgroundColor: '#E3F2FD',
        };
      default:
        return {
          color: '#666',
          icon: '•',
          backgroundColor: '#F5F5F5',
        };
    }
  };

  const typeConfig = getTypeConfig();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.dialog,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              backgroundColor: typeConfig.backgroundColor,
              borderColor: typeConfig.color,
            },
          ]}
        >
          <View style={styles.header}>
            <View
              style={[styles.iconContainer, { backgroundColor: typeConfig.color }]}
            >
              <Text style={styles.icon}>{typeConfig.icon}</Text>
            </View>
            <Text style={[styles.title, { color: typeConfig.color }]}>
              {title}
            </Text>
          </View>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {onConfirm ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton, { backgroundColor: typeConfig.color }]}
                  onPress={() => {
                    onConfirm();
                    handleClose();
                  }}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.singleButton, { backgroundColor: typeConfig.color }]}
                onPress={handleClose}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: width - 40,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  singleButton: {
    marginHorizontal: 0,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  confirmButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default StatusDialog;