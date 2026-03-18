import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function usePushToken() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    registerAndStore(user.id);
  }, [user]);
}

async function registerAndStore(userId: string) {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined as any,
  )).data;

  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);
}
