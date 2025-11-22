import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Eye, Download, FileText, TrendingUp } from "lucide-react";

interface CategoryStats {
  name: string;
  count: number;
}

interface ViewTrend {
  date: string;
  views: number;
}

const Analytics = () => {
  const [totalResources, setTotalResources] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [viewTrends, setViewTrends] = useState<ViewTrend[]>([]);
  const [topResources, setTopResources] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Total resources
    const { count: resourceCount } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true });
    setTotalResources(resourceCount || 0);

    // Total views and downloads
    const { data: resources } = await supabase
      .from("resources")
      .select("view_count, download_count");
    
    if (resources) {
      const views = resources.reduce((sum, r) => sum + (r.view_count || 0), 0);
      const downloads = resources.reduce((sum, r) => sum + (r.download_count || 0), 0);
      setTotalViews(views);
      setTotalDownloads(downloads);
    }

    // Resources by category
    const { data: categoryData } = await supabase
      .from("resources")
      .select(`
        category_id,
        categories (name)
      `);

    if (categoryData) {
      const stats: Record<string, number> = {};
      categoryData.forEach((item) => {
        const categoryName = item.categories?.name || "Uncategorized";
        stats[categoryName] = (stats[categoryName] || 0) + 1;
      });
      setCategoryStats(
        Object.entries(stats).map(([name, count]) => ({ name, count }))
      );
    }

    // View trends (last 7 days)
    const { data: viewData } = await supabase
      .from("resource_views")
      .select("viewed_at")
      .gte("viewed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (viewData) {
      const trends: Record<string, number> = {};
      viewData.forEach((view) => {
        const date = new Date(view.viewed_at).toLocaleDateString();
        trends[date] = (trends[date] || 0) + 1;
      });
      setViewTrends(
        Object.entries(trends).map(([date, views]) => ({ date, views }))
      );
    }

    // Top resources
    const { data: topData } = await supabase
      .from("resources")
      .select("title, view_count, download_count")
      .order("view_count", { ascending: false })
      .limit(5);
    setTopResources(topData || []);
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--muted))"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track resource usage and engagement</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResources}</div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">Resource views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDownloads}</div>
              <p className="text-xs text-muted-foreground">File downloads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalResources > 0 ? Math.round((totalViews / totalResources) * 10) / 10 : 0}
              </div>
              <p className="text-xs text-muted-foreground">Views per resource</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Resources by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Resources by Category</CardTitle>
              <CardDescription>Distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* View Trends */}
          <Card>
            <CardHeader>
              <CardTitle>View Trends</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={viewTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Top Resources</CardTitle>
            <CardDescription>Most viewed resources</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topResources}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="view_count" fill="hsl(var(--primary))" name="Views" />
                <Bar dataKey="download_count" fill="hsl(var(--accent))" name="Downloads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
