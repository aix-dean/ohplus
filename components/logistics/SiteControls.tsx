"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"
import { useState, useEffect } from "react"
import {
  Settings,
  Power,
  RotateCcw,
  Pause,
  ToggleLeft,
  Timer,
  RefreshCw,
  Camera,
  TestTube,
  Play,
  Sun,
  FolderSyncIcon as Sync,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SiteControlsProps {
  product: any
}

export default function SiteControls({ product }: SiteControlsProps) {
  // Mock LED status data - in a real app, this would come from the product data
  const ledStatus = {
    powerStatus: "On",
    temperature: "32°C",
    connection: "Online",
    videoSource: "HDMI 1",
    activeContent: "Current Campaign",
    lastReboot: new Date().toLocaleDateString() + " 09:15 AM",
    lastTimeSync: new Date().toLocaleDateString() + " 08:00 AM",
    warnings: product.specs_rental?.elevation && product.specs_rental.elevation > 100 ? ["High elevation detected"] : [],
  }

  // State to store player status data
  const [playerStatus, setPlayerStatus] = useState<any>(null)

  // State to store player configuration data
  const [playerConfiguration, setPlayerConfiguration] = useState<any>(null)

  // State for brightness slider
  const [brightnessValue, setBrightnessValue] = useState<number>(50)

  // State for volume slider
  const [volumeValue, setVolumeValue] = useState<number>(60)

  // Toast hook
  const { toast } = useToast()

  // Fetch player status and configuration on component mount
  useEffect(() => {
    fetchPlayerStatus()
    fetchPlayerConfiguration()
  }, [])

  const handleAutoBrightness = async () => {
    try {
      const response = await fetch("https://cms-novacloud-272363630855.asia-southeast1.run.app/api/v1/players/realtime-control/brightness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "playerIds": ["141a16d405254b8fb5c5173ef3a58cc5"],
          "value": 0,
          "noticeUrl": "http://www.abc.com/notice"
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Auto Brightness request sent successfully",
        });
      } else {
        alert("Failed to send Auto Brightness request");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error sending Auto Brightness request");
    }
  }

  const handleScreenshot = async () => {
    try {
      const response = await fetch("https://cms-novacloud-272363630855.asia-southeast1.run.app/api/v1/players/realtime-control/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "playerIds": ["141a16d405254b8fb5c5173ef3a58cc5"],
          "noticeUrl": "http://www.abc.com/notice"
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`screen shot data: `)
        if (data.screenshotUrl || data.url) {
          // Automatically download the screenshot
          const screenshotUrl = data.screenshotUrl || data.url;
          const link = document.createElement('a');
          link.href = screenshotUrl;
          link.download = `screenshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          toast({
            title: "Success",
            description: "Screenshot request sent, but no download URL received",
          });
        }
      } else {
        alert("Failed to take screenshot");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error taking screenshot");
    }
  }

  const handlePauseContent = async () => {
    try {
      const response = await fetch("https://cms-novacloud-272363630855.asia-southeast1.run.app/api/v1/players/solutions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "playerIds": ["141a16d405254b8fb5c5173ef3a58cc5"]
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content paused successfully",
        });
      } else {
        alert("Failed to pause content");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error pausing content");
    }
  }

  const handleRestart = async () => {
    try{
      const statusResponse = await fetch("https://cms-novacloud-272363630855.asia-southeast1.run.app/api/v1/players/realtime-control/restart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "playerIds": ["141a16d405254b8fb5c5173ef3a58cc5"],
        })
        
      })
      if (statusResponse.ok) {
        fetchPlayerStatus()
       toast({
          title: "Success",
          description: "The Player successfully restart",
        });
      } else {
        console.error("Failed to fetch player status");
      }
    }catch(e){
      console.error("Error fetching player status:", e);
    }
  }

  // Function to fetch and store player status data
  const fetchPlayerStatus = async () => {
    try {
      const statusResponse = await fetch("https://cms-novacloud-272363630855.asia-southeast1.run.app/api/v1/players/status/player-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "playerIds": ["141a16d405254b8fb5c5173ef3a58cc5"],
          "playerSns": ["2ZVA53C25W2A10067082"]
        })
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setPlayerStatus(statusData);
        console.log("Player status saved:", statusData);
      } else {
        console.error("Failed to fetch player status");
      }
    } catch (error) {
      console.error("Error fetching player status:", error);
    }
  }

  // Function to fetch and store player configuration data
  const fetchPlayerConfiguration = async () => {
    try {
      const configResponse = await fetch("https://cms-novacloud-272363630855.asia-southeast1.run.app/api/v1/players/status/configuration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "playerIds": ["141a16d405254b8fb5c5173ef3a58cc5"],
          "commands": ["volumeValue", "brightnessValue", "videoSourceValue", "timeValue"],
          "noticeUrl": "http://www.abc.com/notice"
        })
      });

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setPlayerConfiguration(configData);
        console.log("Player configuration saved:", configData);
      } else {
        console.error("Failed to fetch player configuration");
      }
    } catch (error) {
      console.error("Error fetching player configuration:", error);
    }
  }

  // Function to apply brightness control
  const handleApplyBrightness = async () => {
    try {
      const response = await fetch("https://cms-novacloud-272363630855.asia-southeast1.run.app/api/v1/players/realtime-control/brightness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "playerIds": ["141a16d405254b8fb5c5173ef3a58cc5"],
          "value": brightnessValue,
          "noticeUrl": "http://www.abc.com/notice"
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Brightness set to ${brightnessValue}% successfully`,
        });
      } else {
        alert("Failed to set brightness");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error setting brightness");
    }
  }

  // Function to apply volume control
  const handleApplyVolume = async () => {
    try {
      const response = await fetch("https://cms-novacloud-272363630855.asia-southeast1.run.app/api/v1/players/realtime-control/volume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "playerIds": ["141a16d405254b8fb5c5173ef3a58cc5"],
          "value": volumeValue,
          "noticeUrl": "http://www.abc.com/notice"
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Volume set to ${volumeValue}% successfully`,
        });
      } else {
        alert("Failed to set volume");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error setting volume");
    }
  }




  return (
    <div className="space-y-6">
        <div className="w-full">
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> */}
        {/* LED Site Status */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={18} />
              LED Site Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Power Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{ledStatus.powerStatus}</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Connection</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{ledStatus.connection}</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Temperature</span>
                <p className="text-sm mt-1">{ledStatus.temperature}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Video Source</span>
                <p className="text-sm mt-1">{ledStatus.videoSource}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Active Content</span>
                <p className="text-sm mt-1 text-blue-600">{ledStatus.activeContent}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Last Time Sync</span>
                <p className="text-sm mt-1">{ledStatus.lastTimeSync}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-500">Last Reboot</span>
                <p className="text-sm mt-1">{ledStatus.lastReboot}</p>
              </div>
            </div>

            {ledStatus.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <span className="text-sm font-medium">⚠ Warnings</span>
                </div>
                <ul className="mt-1 text-sm text-yellow-700">
                  {ledStatus.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card> */}

        {/* Remote Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power size={18} />
              Remote Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                <Power size={16} />
                
              </Button>
              <Button 
              variant="outline" 
              onClick={handleRestart}
              className="flex items-center gap-2 bg-transparent">
                <RotateCcw size={16} />
                Restart Players
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-3">Content Controls</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={handlePauseContent}
                >
                  <Pause size={16} />
                  Pause Content
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <ToggleLeft size={16} />
                  Switch Source
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">System Controls</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Timer size={16} />
                  NTP Time Sync
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <RefreshCw size={16} />
                  Screen Refresh
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Monitoring</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={handleScreenshot}
                >
                  <Camera size={16} />
                  Screenshot
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <RefreshCw size={16} />
                  Refresh Status
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Quick Actions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <TestTube size={16} />
                  Test Pattern
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Play size={16} />
                  Run Diagnostics
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={handleAutoBrightness}
                >
                  <Sun size={16} />
                  Auto Brightness
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Sync size={16} />
                  Sync Playback
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>Content</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Display Health
              </Badge>
              <span>Structure</span>
            </div>
            <span>
              {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
            </span>
            <Button size="sm" variant="outline">
              Live
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {livePreview.map((preview) => (
              <div key={preview.id} className="text-center">
                <div className="bg-gray-100 rounded-lg p-2 mb-2">
                  <Image
                    src={preview.image || "/placeholder.svg"}
                    alt={preview.id}
                    width={150}
                    height={100}
                    className="w-full h-auto rounded"
                  />
                </div>
                <p className="text-sm font-medium truncate">{preview.id}</p>
                <Badge
                  className={
                    preview.health.includes("100%")
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {preview.health}
                </Badge>
              </div>
            ))}
          </div>

          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Create Service Assignment</Button>
        </CardContent>
      </Card> */}

      {/* Brightness and Volume Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Brightness Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Slider
                value={[brightnessValue]}
                onValueChange={(value) => setBrightnessValue(value[0])}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0%</span>
                <span>{brightnessValue}%</span>
                <span>100%</span>
              </div>
              <Button onClick={handleApplyBrightness} className="w-full">
                Apply Brightness
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Slider
                value={[volumeValue]}
                onValueChange={(value) => setVolumeValue(value[0])}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0%</span>
                <span>{volumeValue}%</span>
                <span>100%</span>
              </div>
              <Button onClick={handleApplyVolume} className="w-full">
                Apply Volume
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
