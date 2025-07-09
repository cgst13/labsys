import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, 
  ListItemIcon, ListItemText, Box, CssBaseline, Container, Paper, Avatar,
  Grid, Card, CardContent, Chip, Button, Divider, Skeleton
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard as DashboardIcon, People as PeopleIcon, 
  Receipt as ReceiptIcon, Payment as PaymentIcon, Person as PersonIcon,
  TrendingUp as TrendingUpIcon, Water as WaterIcon, AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon, Settings as SettingsIcon,
  Logout as LogoutIcon, Analytics as AnalyticsIcon, Group as GroupIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { supabase } from './supabaseClient'; // Ensure you have the correct path to your Supabase client
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageHeader from './PageHeader';

const drawerWidth = 280;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const StatsCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #e0f7ff 0%, #cce7ff 100%)',
  color: '#1e293b',
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
  },
}));

const ActionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.2s ease-in-out',
  border: '1px solid #e2e8f0',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderColor: '#4f46e5',
  },
}));

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value.toString().replace(/[^0-9]/g, ''));
    if (isNaN(end)) return setDisplay(value);
    if (start === end) return;
    let increment = end / 30;
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  if (typeof value === 'string' && value.includes('₱')) {
    return `₱${display.toLocaleString()}`;
  }
  if (typeof value === 'string' && value.includes('L')) {
    return `${display.toLocaleString()} L`;
  }
  return display.toLocaleString();
};

const Home = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [user, setUser] = useState({ name: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: null,
    monthlyRevenue: null,
    waterConsumption: null,
    pendingBills: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the logged-in user's email from localStorage
        const email = localStorage.getItem('userEmail');
        if (!email) {
          console.error('No user email found in localStorage.');
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('firstname, lastname, role')
          .eq('email', email)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
        } else {
          setUser({
            name: `${data.firstname} ${data.lastname}`,
            role: data.role,
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
      setLoading(false);
    };

    fetchUserData();

    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const monthStart = `${year}-${month}-01`;
      const nextMonth = new Date(year, now.getMonth() + 1, 1);
      const monthEnd = nextMonth.toISOString().slice(0, 10);
      // Total Customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      // Monthly Revenue (sum of totalbillamount for Paid bills this month)
      const { data: paidBills, error: paidBillsError } = await supabase
        .from('bills')
        .select('totalbillamount, paymentstatus, datepaid')
        .gte('datepaid', monthStart)
        .lt('datepaid', monthEnd)
        .eq('paymentstatus', 'Paid');
      const monthlyRevenue = paidBills && paidBills.length > 0
        ? paidBills.reduce((sum, b) => sum + (Number(b.totalbillamount) || 0), 0)
        : 0;
      // Water Consumption (sum of consumption for Paid bills this month)
      const waterConsumption = paidBills && paidBills.length > 0
        ? paidBills.reduce((sum, b) => sum + (Number(b.consumption) || 0), 0)
        : 0;
      // Pending Bills (count of bills not Paid)
      const { count: pendingBills } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .neq('paymentstatus', 'Paid');
      setStats({
        totalCustomers: totalCustomers ?? 0,
        monthlyRevenue,
        waterConsumption,
        pendingBills: pendingBills ?? 0,
      });
      setLoadingStats(false);
    };
    fetchStats();
  }, []);

  const statsData = [
    { title: 'Total Customers', value: stats.totalCustomers, icon: <PeopleIcon />, color: '#4f46e5', format: v => v?.toLocaleString() },
    { title: 'Monthly Revenue', value: stats.monthlyRevenue, icon: <MoneyIcon />, color: '#059669', format: v => v != null ? `₱${Number(v).toLocaleString()}` : '' },
    { title: 'Water Consumption', value: stats.waterConsumption, icon: <WaterIcon />, color: '#0ea5e9', format: v => v != null ? `${Number(v).toLocaleString()} L` : '' },
    { title: 'Pending Bills', value: stats.pendingBills, icon: <ReceiptIcon />, color: '#f59e0b', format: v => v?.toLocaleString() },
  ];

  const quickActions = [
    { title: 'Add New Customer', description: 'Register a new water service customer', color: '#4f46e5' },
    { title: 'Generate Bills', description: 'Create monthly billing statements', color: '#059669' },
    { title: 'Process Payment', description: 'Record customer payments', color: '#0ea5e9' },
    { title: 'View Reports', description: 'Access detailed analytics and reports', color: '#8b5cf6' },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 102000 },
    { month: 'Feb', revenue: 110500 },
    { month: 'Mar', revenue: 120000 },
    { month: 'Apr', revenue: 115000 },
    { month: 'May', revenue: 123000 },
    { month: 'Jun', revenue: 130000 },
    { month: 'Jul', revenue: 128000 },
    { month: 'Aug', revenue: 135000 },
    { month: 'Sep', revenue: 140000 },
    { month: 'Oct', revenue: 138000 },
    { month: 'Nov', revenue: 145000 },
    { month: 'Dec', revenue: 152000 },
  ];

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, route: '/home' },
    { text: 'Customers', icon: <PeopleIcon />, route: '/customers' },
    { text: 'Billing', icon: <ReceiptIcon />, route: '/billing' },
    { text: 'Payments', icon: <PaymentIcon /> },
    { text: 'Analytics', icon: <AnalyticsIcon /> },
    { text: 'Users', icon: <PersonIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* Remove AppBar, Drawer, and sidebar rendering. */}
      {/* Only render the dashboard cards, quick actions, etc. */}
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        <PageHeader
          title="Dashboard Overview"
          subtitle="LGU Concepcion, Romblon - Water Billing Management System"
          actions={<Chip label="System Online" color="success" size="small" sx={{ fontWeight: 600 }} />}
        />

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {loadingStats
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                      <Skeleton variant="rectangular" height={120} animation="wave" />
                    </Card>
                  </Grid>
                ))
              : statsData.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <StatsCard>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)', 
                            borderRadius: 2, 
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 32,
                          }}>
                            {stat.icon}
                          </Box>
                          <TrendingUpIcon sx={{ opacity: 0.7 }} />
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '2rem', md: '2.5rem' } }}>
                          {stat.format ? stat.format(stat.value) : <AnimatedNumber value={stat.value} />}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {stat.title}
                        </Typography>
                      </CardContent>
                    </StatsCard>
                  </Grid>
                ))}
          </Grid>

          {/* Revenue Trend Chart */}
          <Paper elevation={3} sx={{ mb: 4, p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              Monthly Revenue Trend
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={320} animation="wave" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={revenueData} margin={{ top: 16, right: 32, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontWeight: 600, fill: '#64748b' }} />
                  <YAxis tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} tick={{ fontWeight: 600, fill: '#64748b' }} />
                  <Tooltip formatter={v => `₱${v.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>

          {/* Quick Actions */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <ActionCard>
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: '50%', 
                          backgroundColor: `${action.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px auto'
                        }}
                      >
                        <Box sx={{ color: action.color, fontSize: 24 }}>
                          {index === 0 && <PeopleIcon />}
                          {index === 1 && <ReceiptIcon />}
                          {index === 2 && <PaymentIcon />}
                          {index === 3 && <AnalyticsIcon />}
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1e293b' }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        {action.description}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          borderColor: action.color,
                          color: action.color,
                          '&:hover': {
                            backgroundColor: `${action.color}10`,
                            borderColor: action.color
                          }
                        }}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </ActionCard>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Recent Activity */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Recent Activity
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                No recent activity to display. Start by adding customers or processing payments.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ 
                  mt: 2,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338ca, #6d28d9)',
                  }
                }}
              >
                View All Activities
              </Button>
            </Box>
          </Paper>
        </Container>
    </Box>
  );
};

export default Home;