import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { InAppNotificationProps, NotificationType } from '../../types/notification';

const { width } = Dimensions.get('window');

const InAppNotification: React.FC<InAppNotificationProps> = ({
  notification,
  onPress,
  onDismiss,
  onActionPress,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide if specified
    if (notification.autoHide !== false) {
      const timeout = setTimeout(() => {
        handleDismiss();
      }, notification.duration || 4000);

      return () => clearTimeout(timeout);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const handlePress = () => {
    onPress?.();
    handleDismiss();
  };

  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          borderLeftColor: '#2E7D32',
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#F44336',
          borderLeftColor: '#C62828',
          iconColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: '#FF9800',
          borderLeftColor: '#E65100',
          iconColor: '#FFFFFF',
        };
      case 'info':
        return {
          backgroundColor: '#2196F3',
          borderLeftColor: '#1565C0',
          iconColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderLeftColor: '#007AFF',
          iconColor: '#007AFF',
        };
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '🔔';
    }
  };

  const notificationStyle = getNotificationStyle(notification.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: notificationStyle.backgroundColor,
          borderLeftColor: notificationStyle.borderLeftColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { color: notificationStyle.iconColor }]}>
            {getIcon(notification.type)}
          </Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: notificationStyle.iconColor }]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={[styles.message, { color: notificationStyle.iconColor }]} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        {notification.imageUrl && (
          <Image source={{ uri: notification.imageUrl }} style={styles.image} />
        )}

        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Text style={[styles.closeText, { color: notificationStyle.iconColor }]}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Actions temporarily disabled to fix Redux serialization issues */}
      {false && notification.actions && notification.actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {notification.actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                action.destructive && styles.destructiveAction,
              ]}
              onPress={() => {
                onActionPress?.(action.id);
                // action.onPress(); // Removed to fix serialization
                handleDismiss();
              }}
            >
              <Text
                style={[
                  styles.actionText,
                  { color: notificationStyle.iconColor },
                  action.destructive && styles.destructiveActionText,
                ]}
              >
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    opacity: 0.9,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  destructiveAction: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  destructiveActionText: {
    color: '#FF6B6B',
  },
});

export default InAppNotification;