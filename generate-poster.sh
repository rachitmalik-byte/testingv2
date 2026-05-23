#!/bin/bash
# Run this ONCE from your project root to generate the video poster image.
# Requires ffmpeg (brew install ffmpeg or apt install ffmpeg)
#
# This single file fixes your 5.92s LCP by giving the browser an instant
# image to paint while the video loads in the background.

ffmpeg -i public/hand_shake.mp4 \
  -ss 0.5 \
  -frames:v 1 \
  -q:v 5 \
  public/hand_shake_poster.jpg

echo "✅ Poster generated at public/hand_shake_poster.jpg"
echo "   Add to your video tag: poster=\"/hand_shake_poster.jpg\""
