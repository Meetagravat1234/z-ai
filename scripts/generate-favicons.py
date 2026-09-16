#!/usr/bin/env python3
"""
Generate a professional favicon for Hirebase.

Creates:
- favicon.svg (vector — scalable for any size)
- favicon-16x16.png (browser tab)
- favicon-32x32.png (browser tab retina / Google search result)
- favicon-48x48.png (Windows site icon)
- favicon-96x96.png (Android chrome)
- favicon-192x192.png (Android chrome high-res)
- favicon-512x512.png (PWA / splash screen)
- apple-touch-icon.png (180x180 — iOS home screen)
- favicon.ico (multi-resolution ICO: 16+32+48)

Design: A modern gradient background (emerald → indigo) with a bold
white "H" letter, rounded corners, subtle shadow. Same visual identity
as the site's primary/accent colors.
"""

import struct
import zlib
from pathlib import Path

# Color palette (matches the site's gradient-text + primary)
PRIMARY = (16, 185, 129)   # #10b981 emerald
ACCENT = (99, 102, 241)    # #6366f1 indigo
WHITE = (255, 255, 255)
DARK = (17, 24, 39)        # #111827

PUBLIC_DIR = Path("/home/z/my-project/public")

def lerp_color(c1, c2, t):
    """Linear interpolate between two RGB colors."""
    return (
        int(c1[0] + (c2[0] - c1[0]) * t),
        int(c1[1] + (c2[1] - c1[1]) * t),
        int(c1[2] + (c2[2] - c1[2]) * t),
    )

def draw_gradient(size, corner_radius):
    """Create a rounded-rectangle gradient background."""
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            # Diagonal gradient: top-left = emerald, bottom-right = indigo
            t = (x + y) / (2 * size)
            color = lerp_color(PRIMARY, ACCENT, t)

            # Apply rounded corners (anti-aliased)
            # Distance from nearest corner
            in_corner = False
            corner_dist = 0
            if x < corner_radius and y < corner_radius:
                # Top-left corner
                dx = corner_radius - x
                dy = corner_radius - y
                corner_dist = (dx * dx + dy * dy) ** 0.5
                if corner_dist > corner_radius:
                    # Outside the rounded area — transparent
                    row.append((0, 0, 0, 0))
                    continue
                # Anti-alias edge
                if corner_dist > corner_radius - 1:
                    alpha = max(0, min(255, int(255 * (corner_radius - corner_dist))))
                    row.append((*color, alpha))
                    continue
            elif x >= size - corner_radius and y < corner_radius:
                # Top-right corner
                dx = x - (size - corner_radius - 1)
                dy = corner_radius - y
                corner_dist = (dx * dx + dy * dy) ** 0.5
                if corner_dist > corner_radius:
                    row.append((0, 0, 0, 0))
                    continue
                if corner_dist > corner_radius - 1:
                    alpha = max(0, min(255, int(255 * (corner_radius - corner_dist))))
                    row.append((*color, alpha))
                    continue
            elif x < corner_radius and y >= size - corner_radius:
                # Bottom-left corner
                dx = corner_radius - x
                dy = y - (size - corner_radius - 1)
                corner_dist = (dx * dx + dy * dy) ** 0.5
                if corner_dist > corner_radius:
                    row.append((0, 0, 0, 0))
                    continue
                if corner_dist > corner_radius - 1:
                    alpha = max(0, min(255, int(255 * (corner_radius - corner_dist))))
                    row.append((*color, alpha))
                    continue
            elif x >= size - corner_radius and y >= size - corner_radius:
                # Bottom-right corner
                dx = x - (size - corner_radius - 1)
                dy = y - (size - corner_radius - 1)
                corner_dist = (dx * dx + dy * dy) ** 0.5
                if corner_dist > corner_radius:
                    row.append((0, 0, 0, 0))
                    continue
                if corner_dist > corner_radius - 1:
                    alpha = max(0, min(255, int(255 * (corner_radius - corner_dist))))
                    row.append((*color, alpha))
                    continue

            row.append((*color, 255))
        pixels.append(row)
    return pixels

def draw_h_letter(pixels, size):
    """Draw a bold white 'H' letter in the center of the image."""
    # The H is drawn as two vertical bars + one horizontal bar
    # Bar dimensions scale with image size
    bar_width = max(2, size // 5)        # thickness of vertical bars
    bar_height = int(size * 0.55)         # height of vertical bars
    crossbar_y = (size - bar_height) // 2  # y position of crossbar center
    crossbar_thickness = max(2, size // 7) # thickness of horizontal crossbar

    # Vertical bar positions (left and right)
    left_bar_x = int(size * 0.28)
    right_bar_x = int(size * 0.72) - bar_width

    crossbar_top = crossbar_y + (bar_height // 2) - (crossbar_thickness // 2)
    crossbar_bottom = crossbar_top + crossbar_thickness

    for y in range(size):
        for x in range(size):
            if pixels[y][x][3] == 0:
                continue  # skip transparent (corner) pixels

            in_h = False
            # Left vertical bar
            if left_bar_x <= x < left_bar_x + bar_width:
                if crossbar_y <= y < crossbar_y + bar_height:
                    in_h = True
            # Right vertical bar
            if right_bar_x <= x < right_bar_x + bar_width:
                if crossbar_y <= y < crossbar_y + bar_height:
                    in_h = True
            # Horizontal crossbar
            if left_bar_x + bar_width <= x <= right_bar_x:
                if crossbar_top <= y < crossbar_bottom:
                    in_h = True

            if in_h:
                # White with full opacity
                pixels[y][x] = (*WHITE, 255)

    return pixels

def write_png(filename_or_buf, pixels, size):
    """Write pixels to a PNG file or buffer (no external deps — pure Python)."""
    width = height = size

    # Build raw image data (with filter byte 0 at start of each row)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type: None
        for x in range(width):
            r, g, b, a = pixels[y][x]
            raw_data.extend([r, g, b, a])

    # Compress with zlib
    compressed = zlib.compress(bytes(raw_data), 9)

    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    def make_chunk(chunk_type, data):
        chunk = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(chunk) & 0xFFFFFFFF)
        return struct.pack('>I', len(data)) + chunk + crc

    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    ihdr = make_chunk(b'IHDR', ihdr_data)

    # IDAT chunk (compressed image data)
    idat = make_chunk(b'IDAT', compressed)

    # IEND chunk
    iend = make_chunk(b'IEND', b'')

    png_bytes = signature + ihdr + idat + iend

    # Support both file paths and BytesIO buffers
    if hasattr(filename_or_buf, 'write'):
        filename_or_buf.write(png_bytes)
    else:
        with open(filename_or_buf, 'wb') as f:
            f.write(png_bytes)

def write_ico(filename, png_16, png_32, png_48):
    """Write a multi-resolution ICO file from PNG byte data."""
    # ICO file header
    header = struct.pack('<HHH', 0, 1, 3)  # reserved, type=1 (icon), count=3

    # Directory entries (one per image size)
    entries = b''
    # 16x16
    entries += struct.pack('<BBBBHHII', 16, 16, 0, 0, 1, 32, len(png_16), 22 + 16 * 3 + 0 * 0)
    # 32x32
    entries += struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(png_32), 22 + 16 * 3 + len(png_16) + 0 * 0)
    # 48x48
    entries += struct.pack('<BBBBHHII', 48, 48, 0, 0, 1, 32, len(png_48), 22 + 16 * 3 + len(png_16) + len(png_32) + 0 * 0)

    # Image data (raw PNG bytes)
    with open(filename, 'wb') as f:
        f.write(header + entries + png_16 + png_32 + png_48)

def write_svg(filename):
    """Write a professional SVG favicon with gradient + H letter."""
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#grad)"/>
  <text x="16" y="23" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="white" text-anchor="middle">H</text>
</svg>'''
    with open(filename, 'w') as f:
        f.write(svg)

def get_png_bytes(pixels, size):
    """Return PNG file as bytes (for ICO embedding)."""
    from io import BytesIO
    buf = BytesIO()
    write_png(buf, pixels, size)
    return buf.getvalue()

def main():
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    # Write the SVG first (always 32x32 viewBox, scalable)
    write_svg(PUBLIC_DIR / 'favicon.svg')
    print(f'✓ {PUBLIC_DIR / "favicon.svg"}')

    # Generate PNGs at multiple sizes
    sizes = [16, 32, 48, 96, 192, 512]
    png_bytes_cache = {}

    for size in sizes:
        # Corner radius scales with size (rounded rectangle look)
        corner_radius = max(2, size // 5)

        pixels = draw_gradient(size, corner_radius)
        pixels = draw_h_letter(pixels, size)

        filename = PUBLIC_DIR / f'favicon-{size}x{size}.png'
        write_png(filename, pixels, size)
        print(f'✓ {filename}')

        # Cache bytes for ICO (we only need 16, 32, 48 for ICO)
        if size in (16, 32, 48):
            from io import BytesIO
            buf = BytesIO()
            write_png(buf, pixels, size)
            png_bytes_cache[size] = buf.getvalue()

    # Apple touch icon (180x180 — iOS requires square, no transparency)
    size = 180
    pixels = draw_gradient(size, max(2, size // 5))
    pixels = draw_h_letter(pixels, size)
    # Apple requires solid background (no transparency) — but our gradient is fine
    write_png(PUBLIC_DIR / 'apple-touch-icon.png', pixels, size)
    print(f'✓ {PUBLIC_DIR / "apple-touch-icon.png"}')

    # Multi-resolution ICO file
    write_ico(
        PUBLIC_DIR / 'favicon.ico',
        png_bytes_cache[16],
        png_bytes_cache[32],
        png_bytes_cache[48],
    )
    print(f'✓ {PUBLIC_DIR / "favicon.ico"} (multi-resolution: 16+32+48)')

    print('\n✅ All favicons generated successfully!')
    print('   Files in /public:')
    print('   - favicon.svg (vector)')
    print('   - favicon.ico (multi-res, for Google search results)')
    print('   - favicon-16x16.png through favicon-512x512.png')
    print('   - apple-touch-icon.png (180x180 for iOS)')

if __name__ == '__main__':
    main()
