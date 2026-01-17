# Remote MPD Playback Setup Guide

This guide explains how to set up **remote playback** using MPD (Music Player Daemon) on a Raspberry Pi, allowing noiseport on macOS to control playback on a remote audio system.

## Overview

With remote MPD playback, noiseport runs on your macOS computer and provides the UI for browsing/searching your Navidrome music library, while audio playback happens on a remote device (e.g., Raspberry Pi connected to a DAC).

### Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  rpi1            │         │  macOS           │         │  rpi2            │
│  Navidrome       │◄────────│  noiseport       │─────────►│  MPD + DAC       │
│  Music Library   │  HTTP   │  (UI + Control)  │  TCP    │  (Audio Output)  │
└──────────────────┘         └──────────────────┘  6600   └──────────────────┘
```

- **rpi1**: Runs Navidrome server + stores music library on SSD
- **macOS**: Runs noiseport desktop app (UI for browsing/control)
- **rpi2**: Runs MPD, connected to USB DAC for audio output

## Prerequisites

- noiseport installed on macOS (with remote MPD branch)
- Raspberry Pi (tested on RPi 3/4) with Raspberry Pi OS
- USB DAC connected to Raspberry Pi
- All devices on the same local network
- Navidrome server running and accessible

---

## Part 1: Set Up MPD on Raspberry Pi (rpi2)

### 1.1 Install MPD

```bash
sudo apt update
sudo apt install mpd mpc
```

### 1.2 Configure MPD

Edit the MPD configuration file:

```bash
sudo nano /etc/mpd.conf
```

**Key settings to configure:**

```conf
# Network settings - listen on all interfaces
bind_to_address "0.0.0.0"
port "6600"

# Optional: Set a password for MPD access
# Uncomment and set a password if you want authentication
# password "your_password_here@read,add,control,admin"

# Music directory (not needed for HTTP streaming, but MPD requires it)
music_directory "/var/lib/mpd/music"

# Allow HTTP/HTTPS URLs (required for Navidrome streaming)
follow_outside_symlinks "yes"
follow_symlinks "yes"

# Audio output to USB DAC
audio_output {
    type "alsa"
    name "USB DAC"
    device "hw:CARD=DAC,DEV=0"  # Adjust based on your DAC
    mixer_type "software"       # or "hardware" if DAC supports it
    mixer_device "default"
}

# Optional: Disable unwanted outputs
audio_output {
    type "pulse"
    name "PulseAudio"
    enabled "no"
}
```

**Find your USB DAC device name:**

```bash
aplay -l
```

Look for your DAC in the output and note the card number and device number. Adjust the `device` line accordingly:
- `hw:CARD=0,DEV=0` (if card 0, device 0)
- `hw:CARD=DAC,DEV=0` (if the card name is "DAC")

### 1.3 Set Permissions

Ensure MPD can access audio devices:

```bash
sudo usermod -aG audio mpd
```

### 1.4 Restart MPD

```bash
sudo systemctl restart mpd
sudo systemctl enable mpd  # Auto-start on boot
```

### 1.5 Verify MPD is Running

```bash
sudo systemctl status mpd
```

You should see "active (running)".

Test locally on the Raspberry Pi:

```bash
mpc status
```

Expected output:
```
volume: 100%   repeat: off   random: off   single: off   consume: off
```

### 1.6 Test HTTP Streaming

Try adding a test HTTP stream to verify MPD can play remote URLs:

```bash
mpc add "https://stream.example.com/test.mp3"
mpc play
```

If you hear audio through your DAC, MPD is configured correctly!

---

## Part 2: Configure noiseport on macOS

### 2.1 Select Remote MPD Playback Type

1. Open noiseport
2. Go to **Settings** → **Playback** tab
3. In the **Audio Player** dropdown, select **Remote MPD**

### 2.2 Configure MPD Connection

Scroll down to the **Remote Playback Targets** section:

- **Enable MPD Remote**: Toggle ON
- **MPD Host**: Enter the IP address of your Raspberry Pi (e.g., `192.168.1.100`)
  - You can find the IP with `hostname -I` on the RPi
- **MPD Port**: `6600` (default)
- **MPD Password**: Leave blank unless you set one in `mpd.conf`

### 2.3 Test Connection

Click the **Test Connection** button. You should see:
- ✅ "Successfully connected to MPD server"

If you see an error:
- Check that MPD is running on rpi2: `sudo systemctl status mpd`
- Verify the IP address and port
- Check firewall settings: `sudo ufw allow 6600` (if ufw is enabled)
- Ensure `bind_to_address "0.0.0.0"` in `mpd.conf`

---

## Part 3: Using Remote MPD Playback

### 3.1 Play Music

1. Browse your Navidrome library in noiseport (albums, artists, playlists)
2. Click play on any track, album, or playlist
3. noiseport will:
   - Build Subsonic stream URLs with authentication
   - Send the queue to MPD on rpi2
   - MPD will fetch audio from Navidrome and play through the DAC

### 3.2 Playback Controls

All standard controls work:
- **Play/Pause**: Space bar or play button
- **Next/Previous**: Arrow keys or skip buttons
- **Volume**: Volume slider (controls MPD volume on rpi2)
- **Seek**: Drag the progress bar
- **Queue**: Add songs, reorder queue, shuffle, repeat

### 3.3 Connection Status

Look for the **MPD** badge in the player bar (bottom right):
- 🟢 **Green dot**: Connected and working
- 🟡 **Yellow dot**: Connecting...
- 🔴 **Red dot**: Connection error

Hover over the badge to see connection details or error messages.

---

## Part 4: Troubleshooting

### MPD won't connect from macOS

**Check network connectivity:**
```bash
# On macOS
ping <rpi2-ip-address>
telnet <rpi2-ip-address> 6600
```

**Check MPD is listening:**
```bash
# On rpi2
sudo netstat -tulpn | grep 6600
```

Expected output:
```
tcp  0  0  0.0.0.0:6600  0.0.0.0:*  LISTEN  1234/mpd
```

If not, check `bind_to_address` in `/etc/mpd.conf`.

### No audio output

**Check ALSA devices:**
```bash
# On rpi2
aplay -l
```

**Test audio directly:**
```bash
speaker-test -c 2 -t wav -D hw:CARD=DAC,DEV=0
```

**Check MPD logs:**
```bash
sudo journalctl -u mpd -f
```

### Playback stutters or stops

**Check Navidrome stream URLs are reachable from rpi2:**
```bash
# On rpi2
curl -I "http://<navidrome-host>:4533/rest/stream.view?id=<track-id>&..."
```

You should see `HTTP/1.1 200 OK`.

**Possible causes:**
- Network bandwidth issues (check WiFi signal on rpi2)
- Navidrome server too slow (check CPU/disk on rpi1)
- MPD buffer too small (add `audio_buffer_size "4096"` to `mpd.conf`)

### Authentication errors

If MPD requires a password and you get "permission denied":

1. Check password in `/etc/mpd.conf`:
   ```conf
   password "mypassword@read,add,control,admin"
   ```
2. Enter the same password in noiseport settings (without the `@read...` part)

---

## Part 5: Optional - upmpdcli (UPnP/OpenHome)

For advanced users who want UPnP/OpenHome control (e.g., BubbleUPnP, Linn Kazoo), you can install **upmpdcli** on rpi2.

### Install upmpdcli

```bash
sudo apt install upmpdcli
```

### Configure upmpdcli

Edit `/etc/upmpdcli.conf`:

```conf
mpdhost = localhost
mpdport = 6600
friendlyname = noiseport MPD
checkcontentformat = 0
```

### Restart services

```bash
sudo systemctl restart upmpdcli
sudo systemctl enable upmpdcli
```

upmpdcli will expose MPD as a UPnP Media Renderer on your network. However, **noiseport's direct MPD integration is recommended** for the best experience.

---

## Part 6: Testing Checklist

### Basic Connectivity
- [ ] MPD running on rpi2: `sudo systemctl status mpd`
- [ ] MPD listening on network: `sudo netstat -tulpn | grep 6600`
- [ ] Can reach MPD from macOS: `telnet <rpi2-ip> 6600`
- [ ] noiseport "Test Connection" succeeds

### Audio Output
- [ ] USB DAC detected: `aplay -l`
- [ ] Audio plays locally: `speaker-test -D hw:CARD=DAC,DEV=0`
- [ ] MPD configured to use correct device in `mpd.conf`

### Playback from noiseport
- [ ] Switch playback type to "Remote MPD" in settings
- [ ] Connection status shows green dot
- [ ] Play an album - audio plays on rpi2 DAC
- [ ] Play/pause works
- [ ] Next/previous works
- [ ] Volume control works
- [ ] Seek/scrubbing works
- [ ] Queue management works

### Queue Synchronization
- [ ] Add 10 songs to queue - all show in noiseport
- [ ] Jump to track 5 - playback jumps correctly
- [ ] Shuffle queue - order updates in noiseport
- [ ] Add more songs during playback - queue updates seamlessly

---

## Performance Tips

### Optimize MPD Buffer Settings

Add to `/etc/mpd.conf`:

```conf
# Increase buffer for network streaming
audio_buffer_size "4096"        # Default is 4096 KB
buffer_before_play "10%"        # Start playback at 10% buffer

# Increase max playlist length (default is 16384)
max_playlist_length "32768"
```

### Use 5GHz WiFi (if available)

For better streaming performance, connect rpi2 to 5GHz WiFi instead of 2.4GHz.

### Disable unnecessary MPD features

```conf
# Disable database updates (we stream HTTP, don't scan files)
auto_update "no"
```

---

## Limitations

- **Gapless playback**: Supported if Navidrome serves audio without gaps
- **Transcoding**: noiseport will request transcoded streams if enabled in settings; MPD will play whatever URL it receives
- **Scrobbling**: Handled by noiseport (MPD doesn't scrobble to Last.fm directly)
- **Lyrics**: Displayed in noiseport UI (MPD doesn't render lyrics)

---

## Support

For issues or questions:
- Check logs: `sudo journalctl -u mpd -f`
- MPD docs: https://www.musicpd.org/doc/html/user.html
- noiseport issues: https://github.com/jeffvli/noiseport/issues

---

**Enjoy your remote playback setup! 🎵**
