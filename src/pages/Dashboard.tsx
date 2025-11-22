import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, FileText, Video, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  view_count: number;
  download_count: number;
  created_at: string;
  categories: { name: string } | null;
  profiles: { full_name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

const Dashboard = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchResources();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching resources:", error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch related data separately
    if (data) {
      const enrichedData = await Promise.all(
        data.map(async (resource) => {
          const [categoryData, profileData] = await Promise.all([
            resource.category_id
              ? supabase.from("categories").select("name").eq("id", resource.category_id).single()
              : Promise.resolve({ data: null }),
            supabase.from("profiles").select("full_name").eq("user_id", resource.uploaded_by).single(),
          ]);

          return {
            ...resource,
            categories: categoryData.data,
            profiles: profileData.data,
          };
        })
      );

      setResources(enrichedData as any);
    }
    
    setLoading(false);
  };

  const handleView = async (resource: Resource) => {
    // Track view
    await supabase.from("resource_views").insert({
      resource_id: resource.id,
      user_id: user?.id,
    });

    // Increment view count
    await supabase
      .from("resources")
      .update({ view_count: resource.view_count + 1 })
      .eq("id", resource.id);

    // Open resource
    window.open(resource.file_url, "_blank");
    
    // Refresh data
    fetchResources();
  };

  const handleDownload = async (resource: Resource) => {
    // Increment download count
    await supabase
      .from("resources")
      .update({ download_count: resource.download_count + 1 })
      .eq("id", resource.id);

    // Trigger download
    const link = document.createElement("a");
    link.href = resource.file_url;
    link.download = resource.title;
    link.click();
    
    // Refresh data
    fetchResources();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "pdf":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getFileTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      video: "default",
      image: "secondary",
      pdf: "destructive",
    };
    return <Badge variant={variants[type] || "default"}>{type.toUpperCase()}</Badge>;
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || resource.categories?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
          <p className="text-muted-foreground">Browse and access educational materials</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted" />
                <CardContent className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No resources found</p>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(resource.file_type)}
                      <CardTitle className="text-lg line-clamp-1">{resource.title}</CardTitle>
                    </div>
                    {getFileTypeBadge(resource.file_type)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {resource.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{resource.categories?.name || "Uncategorized"}</span>
                    <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {resource.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {resource.download_count}
                      </span>
                    </div>
                    <span className="text-xs">by {resource.profiles?.full_name || "Unknown"}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(resource)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(resource)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
