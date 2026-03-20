export interface UserRights {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

export interface UserPermissions {
    user: UserRights;
    course: UserRights;
    enrollment: UserRights;
    scheduleSlot: UserRights;
}

export function getUserPermissions(role: string): UserPermissions {
    switch (role) {
        case 'teacher':
            return {
                user: { canRead: true, canCreate: false, canUpdate: true, canDelete: false },
                course: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
                enrollment: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
                scheduleSlot: { canRead: true, canCreate: true, canUpdate: true, canDelete: true }
            };
        
        case 'student':
            return {
                user: { canRead: true, canCreate: false, canUpdate: true, canDelete: false },
                course: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
                enrollment: { canRead: true, canCreate: true, canUpdate: false, canDelete: true },
                scheduleSlot: { canRead: true, canCreate: false, canUpdate: false, canDelete: false }
            };
        
        default:
            return {
                user: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
                course: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
                enrollment: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
                scheduleSlot: { canRead: false, canCreate: false, canUpdate: false, canDelete: false }
            };
    }
}

export function checkPermission(userRole: string, resource: 'user' | 'course' | 'enrollment' | 'scheduleSlot', action: 'read' | 'create' | 'update' | 'delete'): boolean {
    const permissions = getUserPermissions(userRole);
    const resourcePermissions = permissions[resource];
    
    switch (action) {
        case 'read':
            return resourcePermissions.canRead;
        case 'create':
            return resourcePermissions.canCreate;
        case 'update':
            return resourcePermissions.canUpdate;
        case 'delete':
            return resourcePermissions.canDelete;
        default:
            return false;
    }
}