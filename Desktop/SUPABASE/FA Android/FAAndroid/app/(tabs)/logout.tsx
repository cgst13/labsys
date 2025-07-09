import { supabase } from '@/constants/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function Logout() {
  const router = useRouter();
  const [dialogShown, setDialogShown] = useState(false);

  if (!dialogShown) {
    setDialogShown(true);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => router.replace('/(tabs)') },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            setTimeout(() => {
              router.replace('/login');
            }, 100);
          },
        },
      ]
    );
  }

  return null;
} 