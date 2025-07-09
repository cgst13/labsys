import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem,
  ListItemIcon, ListItemText, Box, CssBaseline, Avatar, Divider, Badge, Menu, MenuItem, Collapse
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, People as PeopleIcon,
  Receipt as ReceiptIcon, Payment as PaymentIcon, Person as PersonIcon,
  Analytics as AnalyticsIcon, Water as WaterIcon, Notifications as NotificationsIcon,
  Logout as LogoutIcon, Settings as SettingsIcon, Help as HelpIcon, AccountBalanceWallet as WalletIcon,
  ExpandLess, ExpandMore, Build as BuildIcon, Calculate as CalculateIcon, History as HistoryIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { supabase } from './supabaseClient';
import ProfileDialog from './ProfileDialog';

const drawerWidth = 240;

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
    display: 'block',
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  })
);

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 64,
  marginBottom: theme.spacing(2),
}));

const Layout = () => {
  const [open, setOpen] = useState(window.innerWidth >= 900); // open by default on desktop
  const [user, setUser] = useState({ name: '', role: '', email: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifCount] = useState(3); // Example notification count
  const [toolsOpen, setToolsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          console.error('No user email found in localStorage.');
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('firstname, lastname, role, email, department, position, status, datecreated, lastlogin')
          .eq('email', email)
          .single();
        if (error) {
          console.error('Error fetching user data:', error);
        } else {
          setUser({
            name: `${data.firstname} ${data.lastname}`,
            role: data.role,
            email: data.email,
            department: data.department,
            position: data.position,
            status: data.status,
            datecreated: data.datecreated,
            lastlogin: data.lastlogin
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    fetchUserData();
    const handleResize = () => setOpen(window.innerWidth >= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleProfileOpen = () => {
    setProfileOpen(true);
    handleMenuClose();
  };
  const handleProfileClose = () => setProfileOpen(false);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleToolsSubmenuClick = (sub) => {
    if (sub.text === 'RPT Calculator') {
      navigate('/tools/rpt-calculator');
    }
    // Add more navigation for other tools as needed
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, route: '/home' },
    { text: 'Customers', icon: <PeopleIcon />, route: '/customers' },
    { text: 'Billing', icon: <ReceiptIcon />, route: '/billing' },
    { text: 'Payments', icon: <PaymentIcon />, route: '/payments' },
    { text: 'Credit Management', icon: <WalletIcon />, route: '/credit-management' },
    { text: 'Reports', icon: <AnalyticsIcon />, route: '/reports' },
    { text: 'Users', icon: <PersonIcon />, route: '/users' },
    { text: 'Tools', icon: <BuildIcon />, children: [
      { text: 'RPT Calculator', icon: <CalculateIcon /> },
      { text: 'Old System 2025', icon: <HistoryIcon /> },
      { text: 'Old System 2024', icon: <HistoryIcon /> },
    ] },
  ];

  // Dynamic page title based on route
  const getPageTitle = () => {
    const found = menuItems.find(item => location.pathname.startsWith(item.route));
    return found ? found.text : 'Water Billing System';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #06b6d4 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important', px: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', letterSpacing: 1, lineHeight: 1 }}>
                Water Billing System
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#e0e7ef', fontWeight: 400, fontSize: 15, letterSpacing: 0.5 }}>
                LGU Concepcion, Romblon
              </Typography>
            </Box>
            {/* Existing right-side icons and avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton color="inherit" sx={{ mr: 1 }}>
                <Badge badgeContent={notifCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <IconButton color="inherit" sx={{ mr: 1 }}>
                <HelpIcon />
              </IconButton>
              <Typography variant="body2" sx={{ mr: 1, opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>
                {user.name}
              </Typography>
              <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600, cursor: 'pointer' }} onClick={handleAvatarClick}>
                {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'}
              </Avatar>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>
                  <PersonIcon sx={{ mr: 1 }} /> {user.name}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleProfileOpen}>
                  <SettingsIcon sx={{ mr: 1 }} /> Profile & Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: open ? drawerWidth : 64,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 64,
            boxSizing: 'border-box',
            borderRight: '1px solid #e2e8f0',
            background: '#ffffff',
            transition: 'width 0.2s',
            overflowX: 'hidden',
          },
        }}
        variant={window.innerWidth < 900 ? 'temporary' : 'permanent'}
        anchor="left"
        open={open}
        onClose={handleDrawerToggle}
      >
        <LogoBox>
          <WaterIcon sx={{ fontSize: 36, color: '#06b6d4', mr: open ? 1 : 0 }} />
          {open && <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a8a' }}>MTO Water</Typography>}
        </LogoBox>
        <Divider />
        <List sx={{ p: 0 }}>
          {menuItems.map((item, index) => (
            item.children ? (
              <React.Fragment key={item.text}>
                <ListItem button onClick={() => setToolsOpen(!toolsOpen)}
                  sx={{ borderRadius: 2, mb: 1, mx: 1, minHeight: 48, justifyContent: open ? 'initial' : 'center', px: open ? 2 : 1 }}>
                  <ListItemIcon sx={{ color: '#64748b', minWidth: 40, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                  {open && <ListItemText primary={item.text} />}
                  {open && (toolsOpen ? <ExpandLess /> : <ExpandMore />)}
                </ListItem>
                <Collapse in={toolsOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((sub, subIdx) => (
                      <ListItem button key={sub.text} onClick={() => handleToolsSubmenuClick(sub)} sx={{ pl: open ? 6 : 2, borderRadius: 2, mb: 1, mx: 1, minHeight: 40 }}>
                        <ListItemIcon sx={{ color: '#64748b', minWidth: 40, justifyContent: 'center' }}>{sub.icon}</ListItemIcon>
                        {open && <ListItemText primary={sub.text} />}
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ) : (
              <ListItem
                button
                key={item.text}
                onClick={() => item.route && navigate(item.route)}
                selected={location.pathname.startsWith(item.route)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  mx: 1,
                  backgroundColor: location.pathname.startsWith(item.route) ? '#e0f2fe' : 'transparent',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                  },
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: open ? 2 : 1,
                }}
              >
                <ListItemIcon sx={{ color: location.pathname.startsWith(item.route) ? '#06b6d4' : '#64748b', minWidth: 40, justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: location.pathname.startsWith(item.route) ? 700 : 400,
                      color: location.pathname.startsWith(item.route) ? '#1e3a8a' : '#64748b',
                    }
                  }}
                />}
              </ListItem>
            )
          ))}
        </List>
      </Drawer>
      <Main open={open} className="css-iiowsh">
        <Toolbar sx={{ minHeight: '70px !important' }} />
        <Outlet />
      </Main>
      <ProfileDialog open={profileOpen} onClose={handleProfileClose} user={user} />
    </Box>
  );
};

export default Layout; 