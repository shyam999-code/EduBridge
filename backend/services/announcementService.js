const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const announcementService = {
  createAnnouncement: async (announcementData, requester) => {
    const authorName = requester.name || 'Principal Office';
    const newLog = {
      author_name: authorName,
      date: new Date().toISOString().split('T')[0],
      ...announcementData
    };

    if (!isConfigured) {
      const created = {
        id: `ANN-${100 + mockDb.announcements.length + 1}`,
        ...newLog,
        created_at: new Date()
      };
      mockDb.announcements.unshift(created);
      mockDb.saveToDisk();
      return created;
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert([newLog])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateAnnouncement: async (id, updateData) => {
    if (!isConfigured) {
      const index = mockDb.announcements.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Announcement not found');
      mockDb.announcements[index] = { ...mockDb.announcements[index], ...updateData };
      mockDb.saveToDisk();
      return mockDb.announcements[index];
    }

    const { data, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteAnnouncement: async (id) => {
    if (!isConfigured) {
      const index = mockDb.announcements.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Announcement not found');
      const deleted = mockDb.announcements.splice(index, 1);
      mockDb.saveToDisk();
      return deleted[0];
    }

    const { data, error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getAnnouncements: async () => {
    if (!isConfigured) {
      return mockDb.announcements;
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[announcementService] Supabase query failed, falling back to mockDb:', err.message || err);
      return mockDb.announcements;
    }
  }
};

module.exports = announcementService;
