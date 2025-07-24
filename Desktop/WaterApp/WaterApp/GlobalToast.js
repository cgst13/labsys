import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef();

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast(t => ({ ...t, visible: false })));
    }, 3000);
  };

  const hideToast = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(t => ({ ...t, visible: false })));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: slideAnim }],
              backgroundColor: toast.type === 'success' ? '#43a047' : '#e53935',
            },
          ]}
        >
          <Feather
            name={toast.type === 'success' ? 'check-circle' : 'alert-circle'}
            size={22}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
          <TouchableOpacity onPress={hideToast} style={{ marginLeft: 10 }}>
            <Feather name="x" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: width * 0.05,
    top: 40, // show at top, adjust for status bar
    width: width * 0.9,
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
}); 