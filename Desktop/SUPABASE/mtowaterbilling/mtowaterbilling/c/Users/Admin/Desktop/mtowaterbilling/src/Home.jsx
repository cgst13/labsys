import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, 
  ListItemIcon, ListItemText, Box, CssBaseline, Container, Paper, Avatar,
  Grid, Card, CardContent, Chip, Button, Divider
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard as DashboardIcon, People as PeopleIcon, 
  Receipt as ReceiptIcon, Payment as PaymentIcon, Person as PersonIcon,
  TrendingUp as TrendingUpIcon, Water as WaterIcon, AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon, Settings as SettingsIcon,
  Logout as LogoutIcon, Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

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
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
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

const Home = ({ icon, title }) => {
  const [open, setOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, active: true },
    { text: 'Customers', icon: <PeopleIcon /> },
    { text: 'Billing', icon: <ReceiptIcon /> },
    { text: 'Payments', icon: <PaymentIcon /> },
    { text: 'Analytics', icon: <AnalyticsIcon /> },
    { text: 'Users', icon: <PersonIcon /> },
  ];

  const statsData = [
    { title: 'Total Customers', value: '1,247', icon: <PeopleIcon />, color: '#4f46e5' },
    { title: 'Monthly Revenue', value: '₱125,430', icon: <MoneyIcon />, color: '#059669' },
    { title: 'Water Consumption', value: '45,230 L', icon: <WaterIcon />, color: '#0ea5e9' },
    { title: 'Pending Bills', value: '89', icon: <ReceiptIcon />, color: '#f59e0b' },
  ];

  const quickActions = [
    { title: 'Add New Customer', description: 'Register a new water service customer', color: '#4f46e5' },
    { title: 'Generate Bills', description: 'Create monthly billing statements', color: '#059669' },
    { title: 'Process Payment', description: 'Record customer payments', color: '#0ea5e9' },
    { title: 'View Reports', description: 'Access detailed analytics and reports', color: '#8b5cf6' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <WaterIcon sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Water Billing System
          </Typography>
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <NotificationsIcon />
          </IconButton>
          <Typography variant="body2" sx={{ mr: 3, opacity: 0.9 }}>
            {currentDateTime.toLocaleString()}
          </Typography>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>A</Avatar>
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #e2e8f0',
            background: '#ffffff',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <Toolbar sx={{ minHeight: '70px !important' }} />
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, mb: 2 }}>
            MAIN MENU
          </Typography>
          <List sx={{ p: 0 }}>
            {menuItems.map((item, index) => (
              <ListItem 
                button 
                key={item.text}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  backgroundColor: item.active ? '#f1f5f9' : 'transparent',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                  },
                }}
              >
                <ListItemIcon sx={{ color: item.active ? '#4f46e5' : '#64748b', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: item.active ? 600 : 400,
                      color: item.active ? '#1e293b' : '#64748b'
                    } 
                  }} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
        
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <List sx={{ p: 0 }}>
            <ListItem button sx={{ borderRadius: 2, mb: 1 }}>
              <ListItemIcon sx={{ color: '#64748b', minWidth: 40 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" sx={{ '& .MuiTypography-root': { color: '#64748b' } }} />
            </ListItem>
            <ListItem button sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ color: '#64748b', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" sx={{ '& .MuiTypography-root': { color: '#64748b' } }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Main open={open}>
        <Toolbar sx={{ minHeight: '70px !important' }} />
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              Dashboard Overview
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#64748b' }}>
              LGU Concepcion, Romblon - Water Billing Management System
            </Typography>
            <Chip 
              label="System Online" 
              color="success" 
              size="small" 
              sx={{ mt: 1, fontWeight: 600 }}
            />
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statsData.map((stat, index) => (
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
                        justifyContent: 'center'
                      }}>
                        {stat.icon}
                      </Box>
                      <TrendingUpIcon sx={{ opacity: 0.7 }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {stat.title}
                    </Typography>
                  </CardContent>
                </StatsCard>
              </Grid>
            ))}
          </Grid>

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
      </Main>
    </Box>
  );
};

export default Home;