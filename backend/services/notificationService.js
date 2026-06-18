const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const notificationService = {
  sendNotification: async (user_id, type, title, text) => {
    const newAlert = {
      user_id,
      type,
      title,
      text,
      read: false
    };

    if (!isConfigured) {
      const created = {
        id: `NTF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        ...newAlert,
        created_at: new Date()
      };
      mockDb.notifications.unshift(created);
      return created;
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([newAlert])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getNotifications: async (requester) => {
    if (!isConfigured) {
      return mockDb.notifications.filter(n => n.user_id === requester.id);
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', requester.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[notificationService] Supabase query failed, falling back to mockDb:', err.message || err);
      return mockDb.notifications.filter(n => n.user_id === requester.id);
    }
  },

  markAsRead: async (requester) => {
    if (!isConfigured) {
      mockDb.notifications = mockDb.notifications.map(n => {
        if (n.user_id === requester.id) {
          return { ...n, read: true };
        }
        return n;
      });
      return { success: true };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', requester.id);

    if (error) throw error;
    return { success: true };
  }
};

module.exports = notificationService;
