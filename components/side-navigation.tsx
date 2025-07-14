"use client"

import type React from "react"
import { List, ListItem, ListItemIcon, ListItemText, Divider, Drawer, IconButton } from "@mui/material"
import DashboardIcon from "@mui/icons-material/Dashboard"
import PeopleIcon from "@mui/icons-material/People"
import BarChartIcon from "@mui/icons-material/BarChart"
import AssignmentIcon from "@mui/icons-material/Assignment"
import SettingsIcon from "@mui/icons-material/Settings"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import { styled } from "@mui/material/styles"
import { Link } from "react-router-dom"

interface SideNavigationProps {
  open: boolean
  toggleDrawer: () => void
}

const drawerWidth = 240

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}))

const SideNavigation: React.FC<SideNavigationProps> = ({ open, toggleDrawer }) => {
  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <IconButton onClick={toggleDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        <ListItem button component={Link} to="/dashboard">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} to="/users">
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Users" />
        </ListItem>
        <ListItem button component={Link} to="/reports">
          <ListItemIcon>
            <BarChartIcon />
          </ListItemIcon>
          <ListItemText primary="Reports" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button component={Link} to="/cms/dashboard">
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="CMS Content" />
        </ListItem>
        <ListItem button component={Link} to="/cms/details">
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Edit CMS Content" />
        </ListItem>
      </List>
    </Drawer>
  )
}

export default SideNavigation
