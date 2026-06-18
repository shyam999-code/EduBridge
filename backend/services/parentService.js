const { supabase, isConfigured } = require('../config/supabaseClient');
const mockDb = require('../database/mockDb');

const parentService = {
  createParent: async (parentData) => {
    if (!isConfigured) {
      const newParent = {
        id: `par-${Math.random().toString(36).substr(2, 9)}`,
        ...parentData,
        created_at: new Date()
      };
      mockDb.parents.push(newParent);
      return newParent;
    }

    const { data, error } = await supabase
      .from('parents')
      .insert([parentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateParent: async (id, updateData) => {
    if (!isConfigured) {
      const index = mockDb.parents.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Parent not found');
      mockDb.parents[index] = { ...mockDb.parents[index], ...updateData };
      return mockDb.parents[index];
    }

    const { data, error } = await supabase
      .from('parents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getParentProfile: async (id, requester) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isRequesterUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requester.id);

    if (!isConfigured) {
      const ensureFallbackParent = (userId) => {
        let parent = mockDb.parents.find(p => p.id === userId || p.user_id === userId);
        if (!parent) {
          parent = {
            id: `par-${userId.replace(/[^a-z0-9]/g, '') || 'newparent'}`,
            user_id: userId,
            child_id: null, // Default to null for privacy linking modal
            designation: 'Parent / Guardian',
            address: '404 Oakwood Lane, Crestview',
            phone: '+1 (555) 017-4839'
          };
          mockDb.parents.push(parent);
          mockDb.saveToDisk();
        }
      };

      ensureFallbackParent(id);
      if (requester && requester.role === 'parent') {
        ensureFallbackParent(requester.id);
      }
    }

    if (requester.role === 'parent') {
      const selfParent = (isConfigured && isRequesterUuid)
        ? await getParentByUserId(requester.id)
        : mockDb.parents.find(p => p.user_id === requester.id);
      if (!selfParent || (selfParent.id !== id && selfParent.user_id !== id)) {
        throw { status: 403, code: 'FORBIDDEN', message: 'You can only retrieve your own parent profile.' };
      }
    }

    if (!isConfigured || !isUuid) {
      let parent = mockDb.parents.find(p => p.id === id || p.user_id === id);
      let user = mockDb.users.find(u => u.id === parent.user_id);
      if (!user) {
        user = {
          id: parent.user_id,
          name: parent.user_id.split('-').pop().toUpperCase(),
          email: parent.user_id.includes('@') ? parent.user_id : `${parent.user_id.split('-').pop()}@edubridge.com`,
          role: 'parent',
          status: 'active'
        };
        mockDb.users.push(user);
      }

      const student = mockDb.students.find(s => s.id === parent.child_id);
      const studentUser = student ? mockDb.users.find(u => u.id === student.user_id) : null;
      return {
        ...parent,
        user: user || null,
        child: student ? { ...student, name: studentUser ? studentUser.name : 'Leo Sterling' } : null
      };
    }

    const { data, error } = await supabase
      .from('parents')
      .select(`
        *,
        user:users(*),
        child:students(*, user:users(name))
      `)
      .or(`id.eq.${id},user_id.eq.${id}`)
      .single();

    if (error) throw error;
    return data;
  },

  linkParentToStudent: async (parentId, studentId) => {
    if (!isConfigured) {
      const index = mockDb.parents.findIndex(p => p.id === parentId);
      if (index === -1) throw new Error('Parent profile not found');
      
      const studentExists = mockDb.students.some(s => s.id === studentId);
      if (!studentExists) throw new Error('Student profile not found');

      mockDb.parents[index].child_id = studentId;
      mockDb.saveToDisk();
      return mockDb.parents[index];
    }

    const { data, error } = await supabase
      .from('parents')
      .update({ child_id: studentId })
      .eq('id', parentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  verifyAndLinkChild: async (parentUserId, childName, rollNumber, className) => {
    if (!isConfigured) {
      let parent = mockDb.parents.find(p => p.user_id === parentUserId);
      if (!parent) {
        parent = {
          id: `par-${parentUserId.replace(/[^a-z0-9]/g, '') || 'newparent'}`,
          user_id: parentUserId,
          child_id: null,
          designation: 'Parent / Guardian',
          address: '404 Oakwood Lane, Crestview',
          phone: '+1 (555) 017-4839'
        };
        mockDb.parents.push(parent);
      }

      const student = mockDb.students.find(s => {
        const sUser = mockDb.users.find(u => u.id === s.user_id);
        const nameMatches = sUser && sUser.name.toLowerCase().trim() === childName.toLowerCase().trim();
        
        const rollClean = s.roll_number.toLowerCase().replace(/[^a-z0-9]/g, '');
        const inputRollClean = rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const rollMatches = rollClean === inputRollClean || rollClean.endsWith(inputRollClean);

        const classObj = mockDb.classes.find(c => c.id === s.class_id);
        if (!classObj) return false;
        
        const classClean = classObj.name.toLowerCase().replace(/grade/g, '').replace(/[^a-z0-9]/g, '').trim();
        const inputClassClean = className.toLowerCase().replace(/grade/g, '').replace(/[^a-z0-9]/g, '').trim();
        const classMatches = classClean === inputClassClean || classClean.includes(inputClassClean) || inputClassClean.includes(classClean);

        return nameMatches && rollMatches && classMatches;
      });

      if (!student) {
        throw new Error('Student profile not found with the provided Name, Roll Number, and Class.');
      }

      parent.child_id = student.id;
      mockDb.saveToDisk();

      const studentUser = mockDb.users.find(u => u.id === student.user_id);
      return {
        ...parent,
        child: {
          ...student,
          name: studentUser ? studentUser.name : 'Unknown Student'
        }
      };
    } else {
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('*')
        .eq('user_id', parentUserId)
        .maybeSingle();

      if (parentError || !parentData) throw new Error('Parent profile not found');

      const { data: students, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          user:users(*),
          class:classes(*)
        `);

      if (studentError) throw studentError;

      const student = students.find(s => {
        const nameMatches = s.user && s.user.name.toLowerCase().trim() === childName.toLowerCase().trim();
        const rollClean = s.roll_number.toLowerCase().replace(/[^a-z0-9]/g, '');
        const inputRollClean = rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const rollMatches = rollClean === inputRollClean || rollClean.endsWith(inputRollClean);

        if (!s.class) return false;
        const classClean = s.class.name.toLowerCase().replace(/grade/g, '').replace(/[^a-z0-9]/g, '').trim();
        const inputClassClean = className.toLowerCase().replace(/grade/g, '').replace(/[^a-z0-9]/g, '').trim();
        const classMatches = classClean === inputClassClean || classClean.includes(inputClassClean) || inputClassClean.includes(classClean);

        return nameMatches && rollMatches && classMatches;
      });

      if (!student) throw new Error('Student profile not found with the provided Name, Roll Number, and Class.');

      const { data: updatedParent, error: updateError } = await supabase
        .from('parents')
        .update({ child_id: student.id })
        .eq('id', parentData.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedParent;
    }
  },

  listParents: async () => {
    if (!isConfigured) {
      return mockDb.parents.map(parent => {
        const user = mockDb.users.find(u => u.id === parent.user_id);
        return {
          ...parent,
          name: user ? user.name : 'Unknown Parent',
          email: user ? user.email : ''
        };
      });
    }

    const { data, error } = await supabase
      .from('parents')
      .select(`
        *,
        user:users(name, email)
      `);

    if (error) throw error;
    return data;
  }
};

async function getParentByUserId(userId) {
  const { data } = await supabase.from('parents').select('*').eq('user_id', userId).single();
  return data;
}

module.exports = parentService;
