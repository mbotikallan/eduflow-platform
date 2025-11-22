import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users as UsersIcon, GraduationCap, BookOpen, Shield } from "lucide-react";

interface UserData {
  id: string;
  full_name: string | null;
  user_roles: { role: string }[];
  resources?: { id: string }[];
}

const Users = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    admins: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, user_id");

    if (profiles) {
      const usersWithData = await Promise.all(
        profiles.map(async (profile) => {
          const [rolesData, resourcesData] = await Promise.all([
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", profile.user_id),
            supabase
              .from("resources")
              .select("id")
              .eq("uploaded_by", profile.user_id),
          ]);

          return {
            ...profile,
            user_roles: rolesData.data || [],
            resources: resourcesData.data || [],
          };
        })
      );

      setUsers(usersWithData as any);

      // Calculate stats
      const students = usersWithData.filter((u) => 
        u.user_roles.some((r: any) => r.role === "student")
      ).length;
      const teachers = usersWithData.filter((u) =>
        u.user_roles.some((r: any) => r.role === "teacher")
      ).length;
      const admins = usersWithData.filter((u) =>
        u.user_roles.some((r: any) => r.role === "admin")
      ).length;

      setStats({
        total: usersWithData.length,
        students,
        teachers,
        admins,
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any }> = {
      student: { variant: "default", icon: GraduationCap },
      teacher: { variant: "secondary", icon: BookOpen },
      admin: { variant: "destructive", icon: Shield },
    };
    const config = variants[role] || variants.student;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {role}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Monitor users and their activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teachers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View and manage system users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {user.full_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user.full_name || "Unknown User"}</h3>
                      <div className="flex gap-2 mt-1">
                        {user.user_roles.map((roleObj, index) => (
                          <div key={index}>{getRoleBadge(roleObj.role)}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.resources && user.resources.length > 0 && (
                      <span>{user.resources.length} resources uploaded</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Users;
