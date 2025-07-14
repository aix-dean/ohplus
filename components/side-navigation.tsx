"use client"

import type React from "react"
import { Box, List, ListItem, ListItemIcon, ListItemText, Divider, Typography } from "@mui/material"
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Layers as LayersIcon,
  Assignment as AssignmentTwoIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
} from "@mui/icons-material"
import { Link } from "react-router-dom"

interface SideNavigationProps {
  onClose: () => void
}

const SideNavigation: React.FC<SideNavigationProps> = ({ onClose }) => {
  return (
    <Box sx={{ width: 240 }} role="presentation" onClick={onClose} onKeyDown={onClose}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h6" component="div">
          Logistics App
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button component={Link} to="/logistics/dashboard">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} to="/logistics/orders">
          <ListItemIcon>
            <ShoppingCartIcon />
          </ListItemIcon>
          <ListItemText primary="Orders" />
        </ListItem>
        <ListItem button component={Link} to="/logistics/customers">
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Customers" />
        </ListItem>
        <ListItem button component={Link} to="/logistics/reports">
          <ListItemIcon>
            <BarChartIcon />
          </ListItemIcon>
          <ListItemText primary="Reports" />
        </ListItem>
        <ListItem button component={Link} to="/logistics/integrations">
          <ListItemIcon>
            <LayersIcon />
          </ListItemIcon>
          <ListItemText primary="Integrations" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <Typography sx={{ mt: 2, ml: 2 }} variant="overline" display="block" gutterBottom>
          To Do
        </Typography>
        <ListItem button component={Link} to="/logistics/current-shipments">
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Current Shipments" />
        </ListItem>
        <ListItem button component={Link} to="/logistics/service-reports">
          <ListItemIcon>
            <AssignmentTwoIcon />
          </ListItemIcon>
          <ListItemText primary="Service Reports" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <Typography sx={{ mt: 2, ml: 2 }} variant="overline" display="block" gutterBottom>
          Settings & Help
        </Typography>
        <ListItem button component={Link} to="/logistics/settings">
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        <ListItem button component={Link} to="/logistics/help">
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText primary="Help" />
        </ListItem>
      </List>
    </Box>
  )
}

export default SideNavigation
