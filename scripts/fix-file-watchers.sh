#!/bin/bash
# Fix "ENOSPC: System limit for number of file watchers reached"
# Run with: ./scripts/fix-file-watchers.sh (requires sudo password)

echo "Increasing inotify file watcher limit for React Native/Metro..."
sudo sysctl fs.inotify.max_user_watches=524288
echo ""
echo "Limit set. To make permanent (survives reboot), run:"
echo "  echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.conf && sudo sysctl -p"
