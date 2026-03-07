import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export type Module = 'dashboard' | 'lead' | 'customer' | 'order' | 'cskh' | 're_exam' | 'settings' | 'user' | 'report' | 'revenue' | 'system';
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'view_all' | 'import' | 'access' | 'manage';

interface PermissionContextType {
  hasPermission: (module: Module, action: Action) => boolean;
  canView: (module: Module) => boolean;
  canCreate: (module: Module) => boolean;
  canEdit: (module: Module) => boolean;
  canDelete: (module: Module) => boolean;
  canViewAll: (module: Module) => boolean;
  canImport: (module: Module) => boolean;
  refreshPermissions: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshPermissions = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPermissions({});
        setIsAdmin(false);
        return;
      }

      // 1. Lấy vai trò của user (từ user_roles hoặc profiles)
      // Theo yêu cầu: dùng bảng user_roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_id, roles(is_system)')
        .eq('user_id', session.user.id);

      if (!userRoles || userRoles.length === 0) {
        // Fallback to profiles if user_roles is empty
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role === 'admin') {
          setIsAdmin(true);
          return;
        }
        setPermissions({});
        setIsAdmin(false);
        return;
      }

      const isSystemAdmin = userRoles.some((ur: any) => ur.roles?.is_system && ur.role_id === 'admin');
      if (isSystemAdmin) {
        setIsAdmin(true);
        return;
      }

      setIsAdmin(false);
      const roleIds = userRoles.map(ur => ur.role_id);

      // 2. Lấy quyền của các vai trò
      const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select('module, action, allowed')
        .in('role_id', roleIds)
        .eq('allowed', true);

      const permMap: Record<string, boolean> = {};
      if (rolePerms) {
        rolePerms.forEach(p => {
          permMap[`${p.module}.${p.action}`] = true;
        });
      }
      setPermissions(permMap);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPermissions();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      refreshPermissions();
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const hasPermission = useCallback((module: Module, action: Action): boolean => {
    if (isAdmin) return true;
    return !!permissions[`${module}.${action}`];
  }, [isAdmin, permissions]);

  const canView = useCallback((module: Module) => hasPermission(module, 'view'), [hasPermission]);
  const canCreate = useCallback((module: Module) => hasPermission(module, 'create'), [hasPermission]);
  const canEdit = useCallback((module: Module) => hasPermission(module, 'edit'), [hasPermission]);
  const canDelete = useCallback((module: Module) => hasPermission(module, 'delete'), [hasPermission]);
  const canViewAll = useCallback((module: Module) => hasPermission(module, 'view_all'), [hasPermission]);
  const canImport = useCallback((module: Module) => hasPermission(module, 'import'), [hasPermission]);

  const value = useMemo(() => ({
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canViewAll,
    canImport,
    refreshPermissions,
    isLoading,
    isAdmin
  }), [hasPermission, canView, canCreate, canEdit, canDelete, canViewAll, canImport, refreshPermissions, isLoading, isAdmin]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};
